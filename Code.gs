// ─── CONFIG ───────────────────────────────────────────────────────────────────
const DATA_SHEET_NAME = "Daily Log";

// ─── WEB APP ENTRY POINT ──────────────────────────────────────────────────────
function doGet(e) {
  return HtmlService
    .createHtmlOutputFromFile("Index")
    .setTitle("Daily Check-in")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ─── SUBMIT ENTRY ─────────────────────────────────────────────────────────────
function submitEntry(data) {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  let sheet   = ss.getSheetByName(DATA_SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(DATA_SHEET_NAME);
    const header = sheet.getRange(1, 1, 1, 4);
    header.setValues([["Date", "In Office", "Weight (lbs)", "Savings ($)"]]);
    header.setFontWeight("bold");
    header.setBackground("#f3f3f3");
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 140);
    sheet.setColumnWidth(2, 100);
    sheet.setColumnWidth(3, 120);
    sheet.setColumnWidth(4, 110);
  }

  const today    = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
  const existing = findRowByDate(sheet, today);

  const row = [
    today,
    data.inOffice !== null ? (data.inOffice ? "Yes" : "No") : "",
    data.weight   !== ""   ? parseFloat(data.weight)        : "",
    data.savings  !== null && data.savings !== "" ? parseInt(data.savings) : ""
  ];

  if (existing > 0) {
    sheet.getRange(existing, 1, 1, 4).setValues([row]);
    return { status: "updated", date: today };
  } else {
    sheet.appendRow(row);
    return { status: "saved", date: today };
  }
}

// ─── GET TODAY'S ENTRY (pre-fill on load) ─────────────────────────────────────
function getTodayEntry() {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(DATA_SHEET_NAME);
  if (!sheet) return null;

  const today  = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
  const rowNum = findRowByDate(sheet, today);
  if (rowNum < 0) return null;

  const row = sheet.getRange(rowNum, 1, 1, 4).getValues()[0];
  return {
    inOffice: row[1] === "Yes" ? true : row[1] === "No" ? false : null,
    weight:   row[2] !== "" ? row[2] : "",
    savings:  row[3] !== "" ? row[3] : ""
  };
}

// ─── GET STATS: total check-ins + current streak ──────────────────────────────
function getStats() {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(DATA_SHEET_NAME);
  if (!sheet || sheet.getLastRow() < 2) return { total: 0, streak: 0 };

  const tz   = Session.getScriptTimeZone();
  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();

  const loggedDates = new Set();
  for (const row of data) {
    if (!row[0]) continue;
    const key = row[0] instanceof Date
      ? Utilities.formatDate(row[0], tz, "yyyy-MM-dd")
      : String(row[0]).trim();
    if (key) loggedDates.add(key);
  }

  const total = loggedDates.size;

  // Walk backwards from today counting consecutive logged days
  let streak  = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 365; i++) {
    const d   = new Date(today);
    d.setDate(today.getDate() - i);
    const key = Utilities.formatDate(d, tz, "yyyy-MM-dd");
    if (loggedDates.has(key)) {
      streak++;
    } else {
      if (i === 0) continue; // today not yet logged — don't break streak
      break;
    }
  }

  return { total, streak };
}

// ─── GET SHEET URL ────────────────────────────────────────────────────────────
function getSheetUrl() {
  return SpreadsheetApp.getActiveSpreadsheet().getUrl();
}

// ─── HELPER ───────────────────────────────────────────────────────────────────
function findRowByDate(sheet, dateStr) {
  const data = sheet.getDataRange().getValues();
  const tz   = Session.getScriptTimeZone();
  for (let i = 1; i < data.length; i++) {
    const cell = data[i][0];
    const formatted = cell instanceof Date
      ? Utilities.formatDate(cell, tz, "yyyy-MM-dd")
      : String(cell);
    if (formatted === dateStr) return i + 1;
  }
  return -1;
}
