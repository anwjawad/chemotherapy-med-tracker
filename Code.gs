// ============================================================
//  MedTracker — Google Apps Script Backend
//  Paste this entire file into your Apps Script editor.
//  See SETUP.md for deployment instructions.
// ============================================================

// ── Configuration ────────────────────────────────────────────
// Replace with your actual Google Spreadsheet ID
// (found in the sheet URL: /spreadsheets/d/SPREADSHEET_ID/edit)
var SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';

var MEDS_SHEET     = 'Medications';
var PATIENTS_SHEET = 'Patients';
var FIVEFU_SHEET   = 'FiveFuPatients';

var MEDS_HEADERS = [
  'id', 'medicationName', 'notes', 'createdAt', 'updatedAt'
];
var PATIENTS_HEADERS = [
  'id', 'medicationId', 'medicationName', 'patientName',
  'profileNumber', 'dose', 'lastAppointment', 'nextAppointment',
  'phoneNumber', 'status', 'createdAt', 'updatedAt'
];
var FIVEFU_HEADERS = [
  'id', 'name', 'fileNumber', 'protocol',
  'fiveFuDose', 'appointmentDate', 'createdAt', 'updatedAt'
];

// ── Entry Point ───────────────────────────────────────────────
function doGet(e) {
  try {
    var params = e.parameter;
    var action = params.action;
    var data   = params.data ? JSON.parse(params.data) : {};

    var result;
    switch (action) {
      case 'listMedications':      result = listMedications();             break;
      case 'createMedication':     result = createMedication(data);        break;
      case 'updateMedication':     result = updateMedication(data);        break;
      case 'deleteMedication':     result = deleteMedication(data.id);     break;
      case 'listPatients':         result = listPatients();                break;
      case 'createPatient':        result = createPatient(data);           break;
      case 'updatePatient':        result = updatePatient(data);           break;
      case 'deletePatient':        result = deletePatient(data.id);        break;
      case 'listFiveFuPatients':   result = listFiveFuPatients();          break;
      case 'createFiveFuPatient':  result = createFiveFuPatient(data);     break;
      case 'updateFiveFuPatient':  result = updateFiveFuPatient(data);     break;
      case 'deleteFiveFuPatient':  result = deleteFiveFuPatient(data.id);  break;
      default: throw new Error('Unknown action: ' + action);
    }

    return jsonResponse({ success: true, data: result });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message });
  }
}

function jsonResponse(obj) {
  var output = ContentService.createTextOutput(JSON.stringify(obj));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

// ── Sheet Helpers ─────────────────────────────────────────────
function getSheet(name, headers) {
  var ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
    // Style header row
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground('#4F46E5');
    headerRange.setFontColor('#FFFFFF');
    headerRange.setFontWeight('bold');
  }
  return sheet;
}

function sheetToObjects(sheet, headers) {
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];
  var data = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  return data
    .filter(function(row) { return row[0] !== '' && row[0] !== null; })
    .map(function(row) {
      var obj = {};
      headers.forEach(function(h, i) {
        var val = row[i];
        // Sheets auto-converts date-formatted cells to Date objects.
        // Format them back as YYYY-MM-DD so the frontend can parse them.
        if (val instanceof Date) {
          obj[h] = Utilities.formatDate(val, Session.getScriptTimeZone(), 'yyyy-MM-dd');
        } else {
          obj[h] = val !== null && val !== undefined ? String(val) : '';
        }
      });
      return obj;
    });
}

function findRowIndex(sheet, id) {
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return -1;
  var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) return i + 2; // 1-indexed, +1 for header
  }
  return -1;
}

// ── Medications CRUD ──────────────────────────────────────────
function listMedications() {
  var sheet = getSheet(MEDS_SHEET, MEDS_HEADERS);
  return sheetToObjects(sheet, MEDS_HEADERS);
}

function createMedication(data) {
  var sheet = getSheet(MEDS_SHEET, MEDS_HEADERS);
  var row   = MEDS_HEADERS.map(function(h) { return data[h] || ''; });
  sheet.appendRow(row);
  return data;
}

function updateMedication(data) {
  var sheet   = getSheet(MEDS_SHEET, MEDS_HEADERS);
  var rowIdx  = findRowIndex(sheet, data.id);
  if (rowIdx === -1) throw new Error('Medication not found: ' + data.id);
  var row = MEDS_HEADERS.map(function(h) { return data[h] || ''; });
  sheet.getRange(rowIdx, 1, 1, row.length).setValues([row]);
  return data;
}

