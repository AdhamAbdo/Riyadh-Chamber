# Google Apps Script Backend — Deployment Guide

This folder contains the Google Apps Script code that connects your app to Google Sheets.
Copy these files into the Apps Script editor connected to your Google Sheet.

## Files

| File | Purpose |
|------|---------|
| `Config.gs` | Configuration — spreadsheet ID, sheet names, header mappings |
| `Code.gs` | Entry points (`doGet` / `doPost`) — the web app dispatcher |
| `Utils.gs` | Shared utilities (header mapping, ID generation, date formatting, JSON responses) |
| `Tasks.gs` | Tasks CRUD (getTasks, addTask, updateTask, deleteTask) |
| `Meetings.gs` | Meetings CRUD (getMeetings, addMeeting, updateMeeting, deleteMeeting) |
| `Projects.gs` | Projects CRUD (getProjects, addProject, updateProject, deleteProject) |
| `Lookups.gs` | Read dropdown values from the Lookups sheet (getLookups) |
| `Backup.gs` | Backup import + data reset (importBackup, resetData) |

## Step-by-Step Deployment

### 1. Open the Apps Script Editor

1. Open your Google Sheet in the browser.
2. Click **Extensions → Apps Script** in the top menu.
3. This opens the Apps Script editor in a new tab.

### 2. Copy the Code

1. Delete any default code in the editor (the `Code.gs` that comes pre-filled).
2. For each `.gs` file in this folder:
   - Click **+ (Files) → Script** in the left sidebar.
   - Name the file exactly as shown (e.g. `Config`, `Code`, `Utils`, `Tasks`, etc.).
   - Paste the contents of the corresponding `.gs` file from this folder.
3. Make sure all 8 files are created.

### 3. Set Your Spreadsheet ID

1. In `Config.gs`, find the line:
   ```
   SPREADSHEET_ID: 'YOUR_SPREADSHEET_ID',
   ```
2. Replace `YOUR_SPREADSHEET_ID` with your actual Spreadsheet ID.
3. You can find it in your Google Sheet URL:
   ```
   https://docs.google.com/spreadsheets/d/THIS_IS_YOUR_SPREADSHEET_ID/edit
   ```

### 4. Deploy as a Web App

1. Click **Deploy → New deployment** in the top right.
2. Click the gear icon ⚙️ and select **Web app**.
3. Set:
   - **Description**: `Riyadh Chamber API` (or any name)
   - **Execute as**: **Me** (your account)
   - **Who has access**: **Anyone**
4. Click **Deploy**.
5. You'll see a **Web app URL** that looks like:
   ```
   https://script.google.com/macros/s/AKfycb.../exec
   ```
6. Copy this URL.

### 5. Connect the App

1. Open the `.env` file in your project root.
2. Find the line:
   ```
   VITE_GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
   ```
3. Replace the placeholder URL with the one you copied in step 4.

### 6. Verify Column Headers

The Apps Script reads the **first row** of each sheet as headers and maps fields by name.
Make sure your sheet headers match exactly what's in `Config.gs`:

**Tasks sheet (row 1):**
```
Task_ID | الإدارة | عنوان المهمة | الوصف | نوع المهمة | التاريخ | نسبة الإنجاز (%) | حالة المهمة | الملاحظات
```

**Meetings sheet (row 1):**
```
Meeting_ID | عنوان الاجتماع / المكالمة | التاريخ | الوقت | نوع الاجتماع | التصنيف | الملاحظات
```

**Projects sheet (row 1):**
```
Project_ID | الإدارة | اسم المشروع | الوصف | تاريخ البداية | تاريخ الانتهاء | نوع المشروع | الحالة | نسبة الإنجاز (%) | الملاحظات
```

**Lookups sheet (row 1):**
```
الإدارات | نوع المهمة | حالة المهمة | نوع الاجتماع | تصنيف الاجتماع | نوع المشروع | حالة المشروع
```

> If your headers differ, either rename them in the sheet or adjust the `CONFIG.HEADERS` values in `Config.gs` to match your actual headers.

### 7. Test

1. Open your app and log in.
2. The dashboard should load data from your Google Sheet.
3. Click **تحديث البيانات** (Refresh) — it fetches fresh data from the sheet.
4. Add a task in the app, then check your Google Sheet — the new row should appear.
5. Edit the task in the app, check the sheet — the row should be updated.
6. Delete it in the app, check the sheet — the row should be gone.

### Redeploying After Code Changes

If you modify any `.gs` file:
1. Click **Deploy → Manage deployments**.
2. Click the edit icon ✏️ on your existing deployment.
3. Select **Version: New version**.
4. Click **Deploy**.
5. The URL stays the same — no need to update `.env` again.
