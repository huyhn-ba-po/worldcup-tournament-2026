// API routes
import { TEAMS_META, BACKTEST, OVERLAY, POISSON, ELO, ALL_INT, WC_MATCHES, FIXTURES_2026 } from '../lib/dataLoader.js';
import { computeStatsBaseline, getTeamCard, getEloLeaderboard } from '../lib/stats.js';
import { getH2H, getRecentForm, getTeamWCHistory, searchMatches } from '../lib/h2h.js';
import { aiAvailable, generatePrediction, tryParseJSON, buildPredictionPrompt } from '../lib/ai.js';
import { LRUCache } from 'lru-cache';

const predictionCache = new LRUCache({ max: 200, ttl: 1000 * 60 * 60 * 24 }); // 24h

export default async function apiRoutes(fastify) {
  // === META ===
  fastify.get('/api/meta', async () => ({
    fixtures: FIXTURES_2026.length,
    teams: Object.keys(TEAMS_META.team_meta).length,
    groups: Object.keys(TEAMS_META.groups).length,
    all_internationals: ALL_INT.matches.length,
    wc_matches: WC_MATCHES.matches.length,
    backtest: BACKTEST.best_metrics,
    weights: BACKTEST.best_weights,
    ai_available: aiAvailable(),
  }));

  // === TEAMS ===
  fastify.get('/api/teams', async () => {
    const teams = Object.keys(TEAMS_META.team_meta).map(getTeamCard);
    return { teams };
  });

  fastify.get('/api/teams/:name', async (req, reply) => {
    const team = decodeURIComponent(req.params.name);
    if (!TEAMS_META.team_meta[team]) return reply.code(404).send({ error: 'team not found' });
    const card = getTeamCard(team);
    const group = Object.entries(TEAMS_META.groups).find(([g, members]) => members.includes(team))?.[0];
    const groupMatches = FIXTURES_2026.filter(f => f.group === group);
    const recentForm = getRecentForm(team, { limit: 10, sinceYear: 2020 });
    const wcHistory = getTeamWCHistory(team);
    return { team: card, group, group_matches: groupMatches, recent_form: recentForm, wc_history: wcHistory };
  });

  // === MATCHES ===
  fastify.get('/api/matches', async () => ({ matches: FIXTURES_2026 }));

  fastify.get('/api/matches/:id', async (req, reply) => {
    const id = +req.params.id;
    const fixture = FIXTURES_2026.find(f => f.match === id);
    if (!fixture) return reply.code(404).send({ error: 'fixture not found' });

    const meta = TEAMS_META.team_meta;
    const ctx = {
      flagA: meta[fixture.home]?.flag || '🏳️',
      flagB: meta[fixture.away]?.flag || '🏳️',
      confA: meta[fixture.home]?.conf || '?',
      confB: meta[fixture.away]?.conf || '?',
      tierA: meta[fixture.home]?.rank_tier || 4,
      tierB: meta[fixture.away]?.rank_tier || 4,
    };
    const stats = computeStatsBaseline(fixture.home, fixture.away, 'group', fixture);
    const h2h = getH2H(fixture.home, fixture.away, { limit: 20 });
    const recentA = getRecentForm(fixture.home, { limit: 10, sinceYear: 2020 });
    const recentB = getRecentForm(fixture.away, { limit: 10, sinceYear: 2020 });

    return { fixture, ctx, stats, h2h, recent_a: recentA, recent_b: recentB };
  });

  // === H2H ===
  fastify.get('/api/h2h/:teamA/:teamB', async (req) => {
    const a = decodeURIComponent(req.params.teamA);
    const b = decodeURIComponent(req.params.teamB);
    const limit = +(req.query.limit || 20);
    return getH2H(a, b, { limit });
  });

  // === STATS / LEADERBOARD ===
  fastify.get('/api/leaderboard', async () => ({
    elo: getEloLeaderboard(),
    wcoi_top: Object.entries(OVERLAY.wcoi.per_team)
      .filter(([, v]) => v.wc_matches >= 5)
      .sort((a, b) => b[1].wcoi - a[1].wcoi)
      .slice(0, 15)
      .map(([team, v]) => ({ team, ...v })),
    wcoi_bottom: Object.entries(OVERLAY.wcoi.per_team)
      .filter(([, v]) => v.wc_matches >= 5)
      .sort((a, b) => a[1].wcoi - b[1].wcoi)
      .slice(0, 15)
      .map(([team, v]) => ({ team, ...v })),
  }));

  fastify.get('/api/baseline/:teamA/:teamB', async (req) => {
    const a = decodeURIComponent(req.params.teamA);
    const b = decodeURIComponent(req.params.teamB);
    const stage = req.query.stage || 'group';
    return computeStatsBaseline(a, b, stage);
  });

  // === DATA EXPLORER ===
  fastify.get('/api/search', async (req) => {
    return searchMatches(req.query);
  });

  // === METHODOLOGY ===
  fastify.get('/api/methodology', async () => ({
    weights: BACKTEST.best_weights,
    backtest: BACKTEST.best_metrics,
    all_results: BACKTEST.all_results,
    poisson_global_avg: POISSON.global_avg_goals_per_team_per_match,
    overlay: {
      stage_params: OVERLAY.stage_params.per_stage,
      conf_stage_top: Object.entries(OVERLAY.conf_stage_matrix.per_matchup)
        .sort((a, b) => b[1].n - a[1].n)
        .slice(0, 15)
        .map(([key, v]) => ({ key, ...v })),
      host_effects: OVERLAY.host_effects,
    },
  }));

  // === AI PREDICTION (proxy) ===
  fastify.post('/api/predict/:id', async (req, reply) => {
    if (!aiAvailable()) return reply.code(503).send({ error: 'AI not configured (set GEMINI_API_KEY)' });
    const id = +req.params.id;
    const fixture = FIXTURES_2026.find(f => f.match === id);
    if (!fixture) return reply.code(404).send({ error: 'fixture not found' });

    const cacheKey = `pred:${id}`;
    if (predictionCache.has(cacheKey) && !req.query.fresh) {
      return { ...predictionCache.get(cacheKey), cached: true };
    }

    const meta = TEAMS_META.team_meta;
    const ctx = { flagA: meta[fixture.home]?.flag || '🏳️', flagB: meta[fixture.away]?.flag || '🏳️' };
    const stats = computeStatsBaseline(fixture.home, fixture.away, 'group', fixture);
    const h2h = getH2H(fixture.home, fixture.away);
    const recentA = getRecentForm(fixture.home, { limit: 10, sinceYear: 2020 });
    const recentB = getRecentForm(fixture.away, { limit: 10, sinceYear: 2020 });
    const prompt = buildPredictionPrompt(fixture, h2h, recentA, recentB, stats, ctx);

    try {
      const text = await generatePrediction(prompt);
      const parsed = tryParseJSON(text);
      if (!parsed) return reply.code(502).send({ error: 'AI returned invalid JSON', raw: text.slice(0, 500) });
      const result = { fixture, stats, prediction: parsed, generated_at: new Date().toISOString() };
      predictionCache.set(cacheKey, result);
      return result;
    } catch (err) {
      return reply.code(500).send({ error: err.message });
    }
  });
}
