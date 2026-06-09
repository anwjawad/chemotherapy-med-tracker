import React, { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import Modal from './Modal'
import { useApp } from '../../context/AppContext'
import { determineStatus } from '../../utils/helpers'

export default function AddEditPatient() {
  const { state, dispatch, addPatient, updatePatient } = useApp()
  const existing = state.modal.data
  const isEdit = !!existing

  const defaultMedId = state.selectedMedicationId || ''
  const defaultMed = state.medications.find(m => m.id === defaultMedId)

  const [form, setForm] = useState({
    medicationId: existing?.medicationId || defaultMedId,
    medicationName: existing?.medicationName || defaultMed?.medicationName || '',
    patientName: existing?.patientName || '',
    profileNumber: existing?.profileNumber || '',
    dose: existing?.dose || '',
    lastAppointment: existing?.lastAppointment || '',
    nextAppointment: existing?.nextAppointment || '',
    phoneNumber: existing?.phoneNumber || '',
  })
  const [errors, setErrors] = useState({})
  const [duplicateWarning, setDuplicateWarning] = useState(null)
  const [confirmedDuplicate, setConfirmedDuplicate] = useState(false)

  const set = (field, value) => {
    setForm(f => {
      const next = { ...f, [field]: value }
      if (field === 'medicationId') {
        const med = state.medications.find(m => m.id === value)
        next.medicationName = med?.medicationName || ''
      }
      return next
    })
    if (errors[field]) setErrors(e => ({ ...e, [field]: null }))
  }

  const previewStatus = determineStatus(form.nextAppointment)

  const validate = () => {
    const e = {}
    if (!form.medicationId) e.medicationId = 'Please select a medication'
    if (!form.patientName.trim()) e.patientName = 'Patient name is required'
    if (!form.profileNumber.trim()) e.profileNumber = 'Profile number is required'
    if (!form.dose.trim()) e.dose = 'Dose is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const checkDuplicate = () => {
    if (confirmedDuplicate) return false
    const dup = state.patients.find(
      p => p.profileNumber === form.profileNumber.trim()
        && p.medicationId === form.medicationId
        && p.id !== existing?.id
    )
    if (dup) {
      setDuplicateWarning(`Profile #${form.profileNumber} already exists under this medication (Patient: ${dup.patientName}).`)
      return true
    }
    return false
  }

  const handleSave = () => {
    if (!validate()) return
    if (checkDuplicate()) return
    const payload = {
      ...form,
      patientName: form.patientName.trim(),
      profileNumber: form.profileNumber.trim(),
      dose: form.dose.trim(),
      phoneNumber: form.phoneNumber.trim(),
    }
    if (isEdit) updatePatient({ ...existing, ...payload })
    else addPatient(payload)
  }

  return (
    <Modal
      title={isEdit ? 'Edit Patient' : 'Add Patient'}
      onClose={() => dispatch({ type: 'CLOSE_MODAL' })}
      size="lg"
    >
      {duplicateWarning && (
        <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-3">
          <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800 mb-2">{duplicateWarning}</p>
            <div className="flex gap-2">
              <button className="text-xs btn-secondary py-1 px-3" onClick={() => setDuplicateWarning(null)}>
                Cancel
              </button>
              <button
                className="text-xs btn-primary py-1 px-3 bg-amber-600 hover:bg-amber-700"
                onClick={() => { setDuplicateWarning(null); setConfirmedDuplicate(true) }}
              >
                Add Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="label">Medication <span className="text-red-500">*</span></label>
          <select
            className={`input-field ${errors.medicationId ? 'border-red-400' : ''}`}
            value={form.medicationId}
            onChange={e => set('medicationId', e.target.value)}
            disabled={!!defaultMedId && !isEdit}
          >
            <option value="">Select medication…</option>
            {state.medications.map(m => (
              <option key={m.id} value={m.id}>{m.medicationName}</option>
            ))}
          </select>
          {errors.medicationId && <p className="mt-1 text-xs text-red-600">{errors.medicationId}</p>}
        </div>

        <div>
          <label className="label">Patient Name <span className="text-red-500">*</span></label>
          <input
            className={`input-field ${errors.patientName ? 'border-red-400' : ''}`}
            placeholder="Full name"
            value={form.patientName}
            onChange={e => set('patientName', e.target.value)}
            autoFocus={!defaultMedId}
          />
          {errors.patientName && <p className="mt-1 text-xs text-red-600">{errors.patientName}</p>}
        </div>

        <div>
          <label className="label">Profile Number <span className="text-red-500">*</span></label>
          <input
            className={`input-field font-mono ${errors.profileNumber ? 'border-red-400' : ''}`}
            placeholder="e.g. 123456"
            value={form.profileNumber}
            onChange={e => set('profileNumber', e.target.value)}
          />
          {errors.profileNumber && <p className="mt-1 text-xs text-red-600">{errors.profileNumber}</p>}
        </div>

        <div>
          <label className="label">Dose <span className="text-red-500">*</span></label>
          <input
            className={`input-field ${errors.dose ? 'border-red-400' : ''}`}
            placeholder="e.g. 50mg / cycle 3"
            value={form.dose}
            onChange={e => set('dose', e.target.value)}
          />
          {errors.dose && <p className="mt-1 text-xs text-red-600">{errors.dose}</p>}
        </div>

        <div>
          <label className="label">Phone Number</label>
          <input
            className="input-field"
            placeholder="Contact number"
            value={form.phoneNumber}
            onChange={e => set('phoneNumber', e.target.value)}
          />
        </div>

        <div>
          <label className="label">Last Appointment</label>
          <input type="date" className="input-field" value={form.lastAppointment} onChange={e => set('lastAppointment', e.target.value)} />
        </div>

        <div>
          <label className="label">Next Appointment</label>
          <input type="date" className="input-field" value={form.nextAppointment} onChange={e => set('nextAppointment', e.target.value)} />
        </div>

        <div className="sm:col-span-2">
          <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-xs text-slate-500 font-medium">Status preview:</span>
            <span className={previewStatus === 'delayed' ? 'badge-delayed' : 'badge-scheduled'}>
              {previewStatus === 'delayed' ? '⏳ Delayed' : '✓ Scheduled'}
            </span>
            <span className="text-xs text-slate-400">
              {previewStatus === 'delayed' ? '— No next appointment set' : '— Next appointment assigned'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-4 mt-2 border-t border-slate-100">
        <button className="btn-secondary flex-1" onClick={() => dispatch({ type: 'CLOSE_MODAL' })}>
          Cancel
        </button>
        <button className="btn-primary flex-1" onClick={handleSave}>
          {isEdit ? 'Save Changes' : 'Add Patient'}
        </button>
      </div>
    </Modal>
  )
}
