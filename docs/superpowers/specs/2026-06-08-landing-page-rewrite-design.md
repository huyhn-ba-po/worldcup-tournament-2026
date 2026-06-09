# Landing Page Rewrite — User-Friendly Copy (Approach 1: "AI đoán hộ bạn")

**Date**: 2026-06-08
**Scope**: Rewrite copy của `webapp/public/index.html` — không đổi layout/CSS, chỉ đổi text + bỏ jargon.
**File ảnh hưởng**: 1 file (`webapp/public/index.html`)

## Mục tiêu

Landing page hiện tại có quá nhiều thuật ngữ kỹ thuật (Hybrid Elo + Poisson + WCOI, Bayesian Updater, Backtest 55.5% accuracy 3-way, Brier 0.58, Log Loss 0.98) — đối tượng người dùng chính (fan bóng đá VN, không tech) không hiểu. Cần rewrite copy:

- **Target user**: Fan bóng đá VN — vừa fan thuần (chỉ quan tâm "ai thắng, bao nhiêu") vừa fan có quan tâm chút số liệu ("% tin cậy", "đội mạnh hơn").
- **Tone**: Bạn bè vui vẻ, casual, không khô khan, không quá đùa cợt.
- **Direction**: "AI đoán hộ bạn" — focus AI là trợ thủ, fan chỉ việc xem.

## Thay đổi theo Section (9 sections)

### Section 1: Hero (above-the-fold)

```
Eyebrow: "WORLD CUP 2026 · 11/6 → 19/7"

Headline: "World Cup 2026 đang đến — AI đoán hộ bạn 🤖⚽"

Lead: "Mỗi trong 104 trận đều có dự đoán AI: ai thắng, tỉ số bao nhiêu, lý do là gì.
       Xem AI đoán rồi so với linh cảm của bạn xem ai đúng."

CTA primary: "⚡ Xem AI đoán trận khai mạc"  → link /match/1
CTA secondary: "📋 Lịch đầy đủ 104 trận"      → link /groups

Trust footer: "AI từng đoán đúng ~5/10 trận ở 2 kỳ World Cup gần nhất. Không phải lúc
              nào cũng đúng — phần thú vị của bóng đá là vậy 😄"
```

**Bỏ**: "Hybrid Elo + Poisson + WCOI", "47.980 trận quốc tế lịch sử", "Gemini AI", "Backtest 55.5% accuracy 3-way · Brier 0.58 · Log Loss 0.98".

### Section 2: Countdown Banner (trận khai mạc)

```
Badge: "Trận khai mạc"               (giữ)
Tiêu đề: "Mexico vs Nam Phi"         (giữ)
Phụ: "Estadio Azteca · Mexico City · 02:00 sáng 12/6/2026 (giờ VN)"  (giữ)
Countdown 4 ô D/H/M/S                (giữ)

CTA: "⚡ Xem AI đoán trận này"       (thay "Xem stats baseline →")
Cột phải (cờ 2 đội):
  Trước: 🇲🇽 Mexico · Elo 1834  vs  🇿🇦 Nam Phi · Elo 1653
  Sau:   🇲🇽 Mexico              vs  🇿🇦 Nam Phi          (bỏ Elo)
```

**Lý do bỏ Elo**: Fan VN biết sẵn Mexico mạnh hơn Nam Phi — con số raw không có nghĩa. Fan B muốn số liệu vẫn vào page `/match/1` xem chi tiết.

### Section 3: Stats Strip (4 cards)

| # | Số to | Label | Phụ |
|---|-------|-------|-----|
| 1 | **48** | Đội bóng tham dự | Từ 6 châu lục |
| 2 | **104** | Trận đấu | Vòng bảng + knockout |
| 3 | **47.980** | Trận đấu quá khứ | AI học từ năm 1872 đến nay |
| 4 | **~5/10** | AI đoán đúng | Trên 2 kỳ World Cup trước |

**Bỏ**: "Backtest acc 55.5% · WC2018 + 2022" → "~5/10 trận đúng" để fan hiểu.

### Section 4: Features Grid — 6 cards "Vì sao webapp này hay?"

| # | Icon | Tiêu đề | Mô tả |
|---|------|---------|-------|
| 1 | 🤖 | **AI phân tích sẵn 104 trận** | Click vào trận nào, AI đoán ngay: ai thắng, tỉ số, vì sao. |
| 2 | 🇻🇳 | **Tiếng Việt + giờ VN** | "Hàn Quốc" thay vì "South Korea", "02:00 sáng 12/6" thay vì "13:00 UTC-6". |
| 3 | ⚽ | **Đầy đủ vòng bảng → chung kết** | 12 bảng A-L, knockout 1/16 → Chung kết 19/7. |
| 4 | 👥 | **48 đội + 1.000+ cầu thủ** | Mỗi đội trang riêng. Search cầu thủ (Messi, Mbappé...). |
| 5 | ⚖️ | **So sánh 2 đội bất kỳ** | Brazil gặp Argentina ai thắng? Pháp đối đầu Đức? Có hết. |
| 6 | 💚 | **Miễn phí + không quảng cáo** | Vào xem thoải mái, không cần đăng ký. |

**Bỏ**: "Hybrid Elo + Poisson", "AI làm Bayesian Updater", "Knockout bracket... placeholder slot".

### Section 5: How It Works — 3 bước

```
Section eyebrow: "PIPELINE" → "CÁCH DÙNG"
Section title: "3 bước để có 1 dự đoán" → "3 bước. Không phức tạp."
Section lead: bỏ "Mỗi trận đi qua 3 lớp..."
```

