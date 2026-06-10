# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (Vite, localhost:5173)
npm run build     # Production build to dist/
npm run preview   # Preview production build locally
```

No test runner is configured. `npm run build` catches import/type errors.

## Backend: Google Apps Script (GAS)

`Code.gs` is the canonical backend — paste it into the Apps Script editor. `GAS_ADDITIONS.js` is a migration patch for older deployments that didn't include the 5-FU sheet; it should not be deployed on its own.

`VITE_GAS_URL` in `.env` must point to the deployed Apps Script URL. When absent or containing `YOUR_SCRIPT_ID`, the app falls back to **localStorage mock mode** automatically.

All API calls go through `callGAS(action, data)` in `src/utils/api.js` — a single GET request with `action` and `data` as query params. GAS responds with `{ success: boolean, data: any, error?: string }`. The frontend switches between mock and GAS based on `useMock()`.

## Architecture

### State management

All state lives in `src/context/AppContext.jsx` (single React context + `useReducer`). Consume it with `useApp()`.

All data mutations are **optimistic**: the reducer runs immediately, then `syncItem(id, apiFn)` fires the API call in the background and updates `state.syncStatus[id]` (`'syncing' | 'synced' | 'error'`). `SyncBadge` reads this map to show per-record sync status.

Context exposes: `state`, `dispatch`, `loadData`, `showToast(message, type)`, `syncItem`, and named CRUD actions for each entity.

### Views

Controlled by `state.view`, rendered in `App.jsx`:

| `state.view` | Component | Description |
|---|---|---|
| `'dashboard'` | `Dashboard.jsx` | Grid of medication cards + global stats |
| `'medicationDetail'` | `MedicationDetail.jsx` | Patient list for one medication (tabs: All / Delayed / Scheduled, sort, date-range filters) |
| `'fiveFu'` | `FiveFuPage.jsx` | 5-FU appointment tracker grouped by date, with calendar sidebar |

Navigate with: `dispatch({ type: 'SELECT_MEDICATION', payload: id })`, `dispatch({ type: 'GO_DASHBOARD' })`, `dispatch({ type: 'GO_FIVEFU' })`.

### Modal system

`state.modal = { type, data }`. Register modals in `App.jsx` and open with:
```js
dispatch({ type: 'OPEN_MODAL', modalType: 'yourModalType', data: { ...payload } })
```
Close with `dispatch({ type: 'CLOSE_MODAL' })`. All modal components live in `src/components/modals/` and use the shared `Modal.jsx` wrapper.

Current modal types: `addMedication`, `editMedication`, `addPatient`, `editPatient`, `addFiveFuPatient`, `editFiveFuPatient`, `deleteMedication`, `deletePatient`, `deleteFiveFuPatient`.

### Data models

**Medication**: `{ id, medicationName, notes, createdAt, updatedAt }`

**Patient** (chemo tracker): `{ id, medicationId, medicationName, patientName, profileNumber, dose, lastAppointment, nextAppointment, phoneNumber, status, createdAt, updatedAt }`
- `status` is derived — never set manually. Always use `determineStatus(nextAppointment)` from `helpers.js` (binary: `'delayed'` if no `nextAppointment`, else `'scheduled'`).
- Patients are denormalized: `medicationName` is stored directly. `UPDATE_MEDICATION` in the reducer propagates renames to all linked patients.
- `returnToDelayed(patient)` clears `nextAppointment` and sets `status: 'delayed'` — use this instead of a manual update.

**5-FU Patient**: `{ id, name, fileNumber, protocol, fiveFuDose, appointmentDate, createdAt, updatedAt }`
- Uses `name`/`fileNumber` (not `patientName`/`profileNumber` like the chemo patient model).
- No `status` field — grouped and filtered purely by `appointmentDate`.
- Duplicate detection checks `fileNumber + appointmentDate` combination before saving.

### Helpers (`src/utils/helpers.js`)

Key functions: `determineStatus`, `formatDate` (en-GB locale), `formatDateTime`, `getDaysSince`, `getDaysUntil`, `delayColor` (gray/yellow/amber/orange/red by days overdue), `delayLabel`, `sortDelayedPatients`, `sortScheduledPatients`, `applyPatientFilters`, `now` (ISO timestamp), `generateId` (crypto.randomUUID).

### Styling

Tailwind CSS. Custom component classes in `src/index.css` (`@layer components`): `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.btn-ghost`, `.card`, `.medication-card` (lift animation on hover, pointer-only), `.input-field`, `.label`, `.badge-delayed`, `.badge-scheduled`, `.skeleton`. CSS custom properties for easing: `--ease-out`, `--ease-in-out`, `--ease-drawer`.

### Print

`src/utils/print.js` — chemo patient reports. `src/utils/fiveFuPrint.js` — 5-FU reports (`printFiveFuDay`, `printFiveFuRange`, `printFiveFuAll`). Both generate standalone HTML with inlined styles and open in a new tab that auto-prints on load.

### Seed data

On first load (empty medications store), `buildSeedMedications()` in `src/utils/seed.js` creates 19 chemotherapy medication entries and writes them via the API.

### Deployment

`vite.config.js` sets `base` to `/<repo-name>/` when `GITHUB_REPOSITORY` env var is present (GitHub Pages). GitHub Actions workflow in `.github/workflows/` handles CI/CD; it needs `VITE_GAS_URL` set as a repository secret.
