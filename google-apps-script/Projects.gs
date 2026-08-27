/**
 * Projects.gs — CRUD operations for the Projects sheet.
 */

function getProjects() {
  var sheet = getSheet(CONFIG.SHEETS.PROJECTS);
  var headerInfo = getHeaderMap(sheet);
  var cols = resolveHeaders_(headerInfo.map, CONFIG.HEADERS.PROJECTS);

  var rows = getRowsAsObjects(sheet);
  var result = [];
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    result.push({
      id: sanitize(r[cols.ID]),
      department: sanitize(r[cols.DEPARTMENT]),
      name: sanitize(r[cols.NAME]),
      description: sanitize(r[cols.DESCRIPTION]),
      startDate: formatDate(r[cols.START_DATE]),
      endDate: formatDate(r[cols.END_DATE]),
      type: sanitize(r[cols.TYPE]),
      status: sanitize(r[cols.STATUS]),
      progress: Number(r[cols.PROGRESS]) || 0,
      notes: sanitize(r[cols.NOTES]),
      createdAt: '',
      updatedAt: ''
    });
  }
  return result;
}

function addProject(payload) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var sheet = getSheet(CONFIG.SHEETS.PROJECTS);
    var headerInfo = getHeaderMap(sheet);
    var headers = headerInfo.headers;
    var cols = resolveHeaders_(headerInfo.map, CONFIG.HEADERS.PROJECTS);

    var id = generateId('PROJ', CONFIG.SHEETS.PROJECTS, cols.ID);
    var now = new Date().toISOString();

    var newRow = buildRow_(headers, cols, {
      ID: id,
      DEPARTMENT: sanitize(payload.department),
      NAME: sanitize(payload.name),
      DESCRIPTION: sanitize(payload.description),
      START_DATE: sanitize(payload.startDate),
      END_DATE: sanitize(payload.endDate),
      TYPE: sanitize(payload.type),
      STATUS: sanitize(payload.status),
      PROGRESS: Number(payload.progress) || 0,
      NOTES: sanitize(payload.notes)
    });

    sheet.appendRow(newRow);
    return {
      id: id,
      department: sanitize(payload.department),
      name: sanitize(payload.name),
      description: sanitize(payload.description),
      startDate: sanitize(payload.startDate),
      endDate: sanitize(payload.endDate),
      type: sanitize(payload.type),
      status: sanitize(payload.status),
      progress: Number(payload.progress) || 0,
      notes: sanitize(payload.notes),
      createdAt: now,
      updatedAt: now
    };
  } finally {
    lock.releaseLock();
  }
}

function updateProject(payload) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var sheet = getSheet(CONFIG.SHEETS.PROJECTS);
    var headerInfo = getHeaderMap(sheet);
    var headers = headerInfo.headers;
    var cols = resolveHeaders_(headerInfo.map, CONFIG.HEADERS.PROJECTS);

    var rows = getRowsAsObjects(sheet);
    var targetRow = null;
    for (var i = 0; i < rows.length; i++) {
      if (sanitize(rows[i][cols.ID]) === sanitize(payload.id)) {
        targetRow = rows[i];
        break;
      }
    }
    if (!targetRow) throw new Error('المشروع غير موجود');

    var rowNumber = targetRow._rowNumber;
    var now = new Date().toISOString();

    var newRow = buildRowUpdate_(headers, cols, targetRow, payload, {
      ID: sanitize(payload.id),
      DEPARTMENT: 'department',
      NAME: 'name',
      DESCRIPTION: 'description',
      START_DATE: 'startDate',
      END_DATE: 'endDate',
      TYPE: 'type',
      STATUS: 'status',
      PROGRESS: 'progress',
      NOTES: 'notes'
    });

    sheet.getRange(rowNumber, 1, 1, headers.length).setValues([newRow]);

    return {
      id: sanitize(payload.id),
      department: payload.department !== undefined ? sanitize(payload.department) : sanitize(targetRow[cols.DEPARTMENT]),
      name: payload.name !== undefined ? sanitize(payload.name) : sanitize(targetRow[cols.NAME]),
      description: payload.description !== undefined ? sanitize(payload.description) : sanitize(targetRow[cols.DESCRIPTION]),
      startDate: payload.startDate !== undefined ? sanitize(payload.startDate) : formatDate(targetRow[cols.START_DATE]),
      endDate: payload.endDate !== undefined ? sanitize(payload.endDate) : formatDate(targetRow[cols.END_DATE]),
      type: payload.type !== undefined ? sanitize(payload.type) : sanitize(targetRow[cols.TYPE]),
      status: payload.status !== undefined ? sanitize(payload.status) : sanitize(targetRow[cols.STATUS]),
      progress: payload.progress !== undefined ? (Number(payload.progress) || 0) : (Number(targetRow[cols.PROGRESS]) || 0),
      notes: payload.notes !== undefined ? sanitize(payload.notes) : sanitize(targetRow[cols.NOTES]),
      createdAt: '',
      updatedAt: now
    };
  } finally {
    lock.releaseLock();
  }
}

function deleteProject(payload) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var sheet = getSheet(CONFIG.SHEETS.PROJECTS);
    var headerInfo = getHeaderMap(sheet);
    var cols = resolveHeaders_(headerInfo.map, CONFIG.HEADERS.PROJECTS);

    var rows = getRowsAsObjects(sheet);
    for (var i = 0; i < rows.length; i++) {
      if (sanitize(rows[i][cols.ID]) === sanitize(payload.id)) {
        sheet.deleteRow(rows[i]._rowNumber);
        return;
      }
    }
    throw new Error('المشروع غير موجود');
  } finally {
    lock.releaseLock();
  }
}
