// Hybrid stats baseline computation (Elo + Poisson + Conf×Stage + WCOI)
import { ELO, POISSON, OVERLAY, BACKTEST, TEAMS_META } from './dataLoader.js';

function expectedWinElo(rA, rB) { return 1 / (1 + Math.pow(10, (rB - rA) / 400)); }
function clamp(x, lo, hi) { return Math.max(lo, Math.min(hi, x)); }
function poissonPmf(k, lambda) {
  let logP = -lambda + k * Math.log(lambda || 1e-9);
  for (let i = 2; i <= k; i++) logP -= Math.log(i);
  return Math.exp(logP);
}

const WEIGHTS = BACKTEST.best_weights;
const GLOBAL_AVG = POISSON.global_avg_goals_per_team_per_match;
const HOME_BOOST_POISSON = POISSON.home_boost_multiplier || 1.25;

export function getEloRating(team) {
  return ELO.wc2026[team] ?? 1500;
}

export function getPoissonParams(team) {
  return POISSON.teams[team] || POISSON.default_param || { attack: 1.0, defense: 1.0 };
}

export function getWCOI(team) {
  return OVERLAY.wcoi.per_team[team] || { wcoi: 0, wc_matches: 0 };
}

export function computeStatsBaseline(teamA, teamB, stage = 'group', fixture = null) {
  const eloA = getEloRating(teamA);
  const eloB = getEloRating(teamB);
  const pA = getPoissonParams(teamA);
  const pB = getPoissonParams(teamB);
  const wcoiA = getWCOI(teamA).wcoi;
  const wcoiB = getWCOI(teamB).wcoi;

  // Host boost
  let hostBoost = 0;
  if (fixture && fixture.ground) {
    const k1 = `${teamA}|${fixture.ground}`;
    const k2 = `${teamB}|${fixture.ground}`;
    if (OVERLAY.host_effects.boosts[k1]) hostBoost = OVERLAY.host_effects.boosts[k1];
    else if (OVERLAY.host_effects.boosts[k2]) hostBoost = -OVERLAY.host_effects.boosts[k2];
  }
  if (hostBoost === 0) {
    if ((TEAMS_META.team_meta[teamA] || {}).host) hostBoost = 100;
    else if ((TEAMS_META.team_meta[teamB] || {}).host) hostBoost = -100;
  }

  // ELO
  const rA = eloA + hostBoost;
  const rB = eloB;
  const eloWinA = expectedWinElo(rA, rB);
  const eloGap = Math.abs(rA - rB);
  const drawProb = Math.max(0.18, 0.32 - eloGap / 1500);
  const pElo = { a: eloWinA * (1 - drawProb), d: drawProb, b: (1 - eloWinA) * (1 - drawProb) };

  // POISSON
  const homeBoost = hostBoost > 0 ? HOME_BOOST_POISSON : hostBoost < 0 ? 1 / HOME_BOOST_POISSON : 1;
  const lambdaA = pA.attack * pB.defense * GLOBAL_AVG * homeBoost;
  const lambdaB = pB.attack * pA.defense * GLOBAL_AVG;
  let pPoisA = 0, pPoisD = 0, pPoisB = 0;
  const scoreProbs = [];
  for (let i = 0; i <= 6; i++) {
    for (let j = 0; j <= 6; j++) {
      const p = poissonPmf(i, lambdaA) * poissonPmf(j, lambdaB);
      if (i > j) pPoisA += p; else if (i < j) pPoisB += p; else pPoisD += p;
      scoreProbs.push({ a: i, b: j, p });
    }
  }
  const topScores = scoreProbs.sort((x, y) => y.p - x.p).slice(0, 5);

  // CONF × STAGE
  const cA = OVERLAY.team_confederation[teamA] || 'OTHER';
  const cB = OVERLAY.team_confederation[teamB] || 'OTHER';
  const stageGroup = stage === 'group' ? 'group' : 'knockout';
  const matKey = (cA <= cB ? `${cA}|${cB}` : `${cB}|${cA}`) + '|' + stageGroup;
  const mat = OVERLAY.conf_stage_matrix.per_matchup[matKey];
  let pConf = { a: 0.33, d: 0.33, b: 0.34 };
  if (mat && mat.n >= 5) {
    const rev = cA > cB;
    pConf = {
      a: rev ? mat.c2_win_rate : mat.c1_win_rate,
      d: mat.draw_rate,
      b: rev ? mat.c1_win_rate : mat.c2_win_rate,
    };
  }

  // WCOI
  const wcoiDelta = wcoiA - wcoiB;
  let pWcoi = {
    a: clamp(eloWinA + wcoiDelta * 0.5, 0.05, 0.95) * (1 - drawProb),
    d: drawProb,
    b: clamp(1 - eloWinA - wcoiDelta * 0.5, 0.05, 0.95) * (1 - drawProb),
  };
  const ws = pWcoi.a + pWcoi.d + pWcoi.b;
  pWcoi = { a: pWcoi.a / ws, d: pWcoi.d / ws, b: pWcoi.b / ws };

  // AGGREGATE
  const w = WEIGHTS;
  const aggA = w.elo * pElo.a + w.poisson * pPoisA + w.conf * pConf.a + w.wcoi * pWcoi.a;
  const aggD = w.elo * pElo.d + w.poisson * pPoisD + w.conf * pConf.d + w.wcoi * pWcoi.d;
  const aggB = w.elo * pElo.b + w.poisson * pPoisB + w.conf * pConf.b + w.wcoi * pWcoi.b;
  const tot = aggA + aggD + aggB;

  return {
    prob_a: Math.round((aggA / tot) * 100),
    prob_d: Math.round((aggD / tot) * 100),
    prob_b: Math.round((aggB / tot) * 100),
    expected_score: { a: +lambdaA.toFixed(2), b: +lambdaB.toFixed(2) },
    top_scores: topScores.map(s => ({ score: `${s.a}-${s.b}`, prob: Math.round(s.p * 100) })),
    breakdown: {
      elo:     { rA: Math.round(rA), rB: Math.round(rB), host_boost: hostBoost, win_a: eloWinA, p: { a: Math.round(pElo.a * 100), d: Math.round(pElo.d * 100), b: Math.round(pElo.b * 100) } },
      poisson: { lambdaA: +lambdaA.toFixed(2), lambdaB: +lambdaB.toFixed(2), p: { a: Math.round(pPoisA * 100), d: Math.round(pPoisD * 100), b: Math.round(pPoisB * 100) } },
      conf:    { key: matKey, n: mat?.n || 0, p: { a: Math.round(pConf.a * 100), d: Math.round(pConf.d * 100), b: Math.round(pConf.b * 100) } },
      wcoi:    { wcoi_a: wcoiA, wcoi_b: wcoiB, p: { a: Math.round(pWcoi.a * 100), d: Math.round(pWcoi.d * 100), b: Math.round(pWcoi.b * 100) } },
    },
    weights: w,
  };
}

// Stats card for team — used in team detail page
export function getTeamCard(team) {
  const meta = TEAMS_META.team_meta[team];
  const elo = getEloRating(team);
  const pois = getPoissonParams(team);
  const wcoi = getWCOI(team);
  return {
    name: team,
    flag: meta?.flag || '🏳️',
    confederation: meta?.conf || '?',
    is_host: meta?.host || false,
    titles: meta?.titles || 0,
    rank_tier: meta?.rank_tier || 4,
    elo: elo,
    attack: pois.attack,
    defense: pois.defense,
    wcoi: wcoi.wcoi,
    wc_matches: wcoi.wc_matches,
    gf_per_match: pois.gf_per_match,
    ga_per_match: pois.ga_per_match,
  };
}

// Elo leaderboard
export function getEloLeaderboard() {
  return Object.entries(ELO.wc2026)
    .map(([team, rating]) => ({ team, rating, ...getTeamCard(team) }))
    .sort((a, b) => b.rating - a.rating);
}
