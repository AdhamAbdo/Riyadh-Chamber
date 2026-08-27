/**
 * Config.gs — Configuration for the Riyadh Chamber Google Apps Script backend.
 *
 * Replace YOUR_SPREADSHEET_ID with your actual Google Spreadsheet ID.
 * You can find it in the sheet URL:
 *   https://docs.google.com/spreadsheets/d/YOUR_SPREADSHEET_ID/edit
 */

var CONFIG = {
  SPREADSHEET_ID: '1v9PXsAh-4DgnSveTiKkmLpc6nRVQP-bwPGbYodM3yoY',

  SHEETS: {
    TASKS: 'Tasks',
    MEETINGS: 'Meetings',
    PROJECTS: 'Projects',
    LOOKUPS: 'Lookups'
  },

  // Column header names used in the sheets.
  // Each field has a PRIMARY name (from the spec) and optional ALTERNATES
  // that may appear in the Excel-imported version of the sheet.
  // resolveHeader() in Utils.gs picks whichever header actually exists.
  HEADERS: {
    TASKS: {
      ID:           ['Task_ID', '#'],
      DEPARTMENT:   ['الإدارة'],
      TITLE:        ['عنوان المهمة'],
      DESCRIPTION:  ['الوصف'],
      TYPE:         ['نوع المهمة'],
      DATE:         ['التاريخ'],
      PROGRESS:     ['نسبة الإنجاز (%)'],
      STATUS:       ['حالة المهمة', 'الحالة'],
      NOTES:        ['الملاحظات']
    },
    MEETINGS: {
      ID:             ['Meeting_ID', '#'],
      TITLE:          ['عنوان الاجتماع / المكالفة', 'عنوان الاجتماع'],
      DATE:           ['التاريخ'],
      TIME:           ['الوقت'],
      TYPE:           ['نوع الاجتماع', 'النوع'],
      CLASSIFICATION: ['التصنيف'],
      NOTES:          ['الملاحظات']
    },
    PROJECTS: {
      ID:           ['Project_ID', '#'],
      DEPARTMENT:   ['الإدارة'],
      NAME:         ['اسم المشروع'],
      DESCRIPTION:  ['الوصف'],
      START_DATE:   ['تاريخ البداية'],
      END_DATE:     ['تاريخ الانتهاء'],
      TYPE:         ['نوع المشروع', 'النوع'],
      STATUS:       ['الحالة'],
      PROGRESS:     ['نسبة الإنجاز (%)'],
      NOTES:        ['الملاحظات']
    },
    LOOKUPS: {
      DEPARTMENTS:            ['الإدارات'],
      TASK_TYPES:             ['نوع المهمة'],
      TASK_STATUSES:          ['حالة المهمة'],
      MEETING_TYPES:          ['نوع الاجتماع'],
      MEETING_CLASSIFICATIONS:['تصنيف الاجتماع'],
      PROJECT_TYPES:          ['نوع المشروع'],
      PROJECT_STATUSES:       ['حالة المشروع']
    }
  }
};
