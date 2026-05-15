# WC2026 Predictor Webapp

Public webapp dự đoán FIFA World Cup 2026 kết hợp **Elo + Poisson + WCOI + Gemini AI**, anchored bởi 47,980 trận quốc tế 1872-2025.

Inspired by [AgentUniversity](../../AgentUniversity) pattern: Fastify + multi-page HTML + REST API.

## Quick start

```bash
cd webapp
npm install
cp .env.example .env
# Sửa .env: thêm GEMINI_API_KEY (lấy free tại https://aistudio.google.com/apikey)
npm start
# Mở http://localhost:3000
```

Không có API key vẫn chạy được — chỉ tab "AI dự đoán" bị disable.

## Cấu trúc

```
webapp/
├── package.json
├── .env.example
├── src/
│   ├── server.js              # Fastify entry
│   ├── data/                  # Embedded JSON (Elo, Poisson, overlay, fixtures)
│   ├── lib/                   # Business logic
│   │   ├── dataLoader.js
│   │   ├── normalize.js       # Team name aliases
│   │   ├── stats.js           # Hybrid baseline computation
│   │   ├── h2h.js             # Head-to-head + form lookup
│   │   └── ai.js              # Gemini proxy + prompt builder
│   └── routes/api.js          # REST endpoints
└── public/                    # Static HTML/CSS/JS
    ├── css/main.css
    ├── js/shared.js           # ES module shared by all pages
    ├── index.html             # Home
    ├── groups.html            # 12 bảng A-L
    ├── teams.html             # 48 đội (list + filter)
    ├── team-detail.html       # Per team detail (Elo, Poisson, fixtures, form, WC history)
    ├── match-detail.html      # Per match (stats baseline + AI prediction button)
    ├── methodology.html       # Explain Elo/Poisson/WCOI/Conf×Stage
    ├── leaderboard.html       # Elo ranking + WCOI top/bottom
    ├── compare.html           # Side-by-side 2 teams + H2H
    ├── data-explorer.html     # Search 47k matches
    └── about.html             # About + sources + disclaimer
```

## Routes

### Pages (HTML)
- `/` — Home với countdown, top Elo, upcoming matches, navigation
- `/groups` — 12 nhóm A-L với đội + fixtures
- `/teams` — Grid 48 đội, filter theo conf/sort
- `/team/:name` — Detail page per đội (Elo, Poisson, fixtures, form, WC history)
- `/match/:id` — Detail match với stats baseline + AI prediction
- `/methodology` — Giải thích hybrid pipeline + backtest results
- `/leaderboard` — Elo ranking + WCOI top/bottom
- `/compare` — So sánh 2 đội side-by-side + H2H
- `/data` — Search 47,980 trận với filter
- `/about` — Credits + disclaimer

### API
- `GET /api/meta` — App stats (counts, backtest, weights)
- `GET /api/teams` — All 48 teams với stats
- `GET /api/teams/:name` — Team detail + group fixtures + recent form + WC history
- `GET /api/matches` — All 72 fixtures
- `GET /api/matches/:id` — Match + computed stats baseline + h2h + recent forms
- `GET /api/h2h/:teamA/:teamB?limit=20` — Head-to-head lookup
- `GET /api/baseline/:teamA/:teamB?stage=group` — Stats baseline only
- `GET /api/leaderboard` — Elo + WCOI rankings
- `GET /api/methodology` — Backtest results + Conf×Stage matrix
- `GET /api/search?team=&tournament=&year_from=&year_to=&limit=&offset=` — Search 47k matches
- `POST /api/predict/:id` — Gemini AI prediction (requires `GEMINI_API_KEY` in `.env`, LRU cached 24h)

## Update data

Khi openfootball có data mới hoặc fixture 2026 thay đổi:

```bash
# 1. Re-clone openfootball
cd ../predictor-app/_data_openfootball
git clone --depth 1 https://github.com/openfootball/internationals.git
git clone --depth 1 https://github.com/openfootball/worldcup.json.git

# 2. Re-build stats (chạy lại 4 scripts)
node parse_aggregate.js
node build_elo.js
node build_poisson.js
node build_wc_overlay.js
node build_embed_stats.js

# 3. Copy data sang webapp
cp elo_ratings.json poisson_params.json wc_overlay.json backtest_report.json all_internationals.json wc_all_matches.json ../../webapp/src/data/
```

## Deploy

### Local
`npm start` — port 3000

### Railway/Render
Set env var `GEMINI_API_KEY`, `PORT`, `NODE_ENV=production`. `npm start` works as-is.

### Docker (optional)
Dockerfile có thể thêm sau:
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
ENV PORT=3000
EXPOSE 3000
CMD ["node", "src/server.js"]
```

## Tech notes

- **No build step**: HTML/CSS/JS load trực tiếp, Tailwind via CDN, ES modules
- **Data ngầm**: ~9 MB JSON load vào memory lúc startup (LRU cache, không re-read)
- **AI cache**: 24h LRU per match (200 entries max)
- **No DB**: tất cả là JSON đọc 1 lần lúc start
