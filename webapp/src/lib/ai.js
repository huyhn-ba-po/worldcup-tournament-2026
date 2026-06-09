// Gemini AI proxy (server-side, key in .env to keep secret)
import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';

const apiKey = process.env.GEMINI_API_KEY;
let client = null;
if (apiKey) client = new GoogleGenAI({ apiKey });

export const aiAvailable = () => !!apiKey;

export async function generatePrediction(prompt) {
  if (!client) throw new Error('GEMINI_API_KEY not set in .env');
  const result = await client.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });
  const text = result?.text || result?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return text;
}

export function tryParseJSON(text) {
  if (!text) return null;
  // Strip ```json fences
  let cleaned = text.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();
  // Find first { and last }
  const first = cleaned.indexOf('{');
  const last = cleaned.lastIndexOf('}');
  if (first === -1 || last === -1) return null;
  cleaned = cleaned.slice(first, last + 1);
  try { return JSON.parse(cleaned); } catch { return null; }
}

function formatKeyPlayers(squad, teamName) {
  if (!squad || squad.error || !squad.key_players?.length) return null;
  const lines = squad.key_players.slice(0, 5).map(p => {
    const club = p.club ? ` (${p.club})` : '';
    const caps = p.caps ? `, ${p.caps} caps` : '';
    const goals = p.goals ? `, ${p.goals} bàn` : '';
    return `  · ${p.name}${club} — ${p.pos_vi || p.pos}${caps}${goals}`;
  });
  return lines.join('\n');
}

