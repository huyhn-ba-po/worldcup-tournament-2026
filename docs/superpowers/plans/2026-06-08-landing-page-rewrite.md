# Landing Page Rewrite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite landing page copy theo "Approach 1: AI đoán hộ bạn" — bỏ thuật ngữ kỹ thuật, đổi sang tone bạn bè vui vẻ.

**Architecture:** Single-file copy rewrite (`webapp/public/index.html`). Giữ nguyên CSS, layout, JS logic. Edit text trong 9 sections theo spec, bump cache version, verify trong browser.

**Tech Stack:** HTML5 + Tailwind CDN + vanilla JS module.

**Spec ref:** `docs/superpowers/specs/2026-06-08-landing-page-rewrite-design.md`

**File map (single file):**
- Modify: `webapp/public/index.html`
  - Line 222 `<!-- HERO -->`
  - Line 251 `<!-- COUNTDOWN + OPENER -->`
  - Line 285 `<!-- METRICS -->`
  - Line 315 `<!-- FEATURES -->`
  - Line 374 `<!-- HOW IT WORKS -->`
  - Line 410 `<!-- PROOF -->`
  - Line 429 `<!-- EXPLORE -->`
  - Line 469 `<!-- FAQ -->`
  - Line 503 `<!-- FINAL CTA -->`
  - Line 529 cache version `?v=15`

---

## Task 1: Rewrite Hero Section (Section 1 of spec)

**Files:**
- Modify: `webapp/public/index.html` line ~222-250 (HERO section)

- [ ] **Step 1: Replace eyebrow badge**

Find:
```html
      <span class="badge-live">FIFA World Cup 2026 · 11/6 → 19/7</span>
```
Replace with:
```html
      <span class="badge-live">WORLD CUP 2026 · 11/6 → 19/7</span>
```

- [ ] **Step 2: Replace headline**

Find:
```html
      <h1 class="hero-headline mt-5">
        Dự đoán <span class="gradient-text">World Cup 2026</span><br>
        bằng thống kê + AI
      </h1>
```
Replace with:
```html
      <h1 class="hero-headline mt-5">
        World Cup 2026 đang đến — <span class="gradient-text">AI đoán hộ bạn</span> 🤖⚽
      </h1>
```

- [ ] **Step 3: Replace lead paragraph**

Find:
```html
      <p class="mt-6 text-lg sm:text-xl text-slate-300 leading-relaxed max-w-2xl mx-auto">
        Mô hình Hybrid <b class="text-emerald-300">Elo + Poisson + WCOI</b>, neo bằng
        <b class="text-emerald-300">47.980 trận quốc tế</b> lịch sử,
        kết hợp <b class="text-emerald-300">Gemini AI</b>. Toàn bộ phương pháp công khai để bạn tự kiểm chứng.
      </p>
```
Replace with:
```html
      <p class="mt-6 text-lg sm:text-xl text-slate-300 leading-relaxed max-w-2xl mx-auto">
        Mỗi trong <b class="text-emerald-300">104 trận</b> đều có dự đoán AI: ai thắng, tỉ số bao nhiêu, lý do là gì.
        Xem AI đoán rồi so với linh cảm của bạn xem ai đúng.
      </p>
```

- [ ] **Step 4: Replace CTA buttons + aria-label**

Find:
```html
        <a href="/groups" class="btn-primary" aria-label="Xem dự đoán 12 bảng đấu">
          <span>Khám phá dự đoán</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
        </a>
        <a href="/bracket" class="btn-secondary" aria-label="Xem bracket knockout">
          <span>Bracket knockout</span>
        </a>
```
Replace with:
```html
        <a href="/match/1" class="btn-primary" aria-label="Xem AI dự đoán trận khai mạc">
          <span>⚡ Xem AI đoán trận khai mạc</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
        </a>
        <a href="/groups" class="btn-secondary" aria-label="Xem lịch 104 trận">
          <span>📋 Lịch đầy đủ 104 trận</span>
        </a>
```

- [ ] **Step 5: Replace trust footer**

Find:
```html
      <p class="mt-5 text-xs text-slate-500">
        Backtest WC2018 + WC2022 (128 trận, leak-free):
        <b class="text-emerald-400">55.5% accuracy 3-way</b> · Brier 0.58 · Log Loss 0.98
      </p>
```
Replace with:
```html
      <p class="mt-5 text-xs text-slate-500">
        AI từng đoán đúng <b class="text-emerald-400">~5/10 trận</b> ở 2 kỳ World Cup gần nhất.
        Không phải lúc nào cũng đúng — phần thú vị của bóng đá là vậy 😄
      </p>
```