function deleteMedication(id) {
  var medsSheet = getSheet(MEDS_SHEET, MEDS_HEADERS);
  var rowIdx    = findRowIndex(medsSheet, id);
  if (rowIdx !== -1) medsSheet.deleteRow(rowIdx);

  // Cascade delete patients
  var patientsSheet = getSheet(PATIENTS_SHEET, PATIENTS_HEADERS);
  var lastRow = patientsSheet.getLastRow();
  if (lastRow > 1) {
    var medIds = patientsSheet.getRange(2, 2, lastRow - 1, 1).getValues(); // col 2 = medicationId
    var rowsToDelete = [];
    for (var i = medIds.length - 1; i >= 0; i--) {
      if (String(medIds[i][0]) === String(id)) rowsToDelete.push(i + 2);
    }
    rowsToDelete.forEach(function(r) { patientsSheet.deleteRow(r); });
  }

  return { id: id };
}

// ── Patients CRUD ─────────────────────────────────────────────
function listPatients() {
  var sheet = getSheet(PATIENTS_SHEET, PATIENTS_HEADERS);
  return sheetToObjects(sheet, PATIENTS_HEADERS);
}

function createPatient(data) {
  var sheet = getSheet(PATIENTS_SHEET, PATIENTS_HEADERS);
  var row   = PATIENTS_HEADERS.map(function(h) { return data[h] || ''; });
  sheet.appendRow(row);
  return data;
}

function updatePatient(data) {
  var sheet  = getSheet(PATIENTS_SHEET, PATIENTS_HEADERS);
  var rowIdx = findRowIndex(sheet, data.id);
  if (rowIdx === -1) throw new Error('Patient not found: ' + data.id);
  var row = PATIENTS_HEADERS.map(function(h) { return data[h] || ''; });
  sheet.getRange(rowIdx, 1, 1, row.length).setValues([row]);
  return data;
}

function deletePatient(id) {
  var sheet  = getSheet(PATIENTS_SHEET, PATIENTS_HEADERS);
  var rowIdx = findRowIndex(sheet, id);
  if (rowIdx === -1) throw new Error('Patient not found: ' + id);
  sheet.deleteRow(rowIdx);
  return { id: id };
}

// ── 5-FU Patients CRUD ────────────────────────────────────────
function listFiveFuPatients() {
  var sheet = getSheet(FIVEFU_SHEET, FIVEFU_HEADERS);
  return sheetToObjects(sheet, FIVEFU_HEADERS);
}

function createFiveFuPatient(data) {
  var sheet = getSheet(FIVEFU_SHEET, FIVEFU_HEADERS);
  var row   = FIVEFU_HEADERS.map(function(h) { return data[h] || ''; });
  sheet.appendRow(row);
  return data;
}

function updateFiveFuPatient(data) {
  var sheet  = getSheet(FIVEFU_SHEET, FIVEFU_HEADERS);
  var rowIdx = findRowIndex(sheet, data.id);
  if (rowIdx === -1) throw new Error('5-FU patient not found: ' + data.id);
  var row = FIVEFU_HEADERS.map(function(h) { return data[h] || ''; });
  sheet.getRange(rowIdx, 1, 1, row.length).setValues([row]);
  return data;
}

function deleteFiveFuPatient(id) {
  var sheet  = getSheet(FIVEFU_SHEET, FIVEFU_HEADERS);
  var rowIdx = findRowIndex(sheet, id);
  if (rowIdx === -1) throw new Error('5-FU patient not found: ' + id);
  sheet.deleteRow(rowIdx);
  return { id: id };
}

// ── Utilities ─────────────────────────────────────────────────
// Run this function manually once to initialize/verify your sheets
function initializeSheets() {
  getSheet(MEDS_SHEET, MEDS_HEADERS);
  getSheet(PATIENTS_SHEET, PATIENTS_HEADERS);
  getSheet(FIVEFU_SHEET, FIVEFU_HEADERS);
  Logger.log('Sheets initialized successfully.');
}

// Test function — run from Apps Script editor to verify connection
function testListMedications() {
  var result = listMedications();
  Logger.log(JSON.stringify(result));
}

// Test function — run from Apps Script editor to verify 5-FU connection
function testListFiveFuPatients() {
  var result = listFiveFuPatients();
  Logger.log(JSON.stringify(result));
}
