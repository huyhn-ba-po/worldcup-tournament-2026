#!/usr/bin/env node
/*
 * gen_app_data.js — Sinh JS literals (GROUPS_2026, FIXTURES_2026, NEW_TEAM_META_ENTRIES)
 * từ openfootball/worldcup.json/2026/worldcup.json
 * Tên đội được normalize về form khớp với HISTORICAL_MATCHES embed trong index.html.
 *
 * Output: app_data_inject.txt — paste/copy vào index.html
 */

const fs = require('fs');
const path = require('path');

const WC2026_JSON = path.join(__dirname, 'worldcup.json/2026/worldcup.json');
const OUT = path.join(__dirname, 'app_data_inject.txt');

// Tên openfootball → tên canonical app (khớp HISTORICAL_MATCHES)
const NAME_MAP = {
  'South Korea': 'South Korea',
  'Czech Republic': 'Czech Republic',
  'Mexico': 'Mexico',
  'South Africa': 'South Africa',
  'Canada': 'Canada',
  'Bosnia & Herzegovina': 'Bosnia & Herzegovina',
  'Qatar': 'Qatar',
  'Switzerland': 'Switzerland',
  'Brazil': 'Brazil',
  'Haiti': 'Haiti',
  'Morocco': 'Morocco',
  'Scotland': 'Scotland',
  'Australia': 'Australia',
  'Paraguay': 'Paraguay',
  'Turkey': 'Turkey',
  'USA': 'United States',
  'United States': 'United States',
  'Germany': 'Germany',
  'Curaçao': 'Curaçao',
  'Ivory Coast': 'Ivory Coast',
  'Ecuador': 'Ecuador',
  'Netherlands': 'Netherlands',
  'Japan': 'Japan',
  'Sweden': 'Sweden',
  'Tunisia': 'Tunisia',
  'Belgium': 'Belgium',
  'Egypt': 'Egypt',
  'Iran': 'Iran',
  'New Zealand': 'New Zealand',
  'Spain': 'Spain',
  'Cape Verde': 'Cape Verde',
  'Saudi Arabia': 'Saudi Arabia',
  'Uruguay': 'Uruguay',
  'France': 'France',
  'Senegal': 'Senegal',
  'Iraq': 'Iraq',
  'Norway': 'Norway',
  'Argentina': 'Argentina',
  'Algeria': 'Algeria',
  'Austria': 'Austria',
  'Jordan': 'Jordan',
  'Portugal': 'Portugal',
  'DR Congo': 'DR Congo',
  'Uzbekistan': 'Uzbekistan',
  'Colombia': 'Colombia',
  'England': 'England',
  'Croatia': 'Croatia',
  'Ghana': 'Ghana',
  'Panama': 'Panama',
};

function canon(name) {
  if (NAME_MAP[name]) return NAME_MAP[name];
  console.warn(`! unknown name "${name}"`);
  return name;
}

// Metadata cho các team CÓ THỂ thiếu trong TEAM_META (mới so với draw cũ)
const NEW_TEAM_META = {
  'Czech Republic':       { flag: '🇨🇿', conf: 'UEFA',     titles: 0, host: false, rank_tier: 3 },
  'South Africa':         { flag: '🇿🇦', conf: 'CAF',      titles: 0, host: false, rank_tier: 4 },
  'Bosnia & Herzegovina': { flag: '🇧🇦', conf: 'UEFA',     titles: 0, host: false, rank_tier: 3 },
  'Haiti':                { flag: '🇭🇹', conf: 'CONCACAF', titles: 0, host: false, rank_tier: 4 },
  'Sweden':               { flag: '🇸🇪', conf: 'UEFA',     titles: 0, host: false, rank_tier: 2 },
  'Curaçao':              { flag: '🇨🇼', conf: 'CONCACAF', titles: 0, host: false, rank_tier: 4 },
  'Iraq':                 { flag: '🇮🇶', conf: 'AFC',      titles: 0, host: false, rank_tier: 4 },
  'Norway':               { flag: '🇳🇴', conf: 'UEFA',     titles: 0, host: false, rank_tier: 2 },
  'DR Congo':             { flag: '🇨🇩', conf: 'CAF',      titles: 0, host: false, rank_tier: 4 },
};