- [ ] **Step 6: Open in browser to verify**

Open `http://localhost:3000/` (or refresh nếu đang mở). Verify:
- Badge text uppercase
- Headline có "AI đoán hộ bạn 🤖⚽" với gradient
- Lead paragraph mới
- 2 CTA buttons: "⚡ Xem AI đoán..." (primary, link /match/1) và "📋 Lịch đầy đủ..." (secondary, link /groups)
- Trust footer mới có "~5/10 trận"

---

## Task 2: Rewrite Countdown Banner + Stats Strip (Sections 2-3)

**Files:**
- Modify: `webapp/public/index.html` line ~251-313 (COUNTDOWN + METRICS sections)

- [ ] **Step 1: Update countdown CTA button**

Find:
```html
            <a href="/match/1" class="btn-primary text-sm" style="padding: 10px 18px; min-height: 44px;">
              Xem stats baseline →
            </a>
```
Replace with:
```html
            <a href="/match/1" class="btn-primary text-sm" style="padding: 10px 18px; min-height: 44px;">
              ⚡ Xem AI đoán trận này
            </a>
```

- [ ] **Step 2: Remove Elo numbers from team flags (right column)**

Find:
```html
            <div class="text-center">
              <div class="text-7xl">🇲🇽</div>
              <div class="mt-2 font-bold text-slate-100">Mexico</div>
              <div class="text-xs text-emerald-400 font-mono">Elo 1834</div>
            </div>
            <div class="text-slate-500 text-3xl font-light">vs</div>
            <div class="text-center">
              <div class="text-7xl">🇿🇦</div>
              <div class="mt-2 font-bold text-slate-100">Nam Phi</div>
              <div class="text-xs text-blue-400 font-mono">Elo 1653</div>
            </div>
```
Replace with:
```html
            <div class="text-center">
              <div class="text-7xl">🇲🇽</div>
              <div class="mt-2 font-bold text-slate-100">Mexico</div>
            </div>
            <div class="text-slate-500 text-3xl font-light">vs</div>
            <div class="text-center">
              <div class="text-7xl">🇿🇦</div>
              <div class="mt-2 font-bold text-slate-100">Nam Phi</div>
            </div>
```

- [ ] **Step 3: Rewrite Stats Strip 4 cards**

Find the entire METRICS section (line ~285-313). The section contains:
```html
  <!-- METRICS -->
  <section class="max-w-7xl mx-auto px-4 sm:px-6 mb-20">
    <div class="text-center mb-8">
      <span class="section-eyebrow">Khối dữ liệu</span>
      <h2 class="section-title mx-auto">Tất cả con số bạn cần</h2>
    </div>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
      <div class="stat-card">
        <div class="stat-num">48</div>
        <div class="text-xs text-slate-400 uppercase tracking-wider mt-2">Đội tham dự</div>
        <div class="text-xs text-slate-500 mt-1">12 bảng A→L</div>
      </div>
      <div class="stat-card">
        <div class="stat-num">104</div>
        <div class="text-xs text-slate-400 uppercase tracking-wider mt-2">Trận đấu</div>
        <div class="text-xs text-slate-500 mt-1">72 bảng + 32 KO</div>
      </div>
      <div class="stat-card">
        <div class="stat-num">47.980</div>
        <div class="text-xs text-slate-400 uppercase tracking-wider mt-2">Data H2H</div>
        <div class="text-xs text-slate-500 mt-1">1872 → 2025</div>
      </div>
      <div class="stat-card">
        <div class="stat-num">55.5%</div>
        <div class="text-xs text-slate-400 uppercase tracking-wider mt-2">Backtest acc</div>
        <div class="text-xs text-slate-500 mt-1">WC2018 + 2022</div>
      </div>
    </div>
  </section>
```

Replace with:
```html
  <!-- METRICS -->
  <section class="max-w-7xl mx-auto px-4 sm:px-6 mb-20">
    <div class="text-center mb-8">
      <span class="section-eyebrow">Khối dữ liệu</span>
      <h2 class="section-title mx-auto">Những con số đáng chú ý</h2>
    </div>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
      <div class="stat-card">
        <div class="stat-num">48</div>
        <div class="text-xs text-slate-400 uppercase tracking-wider mt-2">Đội bóng tham dự</div>
        <div class="text-xs text-slate-500 mt-1">Từ 6 châu lục</div>
      </div>
      <div class="stat-card">
        <div class="stat-num">104</div>
        <div class="text-xs text-slate-400 uppercase tracking-wider mt-2">Trận đấu</div>
        <div class="text-xs text-slate-500 mt-1">Vòng bảng + knockout</div>
      </div>
      <div class="stat-card">
        <div class="stat-num">47.980</div>
        <div class="text-xs text-slate-400 uppercase tracking-wider mt-2">Trận đấu quá khứ</div>
        <div class="text-xs text-slate-500 mt-1">AI học từ năm 1872 đến nay</div>
      </div>
      <div class="stat-card">
        <div class="stat-num">~5/10</div>
        <div class="text-xs text-slate-400 uppercase tracking-wider mt-2">AI đoán đúng</div>
        <div class="text-xs text-slate-500 mt-1">Trên 2 kỳ World Cup trước</div>
      </div>
    </div>
  </section>
```

