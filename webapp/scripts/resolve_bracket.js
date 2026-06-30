// Dựng bracket vòng loại trực tiếp từ kết quả thật (results.json) + dự đoán (predictions.json).
// - Tính BXH cuối vòng bảng → nhất/nhì mỗi bảng + 8 đội hạng 3 tốt nhất.
// - Ghép 8 suất hạng 3 vào đúng trận theo tập ứng viên bảng (Annex C FIFA 2026) bằng matching quay lui.
// - Giải slot 1X/2X/3rd(...) → đội thật; W##/L## → đội thắng/thua (lấy kết quả thật, thiếu thì dùng winner dự đoán).
// - Ghi _bracket_resolved.json + in sơ đồ. Báo "sẵn sàng dự đoán" cho trận đã biết đủ 2 đội mà chưa đá.
// Chạy: node scripts/resolve_bracket.js   (nên chạy update_elo_live.js trước)
//
// ⚠️ Lưu ý: tie-break BXH dùng Điểm→Hiệu số→Bàn thắng (bỏ đối đầu trực tiếp). Ghép hạng 3 chọn lời giải
//    hợp lệ đầu tiên theo thứ tự số trận — có thể khác Annex C ở các tổ hợp nhiều lời giải (hiếm).
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { FIXTURES_2026, TEAMS_META } from '../src/lib/dataLoader.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
// Cho phép truyền file kết quả thay thế để test "what-if": node scripts/resolve_bracket.js [resultsPath]
const RES_PATH = process.argv[2] ? join(process.cwd(), process.argv[2]) : join(__dirname, '..', 'src', 'data', 'results.json');
const RES = JSON.parse(readFileSync(RES_PATH, 'utf8')).results || {};
const PRED = JSON.parse(readFileSync(join(__dirname, '..', 'src', 'data', 'predictions.json'), 'utf8')).predictions || {};
const meta = TEAMS_META.team_meta;
const vi = t => (t && meta[t]?.name_vi) || t;

// ===== 1) BXH cuối vòng bảng =====
const groupFix = FIXTURES_2026.filter(f => f.stage === 'group');
const groups = {};
for (const f of groupFix) (groups[f.group] = groups[f.group] || []).push(f);

function tableOf(group) {
  const t = {};
  groups[group].forEach(m => { for (const s of [m.home, m.away]) t[s] = t[s] || { team: s, pts: 0, gf: 0, ga: 0, played: 0 }; });
  for (const m of groups[group]) {
    const r = RES[m.match]; if (!r) continue;
    t[m.home].gf += r.home; t[m.home].ga += r.away; t[m.home].played++;
    t[m.away].gf += r.away; t[m.away].ga += r.home; t[m.away].played++;
    if (r.home > r.away) t[m.home].pts += 3; else if (r.home < r.away) t[m.away].pts += 3; else { t[m.home].pts++; t[m.away].pts++; }
  }
  return Object.values(t).map(x => ({ ...x, gd: x.gf - x.ga }))
    .sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
}

const standings = {}, thirds = [];
let groupComplete = true;
for (const g of Object.keys(groups).sort()) {
  const tab = tableOf(g);
  standings[g] = tab;
  if (tab.some(x => x.played < 3)) groupComplete = false;
  if (tab[2]) thirds.push({ g, ...tab[2] });
}
thirds.sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
const best8 = thirds.slice(0, 8);
const best8Groups = best8.map(t => t.g);

