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
    { href: '/groups', label: 'Lịch vòng bảng' },
    { href: '/bracket', label: 'Vòng loại trực tiếp' },
    { href: '/teams', label: 'Đội tuyển' },
    { href: '/about', label: 'Giới thiệu' },
  ];
  return `
    <header class="border-b border-emerald-500/20 bg-slate-900/60 backdrop-blur sticky top-0 z-40">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
        <a href="/" class="flex items-center gap-2 text-slate-100 font-bold text-lg no-underline">
          <span>WC2026 <span class="text-emerald-500">Predictor</span></span>
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
        <button type="button" data-donate-trigger
           class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition hover:scale-105 cursor-pointer border-0"
           style="background: rgb(var(--brand-500)); color: #ffffff;">
          <span>☕</span> Mời cà phê
        </button>
        <a href="/about" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs no-underline transition border border-slate-700 hover:border-emerald-500 hover:bg-emerald-500/10 text-slate-300">
          Giới thiệu
        </a>
      </div>
    </footer>
    ${renderDonateModal()}
  `;
}

function renderDonateModal() {
  return `
    <div id="donateModal" class="hidden fixed inset-0 z-50 items-center justify-center p-4" role="dialog" aria-modal="true" style="background: rgba(2, 6, 23, 0.85); backdrop-filter: blur(6px);">
      <div class="relative max-w-md w-full rounded-2xl shadow-2xl overflow-hidden" style="background: var(--card-bg); border: 1px solid rgba(19, 91, 236, 0.3);">
        <button type="button" data-donate-close class="absolute top-3 right-4 text-slate-400 hover:text-slate-100 text-3xl leading-none z-10" aria-label="Đóng">×</button>
        <div class="p-6 sm:p-8 text-center">
          <div class="text-2xl mb-1">☕</div>
          <h3 class="text-xl font-bold text-emerald-300">Mời tác giả một ly cà phê</h3>
          <p class="text-sm text-slate-400 mt-2 mb-4">Cảm ơn bạn đã ủng hộ dự án. Quét QR bên dưới hoặc chuyển khoản thủ công.</p>

          <div class="bg-white rounded-2xl p-3 mx-auto mb-4 relative" style="max-width: 280px;">
            <img id="donateQrImg" src="/img/qr-bank.png?v=2" alt="QR Banking Techcombank" class="w-full h-auto rounded-lg block" />
            <div id="donateQrFallback" class="hidden absolute inset-3 flex items-center justify-center text-slate-500 text-xs text-center p-4 bg-white rounded-lg">
              QR code chưa upload.<br>Đặt ảnh tại<br><code class="text-[10px]">webapp/public/img/qr-bank.png</code>
            </div>
          </div>

          <div class="text-left bg-slate-950/60 rounded-xl p-4 text-sm space-y-1.5">
            <div class="flex justify-between items-center"><span class="text-slate-500">Ngân hàng</span><span class="text-slate-200 font-semibold">Techcombank</span></div>
            <div class="flex justify-between items-center"><span class="text-slate-500">Số tài khoản</span>
              <span class="flex items-center gap-2">
                <span class="text-emerald-300 font-mono font-bold" id="donateAcc">1402968888</span>
                <button type="button" data-copy-acc class="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-400 transition">Copy</button>
              </span>
            </div>
            <div class="flex justify-between"><span class="text-slate-500">Chủ tài khoản</span><span class="text-slate-200">HUYNH NHAT HUY</span></div>
            <div class="text-xs text-slate-500 pt-2 border-t border-slate-800 mt-2">Nội dung CK gợi ý: <span class="text-emerald-300 font-mono">"Coffee WC2026"</span></div>
          </div>

          <div class="mt-4 flex justify-center">
            <button type="button" data-donate-close class="text-xs px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition">
              Cảm ơn nhé!
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function openDonate() {
  const m = document.getElementById('donateModal');
  if (!m) return;
  m.classList.remove('hidden');
  m.classList.add('flex');
  document.body.style.overflow = 'hidden';
}
function closeDonate() {
  const m = document.getElementById('donateModal');
  if (!m) return;
  m.classList.add('hidden');
  m.classList.remove('flex');
  document.body.style.overflow = '';
}

// === Cờ quốc gia: thay emoji cờ bằng ảnh flagcdn (Windows không vẽ được emoji cờ) ===
const RI_RE = /[\u{1F1E6}-\u{1F1FF}]/u;            // 1 ký hiệu regional indicator
const RI_PAIR = /[\u{1F1E6}-\u{1F1FF}]{2}/u;       // cặp = 1 lá cờ
function flagCode(pair) {
  const cps = [...pair].map(c => c.codePointAt(0));
  if (cps.length !== 2) return null;
  return cps.map(c => String.fromCharCode(c - 0x1F1E6 + 97)).join(''); // ISO 2 chữ, lowercase
}
function flaggifyNode(node) {
  const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => RI_RE.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT,
  });
  const targets = [];
  let t; while ((t = walker.nextNode())) targets.push(t);
  for (const tn of targets) {
    const parts = tn.nodeValue.split(/([\u{1F1E6}-\u{1F1FF}]{2})/u);
    if (parts.length === 1) continue;
    const frag = document.createDocumentFragment();
    for (const part of parts) {
      if (part && RI_PAIR.test(part) && part.length <= 4) {
        const code = flagCode(part);
        if (code) {
          const img = document.createElement('img');
          img.src = `https://flagcdn.com/h80/${code}.png`;
          img.className = 'flag-img'; img.alt = part; img.loading = 'lazy';
          img.onerror = function () { this.replaceWith(document.createTextNode(part)); };
          frag.appendChild(img);
          continue;
        }
      }
      if (part) frag.appendChild(document.createTextNode(part));
    }
    tn.replaceWith(frag);
  }
}
let _flagObs;
function initFlags() {
  if (typeof MutationObserver === 'undefined') return;
  flaggifyNode(document.body);
  if (_flagObs) return;
  _flagObs = new MutationObserver((muts) => {
    _flagObs.disconnect();
    for (const m of muts) for (const n of m.addedNodes) {
      if (n.nodeType === 1) flaggifyNode(n);
      else if (n.nodeType === 3 && n.parentNode && RI_RE.test(n.nodeValue)) flaggifyNode(n.parentNode);
    }
    _flagObs.observe(document.body, { childList: true, subtree: true });
  });
  _flagObs.observe(document.body, { childList: true, subtree: true });
}

