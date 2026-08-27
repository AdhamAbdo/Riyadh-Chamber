/**
 * Meetings.gs — CRUD operations for the Meetings sheet.
 */

function getMeetings() {
  var sheet = getSheet(CONFIG.SHEETS.MEETINGS);
  var headerInfo = getHeaderMap(sheet);
  var cols = resolveHeaders_(headerInfo.map, CONFIG.HEADERS.MEETINGS);

  var rows = getRowsAsObjects(sheet);
  var result = [];
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    result.push({
      id: sanitize(r[cols.ID]),
      title: sanitize(r[cols.TITLE]),
      date: formatDate(r[cols.DATE]),
      time: sanitize(r[cols.TIME]),
      type: sanitize(r[cols.TYPE]),
      classification: sanitize(r[cols.CLASSIFICATION]),
      notes: sanitize(r[cols.NOTES]),
      createdAt: '',
      updatedAt: ''
    });
  }
  return result;
}

function addMeeting(payload) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var sheet = getSheet(CONFIG.SHEETS.MEETINGS);
    var headerInfo = getHeaderMap(sheet);
    var headers = headerInfo.headers;
    var cols = resolveHeaders_(headerInfo.map, CONFIG.HEADERS.MEETINGS);

    var id = generateId('MEET', CONFIG.SHEETS.MEETINGS, cols.ID);
    var now = new Date().toISOString();

    var newRow = buildRow_(headers, cols, {
      ID: id,
      TITLE: sanitize(payload.title),
      DATE: sanitize(payload.date),
      TIME: sanitize(payload.time),
      TYPE: sanitize(payload.type),
      CLASSIFICATION: sanitize(payload.classification),
      NOTES: sanitize(payload.notes)
    });

    sheet.appendRow(newRow);
    return {
      id: id,
      title: sanitize(payload.title),
      date: sanitize(payload.date),
      time: sanitize(payload.time),
      type: sanitize(payload.type),
      classification: sanitize(payload.classification),
      notes: sanitize(payload.notes),
      createdAt: now,
      updatedAt: now
    };
  } finally {
    lock.releaseLock();
  }
}

function updateMeeting(payload) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var sheet = getSheet(CONFIG.SHEETS.MEETINGS);
    var headerInfo = getHeaderMap(sheet);
    var headers = headerInfo.headers;
    var cols = resolveHeaders_(headerInfo.map, CONFIG.HEADERS.MEETINGS);

    var rows = getRowsAsObjects(sheet);
    var targetRow = null;
    for (var i = 0; i < rows.length; i++) {
      if (sanitize(rows[i][cols.ID]) === sanitize(payload.id)) {
        targetRow = rows[i];
        break;
      }
    }
    if (!targetRow) throw new Error('الاجتماع غير موجود');

    var rowNumber = targetRow._rowNumber;
    var now = new Date().toISOString();

    var newRow = buildRowUpdate_(headers, cols, targetRow, payload, {
      ID: sanitize(payload.id),
      TITLE: 'title',
      DATE: 'date',
      TIME: 'time',
      TYPE: 'type',
      CLASSIFICATION: 'classification',
      NOTES: 'notes'
    });

    sheet.getRange(rowNumber, 1, 1, headers.length).setValues([newRow]);

    return {
      id: sanitize(payload.id),
      title: payload.title !== undefined ? sanitize(payload.title) : sanitize(targetRow[cols.TITLE]),
      date: payload.date !== undefined ? sanitize(payload.date) : formatDate(targetRow[cols.DATE]),
      time: payload.time !== undefined ? sanitize(payload.time) : sanitize(targetRow[cols.TIME]),
      type: payload.type !== undefined ? sanitize(payload.type) : sanitize(targetRow[cols.TYPE]),
      classification: payload.classification !== undefined ? sanitize(payload.classification) : sanitize(targetRow[cols.CLASSIFICATION]),
      notes: payload.notes !== undefined ? sanitize(payload.notes) : sanitize(targetRow[cols.NOTES]),
      createdAt: '',
      updatedAt: now
    };
  } finally {
    lock.releaseLock();
  }
}

function deleteMeeting(payload) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var sheet = getSheet(CONFIG.SHEETS.MEETINGS);
    var headerInfo = getHeaderMap(sheet);
    var cols = resolveHeaders_(headerInfo.map, CONFIG.HEADERS.MEETINGS);

    var rows = getRowsAsObjects(sheet);
    for (var i = 0; i < rows.length; i++) {
      if (sanitize(rows[i][cols.ID]) === sanitize(payload.id)) {
        sheet.deleteRow(rows[i]._rowNumber);
        return;
      }
    }
    throw new Error('الاجتماع غير موجود');
  } finally {
    lock.releaseLock();
  }
}
