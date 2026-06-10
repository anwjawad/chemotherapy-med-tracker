import React, { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import Modal from './Modal'
import { useApp } from '../../context/AppContext'

export default function AddEditFiveFuPatient() {
  const { state, dispatch, addFiveFuPatient, updateFiveFuPatient } = useApp()
  const existing = state.modal.data
  const isEdit = !!existing

  const [form, setForm] = useState({
    name: existing?.name || '',
    fileNumber: existing?.fileNumber || '',
    protocol: existing?.protocol || '',
    fiveFuDose: existing?.fiveFuDose || '',
    appointmentDate: existing?.appointmentDate || '',
  })
  const [errors, setErrors] = useState({})
  const [duplicateWarning, setDuplicateWarning] = useState(null)
  const [confirmedDuplicate, setConfirmedDuplicate] = useState(false)

  const set = (field, value) => {
    setForm(f => ({ ...f, [field]: value }))
    if (errors[field]) setErrors(e => ({ ...e, [field]: null }))
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Patient name is required'
    if (!form.fiveFuDose.trim()) e.fiveFuDose = '5-FU dose is required'
    if (!form.appointmentDate) e.appointmentDate = 'Appointment date is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const checkDuplicate = () => {
    if (confirmedDuplicate) return false
    const dup = (state.fiveFuPatients || []).find(
      p => p.fileNumber === form.fileNumber.trim()
        && p.appointmentDate === form.appointmentDate
        && p.id !== existing?.id
    )
    if (dup) {
      setDuplicateWarning(
        `File #${form.fileNumber} already has an appointment on ${form.appointmentDate} (${dup.name}).`
      )
      return true
    }
    return false
  }

  const handleSave = () => {
    if (!validate()) return
    if (checkDuplicate()) return
    const payload = {
      ...form,
      name: form.name.trim(),
      fileNumber: form.fileNumber.trim(),
      protocol: form.protocol.trim(),
      fiveFuDose: form.fiveFuDose.trim(),
    }
    if (isEdit) updateFiveFuPatient({ ...existing, ...payload })
    else addFiveFuPatient(payload)
  }

  return (
    <Modal
      title={isEdit ? 'Edit 5-FU Patient' : 'Add 5-FU Patient'}
      onClose={() => dispatch({ type: 'CLOSE_MODAL' })}
      size="lg"
    >
      {duplicateWarning && (
        <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-3">
          <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800 mb-2">{duplicateWarning}</p>
            <div className="flex gap-2">
              <button
                className="text-xs btn-secondary py-1 px-3"
                onClick={() => setDuplicateWarning(null)}
              >
                Cancel
              </button>
              <button
                className="text-xs py-1 px-3 inline-flex items-center gap-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium rounded-xl transition-all duration-150 shadow-sm"
                onClick={() => { setDuplicateWarning(null); setConfirmedDuplicate(true) }}
              >
                Add Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Patient Name – full width */}
        <div className="sm:col-span-2">
          <label className="label">Patient Name <span className="text-red-500">*</span></label>
          <input
            className={`input-field ${errors.name ? 'border-red-400 focus:ring-red-400' : ''}`}
            placeholder="Full name"
            value={form.name}
            onChange={e => set('name', e.target.value)}
            autoFocus
          />
          {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
        </div>

        {/* File Number */}
        <div>
          <label className="label">File Number <span className="text-slate-400 font-normal text-xs">(optional)</span></label>
          <input
            className={`input-field font-mono ${errors.fileNumber ? 'border-red-400 focus:ring-red-400' : ''}`}
            placeholder="e.g. 123456"
            value={form.fileNumber}
            onChange={e => set('fileNumber', e.target.value)}
          />
          {errors.fileNumber && <p className="mt-1 text-xs text-red-600">{errors.fileNumber}</p>}
        </div>

        {/* Appointment Date */}
        <div>
          <label className="label">Appointment Date <span className="text-red-500">*</span></label>
          <input
            type="date"
            className={`input-field ${errors.appointmentDate ? 'border-red-400 focus:ring-red-400' : ''}`}
            value={form.appointmentDate}
            onChange={e => set('appointmentDate', e.target.value)}
          />
          {errors.appointmentDate && <p className="mt-1 text-xs text-red-600">{errors.appointmentDate}</p>}
        </div>

        {/* Protocol */}
        <div>
          <label className="label">Protocol <span className="text-slate-400 font-normal text-xs">(optional)</span></label>
          <input
            className={`input-field ${errors.protocol ? 'border-red-400 focus:ring-red-400' : ''}`}
            placeholder="e.g. FOLFOX4, mFOLFOX6, FOLFIRI"
            value={form.protocol}
            onChange={e => set('protocol', e.target.value)}
          />
          {errors.protocol && <p className="mt-1 text-xs text-red-600">{errors.protocol}</p>}
        </div>

        {/* 5-FU Dose */}
        <div>
          <label className="label">5-FU Dose <span className="text-red-500">*</span></label>
          <input
            className={`input-field ${errors.fiveFuDose ? 'border-red-400 focus:ring-red-400' : ''}`}
            placeholder="e.g. 2400 mg/m²"
            value={form.fiveFuDose}
            onChange={e => set('fiveFuDose', e.target.value)}
          />
          {errors.fiveFuDose && <p className="mt-1 text-xs text-red-600">{errors.fiveFuDose}</p>}
        </div>
      </div>

      <div className="flex gap-3 pt-4 mt-2 border-t border-slate-100">
        <button className="btn-secondary flex-1" onClick={() => dispatch({ type: 'CLOSE_MODAL' })}>
          Cancel
        </button>
        <button className="btn-primary flex-1 bg-teal-600 hover:bg-teal-700" onClick={handleSave}>
          {isEdit ? 'Save Changes' : 'Add Patient'}
        </button>
      </div>
    </Modal>
  )
}
