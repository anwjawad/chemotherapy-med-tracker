import React, { useState } from 'react'
import Modal from './Modal'
import { useApp } from '../../context/AppContext'

export default function AddEditMedication() {
  const { state, dispatch, addMedication, updateMedication } = useApp()
  const existing = state.modal.data
  const isEdit = !!existing

  const [form, setForm] = useState({
    medicationName: existing?.medicationName || '',
    notes: existing?.notes || '',
  })
  const [errors, setErrors] = useState({})

  const set = (field, value) => {
    setForm(f => ({ ...f, [field]: value }))
    if (errors[field]) setErrors(e => ({ ...e, [field]: null }))
  }

  const validate = () => {
    const e = {}
    if (!form.medicationName.trim()) e.medicationName = 'Medication name is required'
    const duplicate = state.medications.find(
      m => m.medicationName.toLowerCase() === form.medicationName.trim().toLowerCase()
        && m.id !== existing?.id
    )
    if (duplicate) e.medicationName = 'A medication with this name already exists'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = () => {
    if (!validate()) return
    const payload = { medicationName: form.medicationName.trim(), notes: form.notes.trim() }
    if (isEdit) updateMedication({ ...existing, ...payload })
    else addMedication(payload)
  }

  return (
    <Modal
      title={isEdit ? 'Edit Medication' : 'Add Medication'}
      onClose={() => dispatch({ type: 'CLOSE_MODAL' })}
    >
      <div className="space-y-4">
        <div>
          <label className="label">Medication Name <span className="text-red-500">*</span></label>
          <input
            className={`input-field ${errors.medicationName ? 'border-red-400 focus:ring-red-400' : ''}`}
            placeholder="e.g. Methotrexate 50mg"
            value={form.medicationName}
            onChange={e => set('medicationName', e.target.value)}
            autoFocus
          />
          {errors.medicationName && (
            <p className="mt-1 text-xs text-red-600">{errors.medicationName}</p>
          )}
        </div>

        <div>
          <label className="label">Notes <span className="text-slate-400 font-normal">(optional)</span></label>
          <textarea
            className="input-field resize-none"
            placeholder="Additional notes about availability, protocols, etc."
            rows={3}
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button className="btn-secondary flex-1" onClick={() => dispatch({ type: 'CLOSE_MODAL' })}>
            Cancel
          </button>
          <button className="btn-primary flex-1" onClick={handleSave}>
            {isEdit ? 'Save Changes' : 'Add Medication'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
