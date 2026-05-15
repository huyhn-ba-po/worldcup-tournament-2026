// Shared utilities for all pages
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export async function api(path, opts) {
  const res = await fetch(path, opts);
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  return res.json();
}

export function escapeHtml(s) {
  if (s == null) return '';
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function pct(n) { return Math.round(n * 100); }
export function fmtNum(n, d = 2) {
  if (n == null) return '—';
  return typeof n === 'number' ? n.toFixed(d) : String(n);
}

export function renderNav(currentPath) {
  const links = [
    { href: '/', label: '🏠 Home' },
    { href: '/groups', label: '📊 12 Bảng' },
    { href: '/teams', label: '⚽ Đội' },
    { href: '/leaderboard', label: '🏆 Xếp hạng' },
    { href: '/compare', label: '⚖️ So sánh' },
    { href: '/data', label: '🔍 Khám phá data' },
    { href: '/methodology', label: '🔬 Phương pháp' },
    { href: '/about', label: 'ℹ️ Giới thiệu' },
  ];
  return `
    <header class="border-b border-emerald-500/20 bg-slate-900/60 backdrop-blur sticky top-0 z-40">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        <a href="/" class="flex items-center gap-2 text-white font-bold text-lg no-underline">
          <span class="text-2xl">⚽</span>
          <span>WC2026 <span class="bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">Predictor</span></span>
        </a>
        <nav class="flex flex-wrap items-center gap-1">
          ${links.map(l => `<a href="${l.href}" class="nav-link ${l.href === currentPath || (l.href !== '/' && currentPath.startsWith(l.href)) ? 'active' : ''}">${l.label}</a>`).join('')}
        </nav>
      </div>
    </header>
  `;
}

export function renderFooter() {
  return `
    <footer class="mt-16 border-t border-slate-800 py-8 text-center text-xs text-slate-500">
      <p>Data: openfootball/* CC0 Public Domain · 47,980 trận quốc tế 1872-2025 · 7m.com.cn · FIFA</p>
      <p class="mt-1">AI: Google Gemini 2.5 Flash · Backtest WC2018+2022: 55.5% accuracy</p>
      <p class="mt-1">Đây là dự đoán mang tính tham khảo — bóng đá luôn bất ngờ ⚽</p>
    </footer>
  `;
}

export function mountLayout(currentPath) {
  const nav = document.getElementById('nav');
  if (nav) nav.innerHTML = renderNav(currentPath);
  const footer = document.getElementById('footer');
  if (footer) footer.innerHTML = renderFooter();
}

export function probBar(probA, probD, probB) {
  return `
    <div class="prob-bar">
      <div class="prob-seg bg-emerald-500" style="width: ${probA}%"></div>
      <div class="prob-seg bg-slate-500" style="width: ${probD}%"></div>
      <div class="prob-seg bg-blue-500" style="width: ${probB}%"></div>
    </div>
  `;
}

export function teamLink(team, meta = {}) {
  const flag = meta.flag || '🏳️';
  return `<a href="/team/${encodeURIComponent(team)}" class="text-emerald-300 hover:text-emerald-200 no-underline"><span class="flag mr-1">${flag}</span>${escapeHtml(team)}</a>`;
}

export function matchLink(m, meta = {}) {
  const fH = (meta[m.home] || {}).flag || '🏳️';
  const fA = (meta[m.away] || {}).flag || '🏳️';
  return `<a href="/match/${m.match}" class="block hover:bg-emerald-500/5 rounded-lg p-2 transition no-underline">
    <span class="text-[10px] font-mono bg-slate-800 text-emerald-300 rounded px-1.5 py-0.5">M${m.match}</span>
    <span class="ml-2 text-slate-100">${fH} ${escapeHtml(m.home)} vs ${escapeHtml(m.away)} ${fA}</span>
    <span class="ml-2 text-xs text-slate-500">${m.date || ''}</span>
  </a>`;
}

export function tierBadge(t) {
  const colors = { 1: 'pill', 2: 'pill pill-blue', 3: 'pill pill-amber', 4: 'pill pill-rose' };
  return `<span class="${colors[t] || 'pill pill-slate'}">T${t}</span>`;
}
