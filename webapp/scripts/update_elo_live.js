// Mô hình "sống": tính lại Elo wc2026 từ kết quả thật WC2026 (results.json).
// Idempotent: luôn bắt đầu từ Elo gốc trước giải (wc2026_base) rồi áp toàn bộ kết quả đã đá.
// Chạy: node scripts/update_elo_live.js  (chạy lại mỗi khi có kết quả mới)
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { FIXTURES_2026 } from '../src/lib/dataLoader.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ELO_PATH = join(__dirname, '..', 'src', 'data', 'elo_ratings.json');
const RES = JSON.parse(readFileSync(join(__dirname, '..', 'src', 'data', 'results.json'), 'utf8')).results || {};

const elo = JSON.parse(readFileSync(ELO_PATH, 'utf8'));
const K = (elo.k_factors && (elo.k_factors.WC || elo.k_factors.world_cup)) || 55;

// Lần đầu: lưu Elo gốc trước giải để tái lập
if (!elo.wc2026_base) elo.wc2026_base = { ...elo.wc2026 };
const R = { ...elo.wc2026_base }; // bắt đầu từ gốc

// Hệ số biên thắng (World Football Elo)
function mov(gd) { const g = Math.abs(gd); if (g <= 1) return 1; if (g === 2) return 1.5; return (11 + g) / 8; }
function expW(rA, rB) { return 1 / (1 + Math.pow(10, (rB - rA) / 400)); }

// Các trận vòng bảng đã đá, theo thứ tự thời gian
const played = FIXTURES_2026
  .filter(f => f.stage === 'group' && !f.is_placeholder && RES[f.match])
  .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time) || a.match - b.match);

let n = 0;
for (const f of played) {
  const r = RES[f.match];
  const rA = R[f.home] ?? 1500, rB = R[f.away] ?? 1500;
  const we = expW(rA, rB);
  const wa = r.home > r.away ? 1 : (r.home < r.away ? 0 : 0.5);
  const m = mov(r.home - r.away);
  const delta = K * m * (wa - we);
  R[f.home] = rA + delta;
  R[f.away] = rB - delta;
  n++;
}
for (const t of Object.keys(R)) R[t] = Math.round(R[t]);

// Báo cáo thay đổi lớn
const diffs = Object.keys(R).map(t => ({ t, d: R[t] - elo.wc2026_base[t] })).filter(x => x.d).sort((a, b) => Math.abs(b.d) - Math.abs(a.d));
elo.wc2026 = R;
elo.wc2026_live_updated_at = new Date().toISOString();
writeFileSync(ELO_PATH, JSON.stringify(elo, null, 2), 'utf8');
console.log(`✅ Cập nhật Elo từ ${n} trận đã đá. Thay đổi lớn nhất:`);
diffs.slice(0, 12).forEach(x => console.log(`   ${x.t.padEnd(16)} ${x.d > 0 ? '+' : ''}${x.d} → ${R[x.t]}`));