export function mountLayout(currentPath) {
  const nav = document.getElementById('nav');
  if (nav) nav.innerHTML = renderNav(currentPath);
  const footer = document.getElementById('footer');
  if (footer) footer.innerHTML = renderFooter();
  attachDonateHandlers();
  initFlags();
}

function attachDonateHandlers() {
  // QR image: show fallback if image fails to load (preserves img element)
  const qrImg = document.getElementById('donateQrImg');
  const qrFallback = document.getElementById('donateQrFallback');
  if (qrImg && qrFallback) {
    qrImg.addEventListener('error', () => {
      qrImg.style.display = 'none';
      qrFallback.classList.remove('hidden');
    });
    qrImg.addEventListener('load', () => {
      qrImg.style.display = 'block';
      qrFallback.classList.add('hidden');
    });
  }
  document.querySelectorAll('[data-donate-trigger]').forEach(el => {
    el.addEventListener('click', (e) => { e.preventDefault(); openDonate(); });
  });
  document.querySelectorAll('[data-donate-close]').forEach(el => {
    el.addEventListener('click', () => closeDonate());
  });
  const m = document.getElementById('donateModal');
  if (m) m.addEventListener('click', (e) => { if (e.target.id === 'donateModal') closeDonate(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDonate(); });
  // Copy account number
  document.querySelectorAll('[data-copy-acc]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const acc = document.getElementById('donateAcc')?.textContent?.trim();
      if (!acc) return;
      try {
        await navigator.clipboard.writeText(acc);
        const original = btn.textContent;
        btn.textContent = 'Copied!';
        btn.style.background = '#005BAA';
        btn.style.color = 'white';
        setTimeout(() => { btn.textContent = original; btn.style.background = ''; btn.style.color = ''; }, 1500);
      } catch {}
    });
  });
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

