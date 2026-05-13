#!/usr/bin/env node
/*
 * build_h2h_subset.js — Filter all_internationals.json (47,980 trận)
 * thành subset chỉ chứa các trận liên quan đến 48 đội WC2026.
 *
 * Output: embedded_historical.js — file JS với `var HISTORICAL_MATCHES = [...]`
 *         dùng schema khớp index.html: {h, a, y, hg, ag}
 *
 * Goals:
 *   1. Cover H2H lifetime cho tất cả 1128 cặp đội WC2026
 *   2. Cover recent form 2020-2025 cho 48 đội
 *   3. Bảo toàn 965 trận WC lịch sử đã có
 *
 * Strategy: giữ trận nếu (BOTH teams ∈ WC2026) OR (year ≥ 2020 AND one team ∈ WC2026 AND tournament major)
 */

const fs = require('fs');
const path = require('path');

const DIR = __dirname;
const SRC = path.join(DIR, 'all_internationals.json');

// 48 đội WC2026 (tên dùng trong app — khớp HISTORICAL_MATCHES + GROUPS_2026)
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

// Normalize: tên openfootball/internationals → tên app
// Tham khảo: openfootball dùng "Bosnia and Herzegovina", "United States", "Korea Republic"...
// HISTORICAL_MATCHES trong app dùng "Bosnia & Herzegovina", "United States", "South Korea"...
const ALIAS = {
  'Korea Republic': 'South Korea',
  'Bosnia and Herzegovina': 'Bosnia & Herzegovina',
  'Türkiye': 'Turkey',
  'Turkiye': 'Turkey',
  'Côte d\'Ivoire': 'Ivory Coast',
  'Cote d\'Ivoire': 'Ivory Coast',
  'Curacao': 'Curaçao',
  'DR Congo': 'DR Congo',
  'Congo DR': 'DR Congo',
  'Democratic Republic of the Congo': 'DR Congo',
  'Zaire': 'DR Congo',           // 1974 alias
  'Czechia': 'Czech Republic',
  'Czechoslovakia': 'Czech Republic',  // pre-1993 alias
  'West Germany': 'Germany',
  'East Germany': 'Germany',
  'USA': 'United States',
  // Historical state names → modern
  'Soviet Union': 'Russia',     // not in WC2026, but appears in historical
  'Yugoslavia': 'Serbia',
  'FR Yugoslavia': 'Serbia',
  'Serbia and Montenegro': 'Serbia',
};

function normalize(name) {
  return ALIAS[name] || name;
}

const src = JSON.parse(fs.readFileSync(SRC, 'utf8'));
console.log(`Source: ${src.matches.length} matches (${src.yearRange.join('-')})`);

// Filter strategy
const filtered = [];
const seen = new Set(); // dedupe key: date|t1|t2|s1|s2
const stats = { both_wc26: 0, recent_one_wc26: 0, skipped: 0 };

for (const m of src.matches) {
  const t1 = normalize(m.team1);
  const t2 = normalize(m.team2);

  // Skip if scores null (future games — already in app via FIXTURES_2026)
  if (m.score1 == null || m.score2 == null) { stats.skipped++; continue; }

  const t1In = WC2026_TEAMS.has(t1);
  const t2In = WC2026_TEAMS.has(t2);

  let keep = false;
  if (t1In && t2In) {
    // Cả 2 đội đều ở WC2026 → giữ lifetime H2H
    keep = true; stats.both_wc26++;
  } else if ((t1In || t2In) && m.year >= 2020) {
    // 1 đội WC2026 + recent (2020+) → cho form analysis
    // Skip friendly trừ khi tournament major
    const majorTournaments = [
      'fifa_world_cup', 'fifa_world_cup_qualification',
      'uefa_euro', 'uefa_euro_qualification', 'uefa_nations_league',
      'copa_america', 'african_cup_of_nations', 'afc_asian_cup',
      'gold_cup', 'concacaf_nations_league',
      'arab_cup', 'asean_championship', 'saff_cup',
    ];
    if (majorTournaments.some((t) => m.tournament.includes(t)) || m.year >= 2024) {
      keep = true; stats.recent_one_wc26++;
    }
  }

  if (!keep) continue;

  const key = `${m.date}|${t1}|${t2}|${m.score1}|${m.score2}`;
  if (seen.has(key)) continue;
  seen.add(key);

  filtered.push({
    h: t1,
    a: t2,
    y: m.year,
    hg: m.score1,
    ag: m.score2,
  });
}

// Sort by year then alphabetical (giống schema cũ)
filtered.sort((a, b) => a.y - b.y || a.h.localeCompare(b.h));

console.log(`\nFilter stats:`);
console.log(`  Both teams in WC2026: ${stats.both_wc26}`);
console.log(`  Recent (2020+) one team in WC2026: ${stats.recent_one_wc26}`);
console.log(`  Skipped (future games): ${stats.skipped}`);
console.log(`  Output: ${filtered.length} matches (after dedupe)`);

// Year coverage
const yearCounts = {};
filtered.forEach((m) => { yearCounts[m.y] = (yearCounts[m.y] || 0) + 1; });
const recentYears = Object.keys(yearCounts).filter((y) => parseInt(y) >= 2018).sort();
console.log(`\nRecent year coverage:`);
recentYears.forEach((y) => console.log(`  ${y}: ${yearCounts[y]}`));

// Write as JS file (var so it can be inline injected)
const out = `// === HISTORICAL_MATCHES — ${filtered.length} matches ===
// Generated from openfootball/internationals (Public Domain CC0)
// Strategy:
//   - All historical matches between any 2 WC2026 teams (lifetime H2H)
//   - 2020+ matches involving 1 WC2026 team (recent form for major tournaments)
//   - 2024+ all matches involving 1 WC2026 team
// Source files: _data_openfootball/all_internationals.json
const HISTORICAL_MATCHES = ${JSON.stringify(filtered).replace(/\},\{/g, '},\n{')};
`;

const outPath = path.join(DIR, 'embedded_historical.js');
fs.writeFileSync(outPath, out);
const sizeKB = (fs.statSync(outPath).size / 1024).toFixed(0);
console.log(`\n✓ Saved ${outPath} (${sizeKB} KB)`);

// H2H verification
const h2hMexicoSA = filtered.filter((m) =>
  (m.h === 'Mexico' && m.a === 'South Africa') ||
  (m.h === 'South Africa' && m.a === 'Mexico')
);
console.log(`\nH2H Mexico vs South Africa (WC2026 opener):`);
h2hMexicoSA.forEach((m) => console.log(`  ${m.y} | ${m.h} ${m.hg}-${m.ag} ${m.a}`));