export function buildPredictionPrompt(fixture, h2h, recentA, recentB, stats, ctx, squadA, squadB, env, current) {
  const { home: teamA, away: teamB, group, match, ground, date, time } = fixture;
  const lines = [];
  lines.push(`Bạn là chuyên gia phân tích bóng đá, đang dự đoán một trận đấu tại FIFA World Cup 2026.`);
  lines.push(``);
  lines.push(`TRẬN: ${teamA} ${ctx.flagA} vs ${teamB} ${ctx.flagB}`);
  lines.push(`Bảng ${group} · Match #${match} · ${ground} · ${date} ${time}`);
  lines.push(``);
  lines.push(`=== 🔬 STATS BASELINE (anchor, backtest WC2018+2022 = 55.5% acc) ===`);
  lines.push(`Adjust ±15% từ baseline. Beyond ±15% phải cite reason rõ ràng (max ±25%).`);
  lines.push(``);
  lines.push(`▸ Xác suất aggregate: ${teamA} ${stats.prob_a}% / Hòa ${stats.prob_d}% / ${teamB} ${stats.prob_b}%`);
  lines.push(`▸ Tỉ số kỳ vọng (Poisson): ${teamA} ${stats.expected_score.a} - ${stats.expected_score.b} ${teamB}`);
  lines.push(`▸ Top 3 tỉ số: ${stats.top_scores.slice(0, 3).map(s => `${s.score} (${s.prob}%)`).join(', ')}`);
  lines.push(`▸ Elo: ${teamA} ${stats.breakdown.elo.rA} (host ${stats.breakdown.elo.host_boost >= 0 ? '+' : ''}${stats.breakdown.elo.host_boost}) vs ${teamB} ${stats.breakdown.elo.rB}`);
  lines.push(`▸ Conf×Stage matrix (${stats.breakdown.conf.key}, n=${stats.breakdown.conf.n}): ${stats.breakdown.conf.p.a}/${stats.breakdown.conf.p.d}/${stats.breakdown.conf.p.b}`);
  lines.push(`▸ WCOI: ${teamA}=${stats.breakdown.wcoi.wcoi_a > 0 ? '+' : ''}${stats.breakdown.wcoi.wcoi_a}, ${teamB}=${stats.breakdown.wcoi.wcoi_b > 0 ? '+' : ''}${stats.breakdown.wcoi.wcoi_b}`);
  lines.push(``);
  lines.push(`=== 🧮 ĐỐI ĐẦU LỊCH SỬ (lifetime) ===`);
  lines.push(`${h2h.total} trận · ${teamA} ${h2h.a_wins} W / ${h2h.draws} D / ${h2h.b_wins} ${teamB} W · Tổng bàn ${h2h.a_goals} - ${h2h.b_goals}`);
  if (h2h.last_meeting) {
    const lm = h2h.last_meeting;
    lines.push(`Gặp gần nhất: ${lm.year} ${lm.home} ${lm.score_home}-${lm.score_away} ${lm.away} (${lm.tournament})`);
  } else lines.push(`Chưa từng gặp`);
  lines.push(``);
  lines.push(`=== 🔥 PHONG ĐỘ GẦN NHẤT (last 10 trận quốc tế 2020+) ===`);
  lines.push(`${teamA}: ${recentA.wins}W-${recentA.draws}D-${recentA.losses}L, win rate ${Math.round(recentA.win_rate * 100)}%`);
  lines.push(`${teamB}: ${recentB.wins}W-${recentB.draws}D-${recentB.losses}L, win rate ${Math.round(recentB.win_rate * 100)}%`);
  lines.push(``);

  // === Key players (NEW) ===
  const kpA = formatKeyPlayers(squadA, teamA);
  const kpB = formatKeyPlayers(squadB, teamB);
  if (kpA || kpB) {
    lines.push(`=== ⭐ CẦU THỦ CHỦ CHỐT (top 5 theo caps + goals, từ Wikipedia) ===`);
    if (kpA) { lines.push(`${teamA}:`); lines.push(kpA); }
    if (kpB) { lines.push(`${teamB}:`); lines.push(kpB); }
    lines.push(``);
  }

  // === Môi trường thi đấu (NEW) ===
  if (env && env.available) {
    lines.push(`=== 🌡️ ĐIỀU KIỆN THI ĐẤU (${env.city} · ${env.daypart}) ===`);
    lines.push(`Nhiệt độ cảm nhận lúc đá ~${env.temp_felt_c}°C · độ ẩm ${env.humidity}% · heat-stress: ${env.heat_stress} · độ cao ${env.altitude_m}m (${env.altitude_level})`);
    for (const n of env.notes) lines.push(`• ${n}`);
    lines.push(``);
  }

  // === Tình hình hiện tại (NEW) ===
  if (current && (current.a || current.b)) {
    lines.push(`=== 📰 TÌNH HÌNH HIỆN TẠI (cập nhật ${current.as_of || 'gần giải'}) ===`);
    if (current.a) lines.push(`${teamA}: ${current.a}`);
    if (current.b) lines.push(`${teamB}: ${current.b}`);
    lines.push(``);
  }

  lines.push(`=== NHIỆM VỤ ===`);
  lines.push(`1. Anchor từ stats baseline. Adjust ±15% nếu có lý do qualitative (điều kiện sân bãi/nhiệt độ/độ cao, chấn thương, suspension, motivation, tactical, form 2025-2026).`);
  lines.push(`2. Đưa ra xác suất 3 kết quả (cộng = 100).`);
  lines.push(`3. Tỉ số: chọn từ top 3 Poisson hoặc liền kề.`);
  lines.push(`4. Nêu 3 yếu tố then chốt.`);
  lines.push(`5. 3 đoạn phân tích NGẮN tiếng Việt (giọng báo chí, 2-3 câu/đoạn).`);
  lines.push(``);
  lines.push(`Trả về DUY NHẤT JSON, không markdown:`);
  lines.push(`{`);
  lines.push(`  "prob_a": <int 0-100>, "prob_draw": <int 0-100>, "prob_b": <int 0-100>,`);
  lines.push(`  "score_a": <int 0-7>, "score_b": <int 0-7>,`);
  lines.push(`  "winner": "${teamA}" | "${teamB}" | "Hòa",`);
  lines.push(`  "confidence": <int 0-100>,`);
  lines.push(`  "key_factors": ["yếu tố 1", "yếu tố 2", "yếu tố 3"],`);
  lines.push(`  "analysis_form": "<đoạn 1: phong độ 2024-2026>",`);
  lines.push(`  "analysis_history": "<đoạn 2: lịch sử + WCOI>",`);
  lines.push(`  "analysis_prediction": "<đoạn 3: dự đoán + lý do sai khác stats>"`);
  lines.push(`}`);
  return lines.join('\n');
}
