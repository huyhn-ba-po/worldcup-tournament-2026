#!/usr/bin/env node
/*
 * parse_aggregate.js — Parse Football.TXT từ openfootball/internationals + openfootball/worldcup.json
 * thành 2 file JSON s ạch để làm AI input cho predictor:
 *
 *   all_internationals.json — 47k+ trận quốc tế 1872-2024 (H2H universal)
 *   wc_all_matches.json     — Tất cả trận World Cup 1930-2026 (đã có score nếu đã đá)
 *
 * Usage: node parse_aggregate.js
 */

const fs = require('fs');
const path = require('path');

const DIR = __dirname;
const INTL_DIR = path.join(DIR, 'internationals');
const WCJSON_DIR = path.join(DIR, 'worldcup.json');

// ─────────────────────────────────────────────────────────────────────────
// Parser cho Football.TXT internationals
// ─────────────────────────────────────────────────────────────────────────
// Format mẫu:
//   = Friendly 2024
//   [Mon Jan 1]
//     Japan - Thailand  5-0   @ Tokyo, Japan
//   [Sat Jan 6]
//     Indonesia - Libya  1-2   @ Antalya, Turkey
//
// Regex bắt date header và match line
const DATE_RE = /^\[\s*([A-Za-z]{3})\s+([A-Za-z]{3})[\/\s]+(\d{1,2})(?:\s+(\d{4}))?\s*\]\s*$/;
const MATCH_RE = /^\s+(.+?)\s+-\s+(.+?)\s+(\d+|\?)\s*-\s*(\d+|\?)(?:\s*\(([^)]+)\))?\s*(?:@\s+(.+?))?\s*$/;
// "  Team1 - Team2  5-0   @ Venue, Country"
// "  Team1 - Team2  ?-?   @ Venue" (future match)
// Score có thể có "(aet)" hoặc "(pen ...)"

const MONTH_MAP = { Jan:1, Feb:2, Mar:3, Apr:4, May:5, Jun:6, Jul:7, Aug:8, Sep:9, Oct:10, Nov:11, Dec:12 };

function parseInternationalsFile(filepath, tournamentKey) {
  const content = fs.readFileSync(filepath, 'utf8');
  const lines = content.split(/\r?\n/);

  // Lấy year từ header "= XYZ 2024" hoặc từ filename
  let year = null;
  const headerMatch = content.match(/^=\s+.+?\s+(\d{4})/m);
  if (headerMatch) year = parseInt(headerMatch[1], 10);
  if (!year) {
    const fnYear = filepath.match(/(\d{4})_/);
    if (fnYear) year = parseInt(fnYear[1], 10);
  }
  if (!year) return [];

  const matches = [];
  let curDate = null;

  for (const line of lines) {
    const dm = line.match(DATE_RE);
    if (dm) {
      const dayName = dm[1], month = MONTH_MAP[dm[2]], day = parseInt(dm[3], 10);
      const y = dm[4] ? parseInt(dm[4], 10) : year;
      if (month && day) {
        curDate = `${y}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
      }
      continue;
    }
    const mm = line.match(MATCH_RE);
    if (mm && curDate) {
      const [, team1, team2, s1, s2, note, venue] = mm;
      matches.push({
        date: curDate,
        team1: team1.trim(),
        team2: team2.trim(),
        score1: s1 === '?' ? null : parseInt(s1, 10),
        score2: s2 === '?' ? null : parseInt(s2, 10),
        note: note || null, // e.g. "aet", "pen 5-4"
        venue: venue ? venue.trim() : null,
        tournament: tournamentKey,
        year,
      });
    }
  }
  return matches;
}

function walkInternationals() {
  const allMatches = [];
  const tournamentDirs = fs.readdirSync(INTL_DIR).filter((f) => {
    const full = path.join(INTL_DIR, f);
    return fs.statSync(full).isDirectory();
  });

  const stats = { tournaments: 0, files: 0, matches: 0 };
  for (const t of tournamentDirs) {
    stats.tournaments++;
    const tDir = path.join(INTL_DIR, t);
    const files = fs.readdirSync(tDir).filter((f) => f.endsWith('.txt'));
    for (const f of files) {
      stats.files++;
      const parsed = parseInternationalsFile(path.join(tDir, f), t);
      allMatches.push(...parsed);
      stats.matches += parsed.length;
    }
  }
  return { matches: allMatches, stats };
}

// ─────────────────────────────────────────────────────────────────────────
// Parser cho worldcup.json (đã sẵn JSON, chỉ cần merge)
// ─────────────────────────────────────────────────────────────────────────
function collectWorldCups() {
  const allWCMatches = [];
  const years = fs.readdirSync(WCJSON_DIR)
    .filter((f) => /^\d{4}$/.test(f))
    .sort();
  const stats = { years: 0, matches: 0 };
  for (const y of years) {
    const jsonPath = path.join(WCJSON_DIR, y, 'worldcup.json');
    if (!fs.existsSync(jsonPath)) continue;
    stats.years++;
    const json = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    (json.matches || []).forEach((m) => {
      allWCMatches.push({
        year: parseInt(y, 10),
        ...m,
      });
      stats.matches++;
    });
  }
  return { matches: allWCMatches, stats };
}

// ─────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────
console.log('Parsing internationals/ ...');
const intl = walkInternationals();
console.log(`  ${intl.stats.tournaments} tournaments · ${intl.stats.files} files · ${intl.stats.matches} matches`);

console.log('Collecting worldcup.json/ ...');
const wc = collectWorldCups();
console.log(`  ${wc.stats.years} WC editions · ${wc.stats.matches} matches`);

// Sort by date
intl.matches.sort((a, b) => a.date.localeCompare(b.date));

const intlOut = {
  source: 'openfootball/internationals (mirror of Mart Jürisoo Kaggle dataset)',
  license: 'Public Domain',
  generatedAt: new Date().toISOString(),
  stats: intl.stats,
  yearRange: [intl.matches[0]?.year, intl.matches[intl.matches.length - 1]?.year],
  matches: intl.matches,
};
fs.writeFileSync(path.join(DIR, 'all_internationals.json'), JSON.stringify(intlOut));

const wcOut = {
  source: 'openfootball/worldcup.json',
  license: 'Public Domain',
  generatedAt: new Date().toISOString(),
  stats: wc.stats,
  matches: wc.matches,
};
fs.writeFileSync(path.join(DIR, 'wc_all_matches.json'), JSON.stringify(wcOut, null, 2));

// Stats by decade
const byDecade = {};
intl.matches.forEach((m) => {
  const dec = Math.floor(m.year / 10) * 10;
  byDecade[dec] = (byDecade[dec] || 0) + 1;
});
console.log('\n=== Matches per decade ===');
Object.keys(byDecade).sort().forEach((d) => {
  console.log(`  ${d}s: ${byDecade[d]}`);
});

console.log(`\n✓ Saved: all_internationals.json (${(fs.statSync(path.join(DIR, 'all_internationals.json')).size / 1024 / 1024).toFixed(1)} MB)`);
console.log(`✓ Saved: wc_all_matches.json (${(fs.statSync(path.join(DIR, 'wc_all_matches.json')).size / 1024).toFixed(0)} KB)`);
