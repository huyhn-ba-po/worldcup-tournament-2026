#!/usr/bin/env node
/*
 * backtest_wc.js — Leak-free backtest on WC2018 + WC2022 (128 matches)
 *
 * Strategy:
 *   1. Rebuild Elo using only matches BEFORE each WC match
 *   2. For each WC2018/2022 match, predict using stats baseline (Elo + Poisson + WCOI + Conf matrix)
 *   3. Compare with actual outcome
 *   4. Grid search over aggregator weights to minimize log loss
 *
 * Output: backtest_report.json + console summary
 */

const fs = require('fs');
const path = require('path');

const ALL = path.join(__dirname, 'all_internationals.json');
const WC = path.join(__dirname, 'wc_all_matches.json');
const POIS = path.join(__dirname, 'poisson_params.json');
const OVERLAY = path.join(__dirname, 'wc_overlay.json');
const OUT = path.join(__dirname, 'backtest_report.json');

// ─────────────────────────────────────────────────────────────────────────
// Shared helpers (mirror build_elo.js + build_wc_overlay.js)
// ─────────────────────────────────────────────────────────────────────────
const ALIAS = {
  'Korea Republic': 'South Korea', 'Bosnia and Herzegovina': 'Bosnia & Herzegovina',
  'Türkiye': 'Turkey', 'Turkiye': 'Turkey',
  "Côte d'Ivoire": 'Ivory Coast', "Cote d'Ivoire": 'Ivory Coast',
  'Curacao': 'Curaçao', 'Congo DR': 'DR Congo',
  'Democratic Republic of the Congo': 'DR Congo', 'Zaire': 'DR Congo',
  'Czechia': 'Czech Republic', 'Czechoslovakia': 'Czech Republic',
  'West Germany': 'Germany', 'East Germany': 'Germany',
  'USA': 'United States', 'Soviet Union': 'Russia',
  'Yugoslavia': 'Serbia', 'FR Yugoslavia': 'Serbia', 'Serbia and Montenegro': 'Serbia',
};
const norm = (n) => ALIAS[n] || n;

const TOURNAMENT_K = {
  'fifa_world_cup': 55, 'fifa_world_cup_qualification': 35,
  'uefa_euro': 45, 'uefa_euro_qualification': 30, 'uefa_nations_league': 35,
  'copa_america': 45, 'copa_america_qualification': 30,
  'african_cup_of_nations': 40, 'african_cup_of_nations_qualification': 30,
  'afc_asian_cup': 40, 'afc_asian_cup_qualification': 30,
  'gold_cup': 40, 'gold_cup_qualification': 30,
  'concacaf_nations_league': 30, 'oceania_nations_cup': 35,
  'arab_cup': 30, 'asean_championship': 30,
  'friendly': 20, 'fifa_confederations_cup': 40,
};
function kFactor(t) {
  if (TOURNAMENT_K[t] != null) return TOURNAMENT_K[t];
  if (t.includes('qualification')) return 25;
  if (t.includes('friend')) return 20;
  return 25;
}

function expectedWin(rA, rB) { return 1 / (1 + Math.pow(10, (rB - rA) / 400)); }
function movMultiplier(gd, ratingDiff) {
  if (gd === 0) return 1;
  const base = Math.log(Math.abs(gd) + 1);
  const damp = 2.2 / (Math.abs(ratingDiff) * 0.001 + 2.2);
  return base * damp;
}

function getScores(m) {
  if (m.score && m.score.ft && Array.isArray(m.score.ft)) return [m.score.ft[0], m.score.ft[1]];
  if (m.score1 != null && m.score2 != null) return [m.score1, m.score2];
  return [null, null];
}