- [ ] **Step 4: Verify in browser**

Refresh `http://localhost:3000/`. Verify:
- Countdown banner CTA: "⚡ Xem AI đoán trận này"
- Mexico/Nam Phi: KHÔNG còn "Elo 1834" / "Elo 1653" dưới tên
- Stats strip 4 cards có label mới:
  - "Đội bóng tham dự / Từ 6 châu lục"
  - "Trận đấu / Vòng bảng + knockout"
  - "Trận đấu quá khứ / AI học từ năm 1872 đến nay"
  - "~5/10 / AI đoán đúng / Trên 2 kỳ World Cup trước"

---

## Task 3: Rewrite Features Grid + How It Works (Sections 4-5)

**Files:**
- Modify: `webapp/public/index.html` line ~315-408 (FEATURES + HOW IT WORKS sections)

- [ ] **Step 1: Rewrite 6 Features cards**

Find the entire FEATURES section starting from `<!-- FEATURES -->` until end of `</section>`:
```html
  <!-- FEATURES -->
  <section class="max-w-7xl mx-auto px-4 sm:px-6 mb-20">
    <div class="text-center mb-10">
      <span class="section-eyebrow">Tính năng</span>
      <h2 class="section-title mx-auto">Phân tích minh bạch, dữ liệu mở</h2>
      <p class="section-lead mx-auto">Mọi dự đoán đều có baseline thống kê + breakdown chi tiết. Không hộp đen.</p>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div class="feature-card">
        <div class="feature-number">01</div>
        <h3 class="font-bold text-lg text-emerald-300 mt-3 mb-2">Hybrid Elo + Poisson</h3>
        <p class="text-sm text-slate-300 leading-relaxed">
          3 mô hình thống kê chạy song song: Elo rating từ 47k trận, Poisson goal model 2014+, WCOI overlay
          1.069 trận World Cup. Ensemble weighted bằng backtest.
        </p>
      </div>
```

Replace the ENTIRE features section (line ~315-372) with:
```html
  <!-- FEATURES -->
  <section class="max-w-7xl mx-auto px-4 sm:px-6 mb-20">
    <div class="text-center mb-10">
      <span class="section-eyebrow">Tính năng</span>
      <h2 class="section-title mx-auto">Vì sao webapp này hay?</h2>
      <p class="section-lead mx-auto">6 lý do bạn nên ghim trang này lại cho mùa World Cup.</p>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div class="feature-card">
        <div class="feature-number">01</div>
        <h3 class="font-bold text-lg text-emerald-300 mt-3 mb-2">🤖 AI phân tích sẵn 104 trận</h3>
        <p class="text-sm text-slate-300 leading-relaxed">
          Click vào trận nào, AI đoán ngay: ai thắng, tỉ số bao nhiêu, vì sao. Không cần đọc báo bóng đá nữa.
        </p>
      </div>
      <div class="feature-card">
        <div class="feature-number">02</div>
        <h3 class="font-bold text-lg text-emerald-300 mt-3 mb-2">🇻🇳 Tiếng Việt + giờ VN</h3>
        <p class="text-sm text-slate-300 leading-relaxed">
          "Hàn Quốc" thay vì "South Korea", "02:00 sáng 12/6" thay vì "13:00 UTC-6". Không cần Google tra giờ.
        </p>
      </div>
      <div class="feature-card">
        <div class="feature-number">03</div>
        <h3 class="font-bold text-lg text-emerald-300 mt-3 mb-2">⚽ Đầy đủ vòng bảng → chung kết</h3>
        <p class="text-sm text-slate-300 leading-relaxed">
          12 bảng A-L với 72 trận. Knockout 1/16 → Chung kết 19/7. Lịch và dự đoán mọi trận.
        </p>
      </div>
      <div class="feature-card">
        <div class="feature-number">04</div>
        <h3 class="font-bold text-lg text-emerald-300 mt-3 mb-2">👥 48 đội + 1.000+ cầu thủ</h3>
        <p class="text-sm text-slate-300 leading-relaxed">
          Mỗi đội có trang riêng với đội hình + phong độ. Search cầu thủ theo tên: Messi, Mbappé, Bellingham...
        </p>
      </div>
      <div class="feature-card">
        <div class="feature-number">05</div>
        <h3 class="font-bold text-lg text-emerald-300 mt-3 mb-2">⚖️ So sánh 2 đội bất kỳ</h3>
        <p class="text-sm text-slate-300 leading-relaxed">
          Brazil gặp Argentina ai thắng? Pháp đối đầu Đức? AI so sánh sức mạnh + lịch sử đối đầu giúp bạn.
        </p>
      </div>
      <div class="feature-card">
        <div class="feature-number">06</div>
        <h3 class="font-bold text-lg text-emerald-300 mt-3 mb-2">💚 Miễn phí + không quảng cáo</h3>
        <p class="text-sm text-slate-300 leading-relaxed">
          Vào xem thoải mái, không cần đăng ký. Không pop-up, không banner. Nguồn data lấy từ Wikipedia + FIFA.
        </p>
      </div>
    </div>
  </section>
```

