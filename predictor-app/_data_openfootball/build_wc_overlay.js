#!/usr/bin/env node
/*
 * build_wc_overlay.js — Tính các WC-specific signals:
 *   1. WCOI (WC Overperformance Index) per team
 *   2. Stage parameters (group vs knockout)
 *   3. Confederation × Stage matrix
 *   4. Host nation effects
 *
 * Output: wc_overlay.json
 */

const fs = require('fs');
const path = require('path');

const ALL = path.join(__dirname, 'all_internationals.json');
const WC = path.join(__dirname, 'wc_all_matches.json');
const OUT = path.join(__dirname, 'wc_overlay.json');

const ALIAS = {
  'Korea Republic': 'South Korea', 'Bosnia and Herzegovina': 'Bosnia & Herzegovina',
  'Türkiye': 'Turkey', 'Turkiye': 'Turkey',
  "Côte d'Ivoire": 'Ivory Coast', "Cote d'Ivoire": 'Ivory Coast',
  'Curacao': 'Curaçao', 'Congo DR': 'DR Congo',
  'Democratic Republic of the Congo': 'DR Congo', 'Zaire': 'DR Congo',
  'Czechia': 'Czech Republic', 'Czechoslovakia': 'Czech Republic',
  'West Germany': 'Germany', 'East Germany': 'Germany',
  'USA': 'United States', 'Soviet Union': 'Russia',
  'Yugoslavia': 'Serbia', 'FR Yugoslavia': 'Serbia', 'Serbia and Montenegro': 'Serbia',
};
const norm = (n) => ALIAS[n] || n;

const WC2026_TEAMS = new Set([
  'Mexico', 'South Africa', 'South Korea', 'Czech Republic',
  'Canada', 'Bosnia & Herzegovina', 'Qatar', 'Switzerland',
  'Brazil', 'Morocco', 'Haiti', 'Scotland',
  'United States', 'Paraguay', 'Australia', 'Turkey',
  'Germany', 'Curaçao', 'Ivory Coast', 'Ecuador',
  'Netherlands', 'Japan', 'Sweden', 'Tunisia',
  'Belgium', 'Egypt', 'Iran', 'New Zealand',
  'Spain', 'Cape Verde', 'Saudi Arabia', 'Uruguay',
  'France', 'Senegal', 'Iraq', 'Norway',
  'Argentina', 'Algeria', 'Austria', 'Jordan',
  'Portugal', 'DR Congo', 'Uzbekistan', 'Colombia',
  'England', 'Croatia', 'Ghana', 'Panama',
]);

// Confederation per team
const TEAM_CONF = {
  Argentina: 'CONMEBOL', Brazil: 'CONMEBOL', Uruguay: 'CONMEBOL', Colombia: 'CONMEBOL',
  Ecuador: 'CONMEBOL', Paraguay: 'CONMEBOL', Chile: 'CONMEBOL', Peru: 'CONMEBOL', Bolivia: 'CONMEBOL', Venezuela: 'CONMEBOL',
  France: 'UEFA', Spain: 'UEFA', England: 'UEFA', Portugal: 'UEFA', Netherlands: 'UEFA',
  Belgium: 'UEFA', Italy: 'UEFA', Germany: 'UEFA', Croatia: 'UEFA', Switzerland: 'UEFA',
  Denmark: 'UEFA', Austria: 'UEFA', Serbia: 'UEFA', Poland: 'UEFA', Turkey: 'UEFA',
  Scotland: 'UEFA', Sweden: 'UEFA', Norway: 'UEFA', 'Bosnia & Herzegovina': 'UEFA',
  'Czech Republic': 'UEFA', Hungary: 'UEFA', 'Republic of Ireland': 'UEFA',
  'Northern Ireland': 'UEFA', Wales: 'UEFA', Greece: 'UEFA', Romania: 'UEFA', Russia: 'UEFA',
  Mexico: 'CONCACAF', Canada: 'CONCACAF', 'United States': 'CONCACAF',
  Panama: 'CONCACAF', Haiti: 'CONCACAF', 'Curaçao': 'CONCACAF', Honduras: 'CONCACAF',
  'Costa Rica': 'CONCACAF', Jamaica: 'CONCACAF', 'El Salvador': 'CONCACAF',
  Senegal: 'CAF', Morocco: 'CAF', Egypt: 'CAF', Tunisia: 'CAF', Nigeria: 'CAF',
  'Ivory Coast': 'CAF', Algeria: 'CAF', Ghana: 'CAF', Mali: 'CAF', 'South Africa': 'CAF',
  'Cape Verde': 'CAF', 'DR Congo': 'CAF', Cameroon: 'CAF', Angola: 'CAF', Zambia: 'CAF',
  Japan: 'AFC', 'South Korea': 'AFC', Iran: 'AFC', Australia: 'AFC', 'Saudi Arabia': 'AFC',
  Qatar: 'AFC', Uzbekistan: 'AFC', Jordan: 'AFC', Iraq: 'AFC', 'United Arab Emirates': 'AFC',
  'New Zealand': 'OFC',
};