const TEAM_CONF = {
  Argentina: 'CONMEBOL', Brazil: 'CONMEBOL', Uruguay: 'CONMEBOL', Colombia: 'CONMEBOL', Ecuador: 'CONMEBOL',
  Paraguay: 'CONMEBOL', Chile: 'CONMEBOL', Peru: 'CONMEBOL',
  France: 'UEFA', Spain: 'UEFA', England: 'UEFA', Portugal: 'UEFA', Netherlands: 'UEFA',
  Belgium: 'UEFA', Italy: 'UEFA', Germany: 'UEFA', Croatia: 'UEFA', Switzerland: 'UEFA',
  Denmark: 'UEFA', Austria: 'UEFA', Serbia: 'UEFA', Poland: 'UEFA', Turkey: 'UEFA',
  Scotland: 'UEFA', Sweden: 'UEFA', Norway: 'UEFA', 'Bosnia & Herzegovina': 'UEFA',
  'Czech Republic': 'UEFA', 'Republic of Ireland': 'UEFA', Russia: 'UEFA',
  Mexico: 'CONCACAF', Canada: 'CONCACAF', 'United States': 'CONCACAF',
  Panama: 'CONCACAF', Haiti: 'CONCACAF', 'Curaçao': 'CONCACAF',
  'Costa Rica': 'CONCACAF', Jamaica: 'CONCACAF',
  Senegal: 'CAF', Morocco: 'CAF', Egypt: 'CAF', Tunisia: 'CAF', Nigeria: 'CAF',
  'Ivory Coast': 'CAF', Algeria: 'CAF', Ghana: 'CAF', Mali: 'CAF', 'South Africa': 'CAF',
  'Cape Verde': 'CAF', 'DR Congo': 'CAF', Cameroon: 'CAF',
  Japan: 'AFC', 'South Korea': 'AFC', Iran: 'AFC', Australia: 'AFC', 'Saudi Arabia': 'AFC',
  Qatar: 'AFC', Uzbekistan: 'AFC', Jordan: 'AFC', Iraq: 'AFC',
  'New Zealand': 'OFC',
};
const getConf = (t) => TEAM_CONF[t] || 'OTHER';

// ─────────────────────────────────────────────────────────────────────────
// Build Elo snapshot at given cutoff date
// ─────────────────────────────────────────────────────────────────────────
function computeEloUpTo(allMatches, cutoffDate) {
  const ratings = {};
  const DEFAULT = 1500;
  for (const m of allMatches) {
    if (m.date >= cutoffDate) break; // sorted, so safe
    if (m.score1 == null || m.score2 == null) continue;
    const t1 = norm(m.team1), t2 = norm(m.team2);
    if (!t1 || !t2) continue;
    if (!(t1 in ratings)) ratings[t1] = DEFAULT;
    if (!(t2 in ratings)) ratings[t2] = DEFAULT;
    const r1 = ratings[t1], r2 = ratings[t2];
    const E1 = expectedWin(r1, r2);
    let S1, S2;
    if (m.score1 > m.score2)      { S1 = 1; S2 = 0; }
    else if (m.score1 < m.score2) { S1 = 0; S2 = 1; }
    else                          { S1 = 0.5; S2 = 0.5; }
    const K = kFactor(m.tournament);
    const gd = m.score1 - m.score2;
    ratings[t1] = r1 + K * movMultiplier(gd, r1 - r2) * (S1 - E1);
    ratings[t2] = r2 + K * movMultiplier(-gd, r2 - r1) * (S2 - (1 - E1));
  }
  return ratings;
}

