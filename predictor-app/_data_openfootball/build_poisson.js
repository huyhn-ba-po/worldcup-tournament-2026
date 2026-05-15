#!/usr/bin/env node
/*
 * build_poisson.js — Fit Poisson goal-scoring strength α (attack) và δ (defense) cho mỗi đội
 *
 * Method: Iterative MLE — đơn giản nhưng đủ tốt:
 *   For each team T:
 *     α_T = (Σ goals scored by T in major matches) / (matches × global_avg_goals)
 *     δ_T = (Σ goals conceded by T) / (matches × global_avg_goals)
 *   So α > 1 = above avg attack, δ < 1 = above avg defense.
 *
 * Filter: chỉ dùng matches từ 2014+ (last 3 WC cycles) cho relevance, và chỉ
 * trận của WC + major continental + qualifications.
 *
 * Predicted goals for match (home A vs away B):
 *   λ_A = α_A × δ_B × HOME_BOOST × global_avg
 *   λ_B = α_B × δ_A × global_avg
 *
 * Output: poisson_params.json
 */

const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, 'all_internationals.json');
const OUT = path.join(__dirname, 'poisson_params.json');

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

// Tournaments quan trọng (loại friendly + minor)
const RELEVANT_TOURNAMENTS = new Set([
  'fifa_world_cup', 'fifa_world_cup_qualification',
  'uefa_euro', 'uefa_euro_qualification', 'uefa_nations_league',
  'copa_america', 'copa_america_qualification',
  'african_cup_of_nations', 'african_cup_of_nations_qualification',
  'afc_asian_cup', 'afc_asian_cup_qualification',
  'gold_cup', 'gold_cup_qualification',
  'concacaf_nations_league', 'oceania_nations_cup',
  'oceania_nations_cup_qualification', 'oceania_nations_cup_qualification_for_2026',
  'arab_cup', 'asean_championship', 'saff_cup',
  'fifa_confederations_cup',
]);

// Time decay: matches gần đây trọng số cao hơn
// ξ = 0.0019 per day = decay 50% trong 1 year (gentler than 0.0065)
function timeDecay(year) {
  const ageYears = 2026 - year;
  return Math.exp(-0.10 * ageYears);  // 10% giảm mỗi năm
}

// ─────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────
const src = JSON.parse(fs.readFileSync(SRC, 'utf8'));

// Filter: 2014+ AND relevant tournament
const matches = src.matches.filter((m) =>
  m.year >= 2014 &&
  RELEVANT_TOURNAMENTS.has(m.tournament) &&
  m.score1 != null && m.score2 != null
);
console.log(`Filtered ${matches.length} matches (2014+, relevant tournaments)`);

// Compute global average goals per team per match (with time decay)
let totalWeightedGoals = 0, totalWeight = 0;
for (const m of matches) {
  const w = timeDecay(m.year);
  totalWeightedGoals += w * (m.score1 + m.score2);
  totalWeight += w;
}
const globalAvg = totalWeightedGoals / (2 * totalWeight); // per team per match
console.log(`Global avg goals per team per match (weighted): ${globalAvg.toFixed(2)}`);

// Per-team aggregates
const stats = {}; // team → { gf, ga, played, weight }
for (const m of matches) {
  const t1 = norm(m.team1), t2 = norm(m.team2);
  const w = timeDecay(m.year);

  if (!stats[t1]) stats[t1] = { gf: 0, ga: 0, played: 0, weight: 0 };
  if (!stats[t2]) stats[t2] = { gf: 0, ga: 0, played: 0, weight: 0 };

  stats[t1].gf += w * m.score1;
  stats[t1].ga += w * m.score2;
  stats[t1].played += 1;
  stats[t1].weight += w;

  stats[t2].gf += w * m.score2;
  stats[t2].ga += w * m.score1;
  stats[t2].played += 1;
  stats[t2].weight += w;
}

