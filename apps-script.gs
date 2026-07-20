/* =========================================================
   CIK Clock — Google Apps Script Web App
   ----------------------------------------
   Receives punches from the iPad and writes them to the
   spreadsheet you attach this script to. Also maintains
   a Summary tab (hours + pay per person).

   Setup instructions are in the README. In short:
   1. Create a new Google Sheet.
   2. Extensions → Apps Script.
   3. Delete anything in the editor and paste this file.
   4. Save the project (name it anything).
   5. Deploy → New deployment → Type: Web app.
      Execute as: Me
      Who has access: Anyone
   6. Copy the Web app URL and paste it into the CIK Clock
      Settings tab.

   The script accepts POSTs with either:
     { ping: true }                            → returns { ok: true }
     { punches: [ {id, staffName, job, ...} ]} → upserts rows by id
   ========================================================= */

const PUNCH_SHEET = "Punch Log";
const SUMMARY_SHEET = "Summary";
const HEADERS = [
  "Punch ID", "Name", "Job",
  "Clock In", "Clock Out", "Break (min)",
  "Hours", "Rate", "Pay",
  "Notes", "Edited At", "Deleted"
];

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || "{}");

    if (body.ping) {
      return jsonResponse({ ok: true, msg: "pong" });
    }

    const punches = Array.isArray(body.punches) ? body.punches : [];
    const ss = SpreadsheetApp.getActive();
    const sheet = getOrCreatePunchSheet(ss);
    upsertPunches(sheet, punches);
    updateSummary(ss);

    return jsonResponse({ ok: true, count: punches.length });
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}

function doGet() {
  // Some browsers preflight or people paste the URL. Give them something friendly.
  return jsonResponse({ ok: true, msg: "CIK Clock sync endpoint alive. Use POST." });
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function getOrCreatePunchSheet(ss) {
  let sheet = ss.getSheetByName(PUNCH_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(PUNCH_SHEET);
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold").setBackground("#f2eee6");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function upsertPunches(sheet, punches) {
  if (punches.length === 0) return;
  const lastRow = sheet.getLastRow();
  const existingIds = lastRow > 1
    ? sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat()
    : [];
  const idToRow = {};
  existingIds.forEach((id, idx) => { idToRow[id] = idx + 2; });

  punches.forEach((p) => {
    const row = punchToRow(p);
    if (idToRow[p.id]) {
      sheet.getRange(idToRow[p.id], 1, 1, row.length).setValues([row]);
    } else {
      sheet.appendRow(row);
      idToRow[p.id] = sheet.getLastRow();
    }
  });
}

function punchToRow(p) {
  return [
    p.id || "",
    p.staffName || "",
    p.job || "",
    p.clockIn ? new Date(p.clockIn) : "",
    p.clockOut ? new Date(p.clockOut) : "",
    p.breakMinutes || 0,
    typeof p.hours === "number" ? p.hours : "",
    typeof p.rate === "number" ? p.rate : "",
    typeof p.pay === "number" ? p.pay : "",
    p.notes || "",
    p.editedAt ? new Date(p.editedAt) : "",
    p.deleted ? "YES" : ""
  ];
}

function updateSummary(ss) {
  const punchSheet = ss.getSheetByName(PUNCH_SHEET);
  if (!punchSheet) return;
  let summary = ss.getSheetByName(SUMMARY_SHEET);
  if (!summary) {
    summary = ss.insertSheet(SUMMARY_SHEET);
  }
  summary.clear();

  const lastRow = punchSheet.getLastRow();
  if (lastRow < 2) {
    summary.appendRow(["No punches yet."]);
    return;
  }
  const rows = punchSheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues();

  // Aggregate: byName → { byJob: {job: {hours, pay}}, totalHours, totalPay, weeks: {wk: hours} }
  const agg = {};
  rows.forEach((r) => {
    const [id, name, job, clockIn, clockOut, brk, hours, rate, pay, notes, editedAt, deleted] = r;
    if (deleted === "YES") return;
    if (!name) return;
    if (!clockOut) return; // skip open shifts in totals
    if (!agg[name]) agg[name] = { byJob: {}, totalHours: 0, totalPay: 0, weeks: {} };
    const h = Number(hours) || 0;
    const p = Number(pay) || 0;
    if (!agg[name].byJob[job]) agg[name].byJob[job] = { hours: 0, pay: 0 };
    agg[name].byJob[job].hours += h;
    agg[name].byJob[job].pay += p;
    agg[name].totalHours += h;
    agg[name].totalPay += p;
    const wk = weekKeyLocal(clockIn);
    agg[name].weeks[wk] = (agg[name].weeks[wk] || 0) + h;
  });

  summary.appendRow(["CIK Payroll Summary", "", "", "", "Updated: " + new Date().toLocaleString()]);
  summary.getRange(1, 1, 1, 5).setFontWeight("bold").setBackground("#f2eee6");
  summary.appendRow([]);
  summary.appendRow(["Name", "Job", "Hours", "Gross Pay", "OT flag (any week > 40h)"]);
  summary.getRange(3, 1, 1, 5).setFontWeight("bold");

  const names = Object.keys(agg).sort();
  let grandHours = 0, grandPay = 0;
  names.forEach((name) => {
    const info = agg[name];
    const otFlag = Object.values(info.weeks).some((h) => h > 40) ? "OT" : "";
    Object.keys(info.byJob).sort().forEach((job) => {
      const j = info.byJob[job];
      summary.appendRow([name, job, round2(j.hours), round2(j.pay), ""]);
    });
    summary.appendRow([name, "TOTAL", round2(info.totalHours), round2(info.totalPay), otFlag]);
    const totalRow = summary.getLastRow();
    summary.getRange(totalRow, 1, 1, 5).setFontWeight("bold").setBackground("#f7f3ea");
    grandHours += info.totalHours;
    grandPay += info.totalPay;
  });
  summary.appendRow([]);
  summary.appendRow(["GRAND TOTAL", "", round2(grandHours), round2(grandPay), ""]);
  const gr = summary.getLastRow();
  summary.getRange(gr, 1, 1, 5).setFontWeight("bold").setBackground("#e6dfcd");

  summary.autoResizeColumns(1, 5);
}

function round2(n) { return Math.round(Number(n) * 100) / 100; }

function weekKeyLocal(dateVal) {
  const d = new Date(dateVal);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay() || 7;
  d.setDate(d.getDate() - (day - 1));
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}
