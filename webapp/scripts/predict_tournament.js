// Dự đoán giải đấu dựa trên số liệu: bảng xếp hạng vòng bảng (điểm kỳ vọng),
// đội hạng 3 tốt nhất, ứng viên vô địch (Elo), vua phá lưới (squads).
import { TEAMS_META, FIXTURES_2026, SQUADS, ELO, OVERLAY } from '../src/lib/dataLoader.js';
import { computeStatsBaseline } from '../src/lib/stats.js';

const meta = TEAMS_META.team_meta;
const groups = TEAMS_META.groups; // { A: [team,...], ... }
const vi = (t) => meta[t]?.name_vi || t;

// ===== 1) Điểm kỳ vọng vòng bảng =====
const groupFix = FIXTURES_2026.filter(f => f.stage === 'group' && !f.is_placeholder);
const pts = {};   // team -> {pts, gd}
for (const f of groupFix) {
  const s = computeStatsBaseline(f.home, f.away, 'group', f);
  const pa = s.prob_a / 100, pd = s.prob_d / 100, pb = s.prob_b / 100;
  pts[f.home] = pts[f.home] || { pts: 0, gd: 0 };
  pts[f.away] = pts[f.away] || { pts: 0, gd: 0 };
  pts[f.home].pts += 3 * pa + pd;
  pts[f.away].pts += 3 * pb + pd;
  const eg = s.expected_score;
  pts[f.home].gd += (eg.a - eg.b);
  pts[f.away].gd += (eg.b - eg.a);
}

const standings = {};
const thirds = [];
for (const [g, teams] of Object.entries(groups)) {
  const ranked = teams.map(t => ({ t, ...(pts[t] || { pts: 0, gd: 0 }) }))
    .sort((x, y) => y.pts - x.pts || y.gd - x.gd);
  standings[g] = ranked;
  if (ranked[2]) thirds.push({ g, ...ranked[2] });
}
thirds.sort((a, b) => b.pts - a.pts || b.gd - a.gd);

console.log('========== 1) VÒNG BẢNG — điểm kỳ vọng ==========');
for (const [g, ranked] of Object.entries(standings)) {
  console.log(`\nBẢNG ${g}:`);
  ranked.forEach((r, i) => {
    const mark = i < 2 ? '✅' : (i === 2 ? '🟡' : '  ');
    console.log(`  ${mark} ${i + 1}. ${vi(r.t).padEnd(14)} ${r.pts.toFixed(2)} đ  (HS ${r.gd >= 0 ? '+' : ''}${r.gd.toFixed(1)})`);
  });
}
console.log('\n--- 12 đội hạng 3, 8 đội tốt nhất đi tiếp ---');
thirds.forEach((r, i) => console.log(`  ${i < 8 ? '✅' : '❌'} ${vi(r.t).padEnd(14)} (bảng ${r.g}) ${r.pts.toFixed(2)} đ`));

// ===== 2) Ứng viên vô địch (Elo + host + WCOI) =====
console.log('\n========== 2) ỨNG VIÊN VÔ ĐỊCH (Elo điều chỉnh) ==========');
const elo = ELO.wc2026 || ELO;
const wcoi = OVERLAY.wcoi?.per_team || {};
const contenders = Object.keys(meta).map(t => {
  const base = (elo[t]?.rating ?? elo[t] ?? 1500);
  const host = meta[t]?.host ? 60 : 0;
  const w = (wcoi[t]?.wcoi || 0) * 100; // WCOI nhỏ, nhân lên
  return { t, score: base + host + w, elo: Math.round(base) };
}).sort((a, b) => b.score - a.score);
contenders.slice(0, 12).forEach((c, i) => console.log(`  ${i + 1}. ${vi(c.t).padEnd(14)} Elo ${c.elo}  điểm ${c.score.toFixed(0)}`));

// ===== 3) Vua phá lưới (forwards theo goals + sức mạnh đội) =====
console.log('\n========== 3) ỨNG VIÊN VUA PHÁ LƯỚI ==========');
const scorers = [];
for (const [team, data] of Object.entries(SQUADS.teams)) {
  if (data.error || !data.by_position) continue;
  const atk = [...(data.by_position.forwards || []), ...(data.by_position.midfielders || [])];
  const teamElo = (elo[team]?.rating ?? elo[team] ?? 1500);
  for (const p of atk) {
    if (!p.goals || !p.caps) continue;
    const rate = p.goals / p.caps; // bàn/trận
    if (rate < 0.25 || p.goals < 15) continue;
    // điểm = tỉ lệ ghi bàn × sức mạnh đội (đội mạnh đá nhiều trận hơn)
    const score = rate * (teamElo / 1800);
    scorers.push({ name: p.name, team, vi: vi(team), goals: p.goals, caps: p.caps, rate, score });
  }
}
scorers.sort((a, b) => b.score - a.score);
scorers.slice(0, 15).forEach((s, i) => console.log(`  ${i + 1}. ${s.name.padEnd(20)} (${s.vi}) ${s.goals}b/${s.caps}c = ${s.rate.toFixed(2)} b/trận`));
