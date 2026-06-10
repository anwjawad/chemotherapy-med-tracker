import React, { useState, useMemo } from 'react'
import { Upload, Users } from 'lucide-react'
import Modal from './Modal'
import { useApp } from '../../context/AppContext'

function parseLine(line) {
  const s = line.trim()
  if (!s) return null
  const parts = s.includes('\t')
    ? s.split('\t').map(p => p.trim())
    : s.includes(',')
      ? s.split(',').map(p => p.trim())
      : s.includes(';')
        ? s.split(';').map(p => p.trim())
        : [s]
  return {
    name:       parts[0] || '',
    fileNumber: parts[1] || '',
    fiveFuDose: parts[2] || '',
    protocol:   parts[3] || '',
  }
}

export default function BulkImportFiveFu() {
  const { dispatch, addFiveFuPatientsBulk } = useApp()

  const [date,    setDate]    = useState('')
  const [rawText, setRawText] = useState('')
  const [errors,  setErrors]  = useState({})

  const rows = useMemo(() =>
    rawText.split('\n').map(parseLine).filter(r => r && r.name),
  [rawText])

  const clearError = (field) => setErrors(e => ({ ...e, [field]: null }))

  const validate = () => {
    const e = {}
    if (!date)             e.date    = 'Appointment date is required'
    if (rows.length === 0) e.rawText = 'Paste at least one patient name'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleImport = () => {
    if (!validate()) return
    addFiveFuPatientsBulk(rows.map(r => ({
      name:            r.name,
      fileNumber:      r.fileNumber,
      protocol:        r.protocol,
      fiveFuDose:      r.fiveFuDose,
      appointmentDate: date,
    })))
  }

  return (
    <Modal
      title="Bulk Import 5-FU Patients"
      onClose={() => dispatch({ type: 'CLOSE_MODAL' })}
      size="xl"
    >
      {/* Appointment date */}
      <div className="mb-5 max-w-xs">
        <label className="label">
          Appointment Date <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          className={`input-field ${errors.date ? 'border-red-400 focus:ring-red-400' : ''}`}
          value={date}
          onChange={e => { setDate(e.target.value); clearError('date') }}
          autoFocus
        />
        {errors.date && <p className="mt-1 text-xs text-red-600">{errors.date}</p>}
      </div>

      {/* Paste area */}
      <div className="mb-4">
        <label className="label">
          Patient List <span className="text-red-500">*</span>
          <span className="text-xs font-normal text-slate-400 ml-2">
            one per line · columns: name, file #, dose, protocol (tab or comma separated)
          </span>
        </label>
        <textarea
          className={`input-field font-mono text-sm resize-none h-44 ${errors.rawText ? 'border-red-400 focus:ring-red-400' : ''}`}
          placeholder={"Ahmed Ali\nSara Mohammed\t123456\t2600 mg/m²\nKhalid Hassan, 78901, 2400 mg/m², FOLFIRI"}
          value={rawText}
          onChange={e => { setRawText(e.target.value); clearError('rawText') }}
          spellCheck={false}
        />
        {errors.rawText
          ? <p className="mt-1 text-xs text-red-600">{errors.rawText}</p>
          : <p className="mt-1 text-xs text-slate-400">
              Paste directly from Excel or type names one per line.
              Dose and protocol fall back to the values above for any row that doesn't include them.
            </p>
        }
      </div>

      {/* Preview */}
      {rows.length > 0 && (
        <div className="mb-5">
          <p className="text-xs font-semibold text-teal-700 mb-2 flex items-center gap-1.5">
            <Users size={13} />
            {rows.length} patient{rows.length !== 1 ? 's' : ''} ready to import
          </p>
          <div className="border border-slate-100 rounded-xl overflow-hidden">
            <div className="overflow-y-auto max-h-48">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-400 w-8">#</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-400">Name</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-400">File #</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-400">Protocol</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-400">Dose</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                      <td className="px-3 py-2 text-slate-400 text-xs tabular-nums">{i + 1}</td>
                      <td className="px-3 py-2 font-medium text-slate-800">{r.name}</td>
                      <td className="px-3 py-2 font-mono text-xs text-slate-500">
                        {r.fileNumber || <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-600">
                        {r.protocol || <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-600">
                        {r.fiveFuDose || <span className="text-slate-300">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-4 border-t border-slate-100">
        <button className="btn-secondary flex-1" onClick={() => dispatch({ type: 'CLOSE_MODAL' })}>
          Cancel
        </button>
        <button className="btn-primary flex-1 bg-teal-600 hover:bg-teal-700" onClick={handleImport}>
          <Upload size={14} />
          Import {rows.length > 0 ? `${rows.length} Patient${rows.length !== 1 ? 's' : ''}` : 'Patients'}
        </button>
      </div>
    </Modal>
  )
}