- [ ] **Step 2: Rewrite How It Works section**

Find the entire HOW IT WORKS section (line ~374-408):
```html
  <!-- HOW IT WORKS -->
  <section class="max-w-7xl mx-auto px-4 sm:px-6 mb-20">
    <div class="text-center mb-10">
      <span class="section-eyebrow">Pipeline</span>
      <h2 class="section-title mx-auto">3 bước để có 1 dự đoán</h2>
      <p class="section-lead mx-auto">Mỗi trận đi qua 3 lớp: thống kê → tổng hợp → AI tinh chỉnh.</p>
    </div>
    <div class="grid md:grid-cols-3 gap-4">
      <div class="step-card">
        <div class="step-num">1</div>
        <h3 class="font-bold text-lg text-slate-100 mb-2">Stats Models</h3>
        <p class="text-sm text-slate-400 leading-relaxed mb-3">
          3 mô hình tính độc lập: Elo rating, Poisson expected goals, WC overlay (WCOI + confederation matrix).
        </p>
        <div class="text-xs font-mono text-emerald-400">→ P(Win/Draw/Loss) + expected score</div>
      </div>
      <div class="step-card">
        <div class="step-num">2</div>
        <h3 class="font-bold text-lg text-slate-100 mb-2">Aggregator</h3>
        <p class="text-sm text-slate-400 leading-relaxed mb-3">
          Weighted ensemble: Elo 35% + Poisson 35% + Conf×Stage 20% + WCOI 10%.
          Weights tuned bằng backtest WC2018+2022.
        </p>
        <div class="text-xs font-mono text-emerald-400">→ Stats baseline + top 3 score</div>
      </div>
      <div class="step-card">
        <div class="step-num">3</div>
        <h3 class="font-bold text-lg text-slate-100 mb-2">Gemini AI</h3>
        <p class="text-sm text-slate-400 leading-relaxed mb-3">
          AI nhận stats baseline làm anchor, adjust ±15% dựa trên qualitative (form, chấn thương, motivation).
        </p>
        <div class="text-xs font-mono text-emerald-400">→ Prediction + phân tích VN</div>
      </div>
    </div>
  </section>
```

Replace with:
```html
  <!-- HOW IT WORKS -->
  <section class="max-w-7xl mx-auto px-4 sm:px-6 mb-20">
    <div class="text-center mb-10">
      <span class="section-eyebrow">Cách dùng</span>
      <h2 class="section-title mx-auto">3 bước. Không phức tạp.</h2>
    </div>
    <div class="grid md:grid-cols-3 gap-4">
      <div class="step-card">
        <div class="step-num">1</div>
        <h3 class="font-bold text-lg text-slate-100 mb-2">Chọn 1 trận</h3>
        <p class="text-sm text-slate-400 leading-relaxed mb-3">
          Vào "12 Bảng" hoặc "Bracket", click trận đấu bạn quan tâm.
        </p>
        <div class="text-xs text-emerald-400">→ Vào trang chi tiết trận</div>
      </div>
      <div class="step-card">
        <div class="step-num">2</div>
        <h3 class="font-bold text-lg text-slate-100 mb-2">Bấm "Tạo dự đoán AI"</h3>
        <p class="text-sm text-slate-400 leading-relaxed mb-3">
          Đợi vài giây cho AI đọc dữ liệu và phân tích.
        </p>
        <div class="text-xs text-emerald-400">→ AI đang xử lý...</div>
      </div>
      <div class="step-card">
        <div class="step-num">3</div>
        <h3 class="font-bold text-lg text-slate-100 mb-2">Đọc kết quả</h3>
        <p class="text-sm text-slate-400 leading-relaxed mb-3">
          Ai thắng, tỉ số, 3 yếu tố then chốt + phân tích chi tiết bằng tiếng Việt.
        </p>
        <div class="text-xs text-emerald-400">→ Xong!</div>
      </div>
    </div>
  </section>
```

