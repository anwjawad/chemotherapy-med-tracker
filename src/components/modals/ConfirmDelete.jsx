import React from 'react'
import { AlertTriangle } from 'lucide-react'
import Modal from './Modal'
import { useApp } from '../../context/AppContext'

export default function ConfirmDelete() {
  const { state, dispatch, deleteMedication, deletePatient, deleteFiveFuPatient } = useApp()
  const { type, data } = state.modal

  const isMedication = type === 'deleteMedication'
  const isFiveFuPatient = type === 'deleteFiveFuPatient'

  const patientCount = isMedication
    ? state.patients.filter(p => p.medicationId === data?.id).length
    : 0

  const handleConfirm = () => {
    if (isMedication) deleteMedication(data.id)
    else if (isFiveFuPatient) deleteFiveFuPatient(data.id)
    else deletePatient(data.id)
  }

  const title = isMedication
    ? 'Delete Medication'
    : isFiveFuPatient
      ? 'Delete 5-FU Patient'
      : 'Delete Patient'

  const confirmText = isMedication
    ? `Delete "${data?.medicationName}"?`
    : isFiveFuPatient
      ? `Delete 5-FU patient "${data?.name}"?`
      : `Delete patient "${data?.patientName}"?`

  const detailText = isMedication
    ? patientCount > 0
      ? `This will also permanently delete ${patientCount} patient record${patientCount !== 1 ? 's' : ''} linked to this medication.`
      : 'This action cannot be undone.'
    : isFiveFuPatient
      ? 'This will permanently remove this 5-FU patient record.'
      : 'This will permanently remove this patient record.'

  return (
    <Modal
      title={title}
      onClose={() => dispatch({ type: 'CLOSE_MODAL' })}
      size="sm"
      danger
    >
      <div className="flex flex-col items-center text-center gap-4">
        <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
          <AlertTriangle size={26} className="text-red-600" />
        </div>

        <div>
          <p className="text-slate-800 font-medium mb-1">{confirmText}</p>
          <p className="text-sm text-slate-500">{detailText}</p>
        </div>

        <div className="flex gap-3 w-full pt-2">
          <button className="btn-secondary flex-1" onClick={() => dispatch({ type: 'CLOSE_MODAL' })}>
            Cancel
          </button>
          <button className="btn-danger flex-1" onClick={handleConfirm}>
            Delete
          </button>
        </div>
      </div>
    </Modal>
  )
}
