// Centralized data loading with module-level caching
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA = join(__dirname, '..', 'data');

function loadJSON(name) {
  return JSON.parse(readFileSync(join(DATA, name), 'utf8'));
}

export const ELO = loadJSON('elo_ratings.json');
export const POISSON = loadJSON('poisson_params.json');
export const OVERLAY = loadJSON('wc_overlay.json');
export const BACKTEST = loadJSON('backtest_report.json');
export const WC_MATCHES = loadJSON('wc_all_matches.json');
export const ALL_INT = loadJSON('all_internationals.json');
export const TEAMS_META = loadJSON('teams_meta.json');
export const WC2026_CLEAN = loadJSON('wc2026_clean.json');
export const SQUADS = loadJSON('squads.json');

export { FIXTURES_2026 } from '../data/fixtures.js';

console.log(`[data] Loaded: ${ALL_INT.matches.length} all-int matches, ${WC_MATCHES.matches.length} WC matches, ${Object.keys(ELO.wc2026).length} WC2026 teams`);