const data = JSON.parse(fs.readFileSync(WC2026_JSON, 'utf8'));
const matches = data.matches;

// Convert "13:00 UTC-6" → UTC kickoff timestamp (ms)
function kickoffUTC(date, time) {
  const m = time.match(/(\d{1,2}):(\d{2})\s+UTC([+-]\d+)/);
  if (!m) return new Date(`${date}T00:00:00Z`).getTime();
  const hh = parseInt(m[1], 10), mm = parseInt(m[2], 10), off = parseInt(m[3], 10);
  // local time = UTC + off → UTC = local - off
  const utcHH = hh - off;
  return new Date(`${date}T00:00:00Z`).getTime() + (utcHH * 60 + mm) * 60 * 1000;
}

// 72 trận vòng bảng (sort theo kickoff UTC để có FIFA match number 1-72)
const groupMatches = matches.filter((m) => m.group)
  .map((m) => ({ ...m, _utc: kickoffUTC(m.date, m.time) }))
  .sort((a, b) => a._utc - b._utc);
const koMatches = matches.filter((m) => !m.group);

console.log(`Group matches: ${groupMatches.length}, KO matches: ${koMatches.length}`);

// Build GROUPS_2026: { A: [team1, team2, team3, team4], ... }
const groups = {};
for (const m of groupMatches) {
  const g = m.group.replace('Group ', '');
  if (!groups[g]) groups[g] = new Set();
  groups[g].add(canon(m.team1));
  groups[g].add(canon(m.team2));
}
const GROUPS_2026 = {};
for (const g of Object.keys(groups).sort()) {
  GROUPS_2026[g] = [...groups[g]];
}

// Build FIXTURES_2026: { match: N, group: 'A', home, away }
// Match number = array index trong worldcup.json + 1 (openfootball lưu theo FIFA match order)
const FIXTURES_2026 = groupMatches.map((m, i) => ({
  match: i + 1,
  group: m.group.replace('Group ', ''),
  home: canon(m.team1),
  away: canon(m.team2),
  date: m.date,
  time: m.time,
  ground: m.ground,
}));

// Generate JS literals
let out = '';
out += '// === DATA: GROUPS_2026 (FIFA official draw 2025-12-05) ===\n';
out += 'const GROUPS_2026 = {\n';
for (const g of Object.keys(GROUPS_2026)) {
  const teams = GROUPS_2026[g].map((t) => `"${t}"`).join(', ');
  out += `  ${g}: [${teams}],\n`;
}
out += '};\n\n';

out += '// === DATA: FIXTURES_2026 (72 group-stage matches, FIFA official order) ===\n';
out += 'const FIXTURES_2026 = [\n';
let curGroup = '';
for (const f of FIXTURES_2026) {
  if (f.group !== curGroup) {
    out += `  // Group ${f.group}\n`;
    curGroup = f.group;
  }
  out += `  { match: ${String(f.match).padStart(2)}, group: "${f.group}", home: "${f.home}",${' '.repeat(Math.max(1, 22 - f.home.length))}away: "${f.away}",${' '.repeat(Math.max(1, 22 - f.away.length))}date: "${f.date}", time: "${f.time}", ground: "${f.ground}" },\n`;
}
out += '];\n\n';

out += '// === NEW TEAM_META entries (đội mới so với draw cũ — merge vào TEAM_META) ===\n';
for (const [name, meta] of Object.entries(NEW_TEAM_META)) {
  out += `  ${JSON.stringify(name)}: ${JSON.stringify(meta).replace(/"/g, '"').replace(/,/g, ', ')},\n`;
}

fs.writeFileSync(OUT, out);
console.log(`\n✓ Saved ${OUT} (${out.length} bytes)`);
console.log('\n--- Preview ---');
console.log(out.slice(0, 1500));
