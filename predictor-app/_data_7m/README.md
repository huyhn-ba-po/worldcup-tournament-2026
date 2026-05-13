# WC2026 data from 7m.com.cn

Scrape lịch thi đấu + bảng xếp hạng + tên đội (zh / en / vi) từ trang
[7m.com.cn/2026worldcup](https://www.7m.com.cn/2026worldcup/).

## Nguồn

Trang web là SPA, data load qua AJAX từ API endpoint:

```
https://txt-api.7m.com.cn/specials/worldcup2026/{games|standings|live}?lan={1|3|6}
```

- `lan=1` Chinese · `lan=3` English · `lan=6` Vietnamese
- Header bắt buộc: `Referer: https://www.7m.com.cn/2026worldcup/`

URL pattern này tìm được bằng cách đọc:
- `https://www.7m.com.cn/2026worldcup/static/js/base.js` → `urlLink = '//txt-api.7m.com.cn/specials/worldcup2026'`
- `https://www.7m.com.cn/2026worldcup/static/js/fixtures.js` → `common.ajaxFn('get', urlLink + '/games', {lan})`

## Files

| File | Mô tả |
|------|-------|
| `games_zh.json` / `games_en.json` / `games_vi.json` | Raw response của `/games` — 104 trận (72 vòng bảng + 32 knockout) + 112 team names |
| `standings_zh.json` / `standings_en.json` | Raw response của `/standings` — 12 bảng A–L, mỗi bảng 4 đội với W/D/L/GF/GA/GD/Pts |
| `live.json` | Raw `/live` — chi tiết các trận đang/đã đá (sự kiện, bàn thắng…) |
| `wc2026_clean.json` | **File chính để dùng** — đã parse, đa ngôn ngữ, có giờ VN, mapping bảng/team |
| `fetch_and_parse.js` | Script Node.js: fetch + parse → wc2026_clean.json |

## Game tuple schema (raw)

```
[0] matchId         '5001993'
[1] stageId         '454644' (group) / '454645' (R32) / ... → xem STAGE_NAMES trong fetch_and_parse.js
[2] group           'A'..'L' | '' (knockout)
[3] round/leg       '17' (chưa rõ ý nghĩa)
[4] kickoff time    '2026-06-12 03:00:00' giờ Bắc Kinh UTC+8
[5] end time        '1900-01-01 00:00:00' (placeholder nếu chưa đá)
[6] homeTeamId      '214'
[7] awayTeamId      '209'
[8] homeScore       '0'
[9] awayScore       '0'
[10] status         '0' chưa đá / '1' đã đá xong
[11..18] phụ        tỉ số hiệp 1, OT/Pen
```

## Cách chạy

```bash
node fetch_and_parse.js              # fetch fresh + parse
node fetch_and_parse.js --no-fetch   # chỉ parse từ JSON đã có
```

Output `wc2026_clean.json` có structure:

```json
{
  "source": "7m.com.cn (https://txt-api.7m.com.cn/specials/worldcup2026)",
  "fetchedAt": "2026-05-13T...",
  "stages": { "454644": { "en": "Group Stage", ... }, ... },
  "teams": [ { "id": "208", "name_en": "Korea Republic", "name_vi": "Hàn Quốc", "name_zh": "韩国", "group": "A" }, ... ],
  "matches": [
    {
      "matchId": "5001993", "stageId": "454644", "group": "A",
      "kickoffBeijing": "2026-06-12 03:00:00",
      "kickoffISO": "2026-06-12T03:00:00+08:00",
      "kickoffVN": "2026-06-12 02:00",
      "home": { "name_en": "Mexico", ... }, "away": { ... },
      "homeScore": 0, "awayScore": 0, "finished": false
    }
  ],
  "standings": { "A": [ { "teamId": "208", "name_en": "Korea Republic", "played": 0, ... } ] }
}
```

## Limitations

- 7m không expose **AI prediction / odds** qua endpoint công khai (data hiển thị trên trang là rendered server-side hoặc qua endpoint khác chưa map được).
- Trường `[3]` trong game tuple chưa rõ ý nghĩa (giá trị `'17'` cho mọi trận).
- Match number (1–104 theo FIFA official) **không có** trong response — phải tự gán theo thứ tự kickoff hoặc cross-ref với file `raw/misc/format_fixture_data.csv` trong repo gốc.
