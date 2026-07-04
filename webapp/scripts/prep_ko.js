// Xuất bối cảnh vòng KNOCKOUT để dự đoán (R16/QF/SF/F).
// Lấy các trận trong knockout_resolved.json đã đủ 2 đội, CHƯA đá, CHƯA có dự đoán → in context.
// Chạy: node scripts/update_elo_live.js && node scripts/resolve_bracket.js && node scripts/prep_ko.js
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { FIXTURES_2026, TEAMS_META, SQUADS } from '../src/lib/dataLoader.js';
import { computeStatsBaseline } from '../src/lib/stats.js';
import { getRecentForm, getH2H } from '../src/lib/h2h.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const D = p => JSON.parse(readFileSync(join(__dirname, '..', 'src', 'data', p), 'utf8'));
const RES = D('results.json').results || {};
const PRED = (D('predictions.json').predictions) || {};
const KO = D('knockout_resolved.json').matches || {};
const ELO = D('elo_ratings.json').wc2026 || {};
const meta = TEAMS_META.team_meta;
const vi = t => meta[t]?.name_vi || t;
const fixById = Object.fromEntries(FIXTURES_2026.map(f => [f.match, f]));

// Đường đi WC2026 của 1 đội (các trận đã đá tại giải này)
function wc2026Path(team) {
  const out = [];
  for (const f of FIXTURES_2026) {
    const r = RES[f.match]; if (!r) continue;
    let side = null;
    if (f.home === team) side = { gf: r.home, ga: r.away, opp: f.away };
    else if (f.away === team) side = { gf: r.away, ga: r.home, opp: f.home };
    if (!side) continue;
    const wl = side.gf > side.ga ? 'T' : side.gf < side.ga ? 'B' : 'H';
    out.push(`${wl} ${side.gf}-${side.ga} vs ${vi(side.opp)}`);
  }
  return out;
}

const stageOf = m => (m >= 89 && m <= 96) ? 'R16' : (m >= 97 && m <= 100) ? 'QF'
  : (m >= 101 && m <= 102) ? 'SF' : m === 103 ? '3rd' : 'Final';

const todo = Object.keys(KO).map(Number).sort((a, b) => a - b)
  .filter(m => KO[m].home && KO[m].away && !RES[m] && !PRED[m]);

console.log(`=== BỐI CẢNH KNOCKOUT — ${todo.length} trận cần dự đoán ===\n`);
for (const m of todo) {
  const { home, away } = KO[m];
  const fx = fixById[m] || { match: m, home, away };
  const s = computeStatsBaseline(home, away, stageOf(m), fx);
  const eA = ELO[home], eB = ELO[away];
  const fA = getRecentForm(home, { n: 5 }), fB = getRecentForm(away, { n: 5 });
  const h2h = getH2H(home, away, { limit: 5 });
  const kp = t => (SQUADS.teams[t]?.key_players || []).slice(0, 3)
    .map(p => `${p.name}(${p.pos || '?'}${p.goals ? ',' + p.goals + 'b' : ''})`).join(', ');
  const formStr = f => f && f.matches ? f.matches.map(x => x.result || x.wl || '').join('') : (f?.summary || 'n/a');

  console.log(`#### #${m} [${stageOf(m)}] ${vi(home)} vs ${vi(away)}  (${fx.ground || '?'}, ${fx.date_vn || fx.date || '?'})`);
  console.log(`   Elo live: ${home} ${eA} — ${away} ${eB}  (chênh ${eA - eB >= 0 ? '+' : ''}${eA - eB})`);
  console.log(`   Baseline: ${s.prob_a}/${s.prob_d}/${s.prob_b}  · exp ${s.expected_score.a}-${s.expected_score.b} · top ${s.top_scores.slice(0, 3).map(x => `${x.score}(${x.prob}%)`).join(' ')}`);
  console.log(`   WC2026 ${vi(home)}: ${wc2026Path(home).join(' | ')}`);
  console.log(`   WC2026 ${vi(away)}: ${wc2026Path(away).join(' | ')}`);
  console.log(`   H2H lịch sử: ${h2h && h2h.matches && h2h.matches.length ? h2h.matches.slice(0, 5).map(x => `${x.date?.slice(0, 4) || ''} ${x.score || x.home_score + '-' + x.away_score}`).join(', ') : 'hiếm/không có'}`);
  console.log(`   Sao ${home}: [${kp(home)}]`);
  console.log(`   Sao ${away}: [${kp(away)}]`);
  console.log('');
}
