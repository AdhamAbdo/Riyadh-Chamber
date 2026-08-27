/**
 * Tasks.gs — CRUD operations for the Tasks sheet.
 */

function getTasks() {
  var sheet = getSheet(CONFIG.SHEETS.TASKS);
  var headerInfo = getHeaderMap(sheet);
  var hMap = headerInfo.map;
  var H = CONFIG.HEADERS.TASKS;
  var cols = resolveHeaders_(hMap, H);

  var rows = getRowsAsObjects(sheet);
  var result = [];
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    result.push({
      id: sanitize(r[cols.ID]),
      department: sanitize(r[cols.DEPARTMENT]),
      title: sanitize(r[cols.TITLE]),
      description: sanitize(r[cols.DESCRIPTION]),
      type: sanitize(r[cols.TYPE]),
      date: formatDate(r[cols.DATE]),
      progress: Number(r[cols.PROGRESS]) || 0,
      status: sanitize(r[cols.STATUS]),
      notes: sanitize(r[cols.NOTES]),
      createdAt: '',
      updatedAt: ''
    });
  }
  return result;
}

function addTask(payload) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var sheet = getSheet(CONFIG.SHEETS.TASKS);
    var headerInfo = getHeaderMap(sheet);
    var hMap = headerInfo.map;
    var headers = headerInfo.headers;
    var H = CONFIG.HEADERS.TASKS;
    var cols = resolveHeaders_(hMap, H);

    var id = generateId('TASK', CONFIG.SHEETS.TASKS, cols.ID);
    var now = new Date().toISOString();

    var newRow = buildRow_(headers, cols, {
      ID: id,
      DEPARTMENT: sanitize(payload.department),
      TITLE: sanitize(payload.title),
      DESCRIPTION: sanitize(payload.description),
      TYPE: sanitize(payload.type),
      DATE: sanitize(payload.date),
      PROGRESS: Number(payload.progress) || 0,
      STATUS: sanitize(payload.status),
      NOTES: sanitize(payload.notes)
    });

    sheet.appendRow(newRow);
    return {
      id: id,
      department: sanitize(payload.department),
      title: sanitize(payload.title),
      description: sanitize(payload.description),
      type: sanitize(payload.type),
      date: sanitize(payload.date),
      progress: Number(payload.progress) || 0,
      status: sanitize(payload.status),
      notes: sanitize(payload.notes),
      createdAt: now,
      updatedAt: now
    };
  } finally {
    lock.releaseLock();
  }
}

function updateTask(payload) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var sheet = getSheet(CONFIG.SHEETS.TASKS);
    var headerInfo = getHeaderMap(sheet);
    var hMap = headerInfo.map;
    var headers = headerInfo.headers;
    var H = CONFIG.HEADERS.TASKS;
    var cols = resolveHeaders_(hMap, H);

    var rows = getRowsAsObjects(sheet);
    var targetRow = null;
    for (var i = 0; i < rows.length; i++) {
      if (sanitize(rows[i][cols.ID]) === sanitize(payload.id)) {
        targetRow = rows[i];
        break;
      }
    }
    if (!targetRow) throw new Error('المهمة غير موجودة');

    var rowNumber = targetRow._rowNumber;
    var now = new Date().toISOString();

    var newRow = buildRowUpdate_(headers, cols, targetRow, payload, {
      ID: sanitize(payload.id),
      DEPARTMENT: 'department',
      TITLE: 'title',
      DESCRIPTION: 'description',
      TYPE: 'type',
      DATE: 'date',
      PROGRESS: 'progress',
      STATUS: 'status',
      NOTES: 'notes'
    });

    sheet.getRange(rowNumber, 1, 1, headers.length).setValues([newRow]);

    return {
      id: sanitize(payload.id),
      department: payload.department !== undefined ? sanitize(payload.department) : sanitize(targetRow[cols.DEPARTMENT]),
      title: payload.title !== undefined ? sanitize(payload.title) : sanitize(targetRow[cols.TITLE]),
      description: payload.description !== undefined ? sanitize(payload.description) : sanitize(targetRow[cols.DESCRIPTION]),
      type: payload.type !== undefined ? sanitize(payload.type) : sanitize(targetRow[cols.TYPE]),
      date: payload.date !== undefined ? sanitize(payload.date) : formatDate(targetRow[cols.DATE]),
      progress: payload.progress !== undefined ? (Number(payload.progress) || 0) : (Number(targetRow[cols.PROGRESS]) || 0),
      status: payload.status !== undefined ? sanitize(payload.status) : sanitize(targetRow[cols.STATUS]),
      notes: payload.notes !== undefined ? sanitize(payload.notes) : sanitize(targetRow[cols.NOTES]),
      createdAt: '',
      updatedAt: now
    };
  } finally {
    lock.releaseLock();
  }
}

function deleteTask(payload) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var sheet = getSheet(CONFIG.SHEETS.TASKS);
    var headerInfo = getHeaderMap(sheet);
    var cols = resolveHeaders_(headerInfo.map, CONFIG.HEADERS.TASKS);

    var rows = getRowsAsObjects(sheet);
    for (var i = 0; i < rows.length; i++) {
      if (sanitize(rows[i][cols.ID]) === sanitize(payload.id)) {
        sheet.deleteRow(rows[i]._rowNumber);
        return;
      }
    }
    throw new Error('المهمة غير موجودة');
  } finally {
    lock.releaseLock();
  }
}
