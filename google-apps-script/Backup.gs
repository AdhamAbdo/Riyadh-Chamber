/**
 * Backup.gs — Backup import and data reset functions.
 */

function importBackup(payload) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    if (payload.tasks && Array.isArray(payload.tasks)) {
      replaceSheetData(CONFIG.SHEETS.TASKS, CONFIG.HEADERS.TASKS, payload.tasks, function(t) {
        return {
          ID: t.id,
          DEPARTMENT: t.department,
          TITLE: t.title,
          DESCRIPTION: t.description,
          TYPE: t.type,
          DATE: t.date,
          PROGRESS: t.progress,
          STATUS: t.status,
          NOTES: t.notes
        };
      });
    }

    if (payload.meetings && Array.isArray(payload.meetings)) {
      replaceSheetData(CONFIG.SHEETS.MEETINGS, CONFIG.HEADERS.MEETINGS, payload.meetings, function(m) {
        return {
          ID: m.id,
          TITLE: m.title,
          DATE: m.date,
          TIME: m.time,
          TYPE: m.type,
          CLASSIFICATION: m.classification,
          NOTES: m.notes
        };
      });
    }

    if (payload.projects && Array.isArray(payload.projects)) {
      replaceSheetData(CONFIG.SHEETS.PROJECTS, CONFIG.HEADERS.PROJECTS, payload.projects, function(p) {
        return {
          ID: p.id,
          DEPARTMENT: p.department,
          NAME: p.name,
          DESCRIPTION: p.description,
          START_DATE: p.startDate,
          END_DATE: p.endDate,
          TYPE: p.type,
          STATUS: p.status,
          PROGRESS: p.progress,
          NOTES: p.notes
        };
      });
    }
  } finally {
    lock.releaseLock();
  }
}

function resetData() {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    clearSheetData(CONFIG.SHEETS.TASKS);
    clearSheetData(CONFIG.SHEETS.MEETINGS);
    clearSheetData(CONFIG.SHEETS.PROJECTS);
  } finally {
    lock.releaseLock();
  }
}

// --- Internal helpers ---

function replaceSheetData(sheetName, headerConfig, records, mapFn) {
  var sheet = getSheet(sheetName);
  var headerInfo = getHeaderMap(sheet);
  var headers = headerInfo.headers;
  var cols = resolveHeaders_(headerInfo.map, headerConfig);

  // Clear existing data rows (keep header row)
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.deleteRows(2, lastRow - 1);
  }

  // Write new rows
  for (var i = 0; i < records.length; i++) {
    var values = mapFn(records[i]);
    var newRow = buildRow_(headers, cols, values);
    sheet.appendRow(newRow);
  }
}

function clearSheetData(sheetName) {
  var sheet = getSheet(sheetName);
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.deleteRows(2, lastRow - 1);
  }
}