- [ ] **Step 3: Verify in browser**

Refresh page. Verify:
- Section "Vì sao webapp này hay?" có 6 cards với emoji (🤖 🇻🇳 ⚽ 👥 ⚖️ 💚)
- Section "3 bước. Không phức tạp." chỉ có 3 step cards user-facing (Chọn trận → Bấm nút → Đọc kết quả)
- Không còn từ jargon: Elo, Poisson, WCOI, Aggregator, Bayesian

---

## Task 4: Rewrite Proof + Explore Grid (Sections 6-7)

**Files:**
- Modify: `webapp/public/index.html` line ~410-484 (PROOF + EXPLORE sections)

- [ ] **Step 1: Rewrite Top Elo card title**

Find:
```html
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-bold text-lg text-emerald-300">Top 5 Elo Rating</h2>
        </div>
        <div id="topElo" class="space-y-2"></div>
      </div>
      <div class="card p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-bold text-lg text-emerald-300">5 trận đầu tiên</h2>
```
Replace with:
```html
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-bold text-lg text-emerald-300">🏆 5 đội mạnh nhất WC2026</h2>
        </div>
        <div id="topElo" class="space-y-2"></div>
      </div>
      <div class="card p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-bold text-lg text-emerald-300">📅 5 trận khai cuộc</h2>
```

- [ ] **Step 2: Change "Elo Rating" label trong JS rendering**

Find (near bottom of file, in script):
```javascript
  $('#topElo').innerHTML = lb.elo.slice(0, 5).map((t, i) => `
    <a href="/team/${encodeURIComponent(t.name)}" class="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-emerald-500/5 no-underline transition">
      <div class="flex items-center gap-3 min-w-0">
        <span class="text-slate-500 font-mono text-xs w-5">#${i + 1}</span>
        <span class="text-2xl">${t.flag}</span>
        <div class="min-w-0">
          <div class="font-semibold text-slate-100 truncate">${escapeHtml(t.name_vi)}</div>
          <div class="text-xs text-slate-500">${t.confederation}</div>
        </div>
      </div>
      <span class="font-mono font-bold text-emerald-300">${t.rating}</span>
    </a>
  `).join('');
```

No change needed — confederation label is fine. Number `${t.rating}` stays as "sức mạnh" indicator implicit. Skip this step (no edit needed, just verify visually).

- [ ] **Step 3: Rewrite Explore Grid cards descriptions**

Find:
```html
      <a href="/groups" class="feature-card">
        <div class="text-xs text-emerald-400 font-bold uppercase tracking-wider">12 BẢNG</div>
        <div class="font-bold text-lg text-slate-100 mt-2">Vòng bảng A-L</div>
        <p class="text-xs text-slate-400 mt-2">72 trận với lịch + dự đoán baseline</p>
      </a>
      <a href="/bracket" class="feature-card">
        <div class="text-xs text-emerald-400 font-bold uppercase tracking-wider">KNOCKOUT</div>
        <div class="font-bold text-lg text-slate-100 mt-2">Bracket 1/16 → Final</div>
        <p class="text-xs text-slate-400 mt-2">32 trận tới 19/7 Chung kết</p>
      </a>
      <a href="/teams" class="feature-card">
        <div class="text-xs text-emerald-400 font-bold uppercase tracking-wider">48 ĐỘI</div>
        <div class="font-bold text-lg text-slate-100 mt-2">Mỗi đội có trang riêng</div>
        <p class="text-xs text-slate-400 mt-2">Elo + Poisson + form + lịch sử WC</p>
      </a>
      <a href="/players" class="feature-card">
        <div class="text-xs text-emerald-400 font-bold uppercase tracking-wider">CẦU THỦ</div>
        <div class="font-bold text-lg text-slate-100 mt-2">Search 1.000+ cầu thủ</div>
        <p class="text-xs text-slate-400 mt-2">Tìm theo tên, club, đội, vị trí</p>
      </a>
      <a href="/compare" class="feature-card">
        <div class="text-xs text-emerald-400 font-bold uppercase tracking-wider">SO SÁNH</div>
        <div class="font-bold text-lg text-slate-100 mt-2">2 đội bất kỳ</div>
        <p class="text-xs text-slate-400 mt-2">Side-by-side stats + H2H 20 trận</p>
      </a>
      <a href="/about" class="feature-card">
        <div class="text-xs text-emerald-400 font-bold uppercase tracking-wider">GIỚI THIỆU</div>
        <div class="font-bold text-lg text-slate-100 mt-2">Về tác giả + ủng hộ</div>
        <p class="text-xs text-slate-400 mt-2">GitHub, QR donate, disclaimer</p>
      </a>
```

