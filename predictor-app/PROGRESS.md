# WC2026 Predictor — Progress Log

History của các phase đã làm trên predictor-app, để pull được ở máy khác và tiếp tục.

---

## 📍 Trạng thái hiện tại (2026-05-14)

App phiên bản **v2.1** — đã refactor data từ "simulation cũ sai" sang **FIFA official draw 2025-12-05** với historical data gấp 9× so với bản gốc.

### Quick start trên máy mới

```bash
# 1. Clone fork
git clone https://github.com/Yamus142/worldcup-tournament-2026.git
cd worldcup-tournament-2026

# 2. Mở app
# Windows: double-click predictor-app/index.html
# Hoặc serve local:
cd predictor-app && python -m http.server 8000
# rồi mở http://localhost:8000

# 3. (Optional) Re-clone openfootball data nếu muốn re-parse / cập nhật
cd predictor-app/_data_openfootball
git clone --depth 1 https://github.com/openfootball/worldcup.json.git
git clone --depth 1 https://github.com/openfootball/internationals.git
git clone --depth 1 https://github.com/openfootball/worldcup.more.git
node parse_aggregate.js       # Tạo all_internationals.json + wc_all_matches.json
node build_h2h_subset.js      # Tạo embedded_historical.js để inline vào index.html

# 4. (Optional) Re-fetch 7m.com.cn data
cd predictor-app/_data_7m
node fetch_and_parse.js
```

---

## 🎯 Mục tiêu dự án

Web app static (HTML+Tailwind+Vanilla JS) dự đoán kết quả 104 trận FIFA World Cup 2026 với Gemini 2.5 Flash.

**Methodology "Hybrid Stat + LLM Reasoning"** — 3 tầng:
1. Stats lịch sử (H2H, time-decayed win rate, sức mạnh)
2. Metadata (chức vô địch, host advantage, FIFA tier, liên đoàn)
3. Gemini synthesis → JSON có cấu trúc

---

## ✅ Phase 0 — Setup (DONE)

- Clone repo gốc `minhquan2904/worldcup-tournament-2026`
- Cài GitHub CLI + auth account `Yamus142`
- Git author local: `Yamus142 / huynhnhathuyks@gmail.com`
- Mở app trong browser xác nhận hoạt động

---

## ✅ Phase 1 — Data Foundation (DONE)

### Phase 1.0 — Scrape 7m.com.cn (đa ngôn ngữ + live)

**Lý do**: User yêu cầu lấy data từ trang Trung Quốc 7m. Trang là SPA, data load qua AJAX.

**Endpoint tìm được** (đọc từ source `fixtures.js`):
```
https://txt-api.7m.com.cn/specials/worldcup2026/{games|standings|live}?lan={1|3|6}
```
- `lan=1` Chinese · `lan=3` English · `lan=6` Vietnamese
- Header: `Referer: https://www.7m.com.cn/2026worldcup/`

**Output**: [_data_7m/](_data_7m/)
- `games_{zh,en,vi}.json` — raw 104 trận (72 vòng bảng + 32 KO) + 112 team names
- `standings_{zh,en}.json` — 12 bảng A–L
- `live.json` — chi tiết live
- **`wc2026_clean.json`** — file chính (parsed, đa ngôn ngữ, giờ VN)
- `fetch_and_parse.js` — script Node.js fetch + parse
- `README.md` — schema docs

### Phase 1.1 — Verify chống FIFA official draw 5/12/2025

Đối chiếu data 7m với Wikipedia + FIFA + NBC + Olympics.com → **100% khớp** cả 12 bảng A–L.

Khám phá: data có sẵn trong repo gốc (`raw/misc/grupos_2026.json`, `format_fixture_data.csv`, `wc2026-fixture-format.md`) là **SIMULATION CŨ SAI**:
- Group A repo: `Mexico/Chile/Saudi Arabia/Peru` ❌
- Group A thực: `Mexico/South Africa/Korea Republic/Czech Republic` ✅

### Phase 1.2 — Clone openfootball (historical data public domain CC0)

Clone 3 repo vào [_data_openfootball/](_data_openfootball/):
- `worldcup.json/` (578 KB) — WC 1930-2026 JSON sạch (có stadium info)
- `internationals/` (8.9 MB) — Mirror Mart Jürisoo dataset 1872-2024, **47,980 trận** quốc tế
- `worldcup.more/` (929 KB) — WC chi tiết 1930-2022 với lineups + scorers

**Parse output**:
- **`all_internationals.json`** (7.7 MB) — 47,980 trận quốc tế 1872-2025 cho H2H + form
- `wc_all_matches.json` (398 KB) — 1,069 trận WC

**Scripts**:
- `parse_aggregate.js` — Parse Football.TXT → JSON
- `build_h2h_subset.js` — Filter 47k → 8865 trận liên quan WC2026 teams
- `gen_app_data.js` — Sinh JS literals cho GROUPS_2026/FIXTURES_2026

### Phase 1.A — Refactor index.html (CRITICAL FIX)

**Thay đổi trong `predictor-app/index.html`** (110 KB → 551 KB):