// ===== 2) Ghép 8 suất hạng 3 vào trận (matching quay lui theo tập ứng viên) =====
const thirdSlots = FIXTURES_2026
  .filter(f => /^3rd\(/.test(f.away_slot || ''))
  .map(f => ({ match: f.match, candidates: f.away_slot.replace(/^3rd\(|\)$/g, '').split('/') }))
  .sort((a, b) => a.match - b.match);

function assignThirds() {
  const used = new Set(), out = {};
  const pool = best8.slice(); // {g, team,...}
  function bt(i) {
    if (i === thirdSlots.length) return true;
    const slot = thirdSlots[i];
    for (const t of pool) {
      if (used.has(t.g) || !slot.candidates.includes(t.g)) continue;
      used.add(t.g); out[slot.match] = t.team;
      if (bt(i + 1)) return true;
      used.delete(t.g); delete out[slot.match];
    }
    return false;
  }
  const ok = bt(0);
  return { ok, out };
}

// ===== 3) Giải slot → đội =====
const winnerOf = {}, loserOf = {}; // match -> team (kết quả thật ưu tiên, thiếu thì dùng dự đoán)
function resolveKO(matchId, homeAwayCache) { /* placeholder for recursion guard */ }

function predWinnerLoser(f) {
  // trả {w, l} theo kết quả thật; nếu chưa đá, dùng winner dự đoán (l = đội còn lại)
  const home = slotTeam(f.home_slot), away = slotTeam(f.away_slot);
  const r = RES[f.match];
  if (r && home && away) {
    if (r.home > r.away) return { w: home, l: away };
    if (r.home < r.away) return { w: away, l: home };
    // KO không hòa trong dữ liệu tỉ số → nếu có pen thì cần field riêng; tạm coi nhà thắng
    return { w: home, l: away };
  }
  const p = PRED[f.match];
  if (p && p.winner && p.winner !== 'Hòa' && home && away) {
    const w = p.winner === home ? home : (p.winner === away ? away : null);
    if (w) return { w, l: w === home ? away : home };
  }
  return { w: null, l: null };
}

const koById = Object.fromEntries(FIXTURES_2026.filter(f => f.stage !== 'group').map(f => [f.match, f]));
function slotTeam(slot) {
  if (!slot) return null;
  let m;
  if ((m = slot.match(/^([12])([A-L])$/))) {
    const tab = standings[m[2]]; const idx = +m[1] - 1;
    return groupComplete && tab[idx] ? tab[idx].team : null;
  }
  if (/^3rd\(/.test(slot)) return null; // suất hạng 3 giải qua thirdAssign theo match, xử lý ở dưới
  if ((m = slot.match(/^W(\d+)$/))) return winnerOf[+m[1]] || null;
  if ((m = slot.match(/^L(\d+)$/))) return loserOf[+m[1]] || null;
  return null;
}

const thirdAssign = groupComplete ? assignThirds() : { ok: false, out: {} };

// hàm lấy đội của 1 phía cho 1 trận KO (ưu tiên suất hạng 3 theo match)
function sideTeam(f, side) {
  const slot = side === 'home' ? f.home_slot : f.away_slot;
  if (/^3rd\(/.test(slot || '')) return thirdAssign.out[f.match] || null;
  return slotTeam(slot);
}

// Lan truyền winner/loser theo thứ tự số trận (R32 → Final)
const koSorted = FIXTURES_2026.filter(f => f.stage !== 'group').sort((a, b) => a.match - b.match);
const resolved = [];
for (const f of koSorted) {
  const home = sideTeam(f, 'home'), away = sideTeam(f, 'away');
  const r = RES[f.match];
  let w = null, l = null, played = false, source = 'TBD';
  if (r && home && away) {
    played = true; source = 'result';
    if (r.home >= r.away) { w = home; l = away; } else { w = away; l = home; }
  } else if (home && away) {
    const p = PRED[f.match];
    if (p && p.winner && p.winner !== 'Hòa') {
      w = p.winner === home ? home : (p.winner === away ? away : null);
      l = w ? (w === home ? away : home) : null;
      if (w) source = 'prediction';
    }
  }
  if (w) winnerOf[f.match] = w;
  if (l) loserOf[f.match] = l;
  resolved.push({
    match: f.match, stage: f.stage, date: f.date, ground: f.ground,
    home_slot: f.home_slot, away_slot: f.away_slot,
    home, away,
    ready_to_predict: !!(home && away) && !played && !(PRED[f.match]?.winner),
    played, winner: w, loser: l, winner_source: source,
  });
}

// ===== 4) Xuất =====
const out = {
  generated_for: 'knockout bracket',
  group_stage_complete: groupComplete,
  third_assign_ok: thirdAssign.ok,
  best8_thirds: best8.map(t => ({ group: t.g, team: t.team, pts: t.pts, gd: t.gd, gf: t.gf })),
  matches: resolved,
};
writeFileSync(join(__dirname, '..', '_bracket_resolved.json'), JSON.stringify(out, null, 2), 'utf8');

// File committed cho app overlay đội thật lên fixtures KO (chỉ các trận đã biết đủ 2 đội).
const resolvedTeams = {};
for (const r of resolved) if (r.home && r.away) resolvedTeams[r.match] = { home: r.home, away: r.away };
writeFileSync(join(__dirname, '..', 'src', 'data', 'knockout_resolved.json'),
  JSON.stringify({ group_stage_complete: groupComplete, matches: resolvedTeams }, null, 2), 'utf8');

// ===== 5) In =====
console.log(`Vòng bảng đủ kết quả: ${groupComplete ? 'CÓ' : 'CHƯA (chưa thể dựng R32)'}`);
if (!groupComplete) {
  const need = Object.keys(groups).sort().map(g => {
    const left = groups[g].filter(m => !RES[m.match]).length;
    return left ? `${g}(${left})` : null;
  }).filter(Boolean);
  console.log('  Còn thiếu kết quả ở bảng:', need.join(', ') || '—');
}
if (groupComplete) {
  console.log(`Ghép suất hạng 3: ${thirdAssign.ok ? 'OK' : '❌ KHÔNG tìm được lời giải hợp lệ'}`);
  console.log('8 đội hạng 3 đi tiếp:', best8.map(t => `${vi(t.team)}(${t.g},${t.pts}đ HS${t.gd >= 0 ? '+' : ''}${t.gd})`).join(', '));
  console.log('\n=== R32 ===');
  for (const r of resolved.filter(r => r.stage === 'R32')) {
    const tag = r.played ? `→ ${vi(r.winner)} ✓` : (r.ready_to_predict ? '⏳ SẴN SÀNG DỰ ĐOÁN' : (r.winner ? `(dđ: ${vi(r.winner)})` : ''));
    console.log(`  #${r.match} ${(vi(r.home) || r.home_slot).padEnd(16)} vs ${(vi(r.away) || r.away_slot).padEnd(16)} ${tag}`);
  }
}
const ready = resolved.filter(r => r.ready_to_predict);
console.log(`\n${ready.length} trận SẴN SÀNG dự đoán (đủ 2 đội, chưa đá, chưa có dự đoán): ${ready.map(r => '#' + r.match).join(', ') || '—'}`);
console.log('→ _bracket_resolved.json đã ghi.');
