import { formatDate, getDaysSince } from './helpers'

const PRINT_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', Arial, sans-serif; font-size: 12px; color: #1e293b; padding: 0; }
  .page { padding: 32px; max-width: 1000px; margin: 0 auto; }
  .header { border-bottom: 2px solid #4f46e5; padding-bottom: 16px; margin-bottom: 20px; }
  .hospital-name { font-size: 11px; font-weight: 600; color: #6366f1; text-transform: uppercase; letter-spacing: 0.05em; }
  .report-title { font-size: 20px; font-weight: 700; color: #1e293b; margin: 6px 0; }
  .meta-row { display: flex; gap: 20px; margin-top: 8px; font-size: 11px; color: #64748b; }
  .meta-item { display: flex; gap: 4px; }
  .meta-label { font-weight: 600; }
  table { width: 100%; border-collapse: collapse; margin-top: 12px; }
  thead tr { background: #f1f5f9; }
  th { padding: 10px 8px; text-align: left; font-size: 11px; font-weight: 600; color: #475569; border-bottom: 2px solid #e2e8f0; white-space: nowrap; }
  td { padding: 9px 8px; font-size: 11.5px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
  tr:last-child td { border-bottom: none; }
  tr:nth-child(even) { background: #f8fafc; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 10px; font-weight: 600; }
  .delayed { background: #fee2e2; color: #991b1b; }
  .scheduled { background: #d1fae5; color: #065f46; }
  .days-badge { display: inline-block; padding: 2px 6px; border-radius: 20px; font-size: 10px; font-weight: 600; background: #fef3c7; color: #92400e; }
  .footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #94a3b8; display: flex; justify-content: space-between; }
  .count-badge { display: inline-block; padding: 2px 8px; background: #e0e7ff; color: #3730a3; border-radius: 20px; font-size: 11px; font-weight: 600; margin-left: 8px; }
  .no-data { text-align: center; padding: 40px; color: #94a3b8; font-size: 13px; }
  @media print {
    body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
  }
`

function buildTable(patients, showMedication = false) {
  if (!patients.length) {
    return '<tr><td colspan="9" class="no-data">No patients found</td></tr>'
  }
  return patients.map((p, i) => {
    const days = p.status === 'delayed' ? getDaysSince(p.lastAppointment) : null
    return `
      <tr>
        <td style="color:#94a3b8;font-weight:600">${i + 1}</td>
        ${showMedication ? `<td><strong>${p.medicationName || '—'}</strong></td>` : ''}
        <td><strong>${p.patientName || '—'}</strong></td>
        <td style="font-family:monospace;color:#475569">${p.profileNumber || '—'}</td>
        <td>${p.dose || '—'}</td>
        <td>${formatDate(p.lastAppointment)}</td>
        <td>${p.nextAppointment ? formatDate(p.nextAppointment) : '—'}</td>
        <td>${p.phoneNumber || '—'}</td>
        <td>
          <span class="badge ${p.status}">${p.status === 'delayed' ? 'Delayed' : 'Scheduled'}</span>
          ${days !== null && days > 0 ? `<span class="days-badge" style="margin-left:4px">${days}d</span>` : ''}
        </td>
      </tr>
    `
  }).join('')
}

function printHTML(title, subtitle, patients, showMedication = false) {
  const now = new Date().toLocaleString('en-GB')
  const headers = [
    '#',
    ...(showMedication ? ['Medication'] : []),
    'Patient Name', 'Profile #', 'Dose',
    'Last Appt.', 'Next Appt.', 'Phone', 'Status',
  ]
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>${PRINT_STYLES}</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="hospital-name">Hospital Medication Tracker</div>
    <div class="report-title">${title} <span class="count-badge">${patients.length}</span></div>
    <div class="meta-row">
      ${subtitle ? `<div class="meta-item"><span class="meta-label">Medication:</span> ${subtitle}</div>` : ''}
      <div class="meta-item"><span class="meta-label">Printed:</span> ${now}</div>
    </div>
  </div>
  <table>
    <thead>
      <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
    </thead>
    <tbody>
      ${buildTable(patients, showMedication)}
    </tbody>
  </table>
  <div class="footer">
    <span>Hospital Medication Availability Tracker</span>
    <span>Total: ${patients.length} patients — Generated: ${now}</span>
  </div>
</div>
<script>window.onload=()=>{window.print();setTimeout(()=>window.close(),500)}</script>
</body>
</html>`

  const win = window.open('', '_blank', 'width=900,height=700')
  if (!win) { alert('Please allow popups to print.'); return }
  win.document.write(html)
  win.document.close()
}

export function printDelayedForMedication(patients, medicationName) {
  const delayed = patients.filter(p => p.status === 'delayed')
  printHTML('Delayed Patients List', medicationName, delayed, false)
}

export function printScheduledForMedication(patients, medicationName) {
  const scheduled = patients.filter(p => p.status === 'scheduled')
  printHTML('Scheduled Patients List', medicationName, scheduled, false)
}

export function printAllDelayed(allPatients) {
  const delayed = allPatients.filter(p => p.status === 'delayed')
  printHTML('All Delayed Patients — All Medications', null, delayed, true)
}

export function printFilteredList(patients, title) {
  printHTML(title || 'Patient List', null, patients, true)
}
