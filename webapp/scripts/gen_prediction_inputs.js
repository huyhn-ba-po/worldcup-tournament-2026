// Xuất "input dự đoán" (prompt + stats) cho các trận — để Claude sinh dự đoán tĩnh.
// Dùng: node scripts/gen_prediction_inputs.js [GROUP]   (vd: A). Mặc định: tất cả vòng bảng.
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { TEAMS_META, FIXTURES_2026, SQUADS } from '../src/lib/dataLoader.js';
import { STAGE_NAMES } from '../src/data/fixtures.js';
import { computeStatsBaseline } from '../src/lib/stats.js';
import { getH2H, getRecentForm } from '../src/lib/h2h.js';
import { buildPredictionPrompt } from '../src/lib/ai.js';
import { computeMatchEnv } from '../src/lib/context.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const groupArg = (process.argv[2] || '').toUpperCase();

const meta = TEAMS_META.team_meta;
let fixtures = FIXTURES_2026.filter(f => f.stage === 'group' && !f.is_placeholder);
if (groupArg) fixtures = fixtures.filter(f => f.group === groupArg);
fixtures.sort((a, b) => a.match - b.match);

const out = fixtures.map(fixture => {
  const ctx = {
    flagA: meta[fixture.home]?.flag || '🏳️',
    flagB: meta[fixture.away]?.flag || '🏳️',
    nameA_vi: meta[fixture.home]?.name_vi || fixture.home,
    nameB_vi: meta[fixture.away]?.name_vi || fixture.away,
  };
  const stats = computeStatsBaseline(fixture.home, fixture.away, fixture.stage, fixture);
  const h2h = getH2H(fixture.home, fixture.away);
  const recentA = getRecentForm(fixture.home, { limit: 10, sinceYear: 2020 });
  const recentB = getRecentForm(fixture.away, { limit: 10, sinceYear: 2020 });
  const squadA = SQUADS.teams[fixture.home];
  const squadB = SQUADS.teams[fixture.away];
  const env = computeMatchEnv(fixture);
  const prompt = buildPredictionPrompt(fixture, h2h, recentA, recentB, stats, ctx, squadA, squadB, env);
  return {
    match: fixture.match,
    group: fixture.group,
    home: fixture.home,
    away: fixture.away,
    ground: fixture.ground,
    time: fixture.time,
    name_vi: { a: ctx.nameA_vi, b: ctx.nameB_vi },
    env_compact: env.available
      ? `${env.city}/${env.daypart}, ~${env.temp_felt_c}°C, heat ${env.heat_stress}, alt ${env.altitude_m}m (${env.altitude_level})`
      : 'n/a',
    h2h_compact: h2h.total > 0
      ? `${h2h.total} trận, ${fixture.home} ${h2h.a_wins}W/${h2h.draws}D/${h2h.b_wins}W ${fixture.away}` + (h2h.last_meeting ? `, gần nhất ${h2h.last_meeting.year}` : '')
      : 'chưa từng gặp',
    form_a: `${recentA.wins}W-${recentA.draws}D-${recentA.losses}L (${Math.round(recentA.win_rate*100)}%)`,
    form_b: `${recentB.wins}W-${recentB.draws}D-${recentB.losses}L (${Math.round(recentB.win_rate*100)}%)`,
    stats_summary: {
      prob_a: stats.prob_a, prob_d: stats.prob_d, prob_b: stats.prob_b,
      expected: `${stats.expected_score.a}-${stats.expected_score.b}`,
      top_scores: stats.top_scores.slice(0, 3).map(s => `${s.score}(${s.prob}%)`).join(' '),
    },
  };
});

const target = join(__dirname, '..', `_prediction_inputs${groupArg ? '_' + groupArg : ''}.json`);
writeFileSync(target, JSON.stringify(out, null, 2), 'utf8');
console.log(`[gen] ${out.length} trận → ${target}`);