Replace with:
```html
      <a href="/groups" class="feature-card">
        <div class="text-xs text-emerald-400 font-bold uppercase tracking-wider">12 BẢNG</div>
        <div class="font-bold text-lg text-slate-100 mt-2">Vòng bảng A-L</div>
        <p class="text-xs text-slate-400 mt-2">72 trận, lịch + AI dự đoán mỗi trận</p>
      </a>
      <a href="/bracket" class="feature-card">
        <div class="text-xs text-emerald-400 font-bold uppercase tracking-wider">KNOCKOUT</div>
        <div class="font-bold text-lg text-slate-100 mt-2">Bracket 1/16 → Final</div>
        <p class="text-xs text-slate-400 mt-2">32 trận tới chung kết 19/7</p>
      </a>
      <a href="/teams" class="feature-card">
        <div class="text-xs text-emerald-400 font-bold uppercase tracking-wider">48 ĐỘI</div>
        <div class="font-bold text-lg text-slate-100 mt-2">Mỗi đội có trang riêng</div>
        <p class="text-xs text-slate-400 mt-2">Đội hình, phong độ, lịch sử dự WC</p>
      </a>
      <a href="/players" class="feature-card">
        <div class="text-xs text-emerald-400 font-bold uppercase tracking-wider">CẦU THỦ</div>
        <div class="font-bold text-lg text-slate-100 mt-2">Search 1.000+ cầu thủ</div>
        <p class="text-xs text-slate-400 mt-2">Tìm Messi, Mbappé, Bellingham...</p>
      </a>
      <a href="/compare" class="feature-card">
        <div class="text-xs text-emerald-400 font-bold uppercase tracking-wider">SO SÁNH</div>
        <div class="font-bold text-lg text-slate-100 mt-2">Brazil gặp Argentina ai thắng?</div>
        <p class="text-xs text-slate-400 mt-2">So sánh 2 đội + lịch sử đối đầu</p>
      </a>
      <a href="/about" class="feature-card">
        <div class="text-xs text-emerald-400 font-bold uppercase tracking-wider">GIỚI THIỆU</div>
        <div class="font-bold text-lg text-slate-100 mt-2">Về tác giả + ủng hộ</div>
        <p class="text-xs text-slate-400 mt-2">Liên hệ + ủng hộ</p>
      </a>
```

- [ ] **Step 4: Verify in browser**

Refresh page. Verify:
- Card title trái: "🏆 5 đội mạnh nhất WC2026" (vẫn show số rating ở phải)
- Card title phải: "📅 5 trận khai cuộc"
- 6 cards explore: descriptions không còn jargon (không có "Elo + Poisson + form", "Side-by-side stats + H2H")

---

## Task 5: Rewrite FAQ + Final CTA (Sections 8-9)

**Files:**
- Modify: `webapp/public/index.html` line ~485-528 (FAQ + FINAL CTA sections)

- [ ] **Step 1: Replace entire FAQ section (rút 6 câu → 5 câu)**

Find:
```html
      <details class="faq">
        <summary>Dự đoán có chính xác không?</summary>
        <p>Backtest WC2018 + WC2022 (128 trận, leak-free): <b>55.5% accuracy 3-way</b>. Tốt hơn random (33%) nhưng không bằng bookmaker (~68-72%). Nói cách khác: <b>1/2 dự đoán sai</b>. Bóng đá luôn bất ngờ.</p>
      </details>
      <details class="faq">
        <summary>Tại sao kết hợp AI với thống kê?</summary>
        <p>Thống kê (Elo, Poisson) đáng tin với data có sẵn nhưng không biết về chấn thương, treo giò, motivation. LLM bù lại context định tính nhưng dễ hallucinate. Hybrid với constraint ±15% giữ rigor thống kê và tận dụng AI reasoning.</p>
      </details>
      <details class="faq">
        <summary>Data lấy ở đâu?</summary>
        <p>47.980 trận quốc tế lịch sử từ nhiều nguồn public domain. Lịch thi đấu WC2026 chính thức theo bốc thăm 5/12/2025. Toàn bộ code + data + scripts đều mở trên GitHub.</p>
      </details>
      <details class="faq">
        <summary>Có cần đăng ký không?</summary>
        <p>Không. Mọi trang đều free, không cần tài khoản. AI prediction chỉ cần backend có GEMINI_API_KEY (lấy free tại aistudio.google.com).</p>
      </details>
      <details class="faq">
        <summary>Có thể dùng để cá cược không?</summary>
        <p><b>Không</b>. Webapp này phục vụ mục đích học thuật và giải trí. Backtest accuracy 55.5% nghĩa là kèo bị thua thường xuyên. Không phải lời khuyên tài chính.</p>
      </details>
      <details class="faq">
        <summary>Tôi có thể đóng góp / yêu cầu tính năng?</summary>
        <p>Có. Mở issue/PR trên GitHub repo, hoặc liên hệ qua email ở trang Giới thiệu. Nếu thấy hữu ích, có thể ủng hộ qua QR Banking (Techcombank) trong trang About.</p>
      </details>
```

