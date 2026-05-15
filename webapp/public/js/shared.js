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

// Format ngày VN: "12/06 thứ Sáu"
export function fmtDateVN(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00Z');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}`;
}

// Cache for team meta (used to translate name → VN)
let _teamCache = null;
export async function loadTeams() {
  if (_teamCache) return _teamCache;
  const d = await api('/api/teams');
  _teamCache = Object.fromEntries(d.teams.map(t => [t.name, t]));
  return _teamCache;
}
export function teamName(team, teamMeta) {
  if (!team) return '';
  return teamMeta?.[team]?.name_vi || team;
}
export function teamFlag(team, teamMeta) {
  return teamMeta?.[team]?.flag || '🏳️';
}

export function renderNav(currentPath) {
  const links = [
    { href: '/', label: 'Trang chủ' },
    { href: '/groups', label: '12 Bảng' },
    { href: '/teams', label: 'Đội tuyển' },
    { href: '/bracket', label: 'Bracket' },
    { href: '/leaderboard', label: 'Xếp hạng' },
    { href: '/compare', label: 'So sánh' },
    { href: '/data', label: 'Khám phá data' },
    { href: '/methodology', label: 'Phương pháp' },
    { href: '/about', label: 'Giới thiệu' },
  ];
  return `
    <header class="border-b border-emerald-500/20 bg-slate-900/60 backdrop-blur sticky top-0 z-40">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
        <a href="/" class="flex items-center gap-2 text-white font-bold text-lg no-underline">
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
    <footer class="mt-16 border-t border-slate-800 py-6 text-center text-xs text-slate-500">
      <p>Dữ liệu tổng hợp từ nhiều nguồn công khai · Đây là dự đoán mang tính tham khảo — bóng đá luôn bất ngờ.</p>
      <p class="mt-2 text-slate-400">Tác giả: <b class="text-emerald-300">huyhn (Huỳnh Nhật Huy)</b></p>
      <div class="mt-3 flex items-center justify-center gap-2 flex-wrap">
        <a href="https://github.com/Yamus142/worldcup-tournament-2026" target="_blank" rel="noopener"
           class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs no-underline transition border border-slate-700 hover:border-emerald-500 hover:bg-emerald-500/10 text-slate-300">
          GitHub
        </a>
        <a href="https://www.buymeacoffee.com/huyhn" target="_blank" rel="noopener"
           class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold no-underline transition hover:scale-105"
           style="background: linear-gradient(135deg, #ffdd00, #ffb300); color: #1f2937;">
          <span>☕</span> Buy me a coffee
        </a>
        <a href="/about" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs no-underline transition border border-slate-700 hover:border-emerald-500 hover:bg-emerald-500/10 text-slate-300">
          Giới thiệu
        </a>
      </div>
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
  const name = meta.name_vi || team;
  const flag = meta.flag || '🏳️';
  return `<a href="/team/${encodeURIComponent(team)}" class="text-emerald-300 hover:text-emerald-200 no-underline"><span class="flag mr-1">${flag}</span>${escapeHtml(name)}</a>`;
}

export function matchLink(m, meta = {}) {
  const mA = meta[m.home] || {};
  const mB = meta[m.away] || {};
  const fH = mA.flag || '🏳️';
  const fA = mB.flag || '🏳️';
  const nH = mA.name_vi || m.home;
  const nA = mB.name_vi || m.away;
  const timeVN = m.time_vn ? `${m.time_vn} ${fmtDateVN(m.date_vn)}` : (m.date || '');
  return `<a href="/match/${m.match}" class="block hover:bg-emerald-500/5 rounded-lg p-2 transition no-underline">
    <span class="text-[10px] font-mono bg-slate-800 text-emerald-300 rounded px-1.5 py-0.5">M${m.match}</span>
    <span class="ml-2 text-slate-100">${fH} ${escapeHtml(nH)} vs ${escapeHtml(nA)} ${fA}</span>
    <span class="ml-2 text-xs text-slate-500">${timeVN}</span>
  </a>`;
}

export function tierBadge(t) {
  const colors = { 1: 'pill', 2: 'pill pill-blue', 3: 'pill pill-amber', 4: 'pill pill-rose' };
  return `<span class="${colors[t] || 'pill pill-slate'}">Tier ${t}</span>`;
}
