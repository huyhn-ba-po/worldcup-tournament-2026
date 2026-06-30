// Đồng bộ GIỜ THẬT (UTC) các trận knockout từ football-data.org vào src/data/knockout_schedule.json.
// Map theo cặp đội đã biết (R32 + các trận R16 đã lộ đội). Trận chưa biết đội → bỏ qua (sync lại sau).
// fixtures.js sẽ tính lại giờ VN từ UTC này, thay cho giờ hardcode (vốn xấp xỉ).
// Cần FOOTBALL_DATA_API_KEY trong .env. Chạy: node scripts/sync_ko_schedule.js
import 'dotenv/config';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { FIXTURES_2026, TEAMS_META } from '../src/lib/dataLoader.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const KEY = process.env.FOOTBALL_DATA_API_KEY;
const COMP = process.env.FOOTBALL_DATA_COMP || 'WC';
if (!KEY) { console.error('❌ Thiếu FOOTBALL_DATA_API_KEY trong .env'); process.exit(1); }

const norm = s => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/&/g, 'and').replace(/[^a-z]/g, '');
const ALIAS = {
  korearepublic: 'South Korea', iriran: 'Iran', usa: 'United States', unitedstatesofamerica: 'United States',
  cotedivoire: 'Ivory Coast', czechia: 'Czech Republic', caboverde: 'Cape Verde', capeverdeislands: 'Cape Verde',
  drcongo: 'DR Congo', democraticrepublicofthecongo: 'DR Congo', congodr: 'DR Congo', curacao: 'Curaçao',
  bosniaandherzegovina: 'Bosnia & Herzegovina', bosniaherzegovina: 'Bosnia & Herzegovina', turkiye: 'Turkey',
};
const normToOur = {};
for (const t of Object.keys(TEAMS_META.team_meta)) normToOur[norm(t)] = t;
for (const [k, v] of Object.entries(ALIAS)) normToOur[k] = v;
const resolve = n => normToOur[norm(n)] || null;

const KO_STAGES = ['LAST_32', 'LAST_16', 'QUARTER_FINALS', 'SEMI_FINALS', 'THIRD_PLACE', 'FINAL'];
const ko = FIXTURES_2026.filter(f => f.stage !== 'group');
// lookup theo cặp đội (chỉ trận đã resolve đủ 2 đội thật) + theo từng đội (cho trận lộ 1 đội)
const byPair = {}, byTeamHome = {}, byTeamAway = {};
for (const f of ko) {
  if (f.is_placeholder) continue;
  byPair[`${norm(f.home)}|${norm(f.away)}`] = f.match;
  byTeamHome[norm(f.home)] = f.match; byTeamAway[norm(f.away)] = f.match;
}

const url = `https://api.football-data.org/v4/competitions/${COMP}/matches`;
const res = await fetch(url, { headers: { 'X-Auth-Token': KEY } });
if (!res.ok) { console.error('❌ API lỗi', res.status); process.exit(1); }
const data = await res.json();
const apiKO = (data.matches || []).filter(m => KO_STAGES.includes(m.stage));

const schedule = {};
let mapped = 0, skipped = 0;
for (const m of apiKO) {
  const h = resolve(m.homeTeam?.name), a = resolve(m.awayTeam?.name);
  let id = null;
  if (h && a) id = byPair[`${norm(h)}|${norm(a)}`];
  if (!id && h) id = byTeamHome[norm(h)];       // lộ đội nhà
  if (!id && a) id = byTeamAway[norm(a)];       // lộ đội khách
  if (id && m.utcDate) { schedule[id] = m.utcDate; mapped++; } else skipped++;
}

const out = { synced_at_note: 'giờ UTC thật từ football-data.org', matches: schedule };
writeFileSync(join(__dirname, '..', 'src', 'data', 'knockout_schedule.json'), JSON.stringify(out, null, 2), 'utf8');
console.log(`✅ Map ${mapped} trận KO có giờ thật, bỏ qua ${skipped} (chưa lộ đội).`);
console.log('   Match đã có giờ:', Object.keys(schedule).sort((a, b) => a - b).map(x => '#' + x).join(' '));
