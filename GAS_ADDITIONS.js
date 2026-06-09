// ============================================================
// ADDITIONS TO YOUR EXISTING Code.gs
// Copy these functions into your Apps Script editor.
// Then redeploy the Web App (Deploy > Manage Deployments >
// select your deployment > Edit > Version: New version > Deploy).
// ============================================================

// ── Step 1: Add these cases inside your doGet() switch/if block ─────────────
//
// If your doGet() uses:   var action = e.parameter.action
//
// Add these cases alongside your existing ones:
//
//   case 'listFiveFuPatients':
//     return ContentService.createTextOutput(
//       JSON.stringify(listFiveFuPatients())
//     ).setMimeType(ContentService.MimeType.JSON);
//
//   case 'createFiveFuPatient':
//     return ContentService.createTextOutput(
//       JSON.stringify(createFiveFuPatient(data))
//     ).setMimeType(ContentService.MimeType.JSON);
//
//   case 'updateFiveFuPatient':
//     return ContentService.createTextOutput(
//       JSON.stringify(updateFiveFuPatient(data))
//     ).setMimeType(ContentService.MimeType.JSON);
//
//   case 'deleteFiveFuPatient':
//     return ContentService.createTextOutput(
//       JSON.stringify(deleteFiveFuPatient(data))
//     ).setMimeType(ContentService.MimeType.JSON);

// ── Step 2: Add these helper + CRUD functions anywhere in Code.gs ────────────

/**
 * Returns (or creates) the FiveFuPatients sheet with the correct header row.
 * Safe to call repeatedly — will not overwrite existing data.
 */
function getFiveFuSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('FiveFuPatients');
  if (!sheet) {
    sheet = ss.insertSheet('FiveFuPatients');
    sheet.appendRow([
      'id', 'name', 'fileNumber', 'protocol',
      'fiveFuDose', 'appointmentDate', 'createdAt', 'updatedAt'
    ]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/** List all 5-FU patients. Returns { success: true, data: [...] } */
function listFiveFuPatients() {
  try {
    var sheet = getFiveFuSheet();
    var values = sheet.getDataRange().getValues();
    if (values.length <= 1) return { success: true, data: [] };
    var headers = values[0];
    var rows = values.slice(1).map(function(row) {
      var obj = {};
      headers.forEach(function(h, i) { obj[h] = row[i] !== undefined ? String(row[i]) : ''; });
      return obj;
    });
    return { success: true, data: rows };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/** Create a new 5-FU patient row. */
function createFiveFuPatient(data) {
  try {
    var sheet = getFiveFuSheet();
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var row = headers.map(function(h) { return data[h] !== undefined ? data[h] : ''; });
    sheet.appendRow(row);
    return { success: true, data: data };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/** Update an existing 5-FU patient row by id. */
function updateFiveFuPatient(data) {
  try {
    var sheet = getFiveFuSheet();
    var allValues = sheet.getDataRange().getValues();
    var headers = allValues[0];
    var idIdx = headers.indexOf('id');
    for (var i = 1; i < allValues.length; i++) {
      if (String(allValues[i][idIdx]) === String(data.id)) {
        var updatedRow = headers.map(function(h, j) {
          return data[h] !== undefined ? data[h] : allValues[i][j];
        });
        sheet.getRange(i + 1, 1, 1, headers.length).setValues([updatedRow]);
        return { success: true, data: data };
      }
    }
    return { success: false, error: '5-FU patient not found: ' + data.id };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/** Delete a 5-FU patient row by id. */
function deleteFiveFuPatient(data) {
  try {
    var sheet = getFiveFuSheet();
    var allValues = sheet.getDataRange().getValues();
    var headers = allValues[0];
    var idIdx = headers.indexOf('id');
    for (var i = 1; i < allValues.length; i++) {
      if (String(allValues[i][idIdx]) === String(data.id)) {
        sheet.deleteRow(i + 1);
        return { success: true, data: { id: data.id } };
      }
    }
    return { success: false, error: '5-FU patient not found: ' + data.id };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// ── Step 3 (optional): If you have an initializeSheets() function ────────────
// Add this line inside it so the sheet is created on first setup:
//
//   getFiveFuSheet();
//
// This is safe — getFiveFuSheet() only creates the sheet when it doesn't exist.