// ─────────────────────────────────────────────────────────────────────────
// Load data
// ─────────────────────────────────────────────────────────────────────────
const all = JSON.parse(fs.readFileSync(ALL, 'utf8'));
const wc = JSON.parse(fs.readFileSync(WC, 'utf8'));

console.log(`All internationals: ${all.matches.length}`);
console.log(`WC matches:         ${wc.matches.length}`);

// ─────────────────────────────────────────────────────────────────────────
// 1. WCOI — WC Overperformance Index per team
// ─────────────────────────────────────────────────────────────────────────
// Extract score (handles both WC schema score.ft AND all_internationals schema score1/score2)
function getScores(m) {
  if (m.score && m.score.ft && Array.isArray(m.score.ft)) return [m.score.ft[0], m.score.ft[1]];
  if (m.score1 != null && m.score2 != null) return [m.score1, m.score2];
  return [null, null];
}

// Compare team's win rate at WC vs win rate in all internationals
function computeWinRate(matches, team) {
  let wins = 0, draws = 0, total = 0;
  for (const m of matches) {
    const isT1 = (norm(m.team1 || m.h) === team);
    const isT2 = (norm(m.team2 || m.a) === team);
    if (!isT1 && !isT2) continue;
    const [s1, s2] = getScores(m);
    const s1h = m.hg, s2h = m.ag; // historical schema fallback
    const sa = s1 ?? s1h;
    const sb = s2 ?? s2h;
    if (sa == null || sb == null) continue;
    total++;
    const gFor = isT1 ? sa : sb;
    const gAg = isT1 ? sb : sa;
    if (gFor > gAg) wins++;
    else if (gFor === gAg) draws++;
  }
  return total > 0 ? (wins + 0.5 * draws) / total : null;
}

const wcMatchesFull = wc.matches.filter((m) => {
  if (!m.team1) return false;
  const [s1, s2] = getScores(m);
  return s1 != null && s2 != null;
});

const wcoi = {};
for (const team of WC2026_TEAMS) {
  const wcWR = computeWinRate(wcMatchesFull, team);
  const allWR = computeWinRate(all.matches, team);
  if (wcWR == null || allWR == null) {
    wcoi[team] = { wcoi: 0, wc_matches: 0, wc_win_rate: null, all_win_rate: allWR, note: 'never played at WC' };
  } else {
    const matches_at_wc = wcMatchesFull.filter((m) =>
      norm(m.team1) === team || norm(m.team2) === team).length;
    wcoi[team] = {
      wcoi: +(wcWR - allWR).toFixed(3),
      wc_matches: matches_at_wc,
      wc_win_rate: +wcWR.toFixed(3),
      all_win_rate: +allWR.toFixed(3),
    };
  }
}

console.log('\n=== WCOI Top 10 overperformers ===');
Object.entries(wcoi)
  .filter(([, v]) => v.wc_matches > 8)
  .sort((a, b) => b[1].wcoi - a[1].wcoi)
  .slice(0, 10)
  .forEach(([t, v]) => console.log(`  ${t.padEnd(25)} WCOI=${(v.wcoi > 0 ? '+' : '') + v.wcoi.toFixed(3)}  (WC: ${(v.wc_win_rate * 100).toFixed(0)}%  All: ${(v.all_win_rate * 100).toFixed(0)}%  n=${v.wc_matches})`));

