# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (Vite, localhost:5173)
npm run build     # Production build to dist/
npm run preview   # Preview production build locally
```

No test runner is configured. There is no linter configured — `npm run build` will catch type/import errors.

## Backend: Google Apps Script (GAS)

The backend is a Google Apps Script Web App. `VITE_GAS_URL` in `.env` must point to the deployed Apps Script URL. When `VITE_GAS_URL` is absent or contains `YOUR_SCRIPT_ID`, the app falls back to **localStorage mock mode** automatically — no server needed for local dev.

The API layer in `src/utils/api.js` routes all calls through a single `callGAS(action, data)` function that passes `action` and `data` as URL query params (GET request). GAS responds with `{ success: boolean, data: any, error?: string }`.

## Architecture

### State management

All application state lives in a single React context (`src/context/AppContext.jsx`). The context exposes:

- `state` — the full app state (see `initialState` for shape)
- CRUD actions: `addMedication`, `updateMedication`, `deleteMedication`, `addPatient`, `updatePatient`, `deletePatient`
- Navigation: `navigateToPatient`
- `showToast(message, type)` — triggers a toast notification
- `dispatch` — raw dispatch for UI-only state changes (modal open/close, view switching)

All data mutations are **optimistic**: the reducer is updated immediately, then `syncItem()` fires the API call in the background and shows a `SyncBadge` status.

### Views

The app has two views controlled by `state.view`:
- `'dashboard'` — `Dashboard.jsx`: grid of medication cards + global stats
- `'medicationDetail'` — `MedicationDetail.jsx`: patient list for one medication, with tabs (All / Delayed / Scheduled), sort, and date-range filters

Navigation between views is done via `dispatch({ type: 'SELECT_MEDICATION', payload: id })` and `dispatch({ type: 'GO_DASHBOARD' })`.

### Patient status

Patient status is binary: `'delayed'` (no `nextAppointment`) or `'scheduled'` (has `nextAppointment`). `determineStatus()` in `src/utils/helpers.js` encodes this rule. The delay severity color (`delayColor()`) is based on days since last appointment.

### Data model

**Medication**: `{ id, medicationName, notes, createdAt, updatedAt }`

**Patient**: `{ id, medicationId, medicationName, patientName, profileNumber, dose, lastAppointment, nextAppointment, phoneNumber, status, createdAt, updatedAt }`

Patients are denormalized — they store `medicationName` directly. When a medication is renamed, the reducer (`UPDATE_MEDICATION` case) propagates the new name to all linked patients.

### Modals

Modals are registered in `App.jsx` and driven by `state.modal = { type, data }`. Modal types: `addMedication`, `editMedication`, `addPatient`, `editPatient`, `deleteMedication`, `deletePatient`. Open with `dispatch({ type: 'OPEN_MODAL', modalType: '...', data: ... })`.

### Print

`src/utils/print.js` generates standalone HTML reports and opens them in a new window, which auto-prints on load. It does not use the main app's CSS — styles are inlined as a string constant (`PRINT_STYLES`).

### Styling

Tailwind CSS with custom component classes defined in `src/index.css` (`@layer components`). Key reusable classes: `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.btn-ghost`, `.card`, `.input-field`, `.label`, `.badge-delayed`, `.badge-scheduled`.

### Seed data

On first load (empty medications store), `buildSeedMedications()` in `src/utils/seed.js` creates 19 chemotherapy medication entries and persists them via the API.

### Deployment

`vite.config.js` sets `base` to `/<repo-name>/` when `GITHUB_REPOSITORY` env var is present, enabling GitHub Pages deployment with correct asset paths.
