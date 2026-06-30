// 104 trận WC2026: 72 group stage + 32 knockout
// match number: chronological theo UTC kickoff
// time field: giờ địa phương (UTC offset)
// time_vn field: giờ Việt Nam (GMT+7) — đã tính sẵn
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));
// Overlay đội thật cho knockout (do scripts/resolve_bracket.js sinh sau khi đủ kết quả). Thiếu file → rỗng.
let RESOLVED_KO = {};
try { RESOLVED_KO = JSON.parse(readFileSync(join(__dir, 'knockout_resolved.json'), 'utf8')).matches || {}; } catch { /* chưa có */ }
// Overlay GIỜ THẬT (UTC) cho knockout (do scripts/sync_ko_schedule.js sinh từ football-data.org). Thiếu → rỗng.
let KO_SCHEDULE = {};
try { KO_SCHEDULE = JSON.parse(readFileSync(join(__dir, 'knockout_schedule.json'), 'utf8')).matches || {}; } catch { /* chưa có */ }
// ISO UTC → giờ Việt Nam (GMT+7)
function vnFromUTC(iso) {
  const t = Date.parse(iso); if (Number.isNaN(t)) return null;
  const vn = new Date(t + 7 * 3600 * 1000);
  const p = n => String(n).padStart(2, '0');
  return { date: `${vn.getUTCFullYear()}-${p(vn.getUTCMonth() + 1)}-${p(vn.getUTCDate())}`, time: `${p(vn.getUTCHours())}:${p(vn.getUTCMinutes())}` };
}

// Convert "HH:MM UTC±X" + date → giờ Việt Nam (GMT+7)
function toVietnamTime(date, time) {
  const m = time.match(/(\d{1,2}):(\d{2})\s+UTC([+-]\d+)/);
  if (!m) return null;
  const hh = parseInt(m[1], 10), mm = parseInt(m[2], 10), off = parseInt(m[3], 10);
  // local = UTC + off → UTC = local - off → VN = UTC + 7
  const utcMin = hh * 60 + mm - off * 60;
  const vnMin = utcMin + 7 * 60;
  const dayShift = Math.floor(vnMin / (24 * 60));
  const totalMin = ((vnMin % (24 * 60)) + 24 * 60) % (24 * 60);
  const vH = Math.floor(totalMin / 60), vM = totalMin % 60;
  // Compute new date
  const dt = new Date(date + 'T00:00:00Z');
  dt.setUTCDate(dt.getUTCDate() + dayShift);
  const pad = (n) => String(n).padStart(2, '0');
  return {
    time: `${pad(vH)}:${pad(vM)}`,
    date: `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`,
  };
}