console.log('\n=== WCOI Bottom 10 underperformers ===');
Object.entries(wcoi)
  .filter(([, v]) => v.wc_matches > 8)
  .sort((a, b) => a[1].wcoi - b[1].wcoi)
  .slice(0, 10)
  .forEach(([t, v]) => console.log(`  ${t.padEnd(25)} WCOI=${v.wcoi.toFixed(3)}  (WC: ${(v.wc_win_rate * 100).toFixed(0)}%  All: ${(v.all_win_rate * 100).toFixed(0)}%  n=${v.wc_matches})`));

// ─────────────────────────────────────────────────────────────────────────
// 2. Stage parameters: group vs knockout
// ─────────────────────────────────────────────────────────────────────────
function categorizeStage(m) {
  // wc.matches có field `round` like "Matchday 1", "Round of 16", "Quarterfinal", "Final"
  if (!m.round) return 'unknown';
  const r = m.round.toLowerCase();
  if (r.includes('matchday') || r.includes('group')) return 'group';
  if (r.includes('round of') || r.includes('16') || r.includes('32')) return 'r16_r32';
  if (r.includes('quarter')) return 'quarterfinal';
  if (r.includes('semi')) return 'semifinal';
  if (r.includes('third') || r.includes('3rd')) return 'third';
  if (r.includes('final')) return 'final';
  return 'unknown';
}

const stageStats = { group: { matches: 0, totalGoals: 0, draws: 0, decisive: 0 } };
for (const stage of ['r16_r32', 'quarterfinal', 'semifinal', 'final', 'third']) {
  stageStats[stage] = { matches: 0, totalGoals: 0, draws: 0, decisive: 0 };
}

for (const m of wcMatchesFull) {
  const stage = categorizeStage(m);
  if (!stageStats[stage]) continue;
  const [s1, s2] = getScores(m);
  if (s1 == null) continue;
  stageStats[stage].matches++;
  stageStats[stage].totalGoals += s1 + s2;
  if (s1 === s2) stageStats[stage].draws++;
  else stageStats[stage].decisive++;
}

const stageParams = {};
for (const [stage, s] of Object.entries(stageStats)) {
  if (s.matches < 5) continue;
  stageParams[stage] = {
    matches: s.matches,
    avg_goals_per_match: +(s.totalGoals / s.matches).toFixed(2),
    draw_rate: +(s.draws / s.matches).toFixed(3),
  };
}
console.log('\n=== Stage parameters (1930-2022) ===');
Object.entries(stageParams).forEach(([k, v]) => {
  console.log(`  ${k.padEnd(15)} n=${v.matches}  avg goals=${v.avg_goals_per_match}  draw rate=${(v.draw_rate*100).toFixed(0)}%`);
});

// ─────────────────────────────────────────────────────────────────────────
// 3. Confederation × Stage outcome matrix
// ─────────────────────────────────────────────────────────────────────────
const confMatrix = {}; // key "UEFA|CAF|group" → { wins_t1: 0, draws: 0, wins_t2: 0 }

function getConf(team) {
  return TEAM_CONF[team] || 'OTHER';
}
function matrixKey(c1, c2, stage) {
  // Normalize so c1 ≤ c2 alphabetically (or keep order if same)
  const [a, b] = c1 <= c2 ? [c1, c2] : [c2, c1];
  return `${a}|${b}|${stage}`;
}

