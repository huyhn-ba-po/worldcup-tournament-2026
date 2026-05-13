#!/usr/bin/env node
/*
 * fetch_and_parse.js — Fetch WC2026 data từ 7m.com.cn và parse thành schema clean.
 *
 * Usage:
 *   node fetch_and_parse.js              # fetch fresh + parse
 *   node fetch_and_parse.js --no-fetch   # parse từ JSON đã có
 *
 * Data source: https://txt-api.7m.com.cn/specials/worldcup2026/{games,standings,live}?lan={1,3,6}
 *   lan=1 zh-CN | lan=3 en | lan=6 vi
 *
 * Game tuple schema (từ source code fixtures.js của 7m):
 *   [0] matchId         '5001993'
 *   [1] stageId         '454644' (xem STAGE_NAMES)
 *   [2] group           'A'..'L' hoặc '' nếu knockout
 *   [3] round/leg       '17' (chưa rõ ý nghĩa, có thể là round number)
 *   [4] kickoff time    '2026-06-12 03:00:00' (giờ Bắc Kinh, UTC+8)
 *   [5] end time        '1900-01-01 00:00:00' (placeholder nếu chưa đá)
 *   [6] homeTeamId      '214'
 *   [7] awayTeamId      '209'
 *   [8] homeScore       '0'
 *   [9] awayScore       '0'
 *   [10] status         '0' chưa đá / '1' đã đá xong (suy luận)
 *   [11..18] phụ        bao gồm tỉ số hiệp 1, OT/Pen object
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const DIR = __dirname;
const BASE = 'https://txt-api.7m.com.cn/specials/worldcup2026';
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
  'Referer': 'https://www.7m.com.cn/2026worldcup/',
  'Accept': 'application/json,text/plain,*/*',
};

const ENDPOINTS = [
  { name: 'games_zh',      url: `${BASE}/games?lan=1` },
  { name: 'games_en',      url: `${BASE}/games?lan=3` },
  { name: 'games_vi',      url: `${BASE}/games?lan=6` },
  { name: 'standings_zh',  url: `${BASE}/standings?lan=1` },
  { name: 'standings_en',  url: `${BASE}/standings?lan=3` },
  { name: 'live',          url: `${BASE}/live?lan=3` },
];

