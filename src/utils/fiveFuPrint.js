const PRINT_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Cairo:wght@400;600;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Cairo', 'Inter', Arial, sans-serif; font-size: 12px; color: #1e293b; }
  .page { padding: 32px; max-width: 1000px; margin: 0 auto; }
  .header { border-bottom: 2px solid #0d9488; padding-bottom: 16px; margin-bottom: 20px; }
  .hospital-name { font-size: 11px; font-weight: 600; color: #0f766e; text-transform: uppercase; letter-spacing: 0.05em; }
  .report-title { font-size: 22px; font-weight: 700; color: #1e293b; margin: 6px 0; }
  .meta-row { display: flex; gap: 20px; margin-top: 8px; font-size: 11px; color: #64748b; flex-wrap: wrap; }
  .meta-item { display: flex; gap: 4px; }
  .meta-label { font-weight: 600; }
  .count-badge { display: inline-block; padding: 2px 10px; background: #ccfbf1; color: #0f766e; border-radius: 20px; font-size: 12px; font-weight: 600; margin-left: 8px; }
  table { width: 100%; border-collapse: collapse; margin-top: 4px; }
  thead tr { background: #f0fdfa; }
  th { padding: 10px 10px; text-align: left; font-size: 11px; font-weight: 700; color: #0f766e; border-bottom: 2px solid #5eead4; white-space: nowrap; letter-spacing: 0.03em; text-transform: uppercase; }
  td { padding: 10px 10px; font-size: 12px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; unicode-bidi: plaintext; }
  tr:last-child td { border-bottom: none; }
  tr:nth-child(even) td { background: #f8fafc; }
  .num-col { color: #94a3b8; font-weight: 600; width: 32px; text-align: center; }
  .file-col { font-family: monospace; color: #334155; font-weight: 600; }
  .date-group { background: linear-gradient(135deg, #0d9488, #0891b2); color: white; padding: 9px 12px; font-weight: 700; font-size: 12.5px; letter-spacing: 0.02em; }
  .date-group td { padding: 0; }
  .date-group-inner { padding: 9px 12px; }
  .patient-count { background: rgba(255,255,255,0.25); padding: 1px 8px; border-radius: 20px; font-size: 11px; margin-left: 8px; }
  .footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #94a3b8; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px; }
  .no-data { text-align: center; padding: 40px; color: #94a3b8; font-size: 13px; }
  @media print {
    body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    thead { display: table-header-group; }
  }
`

function formatDateFull(dateStr) {
  if (!dateStr || dateStr === '—') return '—'
  try {
    const d = new Date(dateStr + 'T00:00:00')
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString('en-GB', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    })
  } catch {
    return dateStr
  }
}

function formatDateShort(dateStr) {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr + 'T00:00:00')
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString('en-GB', {
      year: 'numeric', month: 'short', day: 'numeric',
    })
  } catch {
    return dateStr
  }
}

function buildFlatRows(patients) {
  if (!patients.length) {
    return '<tr><td colspan="6" class="no-data">No patients found for the selected period.</td></tr>'
  }
  return patients.map((p, i) => `
    <tr>
      <td class="num-col">${i + 1}</td>
      <td><strong>${p.name || '—'}</strong></td>
      <td class="file-col">${p.fileNumber || '—'}</td>
      <td>${p.protocol || '—'}</td>
      <td>${p.fiveFuDose || '—'}</td>
      <td>${formatDateShort(p.appointmentDate)}</td>
    </tr>
  `).join('')
}

function buildGroupedRows(patients) {
  if (!patients.length) {
    return '<tr><td colspan="5" class="no-data">No patients found for the selected period.</td></tr>'
  }

  const groups = {}
  patients.forEach(p => {
    const d = p.appointmentDate || '—'
    if (!groups[d]) groups[d] = []
    groups[d].push(p)
  })

  const sortedDates = Object.keys(groups).sort()
  let rowNum = 0
  let html = ''

  sortedDates.forEach(date => {
    const dayPatients = groups[date]
    const count = dayPatients.length
    html += `
      <tr class="date-group">
        <td colspan="5">
          <div class="date-group-inner">
            ${formatDateFull(date)}
            <span class="patient-count">${count} patient${count !== 1 ? 's' : ''}</span>
          </div>
        </td>
      </tr>
    `
    dayPatients.forEach(p => {
      rowNum++
      html += `
        <tr>
          <td class="num-col">${rowNum}</td>
          <td><strong>${p.name || '—'}</strong></td>
          <td class="file-col">${p.fileNumber || '—'}</td>
          <td>${p.protocol || '—'}</td>
          <td>${p.fiveFuDose || '—'}</td>
        </tr>
      `
    })
  })

  return html
}

function openPrintWindow(title, dateInfo, patients, showDateCol) {
  const printedAt = new Date().toLocaleString('en-GB')
  const headers = showDateCol
    ? ['#', 'Patient Name', 'File #', 'Protocol', '5-FU Dose', 'Appt. Date']
    : ['#', 'Patient Name', 'File #', 'Protocol', '5-FU Dose']
  const rows = showDateCol ? buildFlatRows(patients) : buildGroupedRows(patients)

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>5-FU Patients List</title>
  <style>${PRINT_STYLES}</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="hospital-name">Hospital Medication Tracker — Chemotherapy Unit</div>
    <div class="report-title">
      5-FU Patients List
      <span class="count-badge">${patients.length} patient${patients.length !== 1 ? 's' : ''}</span>
    </div>
    <div class="meta-row">
      <div class="meta-item">
        <span class="meta-label">Period:</span>
        <span>${dateInfo}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Printed:</span>
        <span>${printedAt}</span>
      </div>
    </div>
  </div>

  <table>
    <thead>
      <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>

  <div class="footer">
    <span>5-FU Treatment — Hospital Medication Availability Tracker</span>
    <span>Total: ${patients.length} patient${patients.length !== 1 ? 's' : ''} — Generated: ${printedAt}</span>
  </div>
</div>
<script>window.onload = () => { window.print(); setTimeout(() => window.close(), 600) }</script>
</body>
</html>`

  const win = window.open('', '_blank', 'width=960,height=720')
  if (!win) { alert('Please allow pop-ups to enable printing.'); return }
  win.document.write(html)
  win.document.close()
}

export function printFiveFuDay(patients, date) {
  const label = date ? formatDateFull(date) : 'Today'
  openPrintWindow('5-FU Patients List', label, patients, false)
}

export function printFiveFuRange(patients, from, to) {
  let label = 'All Dates'
  if (from && to) label = `From ${from} to ${to}`
  else if (from) label = `From ${from}`
  else if (to) label = `Up to ${to}`
  openPrintWindow('5-FU Patients List', label, patients, false)
}

export function printFiveFuAll(patients) {
  openPrintWindow('5-FU Patients List — All Records', 'All Dates', patients, true)
}
