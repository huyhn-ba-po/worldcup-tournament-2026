// API routes
import { TEAMS_META, BACKTEST, OVERLAY, POISSON, ELO, ALL_INT, WC_MATCHES, FIXTURES_2026, SQUADS, PREDICTIONS, getResults } from '../lib/dataLoader.js';
import { STAGE_NAMES } from '../data/fixtures.js';
import { computeStatsBaseline, getTeamCard, getEloLeaderboard } from '../lib/stats.js';
import { getH2H, getRecentForm, getTeamWCHistory, searchMatches } from '../lib/h2h.js';
import { computeMatchEnv } from '../lib/context.js';
import { simulatePrediction } from '../lib/simulate.js';
import { matchdayOf, isLocked } from '../lib/rounds.js';
import { aiAvailable, generatePrediction, tryParseJSON, buildPredictionPrompt } from '../lib/ai.js';
import { LRUCache } from 'lru-cache';

const predictionCache = new LRUCache({ max: 200, ttl: 1000 * 60 * 60 * 24 });

export default async function apiRoutes(fastify) {
  fastify.get('/api/meta', async () => ({
    fixtures: FIXTURES_2026.length,
    group_fixtures: FIXTURES_2026.filter(f => f.stage === 'group').length,
    knockout_fixtures: FIXTURES_2026.filter(f => f.stage !== 'group').length,
    teams: Object.keys(TEAMS_META.team_meta).length,
    groups: Object.keys(TEAMS_META.groups).length,
    all_internationals: ALL_INT.matches.length,
    wc_matches: WC_MATCHES.matches.length,
    backtest: BACKTEST.best_metrics,
    weights: BACKTEST.best_weights,
    ai_available: aiAvailable(),
    stage_names: STAGE_NAMES,
  }));

  fastify.get('/api/teams', async () => {
    const teams = Object.keys(TEAMS_META.team_meta).map(getTeamCard).filter(Boolean);
    return { teams };
  });

  fastify.get('/api/teams/:name', async (req, reply) => {
    const team = decodeURIComponent(req.params.name);
    if (!TEAMS_META.team_meta[team]) return reply.code(404).send({ error: 'team not found' });
    const card = getTeamCard(team);
    const group = Object.entries(TEAMS_META.groups).find(([g, members]) => members.includes(team))?.[0];
    const groupMatches = FIXTURES_2026.filter(f => f.group === group && f.stage === 'group');
    const recentForm = getRecentForm(team, { limit: 10, sinceYear: 2020 });
    const wcHistory = getTeamWCHistory(team);
    const squad = SQUADS.teams[team] || null;
    return { team: card, group, group_matches: groupMatches, recent_form: recentForm, wc_history: wcHistory, squad };
  });

  // === SQUADS ===
  fastify.get('/api/squads', async () => ({
    source: SQUADS.source,
    scraped_at: SQUADS.scraped_at,
    note: SQUADS.note,
    teams: Object.entries(SQUADS.teams).map(([team, data]) => ({
      team,
      name_vi: TEAMS_META.team_meta[team]?.name_vi || team,
      flag: TEAMS_META.team_meta[team]?.flag || '🏳️',
      total: data.total || 0,
      has_data: !data.error,
    })),
  }));

  // === PLAYERS SEARCH ===
  fastify.get('/api/players', async (req) => {
    const { q = '', team = '', position = '', limit = 50, offset = 0 } = req.query;
    const qLower = q.toLowerCase();
    const results = [];
    for (const [teamName, data] of Object.entries(SQUADS.teams)) {
      if (data.error) continue;
      if (team && teamName !== team) continue;
      const teamMeta = TEAMS_META.team_meta[teamName];
      const allPlayers = [
        ...(data.by_position.goalkeepers || []),
        ...(data.by_position.defenders || []),
        ...(data.by_position.midfielders || []),
        ...(data.by_position.forwards || []),
        ...(data.by_position.other || []),
      ];
      for (const p of allPlayers) {
        if (position && p.category !== position) continue;
        if (qLower && !p.name.toLowerCase().includes(qLower) && !(p.club || '').toLowerCase().includes(qLower)) continue;
        results.push({
          ...p,
          team: teamName,
          team_vi: teamMeta?.name_vi || teamName,
          flag: teamMeta?.flag || '🏳️',
        });
      }
    }
    // Sort by caps desc
    results.sort((a, b) => (b.caps || 0) - (a.caps || 0));
    return {
      total: results.length,
      players: results.slice(+offset, +offset + +limit),
    };
  });

  fastify.get('/api/matches', async (req) => {
    const { stage } = req.query;
    let list = FIXTURES_2026;
    if (stage) list = list.filter(f => f.stage === stage);
    // Gắn tỉ số thật (results.json — đọc sống) + dự đoán AI + lượt đấu + khóa
    const RES = getResults();
    list = list.map(f => {
      const result = RES.results?.[f.match] || null;
      const locked = isLocked(f);
      const ap = PREDICTIONS.predictions?.[f.match];
      // Ẩn dự đoán AI nếu trận đang bị khóa (chưa tới lượt) để không lộ trước
      const ai = (ap && !locked) ? { winner: ap.winner, score_a: ap.score_a, score_b: ap.score_b } : null;
      return { ...f, result, ai, matchday: matchdayOf(f.match), locked };
    });
    return { matches: list, stage_names: STAGE_NAMES };
  });

  fastify.get('/api/matches/:id', async (req, reply) => {
    const id = +req.params.id;
    const fixture = FIXTURES_2026.find(f => f.match === id);
    if (!fixture) return reply.code(404).send({ error: 'fixture not found' });

    const meta = TEAMS_META.team_meta;
    const ctx = {
      flagA: meta[fixture.home]?.flag || '🏳️',
      flagB: meta[fixture.away]?.flag || '🏳️',
      nameA_vi: meta[fixture.home]?.name_vi || fixture.home,
      nameB_vi: meta[fixture.away]?.name_vi || fixture.away,
      confA: meta[fixture.home]?.conf || '?',
      confB: meta[fixture.away]?.conf || '?',
      tierA: meta[fixture.home]?.rank_tier || 4,
      tierB: meta[fixture.away]?.rank_tier || 4,
      is_placeholder: fixture.is_placeholder,
      stage_name: STAGE_NAMES[fixture.stage] || fixture.stage,
    };

    let stats = null, h2h = null, recentA = null, recentB = null;
    if (!fixture.is_placeholder) {
      stats = computeStatsBaseline(fixture.home, fixture.away, fixture.stage, fixture);
      h2h = getH2H(fixture.home, fixture.away, { limit: 20 });
      recentA = getRecentForm(fixture.home, { limit: 10, sinceYear: 2020 });
      recentB = getRecentForm(fixture.away, { limit: 10, sinceYear: 2020 });
    }
    const env = computeMatchEnv(fixture);
    const result = getResults().results?.[id] || null;
    const locked = isLocked(fixture);
    return { fixture, ctx, stats, h2h, recent_a: recentA, recent_b: recentB, env, result, locked, matchday: matchdayOf(id) };
  });

  fastify.get('/api/h2h/:teamA/:teamB', async (req) => {
    return getH2H(decodeURIComponent(req.params.teamA), decodeURIComponent(req.params.teamB), { limit: +(req.query.limit || 20) });
  });

  fastify.get('/api/leaderboard', async () => ({
    elo: getEloLeaderboard(),
    wcoi_top: Object.entries(OVERLAY.wcoi.per_team)
      .filter(([, v]) => v.wc_matches >= 5)
      .sort((a, b) => b[1].wcoi - a[1].wcoi)
      .slice(0, 15).map(([team, v]) => ({ team, name_vi: TEAMS_META.team_meta[team]?.name_vi || team, ...v })),
    wcoi_bottom: Object.entries(OVERLAY.wcoi.per_team)
      .filter(([, v]) => v.wc_matches >= 5)
      .sort((a, b) => a[1].wcoi - b[1].wcoi)
      .slice(0, 15).map(([team, v]) => ({ team, name_vi: TEAMS_META.team_meta[team]?.name_vi || team, ...v })),
  }));

  fastify.get('/api/baseline/:teamA/:teamB', async (req) => {
    const a = decodeURIComponent(req.params.teamA);
    const b = decodeURIComponent(req.params.teamB);
    return computeStatsBaseline(a, b, req.query.stage || 'group');
  });

  fastify.get('/api/search', async (req) => searchMatches(req.query));

  fastify.get('/api/methodology', async () => ({
    weights: BACKTEST.best_weights,
    backtest: BACKTEST.best_metrics,
    all_results: BACKTEST.all_results,
    poisson_global_avg: POISSON.global_avg_goals_per_team_per_match,
    overlay: {
      stage_params: OVERLAY.stage_params.per_stage,
      conf_stage_top: Object.entries(OVERLAY.conf_stage_matrix.per_matchup)
        .sort((a, b) => b[1].n - a[1].n).slice(0, 15)
        .map(([key, v]) => ({ key, ...v })),
      host_effects: OVERLAY.host_effects,
    },
  }));

  fastify.post('/api/predict/:id', async (req, reply) => {
    const id = +req.params.id;
    const fixture = FIXTURES_2026.find(f => f.match === id);
    if (!fixture) return reply.code(404).send({ error: 'fixture not found' });
    if (fixture.is_placeholder) return reply.code(400).send({ error: 'cannot predict placeholder match (teams TBD)' });

    // 0) Khóa theo lượt: chưa tới lượt thì không trả dự đoán (tránh lộ trước)
    if (isLocked(fixture)) return reply.code(423).send({ locked: true, error: 'Dự đoán lượt này sẽ mở sau khi lượt trước kết thúc.' });

    // 1) Ưu tiên dự đoán tĩnh do Claude sinh sẵn — không gọi API, không tốn phí.
    const staticPred = PREDICTIONS.predictions?.[id];
    if (staticPred && !req.query.fresh) {
      const stats = computeStatsBaseline(fixture.home, fixture.away, fixture.stage, fixture);
      const env = computeMatchEnv(fixture);
      // Mô phỏng tính mới mỗi request (trừ khi ?stable=1 → trả đúng lõi tĩnh, đồng nhất mọi người)
      const simulation = req.query.stable ? null : simulatePrediction(stats, staticPred);
      return {
        fixture, stats, env, prediction: staticPred, simulation,
        generated_at: PREDICTIONS.generated_at,
        source: 'claude-static', model: PREDICTIONS.generated_by,
      };
    }

    // 2) Fallback: gọi Gemini live (cần GEMINI_API_KEY). ?fresh=1 cũng đi nhánh này.
    if (!aiAvailable()) return reply.code(503).send({ error: 'Trận này hiện chưa có dự đoán sẵn.' });

    const cacheKey = `pred:${id}`;
    if (predictionCache.has(cacheKey) && !req.query.fresh) return { ...predictionCache.get(cacheKey), cached: true };

    const meta = TEAMS_META.team_meta;
    const ctx = { flagA: meta[fixture.home]?.flag || '🏳️', flagB: meta[fixture.away]?.flag || '🏳️' };
    const stats = computeStatsBaseline(fixture.home, fixture.away, fixture.stage, fixture);
    const h2h = getH2H(fixture.home, fixture.away);
    const recentA = getRecentForm(fixture.home, { limit: 10, sinceYear: 2020 });
    const recentB = getRecentForm(fixture.away, { limit: 10, sinceYear: 2020 });
    const squadA = SQUADS.teams[fixture.home];
    const squadB = SQUADS.teams[fixture.away];
    const env = computeMatchEnv(fixture);
    const prompt = buildPredictionPrompt(fixture, h2h, recentA, recentB, stats, ctx, squadA, squadB, env);

    try {
      const text = await generatePrediction(prompt);
      const parsed = tryParseJSON(text);
      if (!parsed) return reply.code(502).send({ error: 'AI returned invalid JSON', raw: text.slice(0, 500) });
      const result = { fixture, stats, env, prediction: parsed, generated_at: new Date().toISOString(), source: 'gemini-live' };
      predictionCache.set(cacheKey, result);
      return result;
    } catch (err) {
      return reply.code(500).send({ error: err.message });
    }
  });
}