const STAGE_NAMES = {
  '454644': { en: 'Group Stage',   vi: 'Vòng bảng',     zh: '分组赛' },
  '454645': { en: 'Round of 32',   vi: 'Vòng 1/16',      zh: '三十二强' },
  '454646': { en: 'Round of 16',   vi: 'Vòng 1/8',       zh: '十六强' },
  '454647': { en: 'Quarterfinals', vi: 'Tứ kết',         zh: '半准决赛' },
  '454648': { en: 'Semifinals',    vi: 'Bán kết',        zh: '半决赛' },
  '454649': { en: '3rd Place',     vi: 'Tranh hạng 3',   zh: '季军赛' },
  '454650': { en: 'Final',         vi: 'Chung kết',      zh: '决赛' },
};

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: HEADERS }, (res) => {
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode} ${url}`));
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (c) => (data += c));
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch (e) { reject(e); } });
    }).on('error', reject);
  });
}

async function fetchAll() {
  for (const ep of ENDPOINTS) {
    process.stdout.write(`→ ${ep.name} ... `);
    try {
      const json = await fetchJson(ep.url);
      fs.writeFileSync(path.join(DIR, `${ep.name}.json`), JSON.stringify(json, null, 0));
      console.log(`ok (${json.data ? 'data' : 'no-data'})`);
    } catch (e) { console.log(`FAIL: ${e.message}`); }
  }
}

// Beijing time string "YYYY-MM-DD HH:MM:SS" → ISO UTC + Vietnam time (UTC+7)
function beijingToISO(s) {
  const [d, t] = s.split(' ');
  return `${d}T${t}+08:00`;
}
function beijingToVietnam(s) {
  // Beijing UTC+8 → Vietnam UTC+7 (-1h)
  const utcMs = new Date(beijingToISO(s)).getTime();
  const vn = new Date(utcMs + 7 * 3600 * 1000); // shift để getUTC* trả ra giờ VN
  const pad = (n) => String(n).padStart(2, '0');
  return `${vn.getUTCFullYear()}-${pad(vn.getUTCMonth() + 1)}-${pad(vn.getUTCDate())} ${pad(vn.getUTCHours())}:${pad(vn.getUTCMinutes())}`;
}

function parse() {
  const gZh = JSON.parse(fs.readFileSync(path.join(DIR, 'games_zh.json'), 'utf8'));
  const gEn = JSON.parse(fs.readFileSync(path.join(DIR, 'games_en.json'), 'utf8'));
  const gVi = JSON.parse(fs.readFileSync(path.join(DIR, 'games_vi.json'), 'utf8'));
  const sEn = JSON.parse(fs.readFileSync(path.join(DIR, 'standings_en.json'), 'utf8'));

  const teamsEn = gEn.data.team;
  const teamsZh = gZh.data.team;
  const teamsVi = gVi.data.team;

  // Map teamId → group letter (from standings)
  const teamGroup = {};
  for (const g of sEn.data.groups) {
    for (const row of sEn.data[g]) {
      teamGroup[row[0]] = g;
    }
  }

  // Build teams (chỉ 48 đội thật, lọc placeholder như "C2", "Winner of SF1")
  const realIds = new Set();
  gEn.data.games.forEach((m) => {
    if (m[2]) { // có group letter → vòng bảng → đội thật
      realIds.add(m[6]); realIds.add(m[7]);
    }
  });

  const teams = [...realIds].sort().map((id) => ({
    id,
    name_en: teamsEn[id],
    name_zh: teamsZh[id],
    name_vi: teamsVi[id],
    group: teamGroup[id] || null,
  }));

  // Build matches
  const matches = gEn.data.games.map((m, idx) => {
    const homeId = m[6], awayId = m[7];
    const stageId = m[1];
    const stage = STAGE_NAMES[stageId] || { en: 'Unknown', vi: 'Unknown', zh: 'Unknown' };
    return {
      matchId: m[0],
      stageId,
      stageName: stage,
      group: m[2] || null,
      kickoffBeijing: m[4],
      kickoffISO: beijingToISO(m[4]),
      kickoffVN: beijingToVietnam(m[4]),
      homeTeamId: homeId,
      awayTeamId: awayId,
      home: { name_en: teamsEn[homeId], name_zh: teamsZh[homeId], name_vi: teamsVi[homeId] },
      away: { name_en: teamsEn[awayId], name_zh: teamsZh[awayId], name_vi: teamsVi[awayId] },
      homeScore: parseInt(m[8], 10),
      awayScore: parseInt(m[9], 10),
      finished: m[10] === '1',
    };
  });

  // Build standings (default rank 1)
  const standings = {};
  for (const g of sEn.data.groups) {
    standings[g] = sEn.data[g].map((row) => ({
      teamId: row[0],
      name_en: teamsEn[row[0]] || row[1],
      played: parseInt(row[2], 10),
      win: parseInt(row[3], 10),
      draw: parseInt(row[4], 10),
      loss: parseInt(row[5], 10),
      goalsFor: parseInt(row[6], 10),
      goalsAgainst: parseInt(row[7], 10),
      goalDiff: parseInt(row[8], 10),
      points: row[9],
    }));
  }

  const out = {
    source: '7m.com.cn (https://txt-api.7m.com.cn/specials/worldcup2026)',
    fetchedAt: new Date().toISOString(),
    fetchedAtBeijing: gEn.time,
    apiVersion: gEn.ver,
    stages: STAGE_NAMES,
    teams,
    matches,
    standings,
  };

  fs.writeFileSync(path.join(DIR, 'wc2026_clean.json'), JSON.stringify(out, null, 2));

  const groupMatches = matches.filter((m) => m.group);
  const koMatches = matches.filter((m) => !m.group);
  console.log(`\n✓ Parsed wc2026_clean.json`);
  console.log(`  Teams: ${teams.length} (chia 12 bảng × 4)`);
  console.log(`  Group matches: ${groupMatches.length} / 72`);
  console.log(`  Knockout matches: ${koMatches.length} / 32`);
  console.log(`  First match: ${matches[0].kickoffVN} VN — ${matches[0].home.name_en} vs ${matches[0].away.name_en} (Group ${matches[0].group})`);
}

(async () => {
  const noFetch = process.argv.includes('--no-fetch');
  if (!noFetch) {
    console.log(`Fetching from 7m.com.cn ...`);
    await fetchAll();
  }
  parse();
})().catch((e) => { console.error(e); process.exit(1); });
