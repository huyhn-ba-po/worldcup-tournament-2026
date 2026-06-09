// Kiểm tra tính toàn vẹn của predictions.json so với fixtures vòng bảng.
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { FIXTURES_2026 } from '../src/data/fixtures.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const P = JSON.parse(readFileSync(join(__dirname, '..', 'src', 'data', 'predictions.json'), 'utf8'));

const group = FIXTURES_2026.filter(f => f.stage === 'group');
let errors = 0;
const warn = (m) => { console.log('  ⚠️ ' + m); errors++; };

console.log(`Fixtures vòng bảng: ${group.length} · Dự đoán có: ${Object.keys(P.predictions).length}`);

for (const f of group) {
  const p = P.predictions[f.match];
  if (!p) { warn(`#${f.match} ${f.home} vs ${f.away}: THIẾU dự đoán`); continue; }
  const sum = p.prob_a + p.prob_draw + p.prob_b;
  if (sum !== 100) warn(`#${f.match}: prob cộng = ${sum} (≠100)`);
  // winner phải khớp tỉ số
  let scoreWinner;
  if (p.score_a > p.score_b) scoreWinner = f.home;
  else if (p.score_a < p.score_b) scoreWinner = f.away;
  else scoreWinner = 'Hòa';
  if (p.winner !== scoreWinner) warn(`#${f.match}: winner '${p.winner}' ≠ tỉ số ${p.score_a}-${p.score_b} (đáng lẽ '${scoreWinner}')`);
  // winner phải nằm trong {home, away, Hòa}
  if (![f.home, f.away, 'Hòa'].includes(p.winner)) warn(`#${f.match}: winner '${p.winner}' không thuộc đội nào`);
  // các field bắt buộc
  for (const k of ['key_factors','analysis_form','analysis_history','analysis_prediction','confidence'])
    if (p[k] == null) warn(`#${f.match}: thiếu field ${k}`);
  if (p.key_factors && p.key_factors.length !== 3) warn(`#${f.match}: key_factors có ${p.key_factors.length} mục (≠3)`);
}

// thừa dự đoán không khớp fixture?
for (const id of Object.keys(P.predictions))
  if (!group.find(f => String(f.match) === id)) warn(`Dự đoán #${id} không khớp fixture vòng bảng nào`);

console.log(errors === 0 ? '✅ HỢP LỆ — không có lỗi' : `❌ ${errors} vấn đề`);
