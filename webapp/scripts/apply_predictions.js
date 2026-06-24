// Helper chung: gộp một file dự đoán {note?, predictions:{ "<matchId>": {...} }} vào src/data/predictions.json.
// Dùng cho mọi vòng (knockout hoặc bổ sung), thay cho việc viết script apply_* riêng từng lần.
// Chạy: node scripts/apply_predictions.js <path/to/preds.json>
//
// Mỗi pred cần: prob_a, prob_draw, prob_b, score_a, score_b, winner, confidence,
//   key_factors[], analysis_form, analysis_history, analysis_prediction.
// (Vòng knockout: winner KHÔNG được là "Hòa" — phải có đội đi tiếp.)
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = process.argv[2];
if (!src) { console.error('❌ Thiếu đường dẫn file dự đoán. Vd: node scripts/apply_predictions.js _ko_preds.json'); process.exit(1); }

const P = join(__dirname, '..', 'src', 'data', 'predictions.json');
const incoming = JSON.parse(readFileSync(join(process.cwd(), src), 'utf8'));
const preds = incoming.predictions || incoming; // chấp nhận cả {predictions:{...}} lẫn {...}

const REQ = ['prob_a', 'prob_draw', 'prob_b', 'score_a', 'score_b', 'winner', 'confidence'];
const errs = [];
for (const [id, p] of Object.entries(preds)) {
  for (const k of REQ) if (p[k] === undefined) errs.push(`#${id} thiếu '${k}'`);
  const sum = (p.prob_a || 0) + (p.prob_draw || 0) + (p.prob_b || 0);
  if (Math.abs(sum - 100) > 1) errs.push(`#${id} tổng xác suất = ${sum} (cần ~100)`);
}
if (errs.length) { console.error('❌ Lỗi dữ liệu:\n  ' + errs.join('\n  ')); process.exit(1); }

const data = JSON.parse(readFileSync(P, 'utf8'));
let n = 0;
for (const [id, p] of Object.entries(preds)) { data.predictions[id] = p; n++; }
if (incoming.note) data.note = incoming.note;
writeFileSync(P, JSON.stringify(data, null, 2), 'utf8');
console.log(`✅ Gộp ${n} dự đoán vào predictions.json` + (incoming.note ? ' (đã cập nhật note)' : ''));