const GROUP_FIXTURES = [
  { match:  1, stage: "group", group: "A", home: "Mexico",                away: "South Africa",          date: "2026-06-11", time: "13:00 UTC-6", ground: "Mexico City" },
  { match:  2, stage: "group", group: "A", home: "South Korea",           away: "Czech Republic",        date: "2026-06-11", time: "20:00 UTC-6", ground: "Guadalajara (Zapopan)" },
  { match:  3, stage: "group", group: "B", home: "Canada",                away: "Bosnia & Herzegovina",  date: "2026-06-12", time: "15:00 UTC-4", ground: "Toronto" },
  { match:  4, stage: "group", group: "D", home: "United States",         away: "Paraguay",              date: "2026-06-12", time: "18:00 UTC-7", ground: "Los Angeles (Inglewood)" },
  { match:  5, stage: "group", group: "B", home: "Qatar",                 away: "Switzerland",           date: "2026-06-13", time: "12:00 UTC-7", ground: "San Francisco Bay Area (Santa Clara)" },
  { match:  6, stage: "group", group: "C", home: "Brazil",                away: "Morocco",               date: "2026-06-13", time: "18:00 UTC-4", ground: "New York/New Jersey (East Rutherford)" },
  { match:  7, stage: "group", group: "C", home: "Haiti",                 away: "Scotland",              date: "2026-06-13", time: "21:00 UTC-4", ground: "Boston (Foxborough)" },
  { match:  8, stage: "group", group: "D", home: "Australia",             away: "Turkey",                date: "2026-06-13", time: "21:00 UTC-7", ground: "Vancouver" },
  { match:  9, stage: "group", group: "E", home: "Germany",               away: "Curaçao",               date: "2026-06-14", time: "12:00 UTC-5", ground: "Houston" },
  { match: 10, stage: "group", group: "F", home: "Netherlands",           away: "Japan",                 date: "2026-06-14", time: "15:00 UTC-5", ground: "Dallas (Arlington)" },
  { match: 11, stage: "group", group: "E", home: "Ivory Coast",           away: "Ecuador",               date: "2026-06-14", time: "19:00 UTC-4", ground: "Philadelphia" },
  { match: 12, stage: "group", group: "F", home: "Sweden",                away: "Tunisia",               date: "2026-06-14", time: "20:00 UTC-6", ground: "Monterrey (Guadalupe)" },
  { match: 13, stage: "group", group: "H", home: "Spain",                 away: "Cape Verde",            date: "2026-06-15", time: "12:00 UTC-4", ground: "Atlanta" },
  { match: 14, stage: "group", group: "G", home: "Belgium",               away: "Egypt",                 date: "2026-06-15", time: "12:00 UTC-7", ground: "Seattle" },
  { match: 15, stage: "group", group: "H", home: "Saudi Arabia",          away: "Uruguay",               date: "2026-06-15", time: "18:00 UTC-4", ground: "Miami (Miami Gardens)" },
  { match: 16, stage: "group", group: "G", home: "Iran",                  away: "New Zealand",           date: "2026-06-15", time: "18:00 UTC-7", ground: "Los Angeles (Inglewood)" },
  { match: 17, stage: "group", group: "I", home: "France",                away: "Senegal",               date: "2026-06-16", time: "15:00 UTC-4", ground: "New York/New Jersey (East Rutherford)" },
  { match: 18, stage: "group", group: "I", home: "Iraq",                  away: "Norway",                date: "2026-06-16", time: "18:00 UTC-4", ground: "Boston (Foxborough)" },
  { match: 19, stage: "group", group: "J", home: "Argentina",             away: "Algeria",               date: "2026-06-16", time: "20:00 UTC-5", ground: "Kansas City" },
  { match: 20, stage: "group", group: "J", home: "Austria",               away: "Jordan",                date: "2026-06-16", time: "21:00 UTC-7", ground: "San Francisco Bay Area (Santa Clara)" },
  { match: 21, stage: "group", group: "K", home: "Portugal",              away: "DR Congo",              date: "2026-06-17", time: "12:00 UTC-5", ground: "Houston" },
  { match: 22, stage: "group", group: "L", home: "England",               away: "Croatia",               date: "2026-06-17", time: "15:00 UTC-5", ground: "Dallas (Arlington)" },
  { match: 23, stage: "group", group: "L", home: "Ghana",                 away: "Panama",                date: "2026-06-17", time: "19:00 UTC-4", ground: "Toronto" },
  { match: 24, stage: "group", group: "K", home: "Uzbekistan",            away: "Colombia",              date: "2026-06-17", time: "20:00 UTC-6", ground: "Mexico City" },
  { match: 25, stage: "group", group: "A", home: "Czech Republic",        away: "South Africa",          date: "2026-06-18", time: "12:00 UTC-4", ground: "Atlanta" },
  { match: 26, stage: "group", group: "B", home: "Switzerland",           away: "Bosnia & Herzegovina",  date: "2026-06-18", time: "12:00 UTC-7", ground: "Los Angeles (Inglewood)" },
  { match: 27, stage: "group", group: "B", home: "Canada",                away: "Qatar",                 date: "2026-06-18", time: "15:00 UTC-7", ground: "Vancouver" },
  { match: 28, stage: "group", group: "A", home: "Mexico",                away: "South Korea",           date: "2026-06-18", time: "19:00 UTC-6", ground: "Guadalajara (Zapopan)" },
  { match: 29, stage: "group", group: "D", home: "United States",         away: "Australia",             date: "2026-06-19", time: "12:00 UTC-7", ground: "Seattle" },
  { match: 30, stage: "group", group: "C", home: "Scotland",              away: "Morocco",               date: "2026-06-19", time: "18:00 UTC-4", ground: "Boston (Foxborough)" },
  { match: 31, stage: "group", group: "C", home: "Brazil",                away: "Haiti",                 date: "2026-06-19", time: "20:30 UTC-4", ground: "Philadelphia" },
  { match: 32, stage: "group", group: "D", home: "Turkey",                away: "Paraguay",              date: "2026-06-19", time: "20:00 UTC-7", ground: "San Francisco Bay Area (Santa Clara)" },
  { match: 33, stage: "group", group: "F", home: "Netherlands",           away: "Sweden",                date: "2026-06-20", time: "12:00 UTC-5", ground: "Houston" },
  { match: 34, stage: "group", group: "E", home: "Germany",               away: "Ivory Coast",           date: "2026-06-20", time: "16:00 UTC-4", ground: "Toronto" },
  { match: 35, stage: "group", group: "E", home: "Ecuador",               away: "Curaçao",               date: "2026-06-20", time: "19:00 UTC-5", ground: "Kansas City" },
  { match: 36, stage: "group", group: "F", home: "Tunisia",               away: "Japan",                 date: "2026-06-20", time: "22:00 UTC-6", ground: "Monterrey (Guadalupe)" },
  { match: 37, stage: "group", group: "H", home: "Spain",                 away: "Saudi Arabia",          date: "2026-06-21", time: "12:00 UTC-4", ground: "Atlanta" },
  { match: 38, stage: "group", group: "G", home: "Belgium",               away: "Iran",                  date: "2026-06-21", time: "12:00 UTC-7", ground: "Los Angeles (Inglewood)" },
  { match: 39, stage: "group", group: "H", home: "Uruguay",               away: "Cape Verde",            date: "2026-06-21", time: "18:00 UTC-4", ground: "Miami (Miami Gardens)" },
  { match: 40, stage: "group", group: "G", home: "New Zealand",           away: "Egypt",                 date: "2026-06-21", time: "18:00 UTC-7", ground: "Vancouver" },
  { match: 41, stage: "group", group: "J", home: "Argentina",             away: "Austria",               date: "2026-06-22", time: "12:00 UTC-5", ground: "Dallas (Arlington)" },
  { match: 42, stage: "group", group: "I", home: "France",                away: "Iraq",                  date: "2026-06-22", time: "17:00 UTC-4", ground: "Philadelphia" },
  { match: 43, stage: "group", group: "I", home: "Norway",                away: "Senegal",               date: "2026-06-22", time: "20:00 UTC-4", ground: "New York/New Jersey (East Rutherford)" },
  { match: 44, stage: "group", group: "J", home: "Jordan",                away: "Algeria",               date: "2026-06-22", time: "20:00 UTC-7", ground: "San Francisco Bay Area (Santa Clara)" },
  { match: 45, stage: "group", group: "K", home: "Portugal",              away: "Uzbekistan",            date: "2026-06-23", time: "12:00 UTC-5", ground: "Houston" },
  { match: 46, stage: "group", group: "L", home: "England",               away: "Ghana",                 date: "2026-06-23", time: "16:00 UTC-4", ground: "Boston (Foxborough)" },
  { match: 47, stage: "group", group: "L", home: "Panama",                away: "Croatia",               date: "2026-06-23", time: "19:00 UTC-4", ground: "Toronto" },
  { match: 48, stage: "group", group: "K", home: "Colombia",              away: "DR Congo",              date: "2026-06-23", time: "20:00 UTC-6", ground: "Guadalajara (Zapopan)" },
  { match: 49, stage: "group", group: "B", home: "Switzerland",           away: "Canada",                date: "2026-06-24", time: "12:00 UTC-7", ground: "Vancouver" },
  { match: 50, stage: "group", group: "B", home: "Bosnia & Herzegovina",  away: "Qatar",                 date: "2026-06-24", time: "12:00 UTC-7", ground: "Seattle" },
  { match: 51, stage: "group", group: "C", home: "Scotland",              away: "Brazil",                date: "2026-06-24", time: "18:00 UTC-4", ground: "Miami (Miami Gardens)" },
  { match: 52, stage: "group", group: "C", home: "Morocco",               away: "Haiti",                 date: "2026-06-24", time: "18:00 UTC-4", ground: "Atlanta" },
  { match: 53, stage: "group", group: "A", home: "Czech Republic",        away: "Mexico",                date: "2026-06-24", time: "19:00 UTC-6", ground: "Mexico City" },
  { match: 54, stage: "group", group: "A", home: "South Africa",          away: "South Korea",           date: "2026-06-24", time: "19:00 UTC-6", ground: "Monterrey (Guadalupe)" },
  { match: 55, stage: "group", group: "E", home: "Curaçao",               away: "Ivory Coast",           date: "2026-06-25", time: "16:00 UTC-4", ground: "Philadelphia" },
  { match: 56, stage: "group", group: "E", home: "Ecuador",               away: "Germany",               date: "2026-06-25", time: "16:00 UTC-4", ground: "New York/New Jersey (East Rutherford)" },
  { match: 57, stage: "group", group: "F", home: "Japan",                 away: "Sweden",                date: "2026-06-25", time: "18:00 UTC-5", ground: "Dallas (Arlington)" },
  { match: 58, stage: "group", group: "F", home: "Tunisia",               away: "Netherlands",           date: "2026-06-25", time: "18:00 UTC-5", ground: "Kansas City" },
  { match: 59, stage: "group", group: "D", home: "Turkey",                away: "United States",         date: "2026-06-25", time: "19:00 UTC-7", ground: "Los Angeles (Inglewood)" },
  { match: 60, stage: "group", group: "D", home: "Paraguay",              away: "Australia",             date: "2026-06-25", time: "19:00 UTC-7", ground: "San Francisco Bay Area (Santa Clara)" },
  { match: 61, stage: "group", group: "I", home: "Norway",                away: "France",                date: "2026-06-26", time: "15:00 UTC-4", ground: "Boston (Foxborough)" },
  { match: 62, stage: "group", group: "I", home: "Senegal",               away: "Iraq",                  date: "2026-06-26", time: "15:00 UTC-4", ground: "Toronto" },
  { match: 63, stage: "group", group: "H", home: "Cape Verde",            away: "Saudi Arabia",          date: "2026-06-26", time: "19:00 UTC-5", ground: "Houston" },
  { match: 64, stage: "group", group: "H", home: "Uruguay",               away: "Spain",                 date: "2026-06-26", time: "18:00 UTC-6", ground: "Guadalajara (Zapopan)" },
  { match: 65, stage: "group", group: "G", home: "Egypt",                 away: "Iran",                  date: "2026-06-26", time: "20:00 UTC-7", ground: "Seattle" },
  { match: 66, stage: "group", group: "G", home: "New Zealand",           away: "Belgium",               date: "2026-06-26", time: "20:00 UTC-7", ground: "Vancouver" },
  { match: 67, stage: "group", group: "L", home: "Panama",                away: "England",               date: "2026-06-27", time: "17:00 UTC-4", ground: "New York/New Jersey (East Rutherford)" },
  { match: 68, stage: "group", group: "L", home: "Croatia",               away: "Ghana",                 date: "2026-06-27", time: "17:00 UTC-4", ground: "Philadelphia" },
  { match: 69, stage: "group", group: "K", home: "Colombia",              away: "Portugal",              date: "2026-06-27", time: "19:30 UTC-4", ground: "Miami (Miami Gardens)" },
  { match: 70, stage: "group", group: "K", home: "DR Congo",              away: "Uzbekistan",            date: "2026-06-27", time: "19:30 UTC-4", ground: "Atlanta" },
  { match: 71, stage: "group", group: "J", home: "Algeria",               away: "Austria",               date: "2026-06-27", time: "21:00 UTC-5", ground: "Kansas City" },
  { match: 72, stage: "group", group: "J", home: "Jordan",                away: "Argentina",             date: "2026-06-27", time: "21:00 UTC-5", ground: "Dallas (Arlington)" }
];

