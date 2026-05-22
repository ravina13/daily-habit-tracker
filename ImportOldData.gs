// ─── CONFIG ───────────────────────────────────────────────────────────────────
// Match these exactly to your tab names (case-sensitive)
const WORK_SHEET_NAME   = "Work Tracker";
const WEIGHT_SHEET_NAME = "Weight Tracker";
const LOG_SHEET_NAME    = "Daily Log";

// Column positions in your source sheets (1-indexed)
// Work Tracker:   A=Day, B=Weekday, C=Work, D=Furlough, E=Attendance
const WORK_COL_DATE       = 1; // A - Day
const WORK_COL_ATTENDANCE = 5; // E - Attendance

// Weight Tracker: A=Date, B=Day, C=Weight Lb, D=Weight Kg, E=Workout
const WEIGHT_COL_DATE   = 1; // A - Date
const WEIGHT_COL_LB     = 3; // C - Weight Lb

// ─── MAIN: run this function manually ─────────────────────────────────────────
function importOldData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const tz = Session.getScriptTimeZone();

  const workSheet   = ss.getSheetByName(WORK_SHEET_NAME);
  const weightSheet = ss.getSheetByName(WEIGHT_SHEET_NAME);
  let   logSheet    = ss.getSheetByName(LOG_SHEET_NAME);

  if (!workSheet)   { SpreadsheetApp.getUi().alert('Sheet not found: ' + WORK_SHEET_NAME);   return; }
  if (!weightSheet) { SpreadsheetApp.getUi().alert('Sheet not found: ' + WEIGHT_SHEET_NAME); return; }

  // Create Daily Log if it doesn't exist yet
  if (!logSheet) {
    logSheet = ss.insertSheet(LOG_SHEET_NAME);
    const header = logSheet.getRange(1, 1, 1, 4);
    header.setValues([["Date", "In Office", "Weight (lbs)", "Savings ($)"]]);
    header.setFontWeight("bold");
    header.setBackground("#f3f3f3");
    logSheet.setFrozenRows(1);
    logSheet.setColumnWidth(1, 140);
    logSheet.setColumnWidth(2, 100);
    logSheet.setColumnWidth(3, 120);
    logSheet.setColumnWidth(4, 110);
  }

  // ── 1. Read existing Daily Log dates to avoid duplicates ──────────────────
  const existingDates = {};
  const logData = logSheet.getDataRange().getValues();
  for (let i = 1; i < logData.length; i++) {
    const d = logData[i][0];
    if (d) {
      const key = d instanceof Date
        ? Utilities.formatDate(d, tz, "yyyy-MM-dd")
        : normalizeDate(String(d));
      existingDates[key] = i + 1; // row number (1-indexed)
    }
  }

  // ── 2. Read Work Tracker → map: dateKey → inOffice ────────────────────────
  const workMap = {};
  const workData = workSheet.getDataRange().getValues();
  for (let i = 1; i < workData.length; i++) {
    const raw = workData[i][WORK_COL_DATE - 1];
    if (!raw) continue;
    const key = raw instanceof Date
      ? Utilities.formatDate(raw, tz, "yyyy-MM-dd")
      : normalizeDate(String(raw));
    if (!key) continue;

    const attendance = workData[i][WORK_COL_ATTENDANCE - 1];
    // Checkboxes come through as TRUE/FALSE booleans
    workMap[key] = attendance === true ? "Yes" : attendance === false ? "No" : "";
  }

  // ── 3. Read Weight Tracker → map: dateKey → weightLb ─────────────────────
  const weightMap = {};
  const weightData = weightSheet.getDataRange().getValues();
  for (let i = 1; i < weightData.length; i++) {
    const raw = weightData[i][WEIGHT_COL_DATE - 1];
    if (!raw) continue;
    const key = raw instanceof Date
      ? Utilities.formatDate(raw, tz, "yyyy-MM-dd")
      : normalizeDate(String(raw));
    if (!key) continue;

    const lb = weightData[i][WEIGHT_COL_LB - 1];
    // Treat 0 or empty as blank
    weightMap[key] = (lb && lb !== 0) ? lb : "";
  }

  // ── 4. Merge all unique dates from both sheets ─────────────────────────────
  const allDates = Array.from(new Set([
    ...Object.keys(workMap),
    ...Object.keys(weightMap)
  ])).sort();

  let inserted = 0;
  let skipped  = 0;

  for (const dateKey of allDates) {
    const inOffice = workMap[dateKey]   !== undefined ? workMap[dateKey]   : "";
    const weight   = weightMap[dateKey] !== undefined ? weightMap[dateKey] : "";

    const row = [dateKey, inOffice, weight, ""];

    if (existingDates[dateKey]) {
      // Date already in log — skip (don't overwrite existing entries)
      skipped++;
    } else {
      logSheet.appendRow(row);
      existingDates[dateKey] = true; // mark as written
      inserted++;
    }
  }

  // ── 5. Sort Daily Log by date ascending (keep header in place) ─────────────
  const lastRow = logSheet.getLastRow();
  if (lastRow > 2) {
    logSheet.getRange(2, 1, lastRow - 1, 4).sort({ column: 1, ascending: true });
  }

  SpreadsheetApp.getUi().alert(
    '✓ Import complete\n\n' +
    'Rows inserted: ' + inserted + '\n' +
    'Rows skipped (already in log): ' + skipped
  );
}

// ─── HELPER: normalise date strings like "4/6/26" or "4/6/2026" ───────────────
function normalizeDate(str) {
  str = str.trim();
  if (!str) return null;

  // Matches M/D/YY or M/D/YYYY
  const match = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (!match) return null;

  let [, m, d, y] = match;
  if (y.length === 2) y = "20" + y;

  return y + "-" + m.padStart(2, "0") + "-" + d.padStart(2, "0");
}
