# openfootball/ — Public Domain Data cho AI Prediction

Aggregate data từ 3 repo của tổ chức [openfootball](https://github.com/openfootball)
(license Public Domain CC0, 583 ⭐ trên repo chính, update hàng ngày).

## Nguồn (đã clone shallow)

| Repo | Mô tả | Kích thước |
|------|-------|------------|
| [`worldcup.json/`](worldcup.json/) | WC 1930-2026 ở format JSON sạch (fixtures + grounds + dates) | 578 KB |
| [`internationals/`](internationals/) | Mirror của Mart Jürisoo Kaggle dataset "International results 1872-2024" — 182 tournaments | 8.9 MB |
| [`worldcup.more/`](worldcup.more/) | WC chi tiết 1930-2022 với goal scorers + lineups + substitutions + penalties | 929 KB |

## File đã parse (chính)

| File | Mô tả | Kích thước | Match count |
|------|-------|-----------|-------------|
| **`all_internationals.json`** | 47,980 trận quốc tế 1872-2025 (tất cả friendly + qualifier + tournament) | 7.7 MB | 47,980 |
| **`wc_all_matches.json`** | 1,069 trận World Cup (1930-2026, có 104 trận 2026 chưa đá) | 398 KB | 1,069 |
| `parse_aggregate.js` | Script Node.js parse Football.TXT → JSON | — | — |

## Schema

### `all_internationals.json`

```json
{
  "source": "openfootball/internationals",
  "license": "Public Domain",
  "stats": { "tournaments": 182, "files": 1868, "matches": 47980 },
  "yearRange": [1872, 2025],
  "matches": [
    {
      "date": "2010-06-11",
      "team1": "South Africa",
      "team2": "Mexico",
      "score1": 1,
      "score2": 1,
      "note": null,           // "aet" | "pen 5-4" | null
      "venue": "Johannesburg, South Africa",
      "tournament": "fifa_world_cup",
      "year": 2010
    }
  ]
}
```

### `wc_all_matches.json`

```json
{
  "matches": [
    {
      "year": 2026,
      "round": "Matchday 1",
      "date": "2026-06-11",
      "time": "13:00 UTC-6",
      "team1": "Mexico",
      "team2": "South Africa",
      "group": "Group A",
      "ground": "Mexico City"
    }
  ]
}
```

## Coverage by decade

```
1870s:    13    1950s: 1,651    2010s: 9,752
1880s:    55    1960s: 2,980    2020s: 4,652
1890s:    59    1970s: 4,132    
1900s:   135    1980s: 5,024    Total: 47,980
1910s:   320    1990s: 6,947
1920s:   817    2000s: 9,525
1930s: 1,085
1940s:   833
```

## Verification spot-check

H2H Mexico vs South Africa (trận khai mạc WC2026):
```
1993-10-06 | Mexico 4-0 South Africa (friendly)
2000-06-07 | Mexico 4-2 South Africa (usa_cup)
2005-07-08 | South Africa 2-1 Mexico (gold_cup)
2010-06-11 | South Africa 1-1 Mexico (fifa_world_cup)  ← WC2010 opener!
```

So với data có sẵn trong repo (`raw/misc/clean_fifa_worldcup_historical_data.csv` chỉ có **966 trận WC**), data mới có **47,980 trận quốc tế** — tăng ~50 lần data cho phân tích H2H, time-decayed form, cross-tournament strength.

## Cách dùng cho AI Prediction

```js
const intl = require('./_data_openfootball/all_internationals.json');

// H2H: tất cả lần Mexico gặp South Africa
function getH2H(t1, t2) {
  return intl.matches.filter(m =>
    (m.team1 === t1 && m.team2 === t2) ||
    (m.team1 === t2 && m.team2 === t1)
  );
}

// Recent form: 10 trận gần nhất của 1 đội
function getRecentForm(team, since = '2024-01-01') {
  return intl.matches
    .filter(m => m.date >= since && (m.team1 === team || m.team2 === team))
    .slice(-10);
}

// Time-decayed win rate: trọng số 0.95^(2026 - year)
function getTimeDecayedStrength(team) {
  const games = intl.matches.filter(m => m.team1 === team || m.team2 === team);
  let weighted = 0, total = 0;
  for (const g of games) {
    const decay = Math.pow(0.95, 2026 - g.year);
    const isHome = g.team1 === team;
    const won = isHome ? g.score1 > g.score2 : g.score2 > g.score1;
    const drew = g.score1 === g.score2;
    weighted += (won ? 3 : drew ? 1 : 0) * decay;
    total += 3 * decay;
  }
  return weighted / total;
}
```

## Gap còn thiếu (Phase 2 sẽ làm)

❌ **Đội hình (squads) WC2026** — openfootball không có, cần scrape từ Wikipedia hoặc FIFA official
❌ **Player stats club level 2024-2026** — cần FBref (free scrape) hoặc API-Football (paid)
❌ **FIFA Ranking real-time** — cần scrape FIFA hoặc dùng Wikipedia
⚠️ **2025-2026 form** — openfootball cập nhật đến hết 2024 + một số trận đầu 2025 (240 trận friendlies + ASEAN Championship). Cần fetch định kỳ.

## Refresh data

```bash
# Pull latest từ openfootball
cd worldcup.json && git pull && cd ..
cd internationals && git pull && cd ..
cd worldcup.more && git pull && cd ..

# Re-parse
node parse_aggregate.js
```

## Notes

- File `worldcup.more/` chưa parse (Football.TXT phức tạp với lineups multi-line) — Phase 2 sẽ làm parser cho goal scorers + lineups + substitutions
- Tên đội đôi khi khác nhau giữa các tournaments ("South Korea" vs "Korea Republic", "Turkey" vs "Turkiye"...) — Phase 2 cần normalize bằng alias mapping
