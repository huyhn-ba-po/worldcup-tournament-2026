#!/usr/bin/env node
/*
 * build_elo.js — Compute Elo rating cho mọi đội từ 47k trận quốc tế 1872-2025
 *
 * Methodology: FIFA-style Elo với K-factor theo tournament importance + margin of victory.
 * Output: elo_ratings.json — final rating cho 48 đội WC2026 + top 100 đội thế giới.
 *
 * Run: node build_elo.js
 */

const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, 'all_internationals.json');
const OUT = path.join(__dirname, 'elo_ratings.json');

// ─────────────────────────────────────────────────────────────────────────
// Name normalization (giữ đồng bộ với build_h2h_subset.js + index.html)
// ─────────────────────────────────────────────────────────────────────────
const ALIAS = {
  'Korea Republic': 'South Korea',
  'Bosnia and Herzegovina': 'Bosnia & Herzegovina',
  'Türkiye': 'Turkey',
  'Turkiye': 'Turkey',
  "Côte d'Ivoire": 'Ivory Coast',
  "Cote d'Ivoire": 'Ivory Coast',
  'Curacao': 'Curaçao',
  'Congo DR': 'DR Congo',
  'Democratic Republic of the Congo': 'DR Congo',
  'Zaire': 'DR Congo',
  'Czechia': 'Czech Republic',
  'Czechoslovakia': 'Czech Republic',
  'West Germany': 'Germany',
  'East Germany': 'Germany',
  'USA': 'United States',
  'Soviet Union': 'Russia',
  'Yugoslavia': 'Serbia',
  'FR Yugoslavia': 'Serbia',
  'Serbia and Montenegro': 'Serbia',
};
const norm = (n) => ALIAS[n] || n;

// ─────────────────────────────────────────────────────────────────────────
// K-factor by tournament (importance weighting)
// ─────────────────────────────────────────────────────────────────────────
// Tournament names = folder name trong openfootball/internationals/
const TOURNAMENT_K = {
  'fifa_world_cup':                       55, // mix group + KO, avg
  'fifa_world_cup_qualification':         35,
  'uefa_euro':                            45,
  'uefa_euro_qualification':              30,
  'uefa_nations_league':                  35,
  'copa_america':                         45,
  'copa_america_qualification':           30,
  'african_cup_of_nations':               40,
  'african_cup_of_nations_qualification': 30,
  'afc_asian_cup':                        40,
  'afc_asian_cup_qualification':          30,
  'gold_cup':                             40,
  'gold_cup_qualification':               30,
  'concacaf_championship_qualification':  30,
  'concacaf_nations_league':              30,
  'concacaf_nations_league_qualification':25,
  'oceania_nations_cup':                  35,
  'oceania_nations_cup_qualification':    25,
  'oceania_nations_cup_qualification_for_2026': 25,
  'arab_cup':                             30,
  'asean_championship':                   30,
  'saff_cup':                             25,
  'gulf_cup':                             25,
  'friendly':                             20,
  'olympic_games':                        25, // U23-level mostly
  'fifa_confederations_cup':              40,
};
function kFactor(tournament) {
  if (TOURNAMENT_K[tournament] != null) return TOURNAMENT_K[tournament];
  // Heuristics for unmatched
  if (tournament.includes('qualification')) return 25;
  if (tournament.includes('friend')) return 20;
  return 25; // generic minor
}

// ─────────────────────────────────────────────────────────────────────────
// Elo formula
// ─────────────────────────────────────────────────────────────────────────
// Expected win prob của A vs B với rating khác biệt
function expectedWin(rA, rB) {
  return 1 / (1 + Math.pow(10, (rB - rA) / 400));
}

// Margin of victory multiplier (FIFA Women's Elo style)
// |GD| càng lớn → m càng cao (max ~2.5), nhưng tăng chậm dần
function movMultiplier(goalDiff, ratingDiff) {
  if (goalDiff === 0) return 1;
  const absGD = Math.abs(goalDiff);
  const base = Math.log(absGD + 1);
  // Damp khi đội mạnh thắng đậm (tránh inflation rating)
  const damp = 2.2 / (Math.abs(ratingDiff) * 0.001 + 2.2);
  return base * damp;
}

