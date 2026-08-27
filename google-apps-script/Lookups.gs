/**
 * Lookups.gs — Read lookup (dropdown) values from the Lookups sheet.
 *
 * The Lookups sheet has columns, each containing a list of values:
 *   الإدارات | نوع المهمة | حالة المهمة | نوع الاجتماع | تصنيف الاجتماع | نوع المشروع | حالة المشروع
 *
 * Values are read top-to-bottom (row 2 onward). Empty cells are skipped.
 */

function getLookups() {
  var sheet = getSheet(CONFIG.SHEETS.LOOKUPS);
  var headerInfo = getHeaderMap(sheet);
  var hMap = headerInfo.map;
  var H = CONFIG.HEADERS.LOOKUPS;

  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol === 0) {
    return { departments: [], taskTypes: [], taskStatuses: [], meetingTypes: [], meetingClassifications: [], projectTypes: [], projectStatuses: [] };
  }

  var data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();

  function collectColumn(candidates) {
    var headerName = resolveHeader(hMap, candidates);
    var colIdx = hMap[headerName];
    if (colIdx === undefined) return [];
    var values = [];
    for (var r = 0; r < data.length; r++) {
      var val = data[r][colIdx];
      if (val !== '' && val !== null && val !== undefined) {
        values.push(String(val).trim());
      }
    }
    // Remove duplicates while preserving order
    var seen = {};
    var unique = [];
    for (var i = 0; i < values.length; i++) {
      if (!seen[values[i]]) {
        seen[values[i]] = true;
        unique.push(values[i]);
      }
    }
    return unique;
  }

  return {
    departments: collectColumn(H.DEPARTMENTS),
    taskTypes: collectColumn(H.TASK_TYPES),
    taskStatuses: collectColumn(H.TASK_STATUSES),
    meetingTypes: collectColumn(H.MEETING_TYPES),
    meetingClassifications: collectColumn(H.MEETING_CLASSIFICATIONS),
    projectTypes: collectColumn(H.PROJECT_TYPES),
    projectStatuses: collectColumn(H.PROJECT_STATUSES)
  };
}
