// Tự lấy tỉ số trận ĐÃ ĐÁ XONG từ football-data.org → ghi vào src/data/results.json.
// Cần FOOTBALL_DATA_API_KEY trong webapp/.env (đăng ký free: https://www.football-data.org/client/register)
// Chạy: node scripts/fetch_results.js   (có thể đặt lịch chạy định kỳ khi giải diễn ra)
import 'dotenv/config';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { FIXTURES_2026, TEAMS_META } from '../src/lib/dataLoader.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RESULTS_PATH = join(__dirname, '..', 'src', 'data', 'results.json');

const KEY = process.env.FOOTBALL_DATA_API_KEY;
const COMP = process.env.FOOTBALL_DATA_COMP || 'WC'; // mã giải World Cup tại football-data.org
if (!KEY) {
  console.error('❌ Thiếu FOOTBALL_DATA_API_KEY trong webapp/.env');
  console.error('   Đăng ký free tại https://www.football-data.org/client/register rồi thêm:');
  console.error('   FOOTBALL_DATA_API_KEY=xxxxxxxx');
  process.exit(1);
}

// Chuẩn hoá tên đội để so khớp (bỏ dấu, ký tự lạ, từ thừa)
function norm(s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/&/g, 'and').replace(/[^a-z]/g, '');
}
// Tên football-data (đã norm) → tên đội trong fixtures của ta
const ALIAS = {
  korearepublic: 'South Korea', southkorea: 'South Korea',
  iriran: 'Iran', iran: 'Iran',
  usa: 'United States', unitedstates: 'United States', unitedstatesofamerica: 'United States',
  cotedivoire: 'Ivory Coast', ivorycoast: 'Ivory Coast',
  czechia: 'Czech Republic', czechrepublic: 'Czech Republic',
  caboverde: 'Cape Verde', capeverde: 'Cape Verde', capeverdeislands: 'Cape Verde',
  drcongo: 'DR Congo', democraticrepublicofthecongo: 'DR Congo', congodr: 'DR Congo',
  curacao: 'Curaçao',
  bosniaandherzegovina: 'Bosnia & Herzegovina', bosniaherzegovina: 'Bosnia & Herzegovina',
  turkiye: 'Turkey', turkey: 'Turkey',
};

const ourTeams = Object.keys(TEAMS_META.team_meta);
const normToOur = {};
for (const t of ourTeams) normToOur[norm(t)] = t;
for (const [k, v] of Object.entries(ALIAS)) normToOur[k] = v;
const resolve = (fdName) => normToOur[norm(fdName)] || null;

// fixture lookup theo cặp (home|away) — chỉ vòng bảng (knockout đội TBD)
const fixByPair = {};
for (const f of FIXTURES_2026) {
  if (f.is_placeholder) continue;
  fixByPair[`${norm(f.home)}|${norm(f.away)}`] = f.match;
}

async function main() {
  const url = `https://api.football-data.org/v4/competitions/${COMP}/matches`;
  let res;
  try {
    res = await fetch(url, { headers: { 'X-Auth-Token': KEY } });
  } catch (e) {
    console.error('❌ Lỗi kết nối:', e.message); process.exit(1);
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error(`❌ API trả ${res.status}. ${res.status === 403 ? 'World Cup có thể không nằm trong gói free — cần nâng cấp.' : ''}`);
    console.error('   ', body.slice(0, 200));
    process.exit(1);
  }
  const data = await res.json();
  const matches = data.matches || [];
  console.log(`[api] Nhận ${matches.length} trận từ football-data.org (${COMP})`);

  // Giữ lại results cũ (vd knockout nhập tay), ghi đè bằng dữ liệu API
  let existing = { results: {} };
  try { existing = JSON.parse(readFileSync(RESULTS_PATH, 'utf8')); } catch {}
  const results = { ...(existing.results || {}) };

  let matched = 0; const unmatched = [];
  for (const m of matches) {
    if (m.status !== 'FINISHED') continue;
    const h = resolve(m.homeTeam?.name || m.homeTeam?.shortName);
    const a = resolve(m.awayTeam?.name || m.awayTeam?.shortName);
    const ft = m.score?.fullTime;
    if (!h || !a || ft?.home == null || ft?.away == null) {
      unmatched.push(`${m.homeTeam?.name} vs ${m.awayTeam?.name}`);
      continue;
    }
    const id = fixByPair[`${norm(h)}|${norm(a)}`] || fixByPair[`${norm(a)}|${norm(h)}`];
    if (!id) { unmatched.push(`${h} vs ${a} (không khớp fixture)`); continue; }
    // nếu khớp đảo chiều, đảo tỉ số cho đúng home/away của ta
    const swapped = !fixByPair[`${norm(h)}|${norm(a)}`];
    results[id] = swapped ? { home: ft.away, away: ft.home } : { home: ft.home, away: ft.away };
    matched++;
  }

  const out = {
    note: `Tỉ số THỰC TẾ tự lấy từ football-data.org (cập nhật ${new Date().toISOString()}). Chạy lại: node scripts/fetch_results.js`,
    results,
  };
  writeFileSync(RESULTS_PATH, JSON.stringify(out, null, 2), 'utf8');
  console.log(`✅ Đã ghi ${matched} trận có tỉ số vào results.json (tổng ${Object.keys(results).length} trận).`);
  if (unmatched.length) console.log(`⚠️  ${unmatched.length} trận chưa khớp: ${unmatched.slice(0, 8).join(', ')}${unmatched.length > 8 ? '...' : ''}`);
}
main();