// ─────────────────────────────────────────────────────────────────────────
// Main: stream qua matches theo thứ tự thời gian
// ─────────────────────────────────────────────────────────────────────────
const src = JSON.parse(fs.readFileSync(SRC, 'utf8'));
console.log(`Loaded ${src.matches.length} matches`);

// Sort chronologically
src.matches.sort((a, b) => a.date.localeCompare(b.date));

const ratings = {};        // team → Elo
const DEFAULT_ELO = 1500;
const ratingHistory = [];  // log mỗi N matches để track convergence
let processed = 0;

for (const m of src.matches) {
  if (m.score1 == null || m.score2 == null) continue;
  const t1 = norm(m.team1);
  const t2 = norm(m.team2);
  if (!t1 || !t2) continue;

  if (!(t1 in ratings)) ratings[t1] = DEFAULT_ELO;
  if (!(t2 in ratings)) ratings[t2] = DEFAULT_ELO;

  const r1 = ratings[t1], r2 = ratings[t2];
  const E1 = expectedWin(r1, r2);
  const E2 = 1 - E1;

  // Actual score
  let S1, S2;
  if (m.score1 > m.score2)      { S1 = 1; S2 = 0; }
  else if (m.score1 < m.score2) { S1 = 0; S2 = 1; }
  else                          { S1 = 0.5; S2 = 0.5; }

  const K = kFactor(m.tournament);
  const gd = m.score1 - m.score2;
  const mov1 = movMultiplier(gd, r1 - r2);
  const mov2 = movMultiplier(-gd, r2 - r1);

  ratings[t1] = r1 + K * mov1 * (S1 - E1);
  ratings[t2] = r2 + K * mov2 * (S2 - E2);

  processed++;
  if (processed % 5000 === 0) {
    console.log(`  ${processed} matches processed (${m.year})`);
  }
}
console.log(`✓ Processed ${processed} matches total\n`);

// ─────────────────────────────────────────────────────────────────────────
// Output: 48 đội WC2026 + top 100 toàn thế giới
// ─────────────────────────────────────────────────────────────────────────
const WC2026_TEAMS = [
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
];

// Sort all teams by rating desc
const allSorted = Object.entries(ratings)
  .sort((a, b) => b[1] - a[1])
  .map(([team, rating]) => ({ team, rating: Math.round(rating) }));

// WC2026 ratings
const wc2026 = {};
for (const t of WC2026_TEAMS) {
  wc2026[t] = Math.round(ratings[t] || DEFAULT_ELO);
}

// Top 30 (sanity check)
console.log('=== Top 30 thế giới (Elo) ===');
allSorted.slice(0, 30).forEach((t, i) => {
  const inWC = WC2026_TEAMS.includes(t.team) ? ' ✓' : '';
  console.log(`  ${(i + 1).toString().padStart(2)}. ${t.team.padEnd(25)} ${t.rating}${inWC}`);
});

console.log('\n=== 48 đội WC2026 (Elo sort) ===');
const wcSorted = Object.entries(wc2026)
  .sort((a, b) => b[1] - a[1]);
wcSorted.forEach((t, i) => {
  console.log(`  ${(i + 1).toString().padStart(2)}. ${t[0].padEnd(25)} ${t[1]}`);
});

// Save
const out = {
  source: 'all_internationals.json (1872-2025)',
  method: 'FIFA-style Elo with K-factor by tournament + margin of victory multiplier',
  default_rating: DEFAULT_ELO,
  computed_at: new Date().toISOString(),
  matches_processed: processed,
  k_factors: TOURNAMENT_K,
  wc2026: wc2026,
  top_50_global: allSorted.slice(0, 50),
};
fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
console.log(`\n✓ Saved ${OUT} (${(fs.statSync(OUT).size / 1024).toFixed(1)} KB)`);
