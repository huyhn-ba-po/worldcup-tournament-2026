#!/usr/bin/env node
/*
 * scrape_squads.js — Scrape Wikipedia squad info cho 48 đội WC2026
 *
 * Lấy "Current squad" section từ Wikipedia national team pages.
 * Output: webapp/src/data/squads.json
 *
 * Usage: node scripts/scrape_squads.js [--team Argentina]
 */

import * as cheerio from 'cheerio';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'src', 'data', 'squads.json');
const CACHE_DIR = join(__dirname, '.wiki_cache');
if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true });

// Wikipedia URL pattern cho 48 đội WC2026
// Format: { canonical_name: wiki_slug }
const WIKI_SLUGS = {
  'Mexico': 'Mexico_national_football_team',
  'South Africa': 'South_Africa_national_soccer_team',
  'South Korea': 'South_Korea_national_football_team',
  'Czech Republic': 'Czech_Republic_national_football_team',
  'Canada': "Canada_men%27s_national_soccer_team",
  'Bosnia & Herzegovina': 'Bosnia_and_Herzegovina_national_football_team',
  'Qatar': 'Qatar_national_football_team',
  'Switzerland': 'Switzerland_national_football_team',
  'Brazil': 'Brazil_national_football_team',
  'Morocco': 'Morocco_national_football_team',
  'Haiti': 'Haiti_national_football_team',
  'Scotland': 'Scotland_national_football_team',
  'United States': "United_States_men%27s_national_soccer_team",
  'Paraguay': 'Paraguay_national_football_team',
  'Australia': 'Australia_men%27s_national_soccer_team',
  'Turkey': 'Turkey_national_football_team',
  'Germany': 'Germany_national_football_team',
  'Curaçao': 'Cura%C3%A7ao_national_football_team',
  'Ivory Coast': 'Ivory_Coast_national_football_team',
  'Ecuador': 'Ecuador_national_football_team',
  'Netherlands': 'Netherlands_national_football_team',
  'Japan': 'Japan_national_football_team',
  'Sweden': 'Sweden_national_football_team',
  'Tunisia': 'Tunisia_national_football_team',
  'Belgium': 'Belgium_national_football_team',
  'Egypt': 'Egypt_national_football_team',
  'Iran': 'Iran_national_football_team',
  'New Zealand': 'New_Zealand_national_football_team',
  'Spain': 'Spain_national_football_team',
  'Cape Verde': 'Cape_Verde_national_football_team',
  'Saudi Arabia': 'Saudi_Arabia_national_football_team',
  'Uruguay': 'Uruguay_national_football_team',
  'France': 'France_national_football_team',
  'Senegal': 'Senegal_national_football_team',
  'Iraq': 'Iraq_national_football_team',
  'Norway': 'Norway_national_football_team',
  'Argentina': 'Argentina_national_football_team',
  'Algeria': 'Algeria_national_football_team',
  'Austria': 'Austria_national_football_team',
  'Jordan': 'Jordan_national_football_team',
  'Portugal': 'Portugal_national_football_team',
  'DR Congo': 'DR_Congo_national_football_team',
  'Uzbekistan': 'Uzbekistan_national_football_team',
  'Colombia': 'Colombia_national_football_team',
  'England': 'England_national_football_team',
  'Croatia': 'Croatia_national_football_team',
  'Ghana': 'Ghana_national_football_team',
  'Panama': 'Panama_national_football_team',
};

// Map các vị trí abbreviation → tiếng Việt
const POS_MAP = {
  'GK': 'Thủ môn',
  'DF': 'Hậu vệ', 'DEF': 'Hậu vệ',
  'CB': 'Trung vệ', 'LB': 'Hậu vệ trái', 'RB': 'Hậu vệ phải', 'LWB': 'Hậu vệ chạy cánh trái', 'RWB': 'Hậu vệ chạy cánh phải',
  'MF': 'Tiền vệ', 'MID': 'Tiền vệ',
  'CM': 'Tiền vệ trung tâm', 'DM': 'Tiền vệ phòng ngự', 'AM': 'Tiền vệ tấn công',
  'LM': 'Tiền vệ trái', 'RM': 'Tiền vệ phải',
  'FW': 'Tiền đạo', 'FWD': 'Tiền đạo',
  'CF': 'Tiền đạo cắm', 'LW': 'Tiền đạo cánh trái', 'RW': 'Tiền đạo cánh phải',
  'ST': 'Tiền đạo', 'SS': 'Tiền đạo lùi',
};