// Compute α (attack) và δ (defense) per team
// α > 1 = ghi nhiều hơn avg, δ > 1 = thủng nhiều hơn avg (bad defense)
const params = {};
for (const [team, s] of Object.entries(stats)) {
  if (!WC2026_TEAMS.has(team)) continue;
  const gfPerMatch = s.gf / s.weight;
  const gaPerMatch = s.ga / s.weight;
  params[team] = {
    attack: +(gfPerMatch / globalAvg).toFixed(3),
    defense: +(gaPerMatch / globalAvg).toFixed(3),
    matches: s.played,
    gf_per_match: +gfPerMatch.toFixed(2),
    ga_per_match: +gaPerMatch.toFixed(2),
  };
}

// Default cho team không có data
const defaultParam = { attack: 0.95, defense: 1.05, matches: 0, gf_per_match: 1.2, ga_per_match: 1.4 };

// Print sample
console.log('\n=== Top 10 attack (α) ===');
const byAttack = Object.entries(params).sort((a, b) => b[1].attack - a[1].attack);
byAttack.slice(0, 10).forEach(([t, p]) => {
  console.log(`  ${t.padEnd(25)} α=${p.attack}  δ=${p.defense}  (${p.matches} matches, ${p.gf_per_match} gf, ${p.ga_per_match} ga)`);
});

console.log('\n=== Top 10 defense (δ thấp = phòng ngự tốt) ===');
const byDefense = Object.entries(params).sort((a, b) => a[1].defense - b[1].defense);
byDefense.slice(0, 10).forEach(([t, p]) => {
  console.log(`  ${t.padEnd(25)} α=${p.attack}  δ=${p.defense}  (${p.gf_per_match} gf, ${p.ga_per_match} ga)`);
});

console.log('\n=== Bottom 5 attack (đội ghi ít) ===');
byAttack.slice(-5).forEach(([t, p]) => {
  console.log(`  ${t.padEnd(25)} α=${p.attack}  δ=${p.defense}  (${p.gf_per_match} gf, ${p.ga_per_match} ga)`);
});

// Verify all 48 WC2026 teams have params
const missing = [...WC2026_TEAMS].filter((t) => !params[t]);
if (missing.length) {
  console.log(`\n⚠ Teams without Poisson data (using default): ${missing.join(', ')}`);
  for (const t of missing) params[t] = { ...defaultParam, _default: true };
}

// Save
const out = {
  source: 'all_internationals.json (filtered 2014+, relevant tournaments only)',
  method: 'Weighted average attack/defense ratio (Poisson rates normalized against global avg)',
  global_avg_goals_per_team_per_match: +globalAvg.toFixed(3),
  time_decay: 'exp(-0.10 * years_ago)',
  home_boost_multiplier: 1.25, // dùng khi predict: λ_home = α_home × δ_away × HOME_BOOST × globalAvg
  computed_at: new Date().toISOString(),
  matches_used: matches.length,
  default_param: defaultParam,
  teams: params,
};
fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
console.log(`\n✓ Saved ${OUT} (${(fs.statSync(OUT).size / 1024).toFixed(1)} KB)`);

// Sanity check: predict Mexico vs South Africa
const mex = params['Mexico'], sa = params['South Africa'];
const HOME_BOOST = 1.25;
const lambdaA = mex.attack * sa.defense * HOME_BOOST * globalAvg;
const lambdaB = sa.attack * mex.defense * globalAvg;
console.log(`\n--- Sanity: Mexico (home) vs South Africa ---`);
console.log(`  λ_Mexico = α(${mex.attack}) × δ_SA(${sa.defense}) × ${HOME_BOOST} × ${globalAvg.toFixed(2)} = ${lambdaA.toFixed(2)} goals`);
console.log(`  λ_SA     = α(${sa.attack}) × δ_Mex(${mex.defense}) × ${globalAvg.toFixed(2)} = ${lambdaB.toFixed(2)} goals`);
console.log(`  Expected score: ${Math.round(lambdaA)}-${Math.round(lambdaB)}`);