// Knockout fixtures — teams chưa xác định, dùng placeholder slot
// Round of 32 (16 trận): 29/6 → 3/7
// Round of 16 (8 trận): 4/7 → 7/7
// Quarterfinals (4 trận): 9/7 → 11/7
// Semifinals (2 trận): 14/7 → 15/7
// 3rd place (1 trận): 18/7
// Final (1 trận): 19/7
// ⚠️ Bracket chuẩn FIFA 2026 (đối chiếu Wikipedia "2026 FIFA World Cup knockout stage", 24/06/2026).
// Suất hạng 3 ghi dạng "3rd(A/B/C/D/F)" = đội hạng 3 đến từ MỘT trong các bảng đó (phân bổ theo Annex C).
// Ngày/giờ/sân giữ theo số trận của bản cũ — CHƯA đối chiếu lại từng trận với lịch chính thức.
const KO_FIXTURES = [
  { match: 73, stage: "R32",  home_slot: "2A", away_slot: "2B",      date: "2026-06-29", time: "12:00 UTC-4", ground: "Philadelphia" },
  { match: 74, stage: "R32",  home_slot: "1E", away_slot: "3rd(A/B/C/D/F)", date: "2026-06-29", time: "15:00 UTC-7", ground: "Los Angeles (Inglewood)" },
  { match: 75, stage: "R32",  home_slot: "1F", away_slot: "2C",      date: "2026-06-30", time: "12:00 UTC-7", ground: "Seattle" },
  { match: 76, stage: "R32",  home_slot: "1C", away_slot: "2F",      date: "2026-06-30", time: "15:00 UTC-7", ground: "Vancouver" },
  { match: 77, stage: "R32",  home_slot: "1I", away_slot: "3rd(C/D/F/G/H)", date: "2026-06-30", time: "18:00 UTC-5", ground: "Dallas (Arlington)" },
  { match: 78, stage: "R32",  home_slot: "2E", away_slot: "2I",      date: "2026-06-30", time: "21:00 UTC-7", ground: "San Francisco Bay Area (Santa Clara)" },
  { match: 79, stage: "R32",  home_slot: "1A", away_slot: "3rd(C/E/F/H/I)", date: "2026-07-01", time: "12:00 UTC-7", ground: "Seattle" },
  { match: 80, stage: "R32",  home_slot: "1L", away_slot: "3rd(E/H/I/J/K)", date: "2026-07-01", time: "15:00 UTC-4", ground: "Atlanta" },
  { match: 81, stage: "R32",  home_slot: "1D", away_slot: "3rd(B/E/F/I/J)", date: "2026-07-02", time: "12:00 UTC-4", ground: "Toronto" },
  { match: 82, stage: "R32",  home_slot: "1G", away_slot: "3rd(A/E/H/I/J)", date: "2026-07-02", time: "15:00 UTC-5", ground: "Houston" },
  { match: 83, stage: "R32",  home_slot: "2K", away_slot: "2L",      date: "2026-07-02", time: "18:00 UTC-4", ground: "Boston (Foxborough)" },
  { match: 84, stage: "R32",  home_slot: "1H", away_slot: "2J",      date: "2026-07-02", time: "21:00 UTC-4", ground: "Miami (Miami Gardens)" },
  { match: 85, stage: "R32",  home_slot: "1B", away_slot: "3rd(E/F/G/I/J)", date: "2026-07-03", time: "12:00 UTC-4", ground: "Philadelphia" },
  { match: 86, stage: "R32",  home_slot: "1J", away_slot: "2H",      date: "2026-07-03", time: "15:00 UTC-7", ground: "Los Angeles (Inglewood)" },
  { match: 87, stage: "R32",  home_slot: "1K", away_slot: "3rd(D/E/I/J/L)", date: "2026-07-03", time: "18:00 UTC-5", ground: "Kansas City" },
  { match: 88, stage: "R32",  home_slot: "2D", away_slot: "2G",      date: "2026-07-03", time: "21:00 UTC-6", ground: "Mexico City" },
  { match: 89, stage: "R16",  home_slot: "W74", away_slot: "W77",    date: "2026-07-04", time: "12:00 UTC-7", ground: "Los Angeles (Inglewood)" },
  { match: 90, stage: "R16",  home_slot: "W73", away_slot: "W75",    date: "2026-07-04", time: "15:00 UTC-7", ground: "Vancouver" },
  { match: 91, stage: "R16",  home_slot: "W76", away_slot: "W78",    date: "2026-07-05", time: "12:00 UTC-5", ground: "Houston" },
  { match: 92, stage: "R16",  home_slot: "W79", away_slot: "W80",    date: "2026-07-05", time: "15:00 UTC-4", ground: "Atlanta" },
  { match: 93, stage: "R16",  home_slot: "W83", away_slot: "W84",    date: "2026-07-06", time: "12:00 UTC-4", ground: "Boston (Foxborough)" },
  { match: 94, stage: "R16",  home_slot: "W81", away_slot: "W82",    date: "2026-07-06", time: "15:00 UTC-4", ground: "Miami (Miami Gardens)" },
  { match: 95, stage: "R16",  home_slot: "W86", away_slot: "W88",    date: "2026-07-07", time: "12:00 UTC-4", ground: "Philadelphia" },
  { match: 96, stage: "R16",  home_slot: "W85", away_slot: "W87",    date: "2026-07-07", time: "15:00 UTC-5", ground: "Dallas (Arlington)" },
  { match: 97, stage: "QF",   home_slot: "W89", away_slot: "W90",    date: "2026-07-09", time: "15:00 UTC-7", ground: "Los Angeles (Inglewood)" },
  { match: 98, stage: "QF",   home_slot: "W93", away_slot: "W94",    date: "2026-07-10", time: "15:00 UTC-5", ground: "Kansas City" },
  { match: 99, stage: "QF",   home_slot: "W91", away_slot: "W92",    date: "2026-07-10", time: "20:00 UTC-4", ground: "Miami (Miami Gardens)" },
  { match: 100, stage: "QF",  home_slot: "W95", away_slot: "W96",    date: "2026-07-11", time: "15:00 UTC-4", ground: "Boston (Foxborough)" },
  { match: 101, stage: "SF",  home_slot: "W97", away_slot: "W98",    date: "2026-07-14", time: "15:00 UTC-5", ground: "Dallas (Arlington)" },
  { match: 102, stage: "SF",  home_slot: "W99", away_slot: "W100",   date: "2026-07-15", time: "15:00 UTC-4", ground: "Atlanta" },
  { match: 103, stage: "3rd", home_slot: "L101", away_slot: "L102",  date: "2026-07-18", time: "15:00 UTC-4", ground: "Miami (Miami Gardens)" },
  { match: 104, stage: "Final", home_slot: "W101", away_slot: "W102", date: "2026-07-19", time: "15:00 UTC-4", ground: "New York/New Jersey (East Rutherford)" }
];

// Combine + augment với time_vn
export const FIXTURES_2026 = [...GROUP_FIXTURES, ...KO_FIXTURES].map((f) => {
  // Giờ VN: ưu tiên UTC thật (knockout_schedule), nếu không có thì tính từ giờ local hardcode.
  const vn = (KO_SCHEDULE[f.match] && vnFromUTC(KO_SCHEDULE[f.match])) || toVietnamTime(f.date, f.time);
  const r = RESOLVED_KO[f.match];
  const resolved = !!(r && r.home && r.away);
  return {
    ...f,
    home: (resolved ? r.home : f.home) || f.home_slot,
    away: (resolved ? r.away : f.away) || f.away_slot,
    resolved,                              // KO đã biết đội thật?
    is_placeholder: !!f.home_slot && !resolved,
    utc: KO_SCHEDULE[f.match] || null,     // giờ thật UTC (nếu đã sync)
    time_vn: vn?.time,
    date_vn: vn?.date,
  };
});

export const STAGE_NAMES = {
  group: "Vòng bảng",
  R32:   "Vòng 1/16",
  R16:   "Vòng 1/8",
  QF:    "Tứ kết",
  SF:    "Bán kết",
  "3rd": "Tranh hạng 3",
  Final: "Chung kết",
};