// Map vị trí → category (4 nhóm chính)
const POS_CATEGORY = {
  'GK': 'goalkeepers',
  'DF': 'defenders', 'DEF': 'defenders', 'CB': 'defenders', 'LB': 'defenders', 'RB': 'defenders',
  'LWB': 'defenders', 'RWB': 'defenders',
  'MF': 'midfielders', 'MID': 'midfielders', 'CM': 'midfielders', 'DM': 'midfielders',
  'AM': 'midfielders', 'LM': 'midfielders', 'RM': 'midfielders',
  'FW': 'forwards', 'FWD': 'forwards', 'CF': 'forwards', 'LW': 'forwards', 'RW': 'forwards',
  'ST': 'forwards', 'SS': 'forwards',
};

const HEADERS = {
  'User-Agent': 'WC2026-Predictor-Scraper/1.0 (https://dudoanworldcup2026ai.xyz; huynhnhathuyks@gmail.com) Educational use',
  'Accept': 'text/html,application/xhtml+xml',
};

async function fetchWiki(slug) {
  const cachePath = join(CACHE_DIR, slug.replace(/[\/\\:?*"<>|%]/g, '_') + '.html');
  if (existsSync(cachePath)) {
    return readFileSync(cachePath, 'utf8');
  }
  const url = `https://en.wikipedia.org/wiki/${slug}`;
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  const html = await res.text();
  writeFileSync(cachePath, html);
  return html;
}

// Extract squad từ HTML — tìm bảng dưới heading "Current squad"
function parseSquad(html, teamName) {
  const $ = cheerio.load(html);
  const players = [];

  // Find heading containing "Current squad" or "Recent call-ups" or "Latest"
  const headingPatterns = [
    /current\s*squad/i,
    /most\s*recent\s*squad/i,
    /recent\s*call/i,
  ];

  let squadTable = null;
  let foundHeading = null;

  // Strategy 1: Find heading then walk forward to next wikitable with "Pos" + "Player" headers
  $('h2, h3, h4').each((_, el) => {
    if (squadTable) return false;
    const headingText = $(el).text().trim();
    const isMatch = headingPatterns.some(p => p.test(headingText));
    if (!isMatch) return;
    foundHeading = headingText;

    // Walk forward, looking for wikitable with squad-like headers
    let cur = el;
    let safetyCounter = 0;
    while (cur && safetyCounter++ < 50) {
      cur = cur.nextSibling;
      if (!cur) break;
      const $cur = $(cur);
      // Stop at next h2/h3 of similar level (different section)
      if ($cur.is('h2') || ($cur.is('h3') && headingPatterns.every(p => !p.test($cur.text())))) {
        // continue past — sometimes nested
      }
      // Check if this or descendant is a squad-matching wikitable
      const candidates = $cur.is('table.wikitable') ? [$cur] : [...$cur.find('table.wikitable')].map(t => $(t));
      for (const cand of candidates) {
        const hdrs = [];
        cand.find('tr').first().find('th').each((_, th) => hdrs.push($(th).text().trim().toLowerCase()));
        const hasPos = hdrs.some(h => /^pos/i.test(h));
        const hasPlayer = hdrs.some(h => /player|name/i.test(h));
        if (hasPos && hasPlayer) {
          squadTable = cand;
          return false;
        }
      }
    }
  });

  // Strategy 2 fallback: scan all wikitables for one with squad-like headers
  if (!squadTable) {
    $('table.wikitable').each((_, t) => {
      if (squadTable) return false;
      const $t = $(t);
      const hdrs = [];
      $t.find('tr').first().find('th').each((_, th) => hdrs.push($(th).text().trim().toLowerCase()));
      const hasPos = hdrs.some(h => /^pos/i.test(h));
      const hasPlayer = hdrs.some(h => /player|name/i.test(h));
      const hasCaps = hdrs.some(h => /^caps$/i.test(h));
      if (hasPos && hasPlayer && hasCaps) {
        squadTable = $t;
        foundHeading = foundHeading || 'Current squad (fallback)';
        return false;
      }
    });
  }

  if (!squadTable || !squadTable.length) {
    return { players: [], heading: null, error: 'no squad table found' };
  }

  // Detect columns
  const headers = [];
  squadTable.find('tr').first().find('th').each((_, th) => {
    headers.push($(th).text().trim().toLowerCase());
  });

  // Find column indices
  const colIdx = {
    no: headers.findIndex(h => /^no\.?$|number/i.test(h)),
    pos: headers.findIndex(h => /pos/i.test(h)),
    name: headers.findIndex(h => /player|name/i.test(h)),
    dob: headers.findIndex(h => /date\s*of\s*birth|dob|age/i.test(h)),
    caps: headers.findIndex(h => /^caps$/i.test(h)),
    goals: headers.findIndex(h => /^goals$/i.test(h)),
    club: headers.findIndex(h => /club/i.test(h)),
  };

  // Parse rows
  squadTable.find('tr').each((idx, tr) => {
    if (idx === 0) return; // skip header
    // Use children() to include both <th> and <td> (Player cell is often <th>)
    const cells = $(tr).children();
    if (cells.length < 3) return;

    const getCell = (i) => i >= 0 && i < cells.length ? $(cells[i]).text().trim().replace(/\[[^\]]*\]/g, '') : '';
    const getCellLink = (i) => {
      if (i < 0 || i >= cells.length) return '';
      const a = $(cells[i]).find('a').first();
      return (a.text() || $(cells[i]).text()).trim().replace(/\[[^\]]*\]/g, '');
    };

    // Position often has numeric prefix like "1GK" → strip
    const pos = getCell(colIdx.pos).toUpperCase().replace(/[^A-Z]/g, '');
    const name = getCellLink(colIdx.name);
    if (!name || name.length < 2 || /^[\d\.\-\s]+$/.test(name)) return;

    const player = {
      pos,
      pos_vi: POS_MAP[pos] || pos,
      category: POS_CATEGORY[pos] || 'other',
      name,
    };

    if (colIdx.no >= 0) {
      const no = parseInt(getCell(colIdx.no), 10);
      if (!isNaN(no)) player.no = no;
    }
    if (colIdx.caps >= 0) {
      const caps = parseInt(getCell(colIdx.caps), 10);
      if (!isNaN(caps)) player.caps = caps;
    }
    if (colIdx.goals >= 0) {
      const goals = parseInt(getCell(colIdx.goals), 10);
      if (!isNaN(goals)) player.goals = goals;
    }
    if (colIdx.club >= 0) {
      player.club = getCellLink(colIdx.club);
    }
    if (colIdx.dob >= 0) {
      const dobText = getCell(colIdx.dob);
      const yearMatch = dobText.match(/\((\d{4})/);
      if (yearMatch) {
        const birthYear = parseInt(yearMatch[1], 10);
        player.age = 2026 - birthYear;
      }
    }

    players.push(player);
  });

  return { players, heading: foundHeading };
}

// Build squad grouped by position
function organizePlayers(players) {
  const groups = { goalkeepers: [], defenders: [], midfielders: [], forwards: [], other: [] };
  players.forEach(p => {
    const cat = p.category || 'other';
    groups[cat].push(p);
  });
  // Sort each group by caps desc (key players first)
  for (const cat of Object.keys(groups)) {
    groups[cat].sort((a, b) => (b.caps || 0) - (a.caps || 0));
  }
  return groups;
}

// Compute "key players" — top by caps + goals across all positions
function getKeyPlayers(players, limit = 7) {
  return [...players]
    .map(p => ({ ...p, score: (p.caps || 0) + (p.goals || 0) * 3 })) // weight goals
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

// Main
async function main() {
  const teamFilter = process.argv.find(a => a.startsWith('--team='))?.split('=')[1];
  const teams = teamFilter ? [teamFilter] : Object.keys(WIKI_SLUGS);

  console.log(`Scraping ${teams.length} teams...`);
  const squads = {};
  let success = 0, failed = 0;

  for (const team of teams) {
    const slug = WIKI_SLUGS[team];
    if (!slug) { console.log(`  ! No slug for ${team}, skip`); continue; }

    try {
      process.stdout.write(`  ${team.padEnd(25)} ... `);
      const html = await fetchWiki(slug);
      const { players, heading, error } = parseSquad(html, team);

      if (players.length === 0) {
        console.log(`✗ ${error || 'no players'}`);
        failed++;
        squads[team] = { error: error || 'no squad found', source_url: `https://en.wikipedia.org/wiki/${slug}` };
        continue;
      }

      const groups = organizePlayers(players);
      const key_players = getKeyPlayers(players);
      squads[team] = {
        source: 'wikipedia',
        source_url: `https://en.wikipedia.org/wiki/${slug}`,
        squad_section: heading,
        total: players.length,
        by_position: groups,
        key_players,
        scraped_at: '2026-05-24', // hardcoded since Date.now restricted
      };
      console.log(`✓ ${players.length} players`);
      success++;
    } catch (e) {
      console.log(`✗ ${e.message.slice(0, 50)}`);
      failed++;
      squads[team] = { error: e.message };
    }

    // polite delay
    await new Promise(r => setTimeout(r, 800));
  }

  // Save
  const out = {
    source: 'wikipedia.org (current squad sections)',
    scraped_at: '2026-05-24',
    total_teams: Object.keys(squads).length,
    success_count: success,
    failed_count: failed,
    note: 'Squads chính thức 26-man WC2026 sẽ công bố cuối tháng 5/2026. Đây là squad gần nhất từ qualifiers/friendlies.',
    teams: squads,
  };
  writeFileSync(OUT, JSON.stringify(out, null, 2));
  console.log(`\n✓ Saved ${OUT}`);
  console.log(`  Success: ${success}/${teams.length}`);
  console.log(`  Failed: ${failed}`);
}

main().catch(e => { console.error(e); process.exit(1); });