| # | Tiêu đề | Mô tả | Output line |
|---|---------|-------|-------------|
| 1 | **Chọn 1 trận** | Vào "12 Bảng" hoặc "Bracket", click trận bạn quan tâm. | → Vào trang chi tiết |
| 2 | **Bấm "Tạo dự đoán AI"** | Đợi vài giây cho AI phân tích. | → AI đang xử lý |
| 3 | **Đọc kết quả** | Ai thắng, tỉ số, 3 yếu tố then chốt + phân tích chi tiết. | → Xong! |

**Bỏ link**: "Xem diagram đầy đủ + công thức →" (đã link tới /methodology — trang đã ẩn).

### Section 6: Top Elo + Upcoming

```
Card trái:
  Title: "Top 5 Elo Rating" → "🏆 5 đội mạnh nhất WC2026"
  Label số: "Elo Rating" → "Sức mạnh" (giữ con số 2104, 2075... cho fan B)
  Không còn link "Full ranking →" (đã ẩn /leaderboard)

Card phải:
  Title: "5 trận đầu tiên" → "📅 5 trận khai cuộc"
  Items: giữ format M1 🇲🇽 Mexico vs Nam Phi 🇿🇦 · 02:00 12/06 (giờ VN)
```

### Section 7: Explore Grid — 6 cards điều hướng

| Card | Eyebrow | Title | Description (sau) |
|------|---------|-------|-------------------|
| /groups | 12 BẢNG | Vòng bảng A-L | "72 trận, lịch + AI dự đoán mỗi trận" |
| /bracket | KNOCKOUT | Bracket 1/16 → Final | "32 trận tới chung kết 19/7" *(giữ)* |
| /teams | 48 ĐỘI | Mỗi đội có trang riêng | "Đội hình, phong độ, lịch sử dự WC" |
| /players | CẦU THỦ | Search 1.000+ cầu thủ | "Tìm Messi, Mbappé, Bellingham..." |
| /compare | SO SÁNH | Brazil gặp Argentina ai thắng? | "So sánh 2 đội + lịch sử đối đầu" |
| /about | GIỚI THIỆU | Về tác giả + ủng hộ | *(giữ)* |

**Bỏ**: Section title "9 trang cho bạn đào sâu" → **"Khám phá thêm"** (đã có).

### Section 8: FAQ — Rút từ 6 câu → 5 câu

| # | Câu hỏi | Trả lời |
|---|---------|---------|
| 1 | **AI đoán có đúng không?** | Khoảng **5/10 trận đúng** (kiểm chứng trên WC 2018+2022). Đủ để xem cho vui, không phải để cá cược. |
| 2 | **AI lấy thông tin ở đâu để đoán?** | AI học từ **47.980 trận quốc tế** từ năm 1872, lịch thi đấu chính thức FIFA, và phong độ + đội hình mới nhất của từng đội. |
| 3 | **Có miễn phí thật không?** | Có. Hoàn toàn miễn phí, không quảng cáo, không cần đăng ký. Nếu thấy hữu ích, có thể mời tác giả một ly cà phê ở trang Giới thiệu. |
| 4 | **Có thể dùng để cá cược không?** | **Không**. AI đoán sai 1/2 trận. Cá cược bóng đá cũng bất hợp pháp ở Việt Nam. Hãy dùng để bàn tán vui thôi. |
| 5 | **Tôi có ý kiến đóng góp thì sao?** | Liên hệ qua email ở trang Giới thiệu. |

**Bỏ**: "Tại sao kết hợp AI với thống kê?" (quá kỹ thuật) và "Tôi có thể đóng góp tính năng?" (gộp vào câu 5).

### Section 9: Final CTA

```
Title:  "Sẵn sàng xem WC2026 với data?" → "OK, vào xem AI đoán nào! 🚀"
Lead:   "Bắt đầu từ trận khai mạc Mexico vs Nam Phi, hoặc xem lịch của đội bạn yêu thích."
CTA:    [Xem 12 bảng đấu] [Bracket knockout]  (giữ)
Footer: "Webapp này hoàn toàn miễn phí." → "Miễn phí, không quảng cáo, không cần đăng ký."
```

## Constraints

- **Chỉ đổi text** (innerHTML / textContent), không sửa CSS, layout, hoặc JS logic.
- **Giữ nguyên** `<style>` block, class names, IDs, animation, breakpoints.
- **Giữ nguyên** JS module imports + countdown logic + Promise.all data fetching.
- **Cập nhật cache version**: `?v=15` → `?v=16` (chỉ cho index.html).

## Test Plan

1. Mở `http://localhost:3000/` → đọc landing như fan VN không biết tech.
2. Verify mọi link click được:
   - "⚡ Xem AI đoán trận khai mạc" → `/match/1`
   - "📋 Lịch đầy đủ 104 trận" → `/groups`
   - 6 explore cards → đúng route
3. Verify countdown vẫn chạy.
4. Verify Top 5 Elo + 5 trận đầu vẫn load từ API.
5. Verify FAQ accordion vẫn mở/đóng.

## Out of Scope

- KHÔNG đổi `match-detail.html`, `team-detail.html`, `players.html` (đã rewrite trước đó hoặc chưa cần).
- KHÔNG đổi CSS/Tailwind classes.
- KHÔNG đổi API routes.
- KHÔNG add/remove sections — chỉ rewrite copy của 9 sections hiện có.
