// CHUNG KẾT #104 + TRANH HẠNG 3 #103 (chiếu trước theo nhánh dự đoán #102).
// #101 SF đã đá thật (TBN 2-0 Pháp) → TBN chắc suất CK; nhánh còn lại phụ thuộc #102 Anh–Argentina
// (đang dự đoán Argentina thắng). Nếu #102 ra khác, #103/#104 sẽ chỉnh lại.
// prob_a = đội NHÀ trong fixture, prob_b = đội KHÁCH.
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const P = join(__dirname, '..', 'src', 'data', 'predictions.json');

const M = {
  // ===== TRANH HẠNG 3 #103 — Pháp vs Anh (Miami, 19/07) =====
  "103": { prob_a:40, prob_draw:27, prob_b:33, score_a:2, score_b:1, winner:"France", confidence:42,
    key_factors:[
      "Chiếu trước: Pháp thua BK trước TBN 0-2; Anh (giả định thua Argentina ở #102) — trận tranh hạng 3",
      "Elo Pháp 2075 > Anh 2011 (+64); Mbappé–Dembélé tạo khác biệt ở trận cởi mở, ít áp lực",
      "Trận hạng 3 thường nhiều bàn và khó lường, nhưng chiều sâu tấn công Pháp nhỉnh hơn"],
    analysis_form:"Pháp thắng 6 thua 1 (chỉ thua TBN ở BK). Anh thắng 5 hòa 1, hàng công trồi sụt (0-0 Ghana, hay thắng sát nút).",
    analysis_history:"Hai đội gặp nhiều ở giao hữu/giải lớn (tứ kết World Cup 2022 Pháp thắng 2-1); thường cân tài nhưng Pháp nhỉnh về ngôi sao.",
    analysis_prediction:"Tâm lý thoải mái, Pháp bung sức tấn công và thắng 2-1 nhờ đẳng cấp Mbappé." },

  // ===== CHUNG KẾT #104 — Tây Ban Nha vs Argentina (New Jersey, 20/07) =====
  "104": { prob_a:37, prob_draw:29, prob_b:34, score_a:2, score_b:1, winner:"Spain", confidence:41,
    key_factors:[
      "Chung kết trong mơ hai ứng viên số 1: Elo gần như ngang (TBN 2101 – Argentina 2113, chênh chỉ -12) → 50/50",
      "Tây Ban Nha phòng ngự hay nhất giải, vừa vùi Pháp 2-0 ở BK; toàn thắng sau trận hòa mở màn, kiểm soát bóng bóp nghẹt",
      "Argentina có Messi–Lautaro và bản lĩnh nhà vua, nhưng để lọt lưới nhiều (loạt 3-2, 3-1) — điểm yếu TBN có thể khai thác"],
    analysis_form:"TBN thắng 6 hòa 1, sạch lưới liên tục (1-0 Bồ, 1-0 Uruguay, 2-0 Pháp). Argentina toàn thắng 7 nhưng hàng thủ hớ hênh vài trận.",
    analysis_history:"Hai nền bóng đá đỉnh cao đối đầu; TBN lối chơi tập thể kỷ luật vs cá nhân kiệt xuất của Argentina — thường rất căng và ít bàn.",
    analysis_prediction:"Chung kết ít bàn, chặt chẽ (baseline top 1-0/0-0/1-1). Kiểm soát và hàng thủ thép giúp Tây Ban Nha nhỉnh hơn: dự đoán TBN thắng 2-1 để lên ngôi vô địch WC2026 — hoàn toàn có thể phải phân định ở hiệp phụ/luân lưu." },
};

const db = JSON.parse(readFileSync(P, 'utf8'));
db.predictions = db.predictions || {};
let added = 0, updated = 0;
for (const [k, v] of Object.entries(M)) { if (db.predictions[k]) updated++; else added++; db.predictions[k] = v; }
db.note = "Dự đoán trọn nhánh knockout tới CK: TBN vs Argentina (#104, dự đoán TBN vô địch 2-1) + tranh hạng 3 Pháp vs Anh (#103, Pháp 2-1). #101 SF đã thật (TBN 2-0 Pháp); #102/#103/#104 phụ thuộc kết quả Anh–Argentina. 2026-07-15.";
writeFileSync(P, JSON.stringify(db, null, 2), 'utf8');
console.log(`✅ Final+3rd: +${added} mới, ${updated} cập nhật. Tổng ${Object.keys(db.predictions).length} trận.`);