for (const m of wcMatchesFull) {
  const stage = categorizeStage(m);
  if (stage === 'unknown') continue;
  const [s1, s2] = getScores(m);
  if (s1 == null) continue;
  const t1 = norm(m.team1), t2 = norm(m.team2);
  const c1 = getConf(t1), c2 = getConf(t2);
  if (c1 === 'OTHER' || c2 === 'OTHER') continue;
  const stageGroup = stage === 'group' ? 'group' : 'knockout';
  const reversed = c1 > c2;
  const key = matrixKey(c1, c2, stageGroup);
  if (!confMatrix[key]) confMatrix[key] = { c1_wins: 0, draws: 0, c2_wins: 0, total: 0 };
  if (s1 > s2)       (reversed ? confMatrix[key].c2_wins++ : confMatrix[key].c1_wins++);
  else if (s1 < s2)  (reversed ? confMatrix[key].c1_wins++ : confMatrix[key].c2_wins++);
  else               confMatrix[key].draws++;
  confMatrix[key].total++;
}

// Convert to rates
const confMatrixRates = {};
for (const [k, v] of Object.entries(confMatrix)) {
  if (v.total < 3) continue;
  confMatrixRates[k] = {
    n: v.total,
    c1_win_rate: +(v.c1_wins / v.total).toFixed(3),
    draw_rate:   +(v.draws / v.total).toFixed(3),
    c2_win_rate: +(v.c2_wins / v.total).toFixed(3),
  };
}
console.log('\n=== Confederation × Stage matrix (top 10 by n) ===');
Object.entries(confMatrixRates)
  .sort((a, b) => b[1].n - a[1].n)
  .slice(0, 10)
  .forEach(([k, v]) => {
    const [c1, c2, stage] = k.split('|');
    console.log(`  ${c1} vs ${c2} (${stage}, n=${v.n}): ${(v.c1_win_rate * 100).toFixed(0)}/${(v.draw_rate * 100).toFixed(0)}/${(v.c2_win_rate * 100).toFixed(0)}`);
  });

// ─────────────────────────────────────────────────────────────────────────
// 4. Host nation effect
// ─────────────────────────────────────────────────────────────────────────
const HOST_BOOSTS = {
  // Đối với WC2026: 3 hosts.
  // Elo +200 cho Mexico games tại Mexico City/Guadalajara/Monterrey
  // Elo +150 cho US games tại US (SoFi, Hard Rock, etc.)
  // Elo +130 cho Canada games tại Toronto/Vancouver
  // 0 cho neutral venue games
  // Host nation lịch sử (22 hosts): 91% past group, 64% past R16, 50% reached SF, 27% champion
  'Mexico|Estadio Azteca':         200,
  'Mexico|Guadalajara (Zapopan)':  180,
  'Mexico|Monterrey (Guadalupe)':  170,
  'United States|*':                150,
  'Canada|*':                       130,
};

console.log('\n=== Host nation historical performance (1930-2022) ===');
console.log('  Past group stage:    91% (20 of 22 hosts)');
console.log('  Reached QF:          64% (14 of 22)');
console.log('  Reached SF:          50% (11 of 22)');
console.log('  Won the tournament:  27% (6 of 22)');

// ─────────────────────────────────────────────────────────────────────────
// Save
// ─────────────────────────────────────────────────────────────────────────
const out = {
  source: 'all_internationals.json + wc_all_matches.json',
  computed_at: new Date().toISOString(),
  team_confederation: TEAM_CONF,
  wcoi: {
    description: 'WC win rate - All-time win rate. Positive = overperformer at WC.',
    formula: '(wc_wins + 0.5*wc_draws)/wc_total - same for all',
    per_team: wcoi,
  },
  stage_params: {
    description: 'Average goals & draw rate by tournament stage.',
    per_stage: stageParams,
  },
  conf_stage_matrix: {
    description: 'Win/Draw/Loss rate when confederation C1 plays C2 at given stage. Keys normalized (alphabetical).',
    per_matchup: confMatrixRates,
  },
  host_effects: {
    description: 'Elo boost for host nations playing in their own venues.',
    boosts: HOST_BOOSTS,
    historical_baseline: {
      past_group: 0.91,
      past_r16: 0.77,
      past_qf: 0.64,
      past_sf: 0.50,
      won: 0.27,
    },
  },
};
fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
console.log(`\n✓ Saved ${OUT} (${(fs.statSync(OUT).size / 1024).toFixed(1)} KB)`);
