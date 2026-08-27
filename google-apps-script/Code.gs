/**
 * Code.gs — Entry points (doGet / doPost) for the Apps Script web app.
 *
 * Deploy this as a Web App (Deploy > New deployment > Web app):
 *   - Execute as: Me
 *   - Who has access: Anyone
 *
 * The deployment URL goes into the frontend .env as VITE_GOOGLE_APPS_SCRIPT_URL.
 */

function doGet(e) {
  try {
    var action = (e && e.parameter && e.parameter.action) || '';
    var params = (e && e.parameter) || {};

    switch (action) {
      case 'getTasks':
        return success(getTasks());
      case 'getMeetings':
        return success(getMeetings());
      case 'getProjects':
        return success(getProjects());
      case 'getLookups':
        return success(getLookups());
      case 'getInitialData':
        return success(getInitialData());
      case 'debug':
        return success(debugInfo());
      default:
        return error('إجراء غير معروف: ' + action);
    }
  } catch (err) {
    logError_(err);
    var msg = (err && err.message) ? err.message : String(err);
    return error('Debug: ' + msg);
  }
}

function doPost(e) {
  try {
    var body = {};
    if (e && e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    }
    var action = body.action || '';
    var payload = body.payload || {};

    switch (action) {
      case 'addTask':
        return success(addTask(payload));
      case 'updateTask':
        return success(updateTask(payload));
      case 'deleteTask':
        deleteTask(payload);
        return success(null, 'تم حذف المهمة بنجاح');
      case 'addMeeting':
        return success(addMeeting(payload));
      case 'updateMeeting':
        return success(updateMeeting(payload));
      case 'deleteMeeting':
        deleteMeeting(payload);
        return success(null, 'تم حذف الاجتماع بنجاح');
      case 'addProject':
        return success(addProject(payload));
      case 'updateProject':
        return success(updateProject(payload));
      case 'deleteProject':
        deleteProject(payload);
        return success(null, 'تم حذف المشروع بنجاح');
      case 'importBackup':
        importBackup(payload);
        return success(null, 'تم استيراد النسخة الاحتياطية بنجاح');
      case 'resetData':
        resetData();
        return success(null, 'تمت إعادة ضبط البيانات بنجاح');
      default:
        return error('إجراء غير معروف: ' + action);
    }
  } catch (err) {
    logError_(err);
    var msg = (err && err.message) ? err.message : String(err);
    return error('Debug: ' + msg);
  }
}

/**
 * Loads all business data in one request (optional performance optimization).
 */
function getInitialData() {
  return {
    tasks: getTasks(),
    meetings: getMeetings(),
    projects: getProjects(),
    lookups: getLookups()
  };
}

/**
 * Returns diagnostic info about the spreadsheet for troubleshooting.
 */
function debugInfo() {
  var ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  var sheets = ss.getSheets();
  var info = {
    spreadsheetName: ss.getName(),
    timeZone: ss.getSpreadsheetTimeZone(),
    sheetNames: [],
    sheetDetails: {}
  };
  for (var i = 0; i < sheets.length; i++) {
    var sheet = sheets[i];
    var name = sheet.getName();
    info.sheetNames.push(name);
    var lastCol = sheet.getLastColumn();
    var headers = [];
    if (lastCol > 0) {
      headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    }
    info.sheetDetails[name] = {
      lastRow: sheet.getLastRow(),
      lastCol: lastCol,
      headers: headers
    };
  }
  return info;
}

/**
 * Logs errors to the Apps Script executions log (visible in the editor).
 */
function logError_(err) {
  console.error('Apps Script error: ' + (err && err.message ? err.message : String(err)));
  if (err && err.stack) console.error(err.stack);
}
