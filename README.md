# Daily Habit Tracker

A personal habit and metrics tracker built entirely inside Google Sheets and Google Apps Script — no third-party services, no subscriptions, no app stores. Log daily metrics from a mobile-optimised web form bookmarked to your iPad home screen.

---

## What it does

- Logs daily metrics: office attendance (yes/no), weight, and end-of-month savings
- Tracks your check-in streak and total check-ins with live motivational nudges
- Pre-fills today's form if you've already logged, preventing duplicates
- Stores everything in a Google Sheet — one row per day, fully yours
- Works as a standalone iPad app via Safari's "Add to Home Screen"

---

## Files

| File | Purpose |
|------|---------|
| `Code.gs` | Server-side Apps Script — all Sheet read/write logic, streak calculation, web app entry point |
| `Index.html` | Client-side UI — the daily check-in form, stats bar, nudge messages |
| `ImportOldData.gs` | One-time migration script for importing historical data from existing Sheet tabs |

---

## Setup

### 1. Create your Google Sheet

Open Google Sheets and create a new spreadsheet. The `Daily Log` tab will be created automatically on first submit.

### 2. Add the scripts

Go to **Extensions → Apps Script** and:

- Paste `Code.gs` into the default `Code.gs` tab
- Click `+` to add a new HTML file, name it `Index` (Apps Script adds `.html`), paste `Index.html`
- Optionally add `ImportOldData.gs` as another script file if you have historical data to import

### 3. Deploy as a web app

1. Click **Deploy → New deployment**
2. Type: **Web app**
3. Execute as: **Me**
4. Who has access: **Only myself** (or adjust as needed)
5. Click **Deploy** and copy the `/exec` URL

### 4. Add to iPad home screen

1. Open the URL in **Safari** on your iPad
2. Tap the **Share** button → **Add to Home Screen**
3. Name it "Daily Check-in" → tap **Add**

It opens full-screen with no browser chrome — feels like a native app.

---

## Importing historical data

If you have existing data in other Sheet tabs, update the config at the top of `ImportOldData.gs`:

```javascript
const WORK_SHEET_NAME   = "Work Tracker";   // your tab name
const WEIGHT_SHEET_NAME = "Weight Tracker"; // your tab name
const LOG_SHEET_NAME    = "Daily Log";
```

Then run the `importOldData` function from the Apps Script editor. It will:

- Normalise date formats (`M/D/YY` and `M/D/YYYY` both handled)
- Convert `TRUE`/`FALSE` checkboxes to `Yes`/`No`
- Treat weight values of `0` as blank
- Skip any dates already in the Daily Log
- Sort the log by date ascending
- Show a confirmation popup with rows inserted vs skipped

---

## Server functions

| Function | Description |
|----------|-------------|
| `doGet(e)` | Serves the web app (Index.html) when the URL is visited |
| `submitEntry(data)` | Writes or overwrites today's row in the Daily Log |
| `getTodayEntry()` | Returns today's existing entry for form pre-fill on load |
| `getStats()` | Returns total check-ins and current consecutive day streak |
| `getSheetUrl()` | Returns the Sheet URL so the form can link to it |
| `findRowByDate()` | Internal helper — finds a row by date string |

---

## Adding new metrics

To track something new (steps, sleep, mood, etc.):

1. **Daily Log sheet** — add a new column header in row 1
2. **Code.gs** — add the field to `submitEntry()`, `getTodayEntry()`, and the row array
3. **Index.html** — add a new `.card-row` with the appropriate input type (toggle for boolean, number input for numeric)
4. **Redeploy** as a new version in Apps Script

---

## Analysing your data

Since everything lives in Google Sheets, analysis is straightforward:

- `COUNTIF(B2:B200, "Yes")` — total office days
- `AVERAGE(C2:C200)` — average weight
- `SPARKLINE(C2:C200)` — inline weight trend
- Insert a line chart on the Date + Weight columns for a visual trend
- Connect to [Looker Studio](https://lookerstudio.google.com) for a live dashboard

---

## Colour palette

| Hex | Name | Role |
|-----|------|------|
| `#DF546A` | Coral | Primary button, streak counter |
| `#85566B` | Plum | Headings, body text |
| `#D7B29A` | Sand | Labels, borders, hints |
| `#C7D8D4` | Sage | Yes toggle, success states |
| `#F7C57C` | Gold | Nudge strip accent |

---

## Deployment updates

Any change to `Index.html` or `Code.gs` requires a redeploy:

1. **Deploy → Manage deployments**
2. Click the pencil icon on your existing deployment
3. Set version to **New version**
4. Click **Deploy**

Same URL — no need to update your iPad shortcut.

---

## Known limitations

- Requires an internet connection (not an offline PWA)
- Streak counts calendar days — a missed weekend breaks the streak
- Savings field only appears on the last day of the month
- Changing the home screen icon requires removing and re-adding the shortcut

---

## Tech stack

- Google Apps Script (server)
- Vanilla HTML / CSS / JS (client)
- Google Sheets (database)
- No frameworks, no dependencies, no external APIs
