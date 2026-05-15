// Head-to-Head + form lookup từ 47k trận quốc tế + 1k WC matches
import { ALL_INT, WC_MATCHES, TEAMS_META } from './dataLoader.js';
import { norm } from './normalize.js';

const ALIASES = TEAMS_META.modern_to_historical;
function getAliasSet(team) {
  return new Set(ALIASES[team] || [team]);
}

// Lifetime H2H giữa 2 đội (qua mọi tournament)
export function getH2H(teamA, teamB, opts = {}) {
  const setA = getAliasSet(teamA);
  const setB = getAliasSet(teamB);
  const matches = [];
  for (const m of ALL_INT.matches) {
    const t1 = norm(m.team1);
    const t2 = norm(m.team2);
    const aHome = setA.has(t1) && setB.has(t2);
    const aAway = setA.has(t2) && setB.has(t1);
    if (!aHome && !aAway) continue;
    if (m.score1 == null || m.score2 == null) continue;
    matches.push({
      date: m.date,
      year: m.year,
      home: t1,
      away: t2,
      score_home: m.score1,
      score_away: m.score2,
      tournament: m.tournament,
      venue: m.venue,
      a_was_home: aHome,
    });
  }
  matches.sort((a, b) => b.date.localeCompare(a.date));

  let aWins = 0, draws = 0, bWins = 0, aGoals = 0, bGoals = 0;
  let decayedWinA = 0, decayedTotal = 0;
  const CURRENT_YEAR = 2026;
  for (const m of matches) {
    const gA = m.a_was_home ? m.score_home : m.score_away;
    const gB = m.a_was_home ? m.score_away : m.score_home;
    aGoals += gA; bGoals += gB;
    let outcome;
    if (gA > gB)      { aWins++; outcome = 'a'; }
    else if (gA < gB) { bWins++; outcome = 'b'; }
    else              { draws++; outcome = 'd'; }
    const decay = Math.pow(0.95, CURRENT_YEAR - m.year);
    decayedTotal += decay;
    if (outcome === 'a')      decayedWinA += decay;
    else if (outcome === 'd') decayedWinA += 0.5 * decay;
  }

  return {
    total: matches.length,
    a_wins: aWins, draws, b_wins: bWins,
    a_goals: aGoals, b_goals: bGoals,
    time_decay_win_rate_a: decayedTotal > 0 ? decayedWinA / decayedTotal : null,
    last_meeting: matches[0] || null,
    matches: opts.limit ? matches.slice(0, opts.limit) : matches,
  };
}

// Recent form (last N matches) for 1 team
export function getRecentForm(team, opts = {}) {
  const limit = opts.limit || 10;
  const sinceYear = opts.sinceYear || 2020;
  const aliases = getAliasSet(team);
  const matches = [];
  for (const m of ALL_INT.matches) {
    if (m.year < sinceYear) continue;
    if (m.score1 == null) continue;
    const t1 = norm(m.team1), t2 = norm(m.team2);
    const isT1 = aliases.has(t1);
    const isT2 = aliases.has(t2);
    if (!isT1 && !isT2) continue;
    matches.push({
      date: m.date,
      year: m.year,
      opponent: isT1 ? t2 : t1,
      gf: isT1 ? m.score1 : m.score2,
      ga: isT1 ? m.score2 : m.score1,
      tournament: m.tournament,
      venue: m.venue,
      is_home: isT1,
    });
  }
  matches.sort((a, b) => b.date.localeCompare(a.date));
  const recent = matches.slice(0, limit);

  let w = 0, d = 0, l = 0;
  for (const m of recent) {
    if (m.gf > m.ga) w++;
    else if (m.gf === m.ga) d++;
    else l++;
  }
  return {
    played: recent.length,
    wins: w, draws: d, losses: l,
    win_rate: recent.length > 0 ? (w + 0.5 * d) / recent.length : 0,
    matches: recent,
  };
}

// All WC fixtures (1930-2026) liên quan đến 1 đội
export function getTeamWCHistory(team) {
  const aliases = getAliasSet(team);
  return WC_MATCHES.matches
    .filter((m) => aliases.has(norm(m.team1)) || aliases.has(norm(m.team2)))
    .sort((a, b) => b.year - a.year);
}

// Search matches by team/year/tournament
export function searchMatches(query) {
  const { team, year_from, year_to, tournament, limit = 50, offset = 0 } = query;
  let results = ALL_INT.matches;
  if (year_from) results = results.filter(m => m.year >= +year_from);
  if (year_to) results = results.filter(m => m.year <= +year_to);
  if (tournament) results = results.filter(m => m.tournament.includes(tournament));
  if (team) {
    const t = team.toLowerCase();
    results = results.filter(m => m.team1.toLowerCase().includes(t) || m.team2.toLowerCase().includes(t));
  }
  results = results.sort((a, b) => b.date.localeCompare(a.date));
  return {
    total: results.length,
    matches: results.slice(offset, offset + limit),
  };
}
