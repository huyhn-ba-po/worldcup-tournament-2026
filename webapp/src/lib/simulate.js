// Mô phỏng quanh dự đoán tĩnh ("lõi"), nhưng tỉ số nổi bật LUÔN là tỉ số
// xác suất cao nhất khớp với kết luận nghiên cứu. Chỉ dao động nhẹ giữa
// vài tỉ số khả năng cao → mỗi lần tải hơi khác mà vẫn hợp lý.

function factorial(n) { let f = 1; for (let i = 2; i <= n; i++) f *= i; return f; }
function poisPmf(k, lambda) {
  if (!(lambda > 0)) lambda = 0.8;
  return Math.exp(-lambda) * Math.pow(lambda, k) / factorial(k);
}

// Chọn ngẫu nhiên 1 phần tử theo trọng số (mảng {item, w})
function weightedPick(arr) {
  const total = arr.reduce((s, x) => s + x.w, 0);
  let r = Math.random() * total;
  for (const x of arr) { r -= x.w; if (r <= 0) return x.item; }
  return arr[arr.length - 1].item;
}

function winnerOf(a, b) { return a > b ? 'home' : (a < b ? 'away' : 'draw'); }

function normalize100(a, b, c) {
  a = Math.max(1, a); b = Math.max(1, b); c = Math.max(1, c);
  const s = a + b + c;
  let ra = Math.round((a / s) * 100), rb = Math.round((b / s) * 100), rc = 100 - ra - rb;
  if (rc < 1) { const d = 1 - rc; rc = 1; if (ra >= rb) ra -= d; else rb -= d; }
  return [ra, rb, rc];
}

const MAXG = 6;

export function simulatePrediction(stats, core) {
  const la = (stats && stats.expected_score && stats.expected_score.a != null)
    ? stats.expected_score.a : (core.score_a + 0.3);
  const lb = (stats && stats.expected_score && stats.expected_score.b != null)
    ? stats.expected_score.b : (core.score_b + 0.3);

  // Lưới mọi tỉ số 0..6 × 0..6 kèm xác suất Poisson đồng thời
  const grid = [];
  for (let a = 0; a <= MAXG; a++)
    for (let b = 0; b <= MAXG; b++)
      grid.push({ a, b, label: `${a}-${b}`, winner: winnerOf(a, b), p: poisPmf(a, la) * poisPmf(b, lb) });

  // Phe theo nghiên cứu (lấy từ tỉ số lõi do Claude chốt)
  const coreKey = winnerOf(core.score_a, core.score_b);

  // TỈ SỐ CHÍNH: chỉ trong nhóm cùng phe với kết luận, ưu tiên xác suất cao nhất.
  // Lấy top tối đa 3 tỉ số khả năng cao nhất, chọn ngẫu nhiên theo trọng số
  // (đa phần ra tỉ số số 1, thi thoảng số 2-3) → luôn "tỉ lệ cao nhất" nhưng có dao động.
  const sameSide = grid.filter(g => g.winner === coreKey).sort((x, y) => y.p - x.p);
  const topPool = (sameSide.length ? sameSide : grid.slice().sort((x, y) => y.p - x.p)).slice(0, 3);
  const primary = weightedPick(topPool.map(g => ({ item: g, w: g.p })));

  // TỈ SỐ PHỤ (0-2): kịch bản lân cận khả năng cao, có thể khác phe (sự bất ngờ),
  // lấy mẫu theo trọng số toàn lưới, loại trùng tỉ số chính.
  const wantAlts = Math.floor(Math.random() * 3); // 0..2 → tổng 1..3 tỉ số
  const pool = grid.filter(g => g.label !== primary.label).map(g => ({ item: g, w: g.p }));
  const seen = new Set([primary.label]);
  const alts = [];
  for (let i = 0; i < wantAlts * 4 && alts.length < wantAlts; i++) {
    const g = weightedPick(pool);
    if (seen.has(g.label)) continue;
    seen.add(g.label); alts.push(g);
  }

  const scorelines = [primary, ...alts].map(g => ({ a: g.a, b: g.b, label: g.label, winner: g.winner }));

  // Rung nhẹ phần trăm quanh lõi (±3) rồi chuẩn hóa 100
  const jit = () => (Math.random() * 6 - 3);
  const [pa, pd, pb] = normalize100(core.prob_a + jit(), core.prob_draw + jit(), core.prob_b + jit());

  return {
    is_simulation: true,
    note: 'Mô phỏng quanh dự đoán cơ sở — tỉ số chính luôn là kịch bản khả năng cao nhất, dao động nhẹ mỗi lần tải.',
    prob_a: pa, prob_draw: pd, prob_b: pb,
    scorelines,
    primary: scorelines[0],
    expected: { a: Math.round(la * 100) / 100, b: Math.round(lb * 100) / 100 },
    core_score: { a: core.score_a, b: core.score_b },
  };
}
