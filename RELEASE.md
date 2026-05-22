# Daily Habit Tracker — Product Release Document
**Version:** 1.0
**Release date:** May 2026
**Platform:** Google Apps Script (Web App) + iPad Home Screen
**Data store:** Google Sheets — Daily Log tab

---

## 1. Product overview

The Daily Habit Tracker is a personal productivity tool built entirely inside Google Sheets and Google Apps Script. It provides a mobile-optimised web form — bookmarked to the iPad home screen as a standalone app — for logging daily metrics, tracking streaks, and staying motivated through consistent check-ins.

The product has two components that work together:

- A web form (`Index.html`) served via Google Apps Script as a web app
- A Google Sheet (`Daily Log` tab) that acts as the database, storing every entry

No third-party services, subscriptions, or app stores are required. Everything lives in your Google account.

---

## 2. Features

### 2.1 Daily check-in form

The form is designed for speed — a 10-second daily interaction. It includes three data fields:

- **Office attendance** — yes/no toggle (pill-style buttons)
- **Weight** — numeric input in lbs, with a hint to log before breakfast for consistency
- **Monthly savings** — numeric input in dollars, shown only on the last day of each month

The form auto-detects the last day of the current month (accounting for February, 30-day months, etc.) and surfaces the savings field automatically. No manual switching required.

### 2.2 Streak and motivation system

Above the form, two stat cards display at a glance:

- **Total check-ins** — all-time count of logged days
- **Day streak** — consecutive days logged without a break (shown in coral red)

A nudge message updates dynamically based on the current streak. The copy changes at key milestones — day 1, days 2–3, days 4–7, days 8–14, days 15–29, days 30–59, and 60+. After submitting, the stats refresh immediately to reflect the new streak.

### 2.3 Smart pre-fill

On page load the form checks whether today has already been logged. If an entry exists, the fields are pre-populated with the saved values and a quiet notice informs the user that resubmitting will overwrite the entry. This prevents accidental duplicates while allowing corrections.

### 2.4 iPad home screen app

The web app URL can be saved to the iPad home screen via Safari (Share → Add to Home Screen). The page includes:

