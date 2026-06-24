// Xuất bối cảnh LƯỢT 3 (lượt cuối vòng bảng) để dự đoán — dựa kết quả lượt 1 + lượt 2.
// Lượt 3 đá đồng thời trong mỗi bảng → cục diện đi tiếp (top 2 + 8 đội hạng 3 tốt nhất) là yếu tố then chốt.
// Chạy: node scripts/prep_round3.js   (chạy update_elo_live.js TRƯỚC để Elo sống mới nhất)
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { FIXTURES_2026, TEAMS_META, SQUADS } from '../src/lib/dataLoader.js';
import { computeStatsBaseline } from '../src/lib/stats.js';
import { getRecentForm } from '../src/lib/h2h.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RES = JSON.parse(readFileSync(join(__dirname, '..', 'src', 'data', 'results.json'), 'utf8')).results || {};
const meta = TEAMS_META.team_meta;
const vi = t => meta[t]?.name_vi || t;

// Gom theo bảng, xác định lượt 1/2/3 theo thứ tự thời gian
const groups = {};
for (const f of FIXTURES_2026.filter(x => x.stage === 'group')) (groups[f.group] = groups[f.group] || []).push(f);
const matchday = {};
for (const g of Object.keys(groups)) {
  const ms = groups[g].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time) || a.match - b.match);
  ms.forEach((m, i) => { matchday[m.match] = Math.floor(i / 2) + 1; });
}

// BXH tích lũy tới hết lượt `uptoMd`
function tableAfter(group, uptoMd) {
  const pts = {};
  groups[group].forEach(m => {
    pts[m.home] = pts[m.home] || { pts: 0, gf: 0, ga: 0, w: 0, d: 0, l: 0, played: 0 };
    pts[m.away] = pts[m.away] || { pts: 0, gf: 0, ga: 0, w: 0, d: 0, l: 0, played: 0 };
  });
  for (const m of groups[group]) {
    if (matchday[m.match] > uptoMd) continue;
    const r = RES[m.match]; if (!r) continue;
    pts[m.home].gf += r.home; pts[m.home].ga += r.away; pts[m.home].played++;
    pts[m.away].gf += r.away; pts[m.away].ga += r.home; pts[m.away].played++;
    if (r.home > r.away) { pts[m.home].pts += 3; pts[m.home].w++; pts[m.away].l++; }
    else if (r.home < r.away) { pts[m.away].pts += 3; pts[m.away].w++; pts[m.home].l++; }
    else { pts[m.home].pts++; pts[m.away].pts++; pts[m.home].d++; pts[m.away].d++; }
  }
  return pts;
}

const res = m => RES[m.match] ? `${RES[m.match].home}-${RES[m.match].away}` : 'chưa có';
const sortTab = pts => Object.entries(pts).sort((a, b) =>
  b[1].pts - a[1].pts || (b[1].gf - b[1].ga) - (a[1].gf - a[1].ga) || b[1].gf - a[1].gf);

console.log('=== KIỂM TRA: số trận có kết quả theo lượt ===');
for (const md of [1, 2, 3]) {
  const ids = Object.keys(matchday).filter(id => matchday[id] === md);
  console.log(`  Lượt ${md}: ${ids.filter(id => RES[id]).length}/${ids.length} trận có kết quả`);
}

// Thu thập toàn bộ đội hạng 3 để xếp hạng so sánh chéo (8 vé tốt nhất)
const thirds = [];

console.log('\n=== BỐI CẢNH LƯỢT 3 (lượt cuối — để dự đoán) ===');
for (const g of Object.keys(groups).sort()) {
  const md1 = groups[g].filter(m => matchday[m.match] === 1);
  const md2 = groups[g].filter(m => matchday[m.match] === 2);
  const md3 = groups[g].filter(m => matchday[m.match] === 3);
  const tab = tableAfter(g, 2);
  const ranked = sortTab(tab);

  console.log(`\n#### BẢNG ${g}`);
  console.log('  L1: ' + md1.map(m => `${vi(m.home)} ${res(m)} ${vi(m.away)}`).join(' | '));
  console.log('  L2: ' + md2.map(m => `${vi(m.home)} ${res(m)} ${vi(m.away)}`).join(' | '));
  console.log('  BXH sau L2: ' + ranked.map(([t, p], i) =>
    `${i + 1}.${vi(t)} ${p.pts}đ (${p.w}-${p.d}-${p.l}, ${p.gf}-${p.ga}, HS${p.gf - p.ga >= 0 ? '+' : ''}${p.gf - p.ga})`).join('  '));

  if (ranked[2]) thirds.push({ g, team: ranked[2][0], ...ranked[2][1], gd: ranked[2][1].gf - ranked[2][1].ga });

  for (const m of md3) {
    const s = computeStatsBaseline(m.home, m.away, 'group', m);
    const ph = tab[m.home] || { pts: 0, gf: 0, ga: 0 }, pa = tab[m.away] || { pts: 0, gf: 0, ga: 0 };
    const kpA = (SQUADS.teams[m.home]?.key_players || []).slice(0, 3).map(p => `${p.name}(${p.goals || 0}b)`).join(', ');
    const kpB = (SQUADS.teams[m.away]?.key_players || []).slice(0, 3).map(p => `${p.name}(${p.goals || 0}b)`).join(', ');
    console.log(`  • L3 #${m.match} ${vi(m.home)} vs ${vi(m.away)}`);
    console.log(`        baseline ${s.prob_a}/${s.prob_d}/${s.prob_b} · exp ${s.expected_score.a}-${s.expected_score.b} · top: ${s.top_scores.slice(0, 3).map(x => `${x.score}(${x.prob}%)`).join(' ')}`);
    console.log(`        cục diện: ${vi(m.home)} ${ph.pts}đ(HS${ph.gf - ph.ga >= 0 ? '+' : ''}${ph.gf - ph.ga}) — ${vi(m.away)} ${pa.pts}đ(HS${pa.gf - pa.ga >= 0 ? '+' : ''}${pa.gf - pa.ga})`);
    console.log(`        sao: ${m.home}=[${kpA}] · ${m.away}=[${kpB}]`);
  }
}

// Xếp hạng 12 đội hạng 3 (luật 48 đội: 8 đội hạng 3 tốt nhất đi tiếp)
console.log('\n=== XẾP HẠNG ĐỘI HẠNG 3 sau L2 (8 vé tốt nhất đi tiếp) ===');
thirds.sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf)
  .forEach((x, i) => console.log(`  ${i + 1}.${vi(x.team)} (B.${x.g}) ${x.pts}đ HS${x.gd >= 0 ? '+' : ''}${x.gd} ${x.gf}bt ${i < 8 ? '✅' : '❌ (ngấp nghé)'}`));

console.log('\n[Lưu ý] Đây là cục diện SAU lượt 2; điểm/HS đội hạng 3 sẽ thay đổi sau lượt 3.');
