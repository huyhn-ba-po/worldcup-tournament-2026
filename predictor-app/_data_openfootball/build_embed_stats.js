#!/usr/bin/env node
/*
 * build_embed_stats.js — Compose embedded_stats.js từ Elo + Poisson + WC overlay
 *
 * Output: embedded_stats.js — file JS với var STATS_DATA chứa toàn bộ stats cho 48 teams.
 *         Inject vào index.html để app dùng làm baseline cho LLM.
 */

const fs = require('fs');
const path = require('path');

const elo = JSON.parse(fs.readFileSync(path.join(__dirname, 'elo_ratings.json'), 'utf8'));
const pois = JSON.parse(fs.readFileSync(path.join(__dirname, 'poisson_params.json'), 'utf8'));
const overlay = JSON.parse(fs.readFileSync(path.join(__dirname, 'wc_overlay.json'), 'utf8'));
const backtest = JSON.parse(fs.readFileSync(path.join(__dirname, 'backtest_report.json'), 'utf8'));

const data = {
  meta: {
    description: 'Hybrid stats baseline for WC2026 prediction (Elo + Poisson + WC overlay)',
    generated_at: new Date().toISOString(),
    backtest_acc: backtest.best_metrics.accuracy_3way,
    backtest_brier: backtest.best_metrics.brier_score,
    backtest_logloss: backtest.best_metrics.log_loss,
    sources: ['openfootball/internationals (1872-2025, 47980 matches)', 'openfootball/worldcup.json (1930-2026)'],
  },
  // Aggregator weights tuned on WC2018+2022
  weights: backtest.best_weights,
  poisson_global_avg: pois.global_avg_goals_per_team_per_match,
  poisson_home_boost: pois.home_boost_multiplier,
  // Per-team stats
  teams: {},
  // Confederation per team
  team_confederation: overlay.team_confederation,
  // Confederation × stage outcome matrix (normalized keys)
  conf_stage_matrix: overlay.conf_stage_matrix.per_matchup,
  stage_params: overlay.stage_params.per_stage,
  // Host effects
  host_boosts: overlay.host_effects.boosts,
};

// Combine per-team data
const WC2026 = Object.keys(elo.wc2026);
for (const team of WC2026) {
  data.teams[team] = {
    elo: elo.wc2026[team],
    attack: pois.teams[team]?.attack ?? 1.0,
    defense: pois.teams[team]?.defense ?? 1.0,
    wcoi: overlay.wcoi.per_team[team]?.wcoi ?? 0,
    wc_matches: overlay.wcoi.per_team[team]?.wc_matches ?? 0,
  };
}

const out = `// === EMBEDDED STATS ===
// Auto-generated from build_embed_stats.js
// Sources: openfootball/* (CC0 Public Domain)
// Backtest WC2018+2022: ${(data.meta.backtest_acc * 100).toFixed(1)}% accuracy, Brier ${data.meta.backtest_brier}, LogLoss ${data.meta.backtest_logloss}
const STATS_DATA = ${JSON.stringify(data, null, 2)};
`;

const OUT = path.join(__dirname, 'embedded_stats.js');
fs.writeFileSync(OUT, out);
const sizeKB = (fs.statSync(OUT).size / 1024).toFixed(1);
console.log(`✓ Saved ${OUT} (${sizeKB} KB)`);
console.log(`  Teams: ${Object.keys(data.teams).length}`);
console.log(`  Conf matrix entries: ${Object.keys(data.conf_stage_matrix).length}`);
console.log(`  Backtest accuracy: ${(data.meta.backtest_acc * 100).toFixed(1)}%`);
