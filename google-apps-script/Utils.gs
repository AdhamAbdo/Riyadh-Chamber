/**
 * Utils.gs — Shared utility functions for the Apps Script backend.
 */

/**
 * Returns the sheet object for the given sheet name from config.
 */
function getSheet(sheetName) {
  var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    throw new Error('Sheet not found: ' + sheetName);
  }
  return sheet;
}

/**
 * Reads the header row (row 1) and returns a map of header name -> column index (0-based).
 * Also returns an ordered array of header names.
 */
function getHeaderMap(sheet) {
  var lastCol = sheet.getLastColumn();
  if (lastCol === 0) return { map: {}, headers: [] };
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var map = {};
  for (var i = 0; i < headers.length; i++) {
    var h = String(headers[i]).trim();
    map[h] = i;
  }
  return { map: map, headers: headers };
}

/**
 * Converts a sheet's data range into an array of row objects keyed by header name.
 * Skips the header row and any completely empty rows.
 */
function getRowsAsObjects(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  var lastCol = sheet.getLastColumn();
  if (lastCol === 0) return [];

  var values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  var headerInfo = getHeaderMap(sheet);
  var headers = headerInfo.headers;

  var result = [];
  for (var r = 0; r < values.length; r++) {
    var row = values[r];
    var isEmpty = true;
    var obj = {};
    for (var c = 0; c < headers.length; c++) {
      var headerName = String(headers[c]).trim();
      var cellValue = row[c];
      if (cellValue !== '' && cellValue !== null && cellValue !== undefined) {
        isEmpty = false;
      }
      obj[headerName] = cellValue;
    }
    if (!isEmpty) {
      obj._rowNumber = r + 2;
      result.push(obj);
    }
  }
  return result;
}

/**
 * Resolves a header field to its actual column name in the sheet.
 * Each field in CONFIG.HEADERS is either a string or an array of possible names.
 * Returns the first name that exists in the header map, or the first candidate
 * if none match.
 */
function resolveHeader(headerMap, candidates) {
  if (typeof candidates === 'string') candidates = [candidates];
  for (var i = 0; i < candidates.length; i++) {
    if (headerMap[candidates[i]] !== undefined) return candidates[i];
  }
  return candidates[0];
}

/**
 * Resolves all header fields for a sheet's CONFIG.HEADERS section.
 * Returns an object with the same keys but values are resolved header names.
 */
function resolveHeaders_(headerMap, headerConfig) {
  var resolved = {};
  for (var key in headerConfig) {
    resolved[key] = resolveHeader(headerMap, headerConfig[key]);
  }
  return resolved;
}

/**
 * Builds a new row array for appendRow, matching the sheet's column order.
 * @param {Array} headers - the raw header array from getHeaderMap
 * @param {Object} cols - resolved header names (from resolveHeaders_)
 * @param {Object} values - map of FIELD_KEY -> value to write
 */
function buildRow_(headers, cols, values) {
  var row = [];
  for (var c = 0; c < headers.length; c++) {
    var h = String(headers[c]).trim();
    var written = false;
    for (var key in cols) {
      if (cols[key] === h && values[key] !== undefined) {
        row.push(values[key]);
        written = true;
        break;
      }
    }
    if (!written) row.push('');
  }
  return row;
}

/**
 * Builds an updated row array, keeping existing values where payload doesn't provide new ones.
 * @param {Array} headers - the raw header array
 * @param {Object} cols - resolved header names
 * @param {Object} targetRow - existing row object from getRowsAsObjects
 * @param {Object} payload - the update payload from the frontend
 * @param {Object} fieldMap - map of FIELD_KEY -> payload property name (or 'ID' for the ID)
 */
function buildRowUpdate_(headers, cols, targetRow, payload, fieldMap) {
  var row = [];
  for (var c = 0; c < headers.length; c++) {
    var h = String(headers[c]).trim();
    var written = false;
    for (var key in fieldMap) {
      if (cols[key] === h) {
        if (key === 'ID') {
          row.push(fieldMap[key]);
        } else {
          var propName = fieldMap[key];
          if (payload[propName] !== undefined) {
            row.push(key === 'PROGRESS' ? (Number(payload[propName]) || 0) : sanitize(payload[propName]));
          } else {
            row.push(key === 'DATE' || key === 'START_DATE' || key === 'END_DATE' ? formatDate(targetRow[h]) : targetRow[h]);
          }
        }
        written = true;
        break;
      }
    }
    if (!written) row.push(targetRow[h] !== undefined ? targetRow[h] : '');
  }
  return row;
}

/**
 * Formats a Date object as YYYY-MM-DD using the spreadsheet's timezone.
 */
function formatDate(date) {
  if (!date) return '';
  if (typeof date === 'string') return date;
  if (Object.prototype.toString.call(date) === '[object Date]') {
    return Utilities.formatDate(date, SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getSpreadsheetTimeZone(), 'yyyy-MM-dd');
  }
  return String(date);
}

/**
 * Generates the next sequential ID with LockService guard.
 */
function generateId(prefix, sheetName, idColumnName) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var sheet = getSheet(sheetName);
    var rows = getRowsAsObjects(sheet);
    var maxNum = 0;
    var pattern = new RegExp('^' + prefix + '-(\\d+)$');
    for (var i = 0; i < rows.length; i++) {
      var id = String(rows[i][idColumnName] || '');
      var match = pattern.exec(id);
      if (match) {
        var num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
    var nextNum = maxNum + 1;
    var padded = ('00000' + nextNum).slice(-5);
    return prefix + '-' + padded;
  } finally {
    lock.releaseLock();
  }
}

/**
 * Sanitizes a string value.
 */
function sanitize(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

/**
 * Builds a success JSON response.
 */
function success(data, message) {
  return ContentService
    .createTextOutput(JSON.stringify({
      success: true,
      message: message || 'تم تنفيذ العملية بنجاح',
      data: data || {}
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Builds an error JSON response.
 */
function error(message) {
  return ContentService
    .createTextOutput(JSON.stringify({
      success: false,
      message: message || 'حدث خطأ أثناء تنفيذ العملية'
    }))
    .setMimeType(ContentService.MimeType.JSON);
}
