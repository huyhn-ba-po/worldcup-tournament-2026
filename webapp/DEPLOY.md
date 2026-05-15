# Deploy lên Railway

Webapp này là Node.js Fastify backend → cần platform hỗ trợ Node.js (KHÔNG dùng GitHub Pages).

## Bước 1 — Đăng ký Railway

1. Vào https://railway.app
2. Click **"Login with GitHub"** → authorize Railway access vào repo của bạn
3. Free tier: $5 credit/tháng (~500h chạy 24/7, đủ cho traffic nhỏ-trung)

## Bước 2 — Deploy

1. Click **"+ New Project"** → **"Deploy from GitHub repo"**
2. Chọn repo `huyhn-ba-po/worldcup-tournament-2026`
3. Railway auto detect Node.js. Cần override 1 setting:
   - Vào **Settings** → **Service Settings**
   - **Root Directory**: `webapp` (vì repo có nhiều folder, chỉ deploy `/webapp`)
   - **Build Command**: để trống (Nixpacks tự xử lý)
   - **Start Command**: `node src/server.js`

## Bước 3 — Set environment variables

Vào tab **Variables** → thêm:

```
GEMINI_API_KEY=<REDACTED-GEMINI-KEY>
NODE_ENV=production
```

> ⚠️ Khuyến nghị: tạo Gemini key mới tại https://aistudio.google.com/apikey để thay cho key đã share trong chat.

## Bước 4 — Generate public domain

1. Vào **Settings** → **Networking** → **Public Networking** → click **"Generate Domain"**
2. Railway sẽ cấp domain dạng `https://wc2026-predictor-production.up.railway.app`
3. (Optional) Custom domain: thêm CNAME record trỏ tới `*.up.railway.app`

## Bước 5 — Test

Truy cập domain Railway cấp:
- `/` — landing page
- `/api/meta` — JSON với `ai_available: true`
- `/match/1` → click "Tạo dự đoán AI" để test Gemini

## Files đã setup sẵn cho Railway

- `railway.json` — build/deploy config + healthcheck `/health`
- `nixpacks.toml` — Node.js 20 build
- `server.js` — `trustProxy: true`, cache headers tối ưu cho production

## Continuous deployment

Mỗi push lên branch `main` → Railway tự rebuild + deploy. Không cần làm gì thêm.

## Monitoring

- **Logs**: Railway dashboard → tab "Logs" (xem realtime)
- **Metrics**: tab "Metrics" (CPU/RAM/network)
- **Crash recovery**: `railway.json` config restart on failure (max 10 retries)

## Cost ước tính

Webapp khá nhẹ:
- Memory: ~150 MB RAM (47k matches load vào memory)
- CPU: rất thấp (chỉ spike khi AI predict)
- Network: low (HTML/JSON small)

→ Free $5 credit hết ~500-700h. Nếu traffic lớn hơn: upgrade plan $5/tháng.

## Migrate sang platform khác sau này

Cấu trúc app đã chuẩn:
- `server.js` đọc PORT từ env
- `.env.example` document các biến cần
- Healthcheck route `/health`

Sang Render/Fly.io/VPS đều dễ. Chỉ cần đảm bảo:
- Node.js 18+
- Set `GEMINI_API_KEY` env var
- Run `node src/server.js` từ `webapp/` folder

## Troubleshooting

**Build fail "Cannot find module"**: chắc chắn Root Directory = `webapp`, không phải repo root.

**AI predict trả 503**: thiếu `GEMINI_API_KEY`. Set lại env var trong Variables.

**Free credit hết**: Railway có warning email khi gần hết. Upgrade hoặc backup data ra rồi switch sang Render free tier.
