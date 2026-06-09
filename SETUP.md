# MedTracker — Setup Guide

## 1. Install Dependencies & Run Locally

```bash
npm install
npm run dev
```

The app opens at http://localhost:5173  
Without a GAS URL configured it runs in **local mode** (data stored in browser localStorage).

---

## 2. Google Sheets + Apps Script Setup

### Step A — Create the Google Spreadsheet

1. Go to [Google Sheets](https://sheets.google.com) and create a new blank spreadsheet.
2. Name it **"MedTracker"** (or any name you prefer).
3. Copy the **Spreadsheet ID** from the URL:
   ```
   https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
   ```

### Step B — Deploy the Apps Script

1. In your spreadsheet, click **Extensions → Apps Script**.
2. Delete the default `myFunction()` code in the editor.
3. Open `Code.gs` from this project and **paste the entire contents** into the Apps Script editor.
4. Find this line near the top and replace it with your real Spreadsheet ID:
   ```javascript
   var SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';
   ```
5. Click **Save** (Ctrl+S / Cmd+S).
6. Run `initializeSheets` once to create the two sheets:
   - Click **Run → Run function → initializeSheets**
   - Authorize access when prompted.

### Step C — Deploy as Web App

1. Click **Deploy → New deployment**.
2. Click the ⚙ gear icon next to **Type** and choose **Web app**.
3. Set the following:
   - **Description**: MedTracker API (any description)
   - **Execute as**: Me (your Google account)
   - **Who has access**: **Anyone** (required for CORS to work from your browser)
4. Click **Deploy**.
5. Copy the **Web App URL** — it looks like:
   ```
   https://script.google.com/macros/s/AKfycb.../exec
   ```

### Step D — Configure the React App

1. Copy `.env.example` to `.env` in the project root:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and paste your Web App URL:
   ```
   VITE_GAS_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
   ```
3. Restart the dev server:
   ```bash
   npm run dev
   ```

The **"Local mode"** badge in the header will disappear when connected to GAS.

---

## 3. Build for Production

```bash
npm run build
```

Output goes to `dist/`. Deploy to any static host (Netlify, Vercel, GitHub Pages, etc.).

---

## 4. Updating the Apps Script

After any changes to `Code.gs`:
1. Go back to Apps Script → **Deploy → Manage deployments**.
2. Click the pencil icon (edit) on your existing deployment.
3. Change the version to **"New version"**.
4. Click **Deploy**.

> **Important**: Always re-deploy after code changes — the URL stays the same.

---

## 5. Sheet Structure Reference

### Medications Sheet
| Column | Field | Description |
|--------|-------|-------------|
| A | id | UUID |
| B | medicationName | Name of the medication |
| C | notes | Optional notes |
| D | createdAt | ISO timestamp |
| E | updatedAt | ISO timestamp |

### Patients Sheet
| Column | Field | Description |
|--------|-------|-------------|
| A | id | UUID |
| B | medicationId | FK → Medications.id |
| C | medicationName | Denormalized name |
| D | patientName | Full name |
| E | profileNumber | Hospital profile number |
| F | dose | Dose description |
| G | lastAppointment | YYYY-MM-DD |
| H | nextAppointment | YYYY-MM-DD (empty = delayed) |
| I | phoneNumber | Contact number |
| J | status | "delayed" or "scheduled" |
| K | createdAt | ISO timestamp |
| L | updatedAt | ISO timestamp |

---

## 6. Troubleshooting

**CORS error in browser console**  
→ Make sure "Who has access" is set to **Anyone** (not "Anyone with Google account").  
→ After changing access, re-deploy as a new version.

**Changes not reflecting after editing Code.gs**  
→ You must deploy a new version. Editing the script alone doesn't update the live web app.

**"API error" toast on save**  
→ Check the Apps Script execution log: in Apps Script editor click **Executions** on the left sidebar.

**App shows "Local mode" badge even after setting VITE_GAS_URL**  
→ Make sure you restarted the dev server after editing `.env`.  
→ Verify the URL doesn't still contain `YOUR_SCRIPT_ID`.
