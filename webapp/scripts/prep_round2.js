// Phân tích lượt đấu vòng bảng + xuất bối cảnh lượt 2 để dự đoán lại (dựa kết quả lượt 1).
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

// Gom theo bảng, sắp theo ngày → lượt 1/2/3
const groups = {};
for (const f of FIXTURES_2026.filter(x => x.stage === 'group')) (groups[f.group] = groups[f.group] || []).push(f);
const matchday = {}; // matchId -> 1|2|3
for (const g of Object.keys(groups)) {
  const ms = groups[g].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time) || a.match - b.match);
  ms.forEach((m, i) => { matchday[m.match] = Math.floor(i / 2) + 1; });
}

// Kết quả + điểm tích lũy sau lượt 1 (và lượt 2 nếu có)
function pointsAfter(group, uptoMd) {
  const pts = {}; groups[group].forEach(m => { pts[m.home] = pts[m.home] || { pts: 0, gf: 0, ga: 0, played: 0 }; pts[m.away] = pts[m.away] || { pts: 0, gf: 0, ga: 0, played: 0 }; });
  for (const m of groups[group]) {
    if (matchday[m.match] > uptoMd) continue;
    const r = RES[m.match]; if (!r) continue;
    pts[m.home].gf += r.home; pts[m.home].ga += r.away; pts[m.home].played++;
    pts[m.away].gf += r.away; pts[m.away].ga += r.home; pts[m.away].played++;
    if (r.home > r.away) pts[m.home].pts += 3; else if (r.home < r.away) pts[m.away].pts += 3; else { pts[m.home].pts++; pts[m.away].pts++; }
  }
  return pts;
}

const r1res = (m) => RES[m.match] ? `${RES[m.match].home}-${RES[m.match].away}` : 'chưa có';
console.log('=== KIỂM TRA: số trận có kết quả theo lượt ===');
for (const md of [1, 2, 3]) {
  const ids = Object.keys(matchday).filter(id => matchday[id] === md);
  const done = ids.filter(id => RES[id]).length;
  console.log(`  Lượt ${md}: ${done}/${ids.length} trận có kết quả`);
}

console.log('\n=== BỐI CẢNH LƯỢT 2 (để dự đoán lại) ===');
for (const g of Object.keys(groups).sort()) {
  const md1 = groups[g].filter(m => matchday[m.match] === 1);
  const md2 = groups[g].filter(m => matchday[m.match] === 2);
  console.log(`\n#### BẢNG ${g}`);
  console.log('  Lượt 1: ' + md1.map(m => `${vi(m.home)} ${r1res(m)} ${vi(m.away)}`).join(' | '));
  const pts = pointsAfter(g, 1);
  console.log('  BXH sau lượt 1: ' + Object.entries(pts).sort((a, b) => b[1].pts - a[1].pts || (b[1].gf - b[1].ga) - (a[1].gf - a[1].ga)).map(([t, p]) => `${vi(t)} ${p.pts}đ(${p.gf}-${p.ga})`).join(', '));
  for (const m of md2) {
    const s = computeStatsBaseline(m.home, m.away, 'group', m);
    const fa = getRecentForm(m.home, { limit: 10, sinceYear: 2020 }), fb = getRecentForm(m.away, { limit: 10, sinceYear: 2020 });
    const kpA = (SQUADS.teams[m.home]?.key_players || []).slice(0, 3).map(p => `${p.name}(${p.goals||0}b)`).join(', ');
    const kpB = (SQUADS.teams[m.away]?.key_players || []).slice(0, 3).map(p => `${p.name}(${p.goals||0}b)`).join(', ');
    console.log(`  • L2 #${m.match} ${vi(m.home)} vs ${vi(m.away)} | baseline ${s.prob_a}/${s.prob_d}/${s.prob_b} exp ${s.expected_score.a}-${s.expected_score.b}`);
    console.log(`        L1: ${vi(m.home)} ${r1res(md1.find(x=>x.home===m.home||x.away===m.home))} · ${vi(m.away)} ${r1res(md1.find(x=>x.home===m.away||x.away===m.away))}`);
    console.log(`        sao: ${m.home}=[${kpA}] ${m.away}=[${kpB}]`);
  }
}
