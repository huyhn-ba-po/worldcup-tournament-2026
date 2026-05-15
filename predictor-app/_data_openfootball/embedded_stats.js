// === EMBEDDED STATS ===
// Auto-generated from build_embed_stats.js
// Sources: openfootball/* (CC0 Public Domain)
// Backtest WC2018+2022: 55.5% accuracy, Brier 0.5797, LogLoss 0.979
const STATS_DATA = {
  "meta": {
    "description": "Hybrid stats baseline for WC2026 prediction (Elo + Poisson + WC overlay)",
    "generated_at": "2026-05-15T14:52:14.929Z",
    "backtest_acc": 0.5547,
    "backtest_brier": 0.5797,
    "backtest_logloss": 0.979,
    "sources": [
      "openfootball/internationals (1872-2025, 47980 matches)",
      "openfootball/worldcup.json (1930-2026)"
    ]
  },
  "weights": {
    "elo": 0.35,
    "poisson": 0.35,
    "conf": 0.2,
    "wcoi": 0.1
  },
  "poisson_global_avg": 1.353,
  "poisson_home_boost": 1.25,
  "teams": {
    "Mexico": {
      "elo": 1834,
      "attack": 1.164,
      "defense": 0.557,
      "wcoi": -0.209,
      "wc_matches": 60
    },
    "South Africa": {
      "elo": 1653,
      "attack": 1.048,
      "defense": 0.675,
      "wcoi": -0.151,
      "wc_matches": 9
    },
    "South Korea": {
      "elo": 1830,
      "attack": 1.437,
      "defense": 0.542,
      "wcoi": -0.356,
      "wc_matches": 38
    },
    "Czech Republic": {
      "elo": 1750,
      "attack": 1.044,
      "defense": 0.901,
      "wcoi": -0.136,
      "wc_matches": 33
    },
    "Canada": {
      "elo": 1811,
      "attack": 1.485,
      "defense": 0.681,
      "wcoi": -0.49,
      "wc_matches": 6
    },
    "Bosnia & Herzegovina": {
      "elo": 1576,
      "attack": 0.94,
      "defense": 1.245,
      "wcoi": 0,
      "wc_matches": 0
    },
    "Qatar": {
      "elo": 1660,
      "attack": 1.411,
      "defense": 0.817,
      "wcoi": -0.535,
      "wc_matches": 3
    },
    "Switzerland": {
      "elo": 1828,
      "attack": 1.283,
      "defense": 0.872,
      "wcoi": -0.017,
      "wc_matches": 41
    },
    "Brazil": {
      "elo": 2001,
      "attack": 1.372,
      "defense": 0.456,
      "wcoi": 0.008,
      "wc_matches": 114
    },
    "Morocco": {
      "elo": 1844,
      "attack": 1.414,
      "defense": 0.378,
      "wcoi": -0.251,
      "wc_matches": 23
    },
    "Haiti": {
      "elo": 1643,
      "attack": 1.744,
      "defense": 0.852,
      "wcoi": -0.532,
      "wc_matches": 3
    },
    "Scotland": {
      "elo": 1749,
      "attack": 1.147,
      "defense": 0.892,
      "wcoi": -0.253,
      "wc_matches": 23
    },
    "United States": {
      "elo": 1855,
      "attack": 1.556,
      "defense": 0.563,
      "wcoi": -0.168,
      "wc_matches": 37
    },
    "Paraguay": {
      "elo": 1750,
      "attack": 0.628,
      "defense": 0.947,
      "wcoi": -0.02,
      "wc_matches": 27
    },
    "Australia": {
      "elo": 1805,
      "attack": 1.471,
      "defense": 0.56,
      "wcoi": -0.314,
      "wc_matches": 20
    },
    "Turkey": {
      "elo": 1762,
      "attack": 1.271,
      "defense": 0.887,
      "wcoi": -0.015,
      "wc_matches": 10
    },
    "Germany": {
      "elo": 1984,
      "attack": 1.887,
      "defense": 0.732,
      "wcoi": 0.012,
      "wc_matches": 117
    },
    "Curaçao": {
      "elo": 1522,
      "attack": 1.165,
      "defense": 0.742,
      "wcoi": 0,
      "wc_matches": 0
    },
    "Ivory Coast": {
      "elo": 1718,
      "attack": 1.205,
      "defense": 0.569,
      "wcoi": -0.246,
      "wc_matches": 9
    },
    "Ecuador": {
      "elo": 1893,
      "attack": 0.91,
      "defense": 0.814,
      "wcoi": 0.025,
      "wc_matches": 13
    },
    "Netherlands": {
      "elo": 1958,
      "attack": 1.612,
      "defense": 0.772,
      "wcoi": 0.074,
      "wc_matches": 55
    },
    "Japan": {
      "elo": 1945,
      "attack": 1.957,
      "defense": 0.51,
      "wcoi": -0.193,
      "wc_matches": 25
    },
    "Sweden": {
      "elo": 1774,
      "attack": 1.267,
      "defense": 0.816,
      "wcoi": -0.091,
      "wc_matches": 51
    },
    "Tunisia": {
      "elo": 1719,
      "attack": 1.066,
      "defense": 0.487,
      "wcoi": -0.269,
      "wc_matches": 18
    },
    "Belgium": {
      "elo": 1886,
      "attack": 1.714,
      "defense": 0.616,
      "wcoi": -0.039,
      "wc_matches": 51
    },
    "Egypt": {
      "elo": 1743,
      "attack": 1.172,
      "defense": 0.458,
      "wcoi": -0.481,
      "wc_matches": 7
    },
    "Iran": {
      "elo": 1866,
      "attack": 1.562,
      "defense": 0.531,
      "wcoi": -0.411,
      "wc_matches": 18
    },
    "New Zealand": {
      "elo": 1749,
      "attack": 2.462,
      "defense": 0.228,
      "wcoi": -0.257,
      "wc_matches": 6
    },
    "Spain": {
      "elo": 2104,
      "attack": 1.702,
      "defense": 0.536,
      "wcoi": -0.113,
      "wc_matches": 67
    },
    "Cape Verde": {
      "elo": 1583,
      "attack": 0.791,
      "defense": 0.715,
      "wcoi": 0,
      "wc_matches": 0
    },
    "Saudi Arabia": {
      "elo": 1650,
      "attack": 1.15,
      "defense": 0.601,
      "wcoi": -0.327,
      "wc_matches": 19
    },
    "Uruguay": {
      "elo": 1931,
      "attack": 0.989,
      "defense": 0.66,
      "wcoi": -0.03,
      "wc_matches": 59
    },
    "France": {
      "elo": 2026,
      "attack": 1.484,
      "defense": 0.576,
      "wcoi": 0.01,
      "wc_matches": 73
    },
    "Senegal": {
      "elo": 1798,
      "attack": 1.231,
      "defense": 0.397,
      "wcoi": -0.051,
      "wc_matches": 12
    },
    "Iraq": {
      "elo": 1697,
      "attack": 1.097,
      "defense": 0.69,
      "wcoi": -0.608,
      "wc_matches": 3
    },
    "Norway": {
      "elo": 1783,
      "attack": 1.238,
      "defense": 0.844,
      "wcoi": 0.015,
      "wc_matches": 8
    },
    "Argentina": {
      "elo": 2075,
      "attack": 1.2,
      "defense": 0.494,
      "wcoi": -0.052,
      "wc_matches": 88
    },
    "Algeria": {
      "elo": 1765,
      "attack": 1.577,
      "defense": 0.634,
      "wcoi": -0.203,
      "wc_matches": 13
    },
    "Austria": {
      "elo": 1854,
      "attack": 1.261,
      "defense": 0.842,
      "wcoi": -0.063,
      "wc_matches": 29
    },
    "Jordan": {
      "elo": 1703,
      "attack": 1.447,
      "defense": 0.603,
      "wcoi": 0,
      "wc_matches": 0
    },
    "Portugal": {
      "elo": 1989,
      "attack": 1.631,
      "defense": 0.537,
      "wcoi": -0.042,
      "wc_matches": 35
    },
    "DR Congo": {
      "elo": 1654,
      "attack": 1.043,
      "defense": 0.654,
      "wcoi": -0.525,
      "wc_matches": 3
    },
    "Uzbekistan": {
      "elo": 1767,
      "attack": 1.282,
      "defense": 0.559,
      "wcoi": 0,
      "wc_matches": 0
    },
    "Colombia": {
      "elo": 1971,
      "attack": 0.936,
      "defense": 0.62,
      "wcoi": -0.04,
      "wc_matches": 22
    },
    "England": {
      "elo": 1992,
      "attack": 1.656,
      "defense": 0.521,
      "wcoi": -0.116,
      "wc_matches": 74
    },
    "Croatia": {
      "elo": 1883,
      "attack": 1.195,
      "defense": 0.808,
      "wcoi": -0.106,
      "wc_matches": 30
    },
    "Ghana": {
      "elo": 1588,
      "attack": 0.983,
      "defense": 0.686,
      "wcoi": -0.197,
      "wc_matches": 15
    },
    "Panama": {
      "elo": 1754,
      "attack": 1.193,
      "defense": 0.919,
      "wcoi": -0.453,
      "wc_matches": 3
    }
  },
  "team_confederation": {
    "Argentina": "CONMEBOL",
    "Brazil": "CONMEBOL",
    "Uruguay": "CONMEBOL",
    "Colombia": "CONMEBOL",
    "Ecuador": "CONMEBOL",
    "Paraguay": "CONMEBOL",
    "Chile": "CONMEBOL",
    "Peru": "CONMEBOL",
    "Bolivia": "CONMEBOL",
    "Venezuela": "CONMEBOL",
    "France": "UEFA",
    "Spain": "UEFA",
    "England": "UEFA",
    "Portugal": "UEFA",
    "Netherlands": "UEFA",
    "Belgium": "UEFA",
    "Italy": "UEFA",
    "Germany": "UEFA",
    "Croatia": "UEFA",
    "Switzerland": "UEFA",
    "Denmark": "UEFA",
    "Austria": "UEFA",
    "Serbia": "UEFA",
    "Poland": "UEFA",
    "Turkey": "UEFA",
    "Scotland": "UEFA",
    "Sweden": "UEFA",
    "Norway": "UEFA",
    "Bosnia & Herzegovina": "UEFA",
    "Czech Republic": "UEFA",
    "Hungary": "UEFA",
    "Republic of Ireland": "UEFA",
    "Northern Ireland": "UEFA",
    "Wales": "UEFA",
    "Greece": "UEFA",
    "Romania": "UEFA",
    "Russia": "UEFA",
    "Mexico": "CONCACAF",
    "Canada": "CONCACAF",
    "United States": "CONCACAF",
    "Panama": "CONCACAF",
    "Haiti": "CONCACAF",
    "Curaçao": "CONCACAF",
    "Honduras": "CONCACAF",
    "Costa Rica": "CONCACAF",
    "Jamaica": "CONCACAF",
    "El Salvador": "CONCACAF",
    "Senegal": "CAF",
    "Morocco": "CAF",
    "Egypt": "CAF",
    "Tunisia": "CAF",
    "Nigeria": "CAF",
    "Ivory Coast": "CAF",
    "Algeria": "CAF",
    "Ghana": "CAF",
    "Mali": "CAF",
    "South Africa": "CAF",
    "Cape Verde": "CAF",
    "DR Congo": "CAF",
    "Cameroon": "CAF",
    "Angola": "CAF",
    "Zambia": "CAF",
    "Japan": "AFC",
    "South Korea": "AFC",
    "Iran": "AFC",
    "Australia": "AFC",
    "Saudi Arabia": "AFC",
    "Qatar": "AFC",
    "Uzbekistan": "AFC",
    "Jordan": "AFC",
    "Iraq": "AFC",
    "United Arab Emirates": "AFC",
    "New Zealand": "OFC"
  },
  "conf_stage_matrix": {
    "CONCACAF|UEFA|group": {
      "n": 75,
      "c1_win_rate": 0.16,
      "draw_rate": 0.267,
      "c2_win_rate": 0.573
    },
    "CONMEBOL|UEFA|group": {
      "n": 149,
      "c1_win_rate": 0.383,
      "draw_rate": 0.255,
      "c2_win_rate": 0.362
    },
    "CONCACAF|CONMEBOL|group": {
      "n": 22,
      "c1_win_rate": 0.182,
      "draw_rate": 0.136,
      "c2_win_rate": 0.682
    },
    "CONMEBOL|CONMEBOL|group": {
      "n": 9,
      "c1_win_rate": 0.556,
      "draw_rate": 0.111,
      "c2_win_rate": 0.333
    },
    "CONCACAF|CONMEBOL|knockout": {
      "n": 5,
      "c1_win_rate": 0,
      "draw_rate": 0.2,
      "c2_win_rate": 0.8
    },
    "CONMEBOL|UEFA|knockout": {
      "n": 76,
      "c1_win_rate": 0.395,
      "draw_rate": 0.263,
      "c2_win_rate": 0.342
    },
    "CONMEBOL|CONMEBOL|knockout": {
      "n": 12,
      "c1_win_rate": 0.75,
      "draw_rate": 0.083,
      "c2_win_rate": 0.167
    },
    "UEFA|UEFA|knockout": {
      "n": 87,
      "c1_win_rate": 0.494,
      "draw_rate": 0.253,
      "c2_win_rate": 0.253
    },
    "UEFA|UEFA|group": {
      "n": 144,
      "c1_win_rate": 0.528,
      "draw_rate": 0.257,
      "c2_win_rate": 0.215
    },
    "AFC|UEFA|group": {
      "n": 61,
      "c1_win_rate": 0.213,
      "draw_rate": 0.18,
      "c2_win_rate": 0.607
    },
    "CAF|UEFA|group": {
      "n": 75,
      "c1_win_rate": 0.187,
      "draw_rate": 0.307,
      "c2_win_rate": 0.507
    },
    "CAF|CONMEBOL|group": {
      "n": 28,
      "c1_win_rate": 0.143,
      "draw_rate": 0.143,
      "c2_win_rate": 0.714
    },
    "CONCACAF|UEFA|knockout": {
      "n": 10,
      "c1_win_rate": 0,
      "draw_rate": 0.4,
      "c2_win_rate": 0.6
    },
    "AFC|CONMEBOL|group": {
      "n": 20,
      "c1_win_rate": 0.1,
      "draw_rate": 0.15,
      "c2_win_rate": 0.75
    },
    "CAF|CONCACAF|group": {
      "n": 9,
      "c1_win_rate": 0.444,
      "draw_rate": 0.222,
      "c2_win_rate": 0.333
    },
    "OFC|UEFA|group": {
      "n": 3,
      "c1_win_rate": 0,
      "draw_rate": 0.333,
      "c2_win_rate": 0.667
    },
    "AFC|CONCACAF|group": {
      "n": 10,
      "c1_win_rate": 0.1,
      "draw_rate": 0.1,
      "c2_win_rate": 0.8
    },
    "CAF|UEFA|knockout": {
      "n": 13,
      "c1_win_rate": 0.077,
      "draw_rate": 0.462,
      "c2_win_rate": 0.462
    },
    "CAF|CONMEBOL|knockout": {
      "n": 3,
      "c1_win_rate": 0,
      "draw_rate": 0.667,
      "c2_win_rate": 0.333
    },
    "AFC|CAF|group": {
      "n": 18,
      "c1_win_rate": 0.333,
      "draw_rate": 0.389,
      "c2_win_rate": 0.278
    },
    "AFC|UEFA|knockout": {
      "n": 9,
      "c1_win_rate": 0,
      "draw_rate": 0.333,
      "c2_win_rate": 0.667
    },
    "AFC|CONMEBOL|knockout": {
      "n": 4,
      "c1_win_rate": 0,
      "draw_rate": 0.25,
      "c2_win_rate": 0.75
    }
  },
  "stage_params": {
    "group": {
      "matches": 696,
      "avg_goals_per_match": 2.65,
      "draw_rate": 0.249
    },
    "r16_r32": {
      "matches": 80,
      "avg_goals_per_match": 2.44,
      "draw_rate": 0.325
    },
    "quarterfinal": {
      "matches": 70,
      "avg_goals_per_match": 2.66,
      "draw_rate": 0.286
    },
    "semifinal": {
      "matches": 38,
      "avg_goals_per_match": 3.11,
      "draw_rate": 0.237
    },
    "final": {
      "matches": 27,
      "avg_goals_per_match": 3.78,
      "draw_rate": 0.333
    },
    "third": {
      "matches": 20,
      "avg_goals_per_match": 3.7,
      "draw_rate": 0.05
    }
  },
  "host_boosts": {
    "Mexico|Estadio Azteca": 200,
    "Mexico|Guadalajara (Zapopan)": 180,
    "Mexico|Monterrey (Guadalupe)": 170,
    "United States|*": 150,
    "Canada|*": 130
  }
};