Replace with:
```html
      <details class="faq">
        <summary>AI đoán có đúng không?</summary>
        <p>Khoảng <b>5/10 trận đúng</b> (kiểm chứng trên World Cup 2018 + 2022). Đủ để xem cho vui và bàn tán, không phải để cá cược. Bóng đá luôn có bất ngờ.</p>
      </details>
      <details class="faq">
        <summary>AI lấy thông tin ở đâu để đoán?</summary>
        <p>AI học từ <b>47.980 trận quốc tế</b> từ năm 1872 đến nay, lịch thi đấu chính thức FIFA, và phong độ + đội hình mới nhất của từng đội tuyển.</p>
      </details>
      <details class="faq">
        <summary>Có miễn phí thật không?</summary>
        <p>Có. Hoàn toàn miễn phí, không quảng cáo, không cần đăng ký. Nếu thấy hữu ích, có thể mời tác giả một ly cà phê ở trang Giới thiệu.</p>
      </details>
      <details class="faq">
        <summary>Có thể dùng để cá cược không?</summary>
        <p><b>Không</b>. AI đoán sai 1/2 trận. Cá cược bóng đá cũng bất hợp pháp ở Việt Nam. Hãy dùng để bàn tán vui với bạn bè thôi.</p>
      </details>
      <details class="faq">
        <summary>Tôi có ý kiến đóng góp thì sao?</summary>
        <p>Liên hệ qua email ở trang Giới thiệu. Rất hoan nghênh!</p>
      </details>
```

- [ ] **Step 2: Rewrite Final CTA**

Find:
```html
      <h2 class="section-title">Sẵn sàng xem WC2026 với data?</h2>
      <p class="section-lead mx-auto mt-2">
        Bắt đầu từ trận khai mạc Mexico vs Nam Phi, hoặc khám phá bảng đấu của đội yêu thích.
      </p>
      <div class="mt-7 flex flex-wrap items-center justify-center gap-3">
        <a href="/groups" class="btn-primary">
          <span>Xem 12 bảng đấu</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
        </a>
        <a href="/bracket" class="btn-secondary">
          <span>Xem bracket knockout</span>
        </a>
      </div>
      <p class="mt-6 text-xs text-slate-500">
        Webapp này hoàn toàn miễn phí.
      </p>
```

Replace with:
```html
      <h2 class="section-title">OK, vào xem AI đoán nào! 🚀</h2>
      <p class="section-lead mx-auto mt-2">
        Bắt đầu từ trận khai mạc Mexico vs Nam Phi, hoặc xem lịch của đội bạn yêu thích.
      </p>
      <div class="mt-7 flex flex-wrap items-center justify-center gap-3">
        <a href="/groups" class="btn-primary">
          <span>Xem 12 bảng đấu</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
        </a>
        <a href="/bracket" class="btn-secondary">
          <span>Xem bracket knockout</span>
        </a>
      </div>
      <p class="mt-6 text-xs text-slate-500">
        Miễn phí, không quảng cáo, không cần đăng ký.
      </p>
```

- [ ] **Step 3: Verify in browser**

Refresh page. Verify:
- FAQ chỉ có 5 câu (không còn câu "Tại sao kết hợp AI với thống kê?")
- 5 câu đều dùng tone friendly: "AI đoán có đúng không?", "Có miễn phí thật không?", etc.
- Final CTA title: "OK, vào xem AI đoán nào! 🚀"
- Final CTA footer: "Miễn phí, không quảng cáo, không cần đăng ký."

---

## Task 6: Bump cache version + final commit

**Files:**
- Modify: `webapp/public/index.html` line 529 (cache version in script import)