// === Tournament badge (kiểu status) ===
const TOURNAMENT_LABELS = {
  fifa_world_cup: 'World Cup',
  fifa_world_cup_qualification: 'VL World Cup',
  confederations_cup: 'Confederations Cup',
  uefa_euro: 'Euro', uefa_euro_qualification: 'VL Euro',
  uefa_nations_league: 'UEFA Nations League',
  copa_america: 'Copa América',
  african_cup_of_nations: 'AFCON', african_cup_of_nations_qualification: 'VL AFCON',
  afc_asian_cup: 'Asian Cup', afc_asian_cup_qualification: 'VL Asian Cup',
  gold_cup: 'Gold Cup',
  concacaf_nations_league: 'CONCACAF Nations League',
  concacaf_championship: 'CONCACAF Championship',
  concacaf_championship_qualification: 'VL CONCACAF',
  cfu_caribbean_cup: 'Caribbean Cup', cfu_caribbean_cup_qualification: 'VL Caribbean Cup',
  friendly: 'Giao hữu',
  gulf_cup: 'Gulf Cup', arab_cup: 'Arab Cup', aff_championship: 'AFF Championship',
  oceania_nations_cup: 'Oceania Nations Cup', british_home_championship: 'British Home Champ.',
  cecafa_cup: 'CECAFA Cup', cosafa_cup: 'COSAFA Cup', merdeka_tournament: 'Merdeka Tournament',
  island_games: 'Island Games', asian_games: 'Asian Games', nordic_championship: 'Nordic Champ.',
  kings_cup: "King's Cup", saff_cup: 'SAFF Cup', korea_cup: 'Korea Cup',
  eaff_championship: 'EAFF Championship', southeast_asian_games: 'SEA Games',
  usa_cup: 'USA Cup', lunar_new_year_cup: 'Lunar New Year Cup', gulf_cup_qualification: 'VL Gulf Cup',
};
const MAJOR_TOURNAMENTS = new Set([
  'uefa_euro', 'copa_america', 'african_cup_of_nations', 'afc_asian_cup', 'gold_cup',
  'concacaf_championship', 'oceania_nations_cup', 'confederations_cup',
  'uefa_nations_league', 'concacaf_nations_league', 'arab_cup', 'gulf_cup', 'aff_championship',
]);
function prettifyTournament(t) {
  return String(t || '').split('_').map(w => w ? w[0].toUpperCase() + w.slice(1) : '').join(' ').trim();
}
export function tournamentInfo(t) {
  t = t || '';
  let tier;
  if (/world_cup/.test(t) && !/qualif/.test(t)) tier = 'world';
  else if (/qualif/.test(t)) tier = 'qualifier';
  else if (t === 'friendly') tier = 'friendly';
  else if (MAJOR_TOURNAMENTS.has(t)) tier = 'major';
  else if (/(cup|championship|nations|euro|copa|games|trophy|vase|league)/.test(t)) tier = 'regional';
  else tier = 'other';
  let label = TOURNAMENT_LABELS[t];
  if (!label) label = tier === 'qualifier' ? 'VL ' + prettifyTournament(t.replace(/_qualification$/, '')) : prettifyTournament(t);
  return { label, tier };
}
export function tournamentBadge(t) {
  const { label, tier } = tournamentInfo(t);
  const icon = tier === 'world' ? '🏆 ' : '';
  return `<span class="tbadge tbadge-${tier}" title="${escapeHtml(t || '')}">${icon}${escapeHtml(label)}</span>`;
}

export function tierBadge(t) {
  const colors = { 1: 'pill', 2: 'pill pill-blue', 3: 'pill pill-amber', 4: 'pill pill-rose' };
  return `<span class="${colors[t] || 'pill pill-slate'}">Tier ${t}</span>`;
}
