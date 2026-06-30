// Kiểm tra tính toàn vẹn của predictions.json so với fixtures vòng bảng.
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { FIXTURES_2026 } from '../src/data/fixtures.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const P = JSON.parse(readFileSync(join(__dirname, '..', 'src', 'data', 'predictions.json'), 'utf8'));

const group = FIXTURES_2026.filter(f => f.stage === 'group');
const byId = Object.fromEntries(FIXTURES_2026.map(f => [String(f.match), f]));
let errors = 0;
const warn = (m) => { console.log('  ⚠️ ' + m); errors++; };

console.log(`Fixtures vòng bảng: ${group.length} · Dự đoán có: ${Object.keys(P.predictions).length}`);

// 1) Vòng bảng: BẮT BUỘC đủ dự đoán, winner khớp tỉ số (cho phép Hòa)
for (const f of group) {
  if (!P.predictions[f.match]) warn(`#${f.match} ${f.home} vs ${f.away}: THIẾU dự đoán`);
}

// 2) Kiểm tra mọi dự đoán đang có (vòng bảng + knockout đã biết đội)
for (const [id, p] of Object.entries(P.predictions)) {
  const f = byId[id];
  if (!f) { warn(`Dự đoán #${id} không khớp fixture nào`); continue; }
  const ko = f.stage !== 'group';
  if (ko && f.is_placeholder) { warn(`#${id}: trận KO chưa biết đội (placeholder) — chưa nên dự đoán`); continue; }

  const sum = p.prob_a + p.prob_draw + p.prob_b;
  if (sum !== 100) warn(`#${id}: prob cộng = ${sum} (≠100)`);

  // winner hợp lệ: vòng bảng cho {home, away, Hòa}; knockout BẮT BUỘC là 1 đội (luân lưu vẫn có đội đi tiếp)
  const allowed = ko ? [f.home, f.away] : [f.home, f.away, 'Hòa'];
  if (!allowed.includes(p.winner)) warn(`#${id}: winner '${p.winner}' không thuộc {${allowed.join(', ')}}`);

  // winner vs tỉ số: knockout cho phép hòa-rồi-luân-lưu (score hòa + winner là 1 đội)
  let scoreWinner;
  if (p.score_a > p.score_b) scoreWinner = f.home;
  else if (p.score_a < p.score_b) scoreWinner = f.away;
  else scoreWinner = 'Hòa';
  if (!(ko && scoreWinner === 'Hòa') && p.winner !== scoreWinner)
    warn(`#${id}: winner '${p.winner}' ≠ tỉ số ${p.score_a}-${p.score_b} (đáng lẽ '${scoreWinner}')`);

  for (const k of ['key_factors','analysis_form','analysis_history','analysis_prediction','confidence'])
    if (p[k] == null) warn(`#${id}: thiếu field ${k}`);
  if (p.key_factors && p.key_factors.length !== 3) warn(`#${id}: key_factors có ${p.key_factors.length} mục (≠3)`);
}

console.log(errors === 0 ? '✅ HỢP LỆ — không có lỗi' : `❌ ${errors} vấn đề`);