// ─────────────────────────────────────────────────────────────────────────
// Stats baseline prediction (combine Elo + Poisson + Conf matrix + WCOI)
// ─────────────────────────────────────────────────────────────────────────
function predictMatch(teamA, teamB, elo, poisson, overlay, weights, stage = 'group') {
  // 1. Elo prob
  const rA = elo[teamA] || 1500;
  const rB = elo[teamB] || 1500;
  const eloA = expectedWin(rA, rB);
  // Estimate draw prob based on Elo closeness
  const eloGap = Math.abs(rA - rB);
  const drawProb = Math.max(0.18, 0.32 - eloGap / 1500);
  let pEloA = eloA * (1 - drawProb);
  let pEloB = (1 - eloA) * (1 - drawProb);
  let pEloD = drawProb;

  // 2. Poisson — derive win/draw/loss from λ
  const pA = poisson.teams[teamA] || poisson.default_param;
  const pB = poisson.teams[teamB] || poisson.default_param;
  const G = poisson.global_avg_goals_per_team_per_match;
  // No home boost in backtest (neutral venue assumption)
  const lambdaA = pA.attack * pB.defense * G;
  const lambdaB = pB.attack * pA.defense * G;
  let pPois = simulatePoisson(lambdaA, lambdaB);

  // 3. Confederation × Stage matrix
  const cA = getConf(teamA), cB = getConf(teamB);
  const stageGroup = stage === 'group' ? 'group' : 'knockout';
  const key = (cA <= cB ? `${cA}|${cB}` : `${cB}|${cA}`) + '|' + stageGroup;
  const matrix = overlay.conf_stage_matrix.per_matchup[key];
  let pConf = { a: 0.33, d: 0.33, b: 0.34 };
  if (matrix && matrix.n >= 5) {
    const reversed = cA > cB;
    pConf = {
      a: reversed ? matrix.c2_win_rate : matrix.c1_win_rate,
      d: matrix.draw_rate,
      b: reversed ? matrix.c1_win_rate : matrix.c2_win_rate,
    };
  }

  // 4. WCOI adjustment — shift Elo prob by Δwcoi
  const wcoiA = (overlay.wcoi.per_team[teamA] || {}).wcoi || 0;
  const wcoiB = (overlay.wcoi.per_team[teamB] || {}).wcoi || 0;
  const wcoiDelta = wcoiA - wcoiB;
  let pWcoi = {
    a: clamp(eloA + wcoiDelta * 0.5, 0.05, 0.95) * (1 - drawProb),
    d: drawProb,
    b: clamp(1 - eloA - wcoiDelta * 0.5, 0.05, 0.95) * (1 - drawProb),
  };
  // Renormalize
  pWcoi = renorm(pWcoi);

  // 5. Aggregate
  const w = weights;
  const probA = w.elo * pEloA + w.poisson * pPois.a + w.conf * pConf.a + w.wcoi * pWcoi.a;
  const probD = w.elo * pEloD + w.poisson * pPois.d + w.conf * pConf.d + w.wcoi * pWcoi.d;
  const probB = w.elo * pEloB + w.poisson * pPois.b + w.conf * pConf.b + w.wcoi * pWcoi.b;
  const total = probA + probD + probB;
  return { a: probA / total, d: probD / total, b: probB / total, lambdaA, lambdaB };
}

function clamp(x, lo, hi) { return Math.max(lo, Math.min(hi, x)); }
function renorm(p) { const s = p.a + p.d + p.b; return { a: p.a / s, d: p.d / s, b: p.b / s }; }

// Poisson simulation: P(A wins / draw / B wins) from λ_A, λ_B
function simulatePoisson(lA, lB) {
  let pWin = 0, pDraw = 0, pLose = 0;
  for (let i = 0; i <= 8; i++) {
    for (let j = 0; j <= 8; j++) {
      const p = poissonPmf(i, lA) * poissonPmf(j, lB);
      if (i > j) pWin += p;
      else if (i < j) pLose += p;
      else pDraw += p;
    }
  }
  const total = pWin + pDraw + pLose;
  return { a: pWin / total, d: pDraw / total, b: pLose / total };
}
function poissonPmf(k, lambda) {
  let logP = -lambda + k * Math.log(lambda || 1e-9);
  for (let i = 2; i <= k; i++) logP -= Math.log(i);
  return Math.exp(logP);
}

// ─────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────
console.log('Loading data...');
const all = JSON.parse(fs.readFileSync(ALL, 'utf8'));
const wc = JSON.parse(fs.readFileSync(WC, 'utf8'));
const poisson = JSON.parse(fs.readFileSync(POIS, 'utf8'));
const overlay = JSON.parse(fs.readFileSync(OVERLAY, 'utf8'));

all.matches.sort((a, b) => a.date.localeCompare(b.date));

// Backtest set: WC2018 (Russia) + WC2022 (Qatar). Group stage only (predictable scores).
const backtestSet = wc.matches.filter((m) => {
  if (m.year !== 2018 && m.year !== 2022) return false;
  const [s1, s2] = getScores(m);
  if (s1 == null || s2 == null) return false;
  return true;
});
console.log(`Backtest set: ${backtestSet.length} WC2018+2022 matches\n`);

// Build Elo snapshots at start of WC2018 and WC2022
const eloAt = {
  2018: computeEloUpTo(all.matches, '2018-06-14'), // WC2018 starts 6/14
  2022: computeEloUpTo(all.matches, '2022-11-20'), // WC2022 starts 11/20
};
console.log('Elo snapshots built.\n');

