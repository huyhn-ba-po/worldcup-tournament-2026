// Tính lượt đấu (matchday) vòng bảng + trạng thái KHÓA dự đoán.
// Quy tắc: lượt N bị khóa cho tới khi lượt N-1 (cùng bảng) đá xong hết.
// → lượt 1 luôn mở; lượt 2 mở khi lượt 1 xong; lượt 3 mở khi lượt 2 xong.
import { FIXTURES_2026, getResults } from './dataLoader.js';

const groupFix = {};
for (const f of FIXTURES_2026.filter(x => x.stage === 'group')) (groupFix[f.group] = groupFix[f.group] || []).push(f);

const MATCHDAY = {}; // matchId -> 1|2|3
for (const g of Object.keys(groupFix)) {
  const ms = groupFix[g].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time) || a.match - b.match);
  ms.forEach((m, i) => { MATCHDAY[m.match] = Math.floor(i / 2) + 1; });
}

export function matchdayOf(matchId) { return MATCHDAY[matchId] || null; }

export function isLocked(fixture) {
  if (!fixture || fixture.stage !== 'group') return false; // chỉ khóa theo lượt ở vòng bảng
  const md = MATCHDAY[fixture.match];
  if (!md || md <= 1) return false;
  const res = getResults().results || {};
  const prev = groupFix[fixture.group].filter(m => MATCHDAY[m.match] === md - 1);
  const allPrevDone = prev.length > 0 && prev.every(m => res[m.match]);
  return !allPrevDone; // chưa đá xong lượt trước → khóa
}