- [ ] **Step 1: Bump cache version**

Find:
```javascript
import { mountLayout, api, escapeHtml, $, loadTeams, fmtDateVN } from '/js/shared.js?v=15';
```
Replace with:
```javascript
import { mountLayout, api, escapeHtml, $, loadTeams, fmtDateVN } from '/js/shared.js?v=16';
```

- [ ] **Step 2: Full verification in browser**

Open `http://localhost:3000/` với Ctrl+Shift+R (hard refresh). Walk through entire page from top to bottom:

1. **Hero**: Badge "WORLD CUP 2026...", headline "AI đoán hộ bạn 🤖⚽", lead mới, 2 CTA mới, trust footer mới
2. **Countdown banner**: CTA "⚡ Xem AI đoán trận này", cờ Mexico/Nam Phi không có Elo
3. **Stats strip**: 4 cards với label mới (~5/10, etc.)
4. **Features**: 6 cards với emoji, friendly tone
5. **How it works**: "3 bước. Không phức tạp." — 3 steps user-facing
6. **Top Elo + Upcoming**: titles có emoji
7. **Explore grid**: descriptions không jargon
8. **FAQ**: 5 câu friendly
9. **Final CTA**: "OK, vào xem AI đoán nào! 🚀"

Click các CTA verify navigation:
- "⚡ Xem AI đoán trận khai mạc" → `/match/1`
- "📋 Lịch đầy đủ 104 trận" → `/groups`
- Các explore cards → đúng route

Verify countdown vẫn đếm xuống.
Verify Top 5 Elo + 5 trận đầu vẫn load từ API.
Verify FAQ accordion mở/đóng OK.

- [ ] **Step 3: Final commit**

Run:
```bash
cd d:/agents/Projects/worldcup-tournament-2026
git add webapp/public/index.html
git status
git diff --stat
```

Expected: 1 file changed, ~150 insertions, ~150 deletions.

Then commit:
```bash
git commit -m "feat(webapp): rewrite landing page copy — focus AI, bỏ jargon (spec 2026-06-08)

Approach 1 'AI đoán hộ bạn'. Target: fan VN, tone bạn bè vui vẻ.

9 sections rewrite:
- Hero: 'AI đoán hộ bạn 🤖⚽' + Lead B + trust '~5/10 trận đúng'
- Countdown banner: CTA '⚡ Xem AI đoán', bỏ Elo numbers
- Stats: '~5/10 AI đoán đúng' thay 'Backtest 55.5% accuracy'
- Features (6): 🤖🇻🇳⚽👥⚖️💚 user-facing, bỏ Hybrid/Bayesian/WCOI
- How it works: 3 bước action (Chọn → Bấm → Đọc) thay pipeline
- Top Elo: '🏆 5 đội mạnh nhất WC2026'
- Explore: descriptions không jargon
- FAQ: rút 6 → 5 câu friendly
- Final CTA: 'OK, vào xem AI đoán nào! 🚀'

Bump cache v=16. Không đổi CSS/layout/JS logic.

Spec: docs/superpowers/specs/2026-06-08-landing-page-rewrite-design.md"
```

Push lên GitHub:
```bash
git push origin main
```

Expected: 1 commit pushed.

- [ ] **Step 4: Smoke test final**

After push, refresh browser one more time. Open match link from hero, verify navigation works end-to-end.

---

## Acceptance Criteria

✅ Hero không còn từ: "Hybrid", "Elo", "Poisson", "WCOI", "Gemini", "Backtest", "Brier", "Log Loss", "accuracy 3-way"
✅ 4 stat cards có "~5/10" thay vì "55.5%"
✅ 6 feature cards user-facing với emoji
✅ How it works 3 steps là action user-facing
✅ FAQ 5 câu friendly
✅ Final CTA có "🚀" và tone vui
✅ Cache version `?v=16`
✅ Tất cả routes/CTA links hoạt động
✅ Countdown + Top Elo + Upcoming load OK từ API
✅ FAQ accordion mở/đóng OK
✅ Commit + push lên GitHub

---

## Spec Coverage Self-Check

| Spec Section | Implemented in Task |
|---|---|
| 1. Hero | Task 1 |
| 2. Countdown Banner | Task 2 |
| 3. Stats Strip | Task 2 |
| 4. Features Grid | Task 3 |
| 5. How It Works | Task 3 |
| 6. Top Elo + Upcoming | Task 4 |
| 7. Explore Grid | Task 4 |
| 8. FAQ | Task 5 |
| 9. Final CTA | Task 5 |
| Cache bump | Task 6 |

All 9 sections covered. ✅
