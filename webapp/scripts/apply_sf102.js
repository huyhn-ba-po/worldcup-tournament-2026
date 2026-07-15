// BÁN KẾT #102 (THẬT) — Anh vs Argentina (Atlanta, 16/07).
// Cả hai đã vào bán kết bằng kết quả thật (Anh 2-1 Na Uy #99, Argentina 3-1 Thụy Sĩ #100).
// Đối thủ ở chung kết đã biết: Tây Ban Nha (thắng Pháp 2-0 ở SF #101).
// prob_a = Anh (nhà), prob_b = Argentina (khách) theo đúng thứ tự bracket.
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const P = join(__dirname, '..', 'src', 'data', 'predictions.json');

const SF = {
  "102": { prob_a:33, prob_draw:27, prob_b:40, score_a:1, score_b:2, winner:"Argentina", confidence:45,
    key_factors:[
      "Elo sống Argentina 2113 vs Anh 2011 (chênh +102) — Argentina toàn thắng 6 trận, vừa hạ Thụy Sĩ 3-1 thuyết phục",
      "Messi–Lautaro đang sắc bén; Argentina bản lĩnh knockout, ứng viên số 1 còn lại của giải",
      "Anh chắc chắn, có Kane, nhưng thắng vất vả (2-1 Na Uy) và từng bế tắc (0-0 Ghana) — kèo thấp bàn (baseline 1-0/0-0/1-1)"],
    analysis_form:"Argentina thắng cả 6, gần đây 3-1 Thụy Sĩ, 3-2 Ai Cập/Cape Verde. Anh thắng 5 hòa 1, vừa vượt Na Uy 2-1 nhưng hàng công trồi sụt.",
    analysis_history:"Đại kình địch World Cup: 1986 Maradona ('Bàn tay của Chúa' + solo), 1998 (Argentina thắng luân lưu), 2002 (Beckham penalty cho Anh). Các lần gặp luôn nghẹt thở.",
    analysis_prediction:"Trận chặt chẽ ít bàn; đẳng cấp Messi–Lautaro và bản lĩnh giúp Argentina vượt qua để gặp Tây Ban Nha ở chung kết. Dự đoán Argentina thắng 2-1 (cảnh giác hiệp phụ/luân lưu)." },
};

const db = JSON.parse(readFileSync(P, 'utf8'));
db.predictions = db.predictions || {};
let added = 0, updated = 0;
for (const [k, v] of Object.entries(SF)) { if (db.predictions[k]) updated++; else added++; db.predictions[k] = v; }
db.note = "Dự đoán Bán kết #102 Anh–Argentina (cả hai vào SF bằng kết quả thật; đối thủ CK là Tây Ban Nha sau khi thắng Pháp 2-0). 2026-07-15.";
writeFileSync(P, JSON.stringify(db, null, 2), 'utf8');
console.log(`✅ SF #102: +${added} mới, ${updated} cập nhật. Tổng ${Object.keys(db.predictions).length} trận.`);