- A custom `apple-touch-icon` (180×180px, coral background with the user's character)
- A `theme-color` meta tag (`#DF546A`) to tint the Safari browser chrome
- A viewport meta tag and full-screen layout so it feels native with no browser chrome visible when launched from the home screen

### 2.5 Open Daily Log link

Both the form and the post-submit success screen include an "Open Daily Log" button. This fetches the live Google Sheet URL from the server and opens it in a new tab, giving direct access to the data without navigating away from the app.

---

## 3. Architecture

| File | Type | Purpose |
|------|------|---------|
| `Code.gs` | Server-side (Apps Script) | Handles all Sheet read/write operations, serves the web app, computes stats |
| `Index.html` | Client-side (HTML/CSS/JS) | Renders the UI, handles user interactions, calls server functions via `google.script.run` |
| `Daily Log` | Google Sheet (tab) | Persistent data store — one row per day, four columns: Date, In Office, Weight (lbs), Savings ($) |

---

## 4. Server functions (Code.gs)

All data operations run server-side in `Code.gs` and are called from the browser using `google.script.run`. The client never touches the Sheet directly.

| Function | What it does |
|----------|-------------|
| `doGet(e)` | Entry point for the web app. Serves `Index.html` when the URL is visited. Configured with ALLOWALL X-Frame options for iPad compatibility. |
| `submitEntry(data)` | Writes or updates a row in the Daily Log. Accepts an object with `inOffice`, `weight`, and `savings` fields. If a row for today already exists it overwrites it; otherwise it appends a new row. Returns a status of `saved` or `updated`. |
| `getTodayEntry()` | Reads today's row from the Daily Log (if it exists) and returns the values so the form can pre-fill on page load. Returns `null` if no entry exists for today. |
| `getStats()` | Scans all dates in the Daily Log and returns two numbers: `total` (all-time count of logged days) and `streak` (consecutive days logged going backwards from today, allowing today to be missing without breaking the streak). |
| `getSheetUrl()` | Returns the URL of the active Google Sheet so the client can open it in a new tab via the 'Open Daily Log' button. |
| `findRowByDate(sheet, dateStr)` | Internal helper. Searches the Daily Log for a row matching a `yyyy-MM-dd` date string and returns its 1-indexed row number, or `-1` if not found. Used by `submitEntry` and `getTodayEntry`. |

---

## 5. Design system

| Swatch | Hex | Name | Role in UI |
|--------|-----|------|-----------|
| 🟥 | `#DF546A` | Coral | Primary action button, streak counter, heading accents |
| 🟫 | `#85566B` | Plum | Main headings, body text, date display, dark elements |
| 🟧 | `#D7B29A` | Sand | Labels, borders, hints, secondary text, metadata |
| 🟩 | `#C7D8D4` | Sage | Yes toggle active state, success confirmation circle |
| 🟨 | `#F7C57C` | Gold | Nudge strip left border, motivational accent |

---

## 6. Historical data import

An optional one-time import script (`ImportOldData.gs`) was created to migrate data from two pre-existing Google Sheet tabs:

- **Work Tracker** — columns: Day (date), Weekday, Work, Furlough, Attendance (checkbox TRUE/FALSE)
- **Weight Tracker** — columns: Date, Day, Weight Lb, Weight Kg, Workout

The script reads both tabs, normalises date formats (`M/D/YY` and `M/D/YYYY` both handled), converts `TRUE`/`FALSE` checkboxes to `Yes`/`No`, treats weight values of `0` as blank, deduplicates against any existing Daily Log entries, merges on date, appends new rows, and sorts the log by date ascending. A confirmation popup reports rows inserted vs skipped.

---

## 7. Deployment

### Initial setup

1. Open your Google Sheet → Extensions → Apps Script
2. Paste `Code.gs` into the default script tab
3. Add a new HTML file named `Index` (Apps Script appends `.html`) and paste `Index.html`
4. Deploy → New deployment → Web app → Execute as: Me → Who has access: Only myself → Deploy
5. Copy the `/exec` URL and open it in Safari on iPad
6. Tap Share → Add to Home Screen

### Updating after changes

1. Edit the relevant file(s) in Apps Script
2. Deploy → Manage deployments → pencil icon → set Version to **New version** → Deploy

The same URL serves the updated version immediately. No need to re-add the iPad shortcut unless the icon changes.

---

## 8. Future scope

### 8.1 Adding new habits and goals to track

The tracker is designed to be extended. Adding a new metric requires changes in two places:

#### Step 1 — Add a column to the Daily Log sheet
In your Google Sheet, add a new column header to row 1 of the Daily Log tab (e.g. "Steps", "Sleep (hrs)", "Water (glasses)"). Note the column number.

#### Step 2 — Update Code.gs
- In `submitEntry()`, add the new field to the row array in the correct column position
- In `getTodayEntry()`, add the new field to the returned object
- If the field is conditional (e.g. only on weekdays), add the same last-day-style logic

#### Step 3 — Update Index.html
- Add a new `.card-row` block inside the form card with a label and the appropriate input type
- For boolean habits (e.g. "Did you exercise?") use the existing `toggle-pair` pattern
- For numeric metrics use the `num-wrap` + `input` pattern
- For text entries (e.g. mood notes) use a standard text input or select dropdown
- Pass the new field in the `data` object inside `submitForm()`
- Pre-fill it in the `getTodayEntry` success handler

#### Step 4 — Redeploy
Deploy a new version in Apps Script. Existing rows will simply have a blank value in the new column.

**Example metrics well-suited for this format:**

- Steps (number) — log from Health app at end of day
- Sleep hours (decimal) — before breakfast alongside weight
- Mood (1–5 scale) — use five toggle buttons
- Water glasses (number) — end of day
- No alcohol (boolean) — yes/no toggle
- Reading (boolean or minutes) — daily habit check

---

### 8.2 Analysing the Daily Log

Because the data lives in Google Sheets, analysis can be done without any code using built-in features, or enhanced with Apps Script for more depth.

#### Quick analysis with Google Sheets formulas

| Formula | What it returns |
|---------|----------------|
| `=COUNTIF(B2:B200, "Yes")` | Total office days |
| `=AVERAGE(C2:C200)` | Average weight across all logged days |
| `=SPARKLINE(C2:C200)` | Inline weight trend in a single cell |
| `=MAXIFS(C2:C200, C2:C200, ">"&0)` | Heaviest recorded weight |
| `=MINIFS(C2:C200, C2:C200, ">"&0)` | Lightest recorded weight |
| `=COUNTIFS(A2:A200, ">="&DATE(2026,5,1), A2:A200, "<="&DATE(2026,5,31))` | Check-ins in a given month |

#### Charts

Select the Date and Weight columns → Insert → Chart → Line chart for a weight trend over time. Add a trendline to see overall direction. Repeat for any other numeric column.

#### Monthly summary tab (recommended next step)

Create a new tab called `Monthly Summary`. Use `AVERAGEIFS` and `COUNTIFS` to pull per-month aggregates automatically. Add a chart per metric. This becomes a passive dashboard that updates every time new data is logged.

#### Apps Script analysis functions (future)

- A `getMonthlyStats()` function that returns averages, highs, lows, and office day count for a given month — surfaced in a new "Stats" view in the app
- A `getWeightTrend()` function using linear regression over the last 30 days to show whether weight is trending up, down, or flat
- Weekly email digest via a time-based trigger that runs every Sunday and sends a summary to Gmail
- Goal tracking — store a target weight or savings goal in a Settings tab and show progress as a percentage in the app header

#### Looker Studio

For richer visualisation, connect the Google Sheet to [Looker Studio](https://lookerstudio.google.com) (free). Point it at the Daily Log tab and build charts with date filters, moving averages, and scorecards. The dashboard auto-refreshes as new entries are logged.

---

## 9. Known limitations

- The app requires an internet connection — it is a live web app, not an offline PWA
- Google Apps Script has a 6-minute execution limit per call (not a concern for this use case but relevant if bulk operations are added)
- The `apple-touch-icon` is embedded as base64 in the HTML; changing it requires a redeploy and re-adding the home screen shortcut
- The streak counter counts calendar days, not weekdays — a missed weekend will break a streak
- Savings field only appears on the last calendar day of the month; mid-month corrections require direct Sheet editing

---

*Daily Habit Tracker v1.0 · May 2026*
