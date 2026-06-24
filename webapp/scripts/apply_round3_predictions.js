// Cập nhật dự đoán LƯỢT 3 (lượt cuối vòng bảng) — Elo "sống" sau 48 trận + cục diện đi tiếp
// (top 2 mỗi bảng + 8 đội hạng 3 tốt nhất) + động lực "phải thắng"/"đã qua vòng" + chấn thương carry-over.
// Lưu ý: tin chấn thương lấy từ mốc ~18/06 (lượt 2); một số trường hợp có thể đã thay đổi tới ~24/06.
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const P = join(__dirname, '..', 'src', 'data', 'predictions.json');

// prob_a/prob_b: theo ĐỘI NHÀ (home) / ĐỘI KHÁCH (away) đúng thứ tự fixture.
const R3 = {
  // ===== BẢNG A (Mexico 6đ đã qua; Hàn 3đ; Séc/Nam Phi phải thắng) =====
  "53": { prob_a:30,prob_draw:26,prob_b:44, score_a:1,score_b:2, winner:"Mexico", confidence:44,
    key_factors:["Mexico nhất bảng (6đ), chơi để giữ ngôi đầu","Séc phải thắng mới mong vé hạng 3","Mexico có thể xoay tua nhẹ nhưng vẫn hơn đẳng cấp"],
    analysis_form:"Mexico toàn thắng (2-0 Nam Phi, 1-0 Hàn Quốc); Séc mới 1 điểm (thua Hàn, hòa Nam Phi).",
    analysis_history:"Mexico nhỉnh hơn về tổ chức; Séc trông cậy Schick–Souček nhưng thiếu ổn định.",
    analysis_prediction:"Áp lực dồn lên Séc nhưng Mexico bản lĩnh hơn: dự đoán Mexico thắng 2-1." },
  "54": { prob_a:24,prob_draw:28,prob_b:48, score_a:1,score_b:2, winner:"South Korea", confidence:44,
    key_factors:["Hàn Quốc chỉ cần tránh thua là gần như đi tiếp","Nam Phi phải thắng, đã 0 bàn từ bóng sống nhiều trận","Son Heung-min tạo khác biệt"],
    analysis_form:"Hàn Quốc 3 điểm (thắng Séc, thua sát Mexico); Nam Phi 1 điểm, hàng công bế tắc.",
    analysis_history:"Hàn Quốc vượt trội về cá nhân với Son dẫn dắt.",
    analysis_prediction:"Son tạo đột biến giúp Hàn Quốc thắng 2-1." },

  // ===== BẢNG B (Canada 4đ+6, Thụy Sĩ 4đ+3 — đều gần chắc; Bosnia/Qatar phải thắng) =====
  "49": { prob_a:33,prob_draw:32,prob_b:35, score_a:1,score_b:1, winner:"Hòa", confidence:38,
    key_factors:["Cả hai cùng 4đ, một trận hòa gần như đưa cả hai đi tiếp","Canada bay cao (vùi dập Qatar 6-0)","Trận tranh ngôi đầu nhưng dễ thận trọng"],
    analysis_form:"Thụy Sĩ thắng Bosnia 4-1; Canada thắng Qatar 6-0. Cả hai đang đầy tự tin và an toàn về điểm số.",
    analysis_history:"Hai đội ngang cơ; Thụy Sĩ kỷ luật, Canada thể lực + khán giả nhà.",
    analysis_prediction:"Khi cả hai cùng có lợi nếu hòa: dự đoán hòa 1-1." },
  "50": { prob_a:48,prob_draw:24,prob_b:28, score_a:2,score_b:1, winner:"Bosnia & Herzegovina", confidence:40,
    key_factors:["Cả hai gần như bị loại — đá vì danh dự","Bosnia có Džeko, chất lượng cá nhân hơn","Qatar thủng 7 bàn, phòng ngự rệu rã"],
    analysis_form:"Bosnia thua Thụy Sĩ 1-4; Qatar thua Canada 0-6. Cả hai mới 1 điểm và hết cửa.",
    analysis_history:"Bosnia có mũi nhọn Džeko, hơn Qatar về kinh nghiệm.",
    analysis_prediction:"Bosnia tận dụng cá nhân để thắng danh dự 2-1." },

  // ===== BẢNG C (Brazil 4đ, Maroc 4đ, Scotland 3đ; Haiti loại) =====
  "51": { prob_a:22,prob_draw:24,prob_b:54, score_a:1,score_b:2, winner:"Brazil", confidence:46,
    key_factors:["Brazil cần thắng để chắc ngôi đầu trước Maroc","Hàng công Brazil còn sứt mẻ (Rodrygo/Estêvão chấn thương, Neymar nghi ngờ)","Scotland phải có điểm để giữ hy vọng đi tiếp"],
    analysis_form:"Brazil hòa Maroc 1-1 rồi thắng Haiti 3-0; Scotland thắng Haiti 1-0, thua Maroc 0-1.",
    analysis_history:"Brazil vượt trội đẳng cấp dù thiếu vài trụ cột tấn công.",
    analysis_prediction:"Brazil thắng nhưng không dễ: dự đoán 2-1." },
  "52": { prob_a:62,prob_draw:20,prob_b:18, score_a:2,score_b:0, winner:"Morocco", confidence:52,
    key_factors:["Maroc cần thắng để tranh ngôi đầu bảng","Haiti yếu nhất bảng, đã bị loại","Maroc phòng ngự chắc, Hakimi–El Kaabi sắc bén"],
    analysis_form:"Maroc cầm hòa Brazil 1-1 và thắng Scotland 1-0; Haiti thua cả hai, chưa ghi bàn.",
    analysis_history:"Maroc — hạng tư World Cup 2022 — hơn hẳn Haiti mọi tuyến.",
    analysis_prediction:"Maroc thắng thoải mái 2-0." },

  // ===== BẢNG D (Mỹ 6đ đã qua; Úc 3đ & Paraguay 3đ tranh vé; Thổ loại) =====
  "59": { prob_a:30,prob_draw:34,prob_b:36, score_a:1,score_b:1, winner:"Hòa", confidence:37,
    key_factors:["Mỹ đã nhất bảng (6đ) → nhiều khả năng xoay tua","Thổ Nhĩ Kỳ đá vì danh dự nhưng có Çalhanoğlu, Güler","Đội hình Mỹ thay đổi làm giảm sức mạnh"],
    analysis_form:"Mỹ toàn thắng (4-1, 2-0); Thổ Nhĩ Kỳ thua cả hai và đã bị loại.",
    analysis_history:"Trên giấy Mỹ mạnh hơn, nhưng đội hình hai dễ tạo thế cân bằng.",
    analysis_prediction:"Mỹ xoay tua, Thổ quyết vớt danh dự: dự đoán hòa 1-1." },
  "60": { prob_a:30,prob_draw:24,prob_b:46, score_a:0,score_b:1, winner:"Australia", confidence:42,
    key_factors:["Trận tranh vé nhì bảng trực tiếp","Úc hơn hiệu số (0 so với -2) → chỉ cần hòa là đi tiếp","Paraguay phải thắng nhưng hàng công nghèo bàn"],
    analysis_form:"Úc thắng Thổ 2-0, thua Mỹ 0-2; Paraguay thắng Thổ 1-0, thua Mỹ 1-4.",
    analysis_history:"Úc thực dụng và đang ở thế thuận lợi hơn về điểm/hiệu số.",
    analysis_prediction:"Úc phòng ngự chắc và tận dụng cơ hội: thắng 1-0." },

  // ===== BẢNG E (Đức 6đ đã qua; Bờ Biển Ngà 3đ; Ecuador/Curaçao khó) =====
  "55": { prob_a:24,prob_draw:24,prob_b:52, score_a:1,score_b:2, winner:"Ivory Coast", confidence:44,
    key_factors:["Bờ Biển Ngà cần thắng để chắc vé nhì bảng","Curaçao thủng 7 bàn ở lượt 1, mong manh","Tuyến giữa BBN (Kessié, Sangaré) áp đảo"],
    analysis_form:"Bờ Biển Ngà thắng Ecuador 1-0, thua Đức 1-2; Curaçao bị Đức vùi 1-7 rồi hòa Ecuador 0-0.",
    analysis_history:"Bờ Biển Ngà hơn về thể lực và chất lượng cá nhân.",
    analysis_prediction:"Bờ Biển Ngà giành 3 điểm cần thiết: thắng 2-1." },
  "56": { prob_a:26,prob_draw:22,prob_b:52, score_a:1,score_b:2, winner:"Germany", confidence:44,
    key_factors:["Đức đã nhất bảng (6đ) và có thể xoay tua","Đức thiếu ter Stegen (thủ môn) và Gnabry","Ecuador phải thắng nhưng tịt ngòi (0 bàn sau 2 trận)"],
    analysis_form:"Đức thắng 7-1 và 2-1; Ecuador thua BBN 0-1, hòa Curaçao 0-0 — chưa ghi bàn.",
    analysis_history:"Đức vẫn là ứng viên vô địch, hơn hẳn Ecuador về tấn công.",
    analysis_prediction:"Dù xoay tua, Đức vẫn thắng 2-1." },

  // ===== BẢNG F (Hà Lan 4đ, Nhật 4đ — tranh đầu bảng; Thụy Điển 3đ; Tunisia loại) =====
  "57": { prob_a:52,prob_draw:20,prob_b:28, score_a:2,score_b:1, winner:"Japan", confidence:46,
    key_factors:["Nhật chỉ cần hòa là gần chắc đi tiếp","Nhật đang nóng máy (4-0 Tunisia)","Thụy Điển phải thắng, dựa Isak–Gyökeres"],
    analysis_form:"Nhật hòa Hà Lan 2-2 rồi thắng Tunisia 4-0; Thụy Điển thắng Tunisia 5-1 nhưng thua Hà Lan 1-5.",
    analysis_history:"Nhật tốc độ và phối hợp nhuyễn, gây khó cho hàng thủ Thụy Điển.",
    analysis_prediction:"Nhật làm chủ thế trận: thắng 2-1." },
  "58": { prob_a:24,prob_draw:24,prob_b:52, score_a:1,score_b:2, winner:"Netherlands", confidence:43,
    key_factors:["Hà Lan cần thắng để tranh ngôi đầu với Nhật","Hà Lan tổn thất nặng tuyến sau (Xavi Simons ACL, Timber, de Ligt)","Tunisia đã bị loại, thủng 9 bàn sau 2 trận"],
    analysis_form:"Hà Lan hòa Nhật 2-2, thắng Thụy Điển 5-1; Tunisia thua cả hai (1-5, 0-4).",
    analysis_history:"Hà Lan vượt trội dù khủng hoảng nhân sự phòng ngự; Depay–Gakpo đủ sức xuyên phá.",
    analysis_prediction:"Hà Lan thắng nhưng để lọt lưới: dự đoán 2-1." },

  // ===== BẢNG G (Ai Cập 4đ; Iran 2đ & Bỉ 2đ phải thắng; New Zealand 1đ) =====
  "65": { prob_a:33,prob_draw:34,prob_b:33, score_a:1,score_b:1, winner:"Hòa", confidence:36,
    key_factors:["Ai Cập chỉ cần 1 điểm là gần chắc nhất bảng","Iran phòng ngự cực lì, trận ít bàn","Salah có thể bùng nổ nhưng dễ bị khóa"],
    analysis_form:"Ai Cập hòa Bỉ 1-1, thắng New Zealand 3-1; Iran hòa New Zealand 2-2 và hòa Bỉ 0-0.",
    analysis_history:"Hai đội cân bằng; hàng thủ Iran luôn khó xuyên phá.",
    analysis_prediction:"Trận chặt chẽ giữa hai nhu cầu trái ngược: dự đoán hòa 1-1." },
  "66": { prob_a:30,prob_draw:24,prob_b:46, score_a:1,score_b:2, winner:"Belgium", confidence:40,
    key_factors:["Bỉ buộc phải thắng để đi tiếp (mới 2đ)","Dàn sao Lukaku–De Bruyne phải lên tiếng","New Zealand khó chịu nhưng kém đẳng cấp"],
    analysis_form:"Bỉ gây thất vọng (hòa 1-1, 0-0) chỉ ghi 1 bàn; New Zealand hòa Iran 2-2, thua Ai Cập 1-3.",
    analysis_history:"Bỉ vượt trội cá nhân; khi bị dồn vào chân tường thường bung sức.",
    analysis_prediction:"Bỉ thắng trong trận sống còn: dự đoán 2-1." },

  // ===== BẢNG H (TBN 4đ; Uruguay 2đ & Cape Verde 2đ; Ả Rập 1đ) =====
  "64": { prob_a:24,prob_draw:26,prob_b:50, score_a:1,score_b:2, winner:"Spain", confidence:44,
    key_factors:["Tây Ban Nha cần thắng để chắc ngôi đầu","Uruguay phải có điểm, lại mất trung vệ Giménez","TBN kiểm soát bóng vượt trội (Yamal nếu kịp bình phục)"],
    analysis_form:"TBN hòa Cape Verde 0-0 rồi thắng Ả Rập 4-0; Uruguay hòa cả Ả Rập và Cape Verde.",
    analysis_history:"TBN cầm bóng và đẳng cấp hơn; Uruguay trông cậy bản lĩnh và Valverde.",
    analysis_prediction:"Tây Ban Nha thắng 2-1 dù Uruguay đá rắn." },
  "63": { prob_a:42,prob_draw:30,prob_b:28, score_a:1,score_b:0, winner:"Cape Verde", confidence:38,
    key_factors:["Cape Verde thắng là gần như đoạt vé lịch sử","Ả Rập gần bị loại (thua TBN 0-4), ít động lực","Trận ít bàn, đội nào tận dụng cơ hội sẽ thắng"],
    analysis_form:"Cape Verde hòa TBN 0-0 và hòa Uruguay 2-2; Ả Rập hòa Uruguay 1-1, thua đậm TBN.",
    analysis_history:"Cape Verde phòng ngự kỷ luật và đang giàu động lực hơn.",
    analysis_prediction:"Cape Verde tận dụng quyết tâm để thắng tối thiểu 1-0." },

  // ===== BẢNG I (Pháp 6đ & Na Uy 6đ đã qua; Senegal/Iraq loại) =====
  "61": { prob_a:32,prob_draw:34,prob_b:34, score_a:1,score_b:1, winner:"Hòa", confidence:36,
    key_factors:["Cả hai đã chắc suất, chỉ tranh ngôi đầu","Khả năng cao xoay tua, giữ sức cho vòng knock-out","Haaland vs Mbappé nhưng đôi bên ngại rủi ro"],
    analysis_form:"Cả Na Uy và Pháp đều toàn thắng 2 trận và bỏ xa phần còn lại của bảng.",
    analysis_history:"Hai đội ngang tài; Pháp nhỉnh chiều sâu, Na Uy có Haaland đang rực sáng.",
    analysis_prediction:"Hai đội an toàn về vé nên thận trọng: dự đoán hòa 1-1." },
  "62": { prob_a:52,prob_draw:28,prob_b:20, score_a:2,score_b:0, winner:"Senegal", confidence:44,
    key_factors:["Cả hai đã bị loại — đá vì danh dự","Senegal vượt trội cá nhân (Mané, Sarr)","Iraq thủng 7 bàn sau 2 trận"],
    analysis_form:"Senegal thua Pháp và Na Uy nhưng vẫn ghi 3 bàn; Iraq thua cả hai (1-4, 0-3).",
    analysis_history:"Senegal hơn hẳn đẳng cấp và thể hình.",
    analysis_prediction:"Senegal khép lại bằng chiến thắng 2-0." },

  // ===== BẢNG J (Argentina 6đ đã qua; Áo 3đ & Algeria 3đ tranh vé; Jordan loại) =====
  "71": { prob_a:42,prob_draw:26,prob_b:32, score_a:2,score_b:1, winner:"Algeria", confidence:40,
    key_factors:["Trận tranh vé nhì bảng trực tiếp","Algeria kém hiệu số nên buộc phải thắng","Mahrez là quân bài tạo đột biến"],
    analysis_form:"Algeria thắng Jordan 2-1, thua Argentina 0-3; Áo thắng Jordan 3-1, thua Argentina 0-2.",
    analysis_history:"Hai đội ngang điểm; Algeria nhỉnh hơn ở ngôi sao tấn công.",
    analysis_prediction:"Algeria thắng trong trận sống còn nhờ Mahrez: 2-1." },
  "72": { prob_a:22,prob_draw:26,prob_b:52, score_a:1,score_b:2, winner:"Argentina", confidence:42,
    key_factors:["Argentina đã nhất bảng (6đ) → xoay tua mạnh, có thể để Messi nghỉ","Romero, Molina dính chấn thương từ lượt trước","Chiều sâu (Lautaro, Álvarez) vẫn quá mạnh so với Jordan"],
    analysis_form:"Argentina toàn thắng (3-0, 2-0) và sạch lưới; Jordan thua cả hai, đã bị loại.",
    analysis_history:"Đẳng cấp Argentina áp đảo dù không tung đội hình mạnh nhất.",
    analysis_prediction:"Đội hình hai Argentina vẫn thắng 2-1." },

  // ===== BẢNG K (Colombia 6đ & Bồ Đào Nha 4đ đã qua; Congo/Uzbekistan đua hạng 3) =====
  "69": { prob_a:31,prob_draw:35,prob_b:34, score_a:1,score_b:1, winner:"Hòa", confidence:36,
    key_factors:["Cả hai đã đi tiếp; Colombia chỉ cần hòa là giữ ngôi đầu","Bồ Đào Nha cần thắng mới vượt lên đầu bảng","Hai đội có thể giữ chân trụ cột cho vòng sau"],
    analysis_form:"Colombia toàn thắng (3-1, 1-0); Bồ Đào Nha hòa Congo 1-1, thắng Uzbekistan 5-0.",
    analysis_history:"Colombia (James, Díaz) và Bồ Đào Nha (Ronaldo, chiều sâu) ngang ngửa.",
    analysis_prediction:"Colombia thủ chắc giữ ngôi đầu, Bồ khó xuyên phá: dự đoán hòa 1-1." },
  "70": { prob_a:44,prob_draw:28,prob_b:28, score_a:2,score_b:1, winner:"DR Congo", confidence:38,
    key_factors:["CHDC Congo cần thắng để nuôi hy vọng vé hạng 3","Uzbekistan đã bị loại (thủng 8 bàn)","Congo từng cầm hòa Bồ Đào Nha — đủ lì lợm"],
    analysis_form:"Congo hòa Bồ Đào Nha 1-1, thua sát Colombia 0-1; Uzbekistan thua cả hai (1-3, 0-5).",
    analysis_history:"Congo giàu thể lực và động lực hơn hẳn.",
    analysis_prediction:"Congo thắng để bám đuổi suất vớt: 2-1." },

  // ===== BẢNG L (Anh 4đ & Ghana 4đ tranh đầu; Croatia 3đ phải thắng; Panama loại) =====
  "67": { prob_a:14,prob_draw:20,prob_b:66, score_a:0,score_b:2, winner:"England", confidence:52,
    key_factors:["Anh cần thắng để chắc ngôi đầu bảng","Hỏa lực Anh mạnh (Kane) gặp Panama đã bị loại","Panama mới ghi 0 bàn sau 2 trận"],
    analysis_form:"Anh thắng Croatia 4-2, hòa Ghana 0-0; Panama thua Ghana 0-1, thua Croatia 0-1.",
    analysis_history:"Anh vượt trội toàn diện; Panama khó tạo ra cơ hội.",
    analysis_prediction:"Anh thắng chủ động 2-0." },
  "68": { prob_a:50,prob_draw:26,prob_b:24, score_a:2,score_b:1, winner:"Croatia", confidence:42,
    key_factors:["Croatia phải thắng để vượt Ghana lấy vé","Modrić điều tiết tuyến giữa","Ghana chỉ cần hòa là gần chắc đi tiếp → có thể thủ"],
    analysis_form:"Croatia thua Anh 2-4 nhưng thắng Panama 1-0; Ghana thắng Panama 1-0, hòa Anh 0-0.",
    analysis_history:"Croatia — á quân 2018 — hơn Ghana về kỹ thuật và kinh nghiệm.",
    analysis_prediction:"Croatia quyết thắng để đi tiếp: 2-1." },
};

const data = JSON.parse(readFileSync(P, 'utf8'));
let n = 0, draws = 0;
for (const [id, pred] of Object.entries(R3)) { data.predictions[id] = pred; n++; if (pred.winner === 'Hòa') draws++; }
data.note = `Stats baseline (Elo SỐNG sau 48 trận) + Claude điều chỉnh theo cục diện đi tiếp (top 2 + 8 hạng 3) + động lực phải-thắng/đã-qua-vòng + chấn thương carry-over (~18/06). Cập nhật lượt 3 ${new Date().toISOString().slice(0,10)}.`;
writeFileSync(P, JSON.stringify(data, null, 2), 'utf8');
console.log(`✅ Cập nhật ${n} dự đoán lượt 3 (trong đó ${draws} trận HÒA = ${Math.round(draws/n*100)}%)`);
