// CHUNG KẾT #104 + TRANH HẠNG 3 #103 — nhánh đã XÁC ĐỊNH bằng kết quả thật.
// SF thật: #101 TBN 2-0 Pháp, #102 Argentina 2-1 Anh → CK: TBN vs Argentina; hạng 3: Pháp vs Anh.
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
      "Pháp thua BK trước TBN 0-2, Anh thua BK trước Argentina 1-2 — cả hai đá tranh hạng 3",
      "Elo Pháp 2075 > Anh 2011 (+64); Mbappé–Dembélé tạo khác biệt ở trận cởi mở, ít áp lực tâm lý",
      "Trận hạng 3 thường nhiều bàn và khó lường, nhưng chiều sâu tấn công của Pháp nhỉnh hơn"],
    analysis_form:"Pháp thắng 6 thua 1 (chỉ thua TBN ở BK). Anh thắng 5 hòa 1 thua 1, hàng công trồi sụt (0-0 Ghana, hay thắng sát nút).",
    analysis_history:"Hai đội gặp nhiều ở giải lớn (tứ kết World Cup 2022 Pháp thắng 2-1); thường cân tài nhưng Pháp nhỉnh về ngôi sao.",
    analysis_prediction:"Tâm lý thoải mái, Pháp bung sức tấn công và thắng 2-1 nhờ đẳng cấp Mbappé." },

  // ===== CHUNG KẾT #104 — Tây Ban Nha vs Argentina (New Jersey, 20/07) =====
  "104": { prob_a:37, prob_draw:29, prob_b:34, score_a:2, score_b:1, winner:"Spain", confidence:41,
    key_factors:[
      "Chung kết trong mơ giữa hai ứng viên số 1: Elo gần như ngang (TBN 2101 – Argentina 2113, chênh chỉ -12) → 50/50",
      "Tây Ban Nha phòng ngự hay nhất giải, vừa thắng Pháp 2-0 ở BK (sạch lưới); toàn giải chỉ hòa mở màn rồi thắng liền mạch, kiểm soát bóng bóp nghẹt",
      "Argentina có Messi–Lautaro và bản lĩnh nhà vua (vừa hạ Anh 2-1), nhưng để lọt lưới đều (3-2, 3-1, 2-1) — điểm yếu TBN có thể khai thác"],
    analysis_form:"TBN thắng 6 hòa 1, sạch lưới liên tục (1-0 Bồ, 1-0 Uruguay, 2-0 Pháp). Argentina toàn thắng 7 nhưng hàng thủ hớ hênh vài trận.",
    analysis_history:"Hai nền bóng đá đỉnh cao đối đầu; TBN lối chơi tập thể kỷ luật vs cá nhân kiệt xuất của Argentina — thường rất căng và ít bàn.",
    analysis_prediction:"Chung kết ít bàn, chặt chẽ (baseline top 1-0/0-0/1-1). Kiểm soát thế trận và hàng thủ thép giúp Tây Ban Nha nhỉnh hơn: dự đoán TBN thắng 2-1 để lên ngôi vô địch WC2026 — hoàn toàn có thể phải phân định ở hiệp phụ/luân lưu." },
};

const db = JSON.parse(readFileSync(P, 'utf8'));
db.predictions = db.predictions || {};
let added = 0, updated = 0;
for (const [k, v] of Object.entries(M)) { if (db.predictions[k]) updated++; else added++; db.predictions[k] = v; }
db.note = "2 trận cuối (nhánh đã xác định bằng kết quả thật — SF: TBN 2-0 Pháp, Argentina 2-1 Anh): CK #104 Tây Ban Nha vs Argentina → dự đoán TBN vô địch 2-1; tranh hạng 3 #103 Pháp vs Anh → Pháp 2-1. 2026-07-16.";
writeFileSync(P, JSON.stringify(db, null, 2), 'utf8');
console.log(`✅ Final+3rd: +${added} mới, ${updated} cập nhật. Tổng ${Object.keys(db.predictions).length} trận.`);