| Khối | Trước | Sau |
|------|-------|-----|
| `GROUPS_2026` | Bốc thăm cũ sai | FIFA official draw 5/12/2025 |
| `FIXTURES_2026` | `{match, group, home, away}` | + `date`, `time` (UTC offset), `ground` |
| Match number | Cluster theo nhóm | Chronological theo UTC kickoff (Match 1 = opener) |
| `TEAM_META` | 48 đội cũ | +8 đội mới (Czech, B&H, Sweden, Norway, Haiti, Curaçao, Iraq, DR Congo) |
| `MODERN_TO_HISTORICAL` | 5 alias | +1 (DR Congo → Zaire) |
| `HISTORICAL_MATCHES` | 965 WC-only 1930-2022 | **8,865 trận** 1872-2024 (9.2×) |

**Smoke test pass 100%**:
- 48 teams trong 12 bảng
- 72 fixtures, 0 mismatches
- ALL teams có historical data (no zeros)
- Match numbers 1-72 unique
- 8865 historical matches cover 1872-2024

**H2H upgrade thực tế**:
- Mexico vs SA (Match 1): 1 → 4 matches
- South Korea vs Czech (Match 2): 0 → 6 matches
- US vs Paraguay (Match 4): 0 → 8 matches
- Top: Argentina 718, Brazil 701, Uruguay 621, Germany 576, England 576
- Bottom: Curaçao 75, Cape Verde 84 (vẫn đủ cho phân tích)

---

## ⏳ Phase 2 — Còn lại (TODO)

### Phase 2.1 — Wikipedia squads scrape (chưa làm)

Lấy đội hình 26-man WC2026 cho 48 đội từ Wikipedia squad pages. Mục tiêu: thêm "key players" + "đội hình" vào AI prompt.

URL pattern: `https://en.wikipedia.org/wiki/{Country}_at_the_2026_FIFA_World_Cup`

### Phase 2.2 — FBref recent form 2025-2026 (chưa làm)

Form club-level cho cầu thủ key. FBref miễn phí scrape HTML, hoặc StatsBomb API (paid).

### Phase 2.3 — FIFA Ranking real-time (chưa làm)

Wikipedia: `https://en.wikipedia.org/wiki/FIFA_Men%27s_World_Ranking` (cập nhật hàng tháng).

### Phase 2.4 — Parse worldcup.more lineups (chưa làm)

Custom Football.TXT format với scorers + lineups + substitutions cho 1930-2022. Cần parser riêng (regex multi-line).

### Phase 2.5 — Refine AI prompt (chưa làm)

Tận dụng data mới: pass H2H 4 trận Mexico-SA cho AI thay vì chỉ feed stats aggregate.

### Phase Side — Update repo gốc data (option 2 user đã đồng ý)

Update `raw/misc/grupos_2026.json` + `format_fixture_data.csv` + `wc2026-fixture-format.md` với data đúng từ 7m/openfootball. Sau đó open PR ngược về `minhquan2904`.

---

## 📂 Cấu trúc folder

```
predictor-app/
├── PROGRESS.md             ← Bạn đang đọc
├── README.md               (gốc của repo, mô tả app)
├── index.html (551 KB)     ← v2.1 — embedded data
├── landing.html (540 line) ← MKT page
├── _data_7m/
│   ├── README.md
│   ├── fetch_and_parse.js
│   ├── games_{zh,en,vi}.json
│   ├── standings_{zh,en}.json
│   ├── live.json
│   └── wc2026_clean.json   ← Main data file
└── _data_openfootball/
    ├── README.md
    ├── parse_aggregate.js
    ├── build_h2h_subset.js
    ├── gen_app_data.js
    ├── all_internationals.json (7.7 MB)
    ├── wc_all_matches.json
    ├── embedded_historical.js  ← Source for HISTORICAL_MATCHES trong index.html
    ├── app_data_inject.txt
    └── (worldcup.json/, internationals/, worldcup.more/ trong .gitignore)
```

---

## 🔧 Workflow tiếp tục

### Trên máy khác (lần đầu)

```bash
git clone https://github.com/Yamus142/worldcup-tournament-2026.git
cd worldcup-tournament-2026/predictor-app
# Mở index.html bằng browser
```

### Cập nhật data mới (định kỳ)

```bash
# Re-clone openfootball
cd predictor-app/_data_openfootball
rm -rf worldcup.json internationals worldcup.more
git clone --depth 1 https://github.com/openfootball/worldcup.json.git
git clone --depth 1 https://github.com/openfootball/internationals.git
git clone --depth 1 https://github.com/openfootball/worldcup.more.git
node parse_aggregate.js
node build_h2h_subset.js

# Embed vào index.html bằng Node script (xem PROGRESS.md cũ trong git log)
# Hoặc copy thủ công khối HISTORICAL_MATCHES từ embedded_historical.js vào index.html
```

### Test browser

1. Mở `index.html` (double-click)
2. Tab "Bảng A" → phải hiển thị Mexico/SA/SK/Czech
3. Match 1 → Mexico vs South Africa, Mexico City, 11/6/2026
4. Click ⚙️ Settings → paste Gemini API key (https://aistudio.google.com/apikey)
5. Click 🤖 AI trên trận bất kỳ → check prediction
6. Click 📊 Dữ liệu AI đã dùng → verify H2H + form data passed to AI

---

## 🔗 Sources & licenses

- **openfootball/*** — CC0 Public Domain (free, no attribution required)
- **7m.com.cn** — Scrape (no API key needed, đọc qua AJAX endpoint công khai)
- **FIFA official** — Cross-check verify (https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026)

---

## 📝 Git history relevant commits

- `52123d3` — feat(predictor-app): add WC2026 AI prediction web app (original by minhquan2904)
- (Phase 1 commit) — Refactor data: FIFA draw + openfootball historical 9× upgrade