// Grid search weights
const weightGrids = [
  { elo: 0.50, poisson: 0.30, conf: 0.10, wcoi: 0.10 },
  { elo: 0.45, poisson: 0.30, conf: 0.15, wcoi: 0.10 },
  { elo: 0.40, poisson: 0.35, conf: 0.15, wcoi: 0.10 },
  { elo: 0.55, poisson: 0.25, conf: 0.10, wcoi: 0.10 },
  { elo: 0.60, poisson: 0.20, conf: 0.10, wcoi: 0.10 },
  { elo: 0.35, poisson: 0.35, conf: 0.20, wcoi: 0.10 },
  { elo: 0.45, poisson: 0.30, conf: 0.10, wcoi: 0.15 },
  { elo: 1.00, poisson: 0.00, conf: 0.00, wcoi: 0.00 }, // Elo-only baseline
  { elo: 0.00, poisson: 1.00, conf: 0.00, wcoi: 0.00 }, // Poisson-only
];

// Stage categorize for WC matches
function getStage(m) {
  if (!m.round) return 'unknown';
  const r = m.round.toLowerCase();
  if (r.includes('matchday') || r.includes('group')) return 'group';
  return 'knockout';
}

const results = [];

for (const weights of weightGrids) {
  let correct = 0, total = 0;
  let brier = 0;
  let logloss = 0;
  let exactScore = 0;

  for (const m of backtestSet) {
    const t1 = norm(m.team1), t2 = norm(m.team2);
    const [s1, s2] = getScores(m);
    const elo = eloAt[m.year];
    const stage = getStage(m);
    const pred = predictMatch(t1, t2, elo, poisson, overlay, weights, stage);

    // Actual outcome
    let actual = 'd';
    if (s1 > s2) actual = 'a';
    else if (s1 < s2) actual = 'b';

    // Predicted outcome (argmax)
    const predOutcome = pred.a >= pred.d && pred.a >= pred.b ? 'a' :
                        pred.b >= pred.d ? 'b' : 'd';

    if (predOutcome === actual) correct++;
    total++;

    // Brier
    const aArr = [actual === 'a' ? 1 : 0, actual === 'd' ? 1 : 0, actual === 'b' ? 1 : 0];
    brier += Math.pow(pred.a - aArr[0], 2) + Math.pow(pred.d - aArr[1], 2) + Math.pow(pred.b - aArr[2], 2);

    // Log loss
    const pActual = actual === 'a' ? pred.a : actual === 'd' ? pred.d : pred.b;
    logloss += -Math.log(Math.max(pActual, 1e-9));

    // Exact score (using lambda)
    const predA = Math.round(pred.lambdaA);
    const predB = Math.round(pred.lambdaB);
    if (predA === s1 && predB === s2) exactScore++;
  }

  results.push({
    weights,
    accuracy_3way: +(correct / total).toFixed(4),
    brier_score: +(brier / total).toFixed(4),
    log_loss: +(logloss / total).toFixed(4),
    exact_score_acc: +(exactScore / total).toFixed(4),
    correct, total,
  });
}

// Print sorted by log loss (lower = better)
results.sort((a, b) => a.log_loss - b.log_loss);
console.log('=== Grid search results (sorted by log loss, lower better) ===');
console.log('elo  / pois / conf / wcoi  | Acc3 |   Brier  | LogLoss  | ExactScore');
console.log('-----------------------------------------------------------------------');
for (const r of results) {
  const w = r.weights;
  console.log(
    `${w.elo.toFixed(2)} / ${w.poisson.toFixed(2)} / ${w.conf.toFixed(2)} / ${w.wcoi.toFixed(2)}  | ` +
    `${(r.accuracy_3way * 100).toFixed(1)}% | ${r.brier_score.toFixed(4)} | ${r.log_loss.toFixed(4)} | ${(r.exact_score_acc * 100).toFixed(1)}%`
  );
}

// Best
const best = results[0];
console.log(`\nBEST WEIGHTS: elo=${best.weights.elo} pois=${best.weights.poisson} conf=${best.weights.conf} wcoi=${best.weights.wcoi}`);
console.log(`  Accuracy 3-way: ${(best.accuracy_3way * 100).toFixed(1)}%`);
console.log(`  Brier score:    ${best.brier_score.toFixed(4)}`);
console.log(`  Log loss:       ${best.log_loss.toFixed(4)}`);
console.log(`  Exact score:    ${(best.exact_score_acc * 100).toFixed(1)}%`);

// Save report
fs.writeFileSync(OUT, JSON.stringify({
  backtest_set: 'WC2018 + WC2022',
  matches: backtestSet.length,
  computed_at: new Date().toISOString(),
  best_weights: best.weights,
  best_metrics: best,
  all_results: results,
}, null, 2));
console.log(`\n✓ Saved ${OUT}`);
