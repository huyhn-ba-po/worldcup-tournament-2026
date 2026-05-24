<div align="center">

# WC2026 Predictor

**FIFA World Cup 2026 prediction webapp** — Hybrid statistical models + Gemini AI, anchored by 47,980 international matches (1872–2025).

[![Stars](https://img.shields.io/github/stars/huyhn-ba-po/worldcup-tournament-2026?style=flat-square&color=fcd34d&logo=github)](https://github.com/huyhn-ba-po/worldcup-tournament-2026/stargazers)
[![License](https://img.shields.io/badge/license-MIT-emerald?style=flat-square)](LICENSE)
[![Node](https://img.shields.io/badge/node-%E2%89%A518-emerald?style=flat-square&logo=node.js)](https://nodejs.org)
[![Backtest](https://img.shields.io/badge/backtest_acc-55.5%25-emerald?style=flat-square)](#-backtest-results)
[![Data](https://img.shields.io/badge/matches-47%2C980-blue?style=flat-square)](#-data-sources)

[Demo](#-quick-start) · [Methodology](#-methodology) · [Architecture](#%EF%B8%8F-architecture) · [Roadmap](#%EF%B8%8F-roadmap)

</div>

---

## 📖 Overview

Dự án dự đoán **104 trận FIFA World Cup 2026** (12 bảng A–L · 48 đội · 11/6 → 19/7/2026) kết hợp:

- **3 mô hình thống kê** chạy song song (Elo · Poisson · WC overlay)
- **Aggregator** weighted ensemble — tuned bằng backtest WC2018+2022 leak-free
- **Gemini 2.5 Flash** làm Bayesian updater với constraint ±15% từ baseline

Toàn bộ phương pháp, data, formula, weights, backtest results đều **công khai**. Bạn có thể tự kiểm chứng hoặc fork để adapt cho giải đấu khác.

> **Disclaimer**: Dự đoán mang tính tham khảo và học thuật. Backtest accuracy 55.5% nghĩa là ~1/2 dự đoán có thể sai. KHÔNG dùng làm cơ sở cá cược.

## ✨ Features

| | |
|---|---|
| 🎯 **Hybrid prediction** | 3 stats models + LLM Bayesian updater, không black box |
| 📊 **Stats baseline** | Mỗi trận có Elo · Poisson · Conf×Stage · WCOI breakdown chi tiết |
| 🤖 **AI analysis** | Gemini 2.5 Flash phân tích tiếng Việt với 3 đoạn (phong độ · lịch sử · dự đoán) |
| 🌐 **Multilingual** | Tên đội phiên âm tiếng Việt (Hàn Quốc, Nam Phi, Đức, Pháp...) |
| 🕐 **GMT+7 timezone** | Tất cả giờ thi đấu hiển thị giờ Việt Nam, không cần tính lại |
| 🏆 **Full tournament** | 72 trận vòng bảng + 32 trận knockout (R32 → Final 19/7) |
| 🔍 **Data explorer** | Search engine 47,980 trận quốc tế, filter theo đội/giải/năm |
| ⚖️ **Compare 2 teams** | Side-by-side stats + H2H 20 trận gần nhất |
| 🏅 **Leaderboard** | Elo ranking + WCOI top/bottom (ai overperform/underperform tại WC) |
| 📐 **Methodology page** | Pipeline diagram + công thức + backtest comparison |
| 💾 **Public data** | CC0 Public Domain (openfootball ecosystem) |

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       MATCH: Team A vs Team B                    │
└──────────────────────────────┬──────────────────────────────────┘
                               │
       ┌───────────────────────┼───────────────────────┐
       ▼                       ▼                       ▼
  ┌─────────┐            ┌──────────┐            ┌──────────┐
  │   ELO   │            │ POISSON  │            │WC Overlay│
  │ (47k)   │            │ (6k major│            │ (1k WC)  │
  │ K=20-55 │            │  α/δ team│            │WCOI+Conf │
  └────┬────┘            └─────┬────┘            └─────┬────┘
       │                       │                       │
       │  P_elo                │  λ_A, λ_B             │  adjustments
       ▼                       ▼                       ▼
  ┌──────────────────────────────────────────────────────────┐
  │  AGGREGATOR — weighted ensemble                          │
  │  P_baseline = 35% Elo + 35% Poisson + 20% Conf + 10% WCOI│
  │  (weights tuned by WC2018+2022 backtest)                 │
  └────────────────────────────┬─────────────────────────────┘
                               ▼
           ┌────────────────────────────────────────┐
           │  GEMINI 2.5 Flash · Bayesian Updater   │
           │  Constraint: P_final ∈ baseline ±15%   │
           │  (±25% with cited qualitative reason)  │
           └────────────────────┬───────────────────┘
                                ▼
              ┌─────────────────────────────────┐
              │  FINAL prediction               │
              │  · prob_a/d/b + score + conf    │
              │  · 3 đoạn phân tích VN          │
              │  · Stats breakdown transparency │
              └─────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js ≥ 18
- (Optional) Gemini API key — lấy free tại [aistudio.google.com/apikey](https://aistudio.google.com/apikey)

### Run locally

```bash
git clone https://github.com/huyhn-ba-po/worldcup-tournament-2026.git
cd worldcup-tournament-2026/webapp

npm install
cp .env.example .env
# Edit .env, set GEMINI_API_KEY (optional, AI button disabled if missing)

npm start
# → http://localhost:3000
```

### Dev mode (auto reload)

```bash
npm run dev
```

## 🗂️ Project structure

```
worldcup-tournament-2026/
├── webapp/                     # ⭐ Production webapp (Fastify + Vanilla JS)
│   ├── src/
│   │   ├── server.js           # Fastify entry + page routes
│   │   ├── routes/api.js       # 10 REST endpoints
│   │   ├── lib/
│   │   │   ├── stats.js        # Hybrid Elo + Poisson + WCOI aggregator
│   │   │   ├── h2h.js          # H2H + recent form lookup
│   │   │   ├── ai.js           # Gemini proxy + prompt builder
│   │   │   └── dataLoader.js
│   │   └── data/               # Embedded JSON (Elo, Poisson, overlay, fixtures)
│   ├── public/                 # 10 HTML pages + CSS + shared.js
│   ├── package.json
│   └── README.md               # Webapp-specific docs
│
├── predictor-app/              # 🧪 Legacy single-file HTML (v2.x)
│   ├── index.html              # Standalone (no backend needed)
│   ├── _data_7m/               # Multilingual data từ 7m.com.cn
│   └── _data_openfootball/     # Stats build pipeline + 47k matches data
│       ├── build_elo.js
│       ├── build_poisson.js
│       ├── build_wc_overlay.js
│       ├── backtest_wc.js
│       └── parse_aggregate.js
│
└── README.md                   # ← Bạn đang đọc
```

## 🔬 Methodology

### Tier 1 — Elo Rating (35% weight)

FIFA-style Elo cập nhật sau mỗi trong **47,980 trận quốc tế 1872–2025**. K-factor theo importance giải đấu:

| Tournament | K-factor |
|------------|----------|
| World Cup (group/KO) | 55 |
| UEFA Euro / Copa America | 45 |
| WC qualifiers | 35 |
| Continental qualifiers | 30 |
| Friendlies | 20 |

Margin of victory multiplier: `m = log(|GD| + 1) × damp(rating_diff)`

Host boost: +200 Mexico (Estadio Azteca), +100–150 USA/Canada venues.

### Tier 2 — Poisson Goal Model (35% weight)

Fit attack (`α`) và defense (`δ`) per team từ **6,028 trận major tournaments 2014+** (time-decay `exp(-0.10 × age)`):

```
λ_home = α_home × δ_away × home_boost × global_avg
λ_away = α_away × δ_home × global_avg
P(score=i,j) = Poisson(i; λ_home) × Poisson(j; λ_away)
```

### Tier 3 — Confederation × Stage Matrix (20% weight)

Trích từ **1,069 trận WC 1930–2022**: cho mỗi cặp liên đoàn (UEFA, CONMEBOL, CAF, AFC, CONCACAF, OFC) × stage (group / knockout), tính win rate lịch sử.

Ví dụ: UEFA vs AFC group stage win/draw/loss = 61% / 18% / 21%.

### Tier 4 — WCOI · WC Overperformance Index (10% weight)

```
WCOI = WC_win_rate − all_time_win_rate
```

- **Overperformers**: Argentina (+0.11), Croatia (+0.05), Germany (+0.05)
- **Underperformers**: Iran (−0.41), South Korea (−0.36), Mexico (−0.21, "knockout curse")

### Tier 5 — LLM Bayesian Updater

Gemini 2.5 Flash nhận stats baseline như anchor:

- **Constraint** `±15%` cho mỗi outcome → ngăn LLM hallucinate
- **Soft cap** `±25%` với lý do định tính rõ ràng (chấn thương, treo giò, motivation, tactical)
- Output: prediction JSON + 3 đoạn phân tích VN (form / history / prediction)

## 📊 Backtest Results

Leak-free backtest trên **WC2018 + WC2022 (128 trận)** — Elo rebuild đến cutoff date của từng trận:

| Method | Accuracy 3-way | Brier ↓ | Log Loss ↓ | Exact Score |
|--------|----------------|---------|------------|-------------|
| Random baseline | 33% | 0.67 | 1.10 | — |
| Poisson only (naive) | 46.1% | 0.65 | 1.08 | 7.8% |
| **Hybrid ensemble** | **55.5%** | **0.58** | **0.98** | **7.8%** |
| Elo only | 56.3% | 0.59 | 0.99 | — |
| Hybrid + LLM (expected) | ~58–62% | ~0.55 | ~0.85 | ~12% |

**Benchmark reference**:
- FiveThirtyEight SPI: ~57% WC group stage
- Bookmaker consensus: ~65–70%
- Random guess: 33%

## 📦 Data Sources

| Source | Volume | License |
|--------|--------|---------|
| [openfootball/internationals](https://github.com/openfootball/internationals) | 47,980 trận quốc tế 1872–2025 (Mart Jürisoo mirror) | CC0 Public Domain |
| [openfootball/worldcup.json](https://github.com/openfootball/worldcup.json) | 1,069 trận WC 1930–2026 + fixtures 2026 | CC0 Public Domain |
| [openfootball/worldcup.more](https://github.com/openfootball/worldcup.more) | WC chi tiết với goal scorers + lineups | CC0 Public Domain |
| 7m.com.cn | Multilingual names + live data | Public AJAX endpoint |
| FIFA official | Verify 12 bảng A–L draw 5/12/2025 | Public |

## 🛣️ Roadmap

### ✅ Done

- [x] Lịch thi đấu chính thức 104 trận (FIFA draw 5/12/2025)
- [x] Hybrid Elo + Poisson + WCOI pipeline
- [x] Backtest framework (leak-free, log loss / Brier / accuracy)
- [x] Multi-page Fastify webapp (10 trang)
- [x] Gemini AI integration với constraint anchor
- [x] Tên VN cho 48 đội + GMT+7 timezone
- [x] Knockout bracket (32 trận tới Final)
- [x] Donate QR Banking
- [x] Open source + public methodology

### 🚧 Phase 3 (planned)

- [ ] Squad scraping cho 48 đội từ Wikipedia (26-man rosters)
- [ ] Star player impact analysis (FBref scrape, free)
- [ ] FIFA Ranking real-time integration
- [ ] Parse openfootball/worldcup.more cho lineups + goal scorers
- [ ] Worldcup.more raw data → enriched H2H analysis
- [ ] Real-time live score during WC2026

### 💡 Ideas

- [ ] Browser extension hiển thị prediction trên FIFA.com
- [ ] Telegram bot push prediction trước mỗi trận
- [ ] Bracket simulator (predict group → auto-fill knockout)
- [ ] Tournament probability simulator (Monte Carlo 100k runs)
- [ ] Pre-match podcast generator (script tiếng Việt 5 phút)

## 🤝 Contributing

Welcome contributions! Một số hướng dễ bắt đầu:

1. **Improve methodology**: Dixon-Coles correction cho Poisson, opponent-adjusted attack/defense
2. **Add data sources**: scrape squad / injury / news từ ESPN/Sofascore
3. **UI/UX polish**: animations, mobile improvements, dark/light mode toggle
4. **i18n**: thêm English / Spanish / Mandarin

Open an issue trước khi PR cho changes lớn. Code style: Prettier defaults, no build step.

## 📜 License

[MIT](LICENSE) — bạn có thể fork, modify, deploy tự do.

Data từ openfootball ecosystem là **CC0 Public Domain** (không cần ghi nguồn). Tuy nhiên ghi credit là điều tử tế nên làm.

## ✍️ Author

**Huỳnh Nhật Huy** ([@huyhn-ba-po](https://github.com/huyhn-ba-po))

- Email: huynhnhathuyks@gmail.com
- GitHub: [github.com/huyhn-ba-po](https://github.com/huyhn-ba-po)

## ☕ Support

Nếu thấy dự án hữu ích:

- ⭐ **[Star repo này trên GitHub](https://github.com/huyhn-ba-po/worldcup-tournament-2026)** — miễn phí mà giúp lan rộng
- ☕ Mời tác giả một ly cà phê: quét QR Banking trong trang **/about** của webapp

## 🙏 Acknowledgments

- [openfootball](https://github.com/openfootball) team — public domain football data
- [Mart Jürisoo](https://www.kaggle.com/datasets/martj42/international-football-results-from-1872-to-2017) — international results dataset
- [FiveThirtyEight SPI](https://projects.fivethirtyeight.com/soccer-predictions/) — methodology inspiration
- [Dixon-Coles (1997)](https://www.math.ku.dk/~rolf/teaching/thesis/DixonColes.pdf) — Poisson correction paper
- 7m.com.cn — multilingual data endpoint
- Google Gemini — AI reasoning layer

---

<div align="center">

**Dự đoán có rigor thống kê + AI reasoning + dữ liệu công khai.**
**Football is unpredictable — but data makes it less so.**

[Top ↑](#wc2026-predictor)

</div>
