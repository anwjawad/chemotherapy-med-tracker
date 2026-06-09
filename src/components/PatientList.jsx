import React from 'react'
import { Printer, CalendarX, CalendarCheck } from 'lucide-react'
import PatientRow from './PatientRow'
import EmptyState from './EmptyState'
import { printDelayedForMedication, printScheduledForMedication } from '../utils/print'

export default function PatientList({ patients, type, medicationName, filters }) {
  const isDelayed = type === 'delayed'
  const count = patients.length

  const handlePrint = (e) => {
    e.stopPropagation()
    if (isDelayed) printDelayedForMedication(patients, medicationName)
    else printScheduledForMedication(patients, medicationName)
  }

  return (
    <div className="card overflow-hidden flex flex-col">
      {/* List Header */}
      <div className={`px-5 py-4 flex items-center justify-between border-b ${
        isDelayed ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'
      }`}>
        <div className="flex items-center gap-2.5">
          {isDelayed
            ? <CalendarX size={16} className="text-red-500" />
            : <CalendarCheck size={16} className="text-emerald-500" />}
          <span className={`font-semibold text-sm ${isDelayed ? 'text-red-700' : 'text-emerald-700'}`}>
            {isDelayed ? 'Delayed / Unavailable' : 'Scheduled / Appointment Given'}
          </span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
            isDelayed ? 'bg-red-200 text-red-800' : 'bg-emerald-200 text-emerald-800'
          }`}>
            {count}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isDelayed && count > 0 && (
            <span className="text-xs text-red-400">Sorted: most delayed first</span>
          )}
          {!isDelayed && count > 0 && (
            <span className="text-xs text-emerald-400">Sorted: nearest appointment first</span>
          )}
          <button
            className="btn-ghost py-1 px-2"
            onClick={handlePrint}
            title={`Print ${isDelayed ? 'delayed' : 'scheduled'} patients`}
          >
            <Printer size={14} />
            <span className="hidden sm:inline text-xs">Print</span>
          </button>
        </div>
      </div>

      {/* Patient List */}
      <div className="flex-1 overflow-y-auto">
        {count === 0 ? (
          <EmptyState
            icon={isDelayed ? <CalendarX size={22} /> : <CalendarCheck size={22} />}
            title={isDelayed ? 'No delayed patients' : 'No scheduled patients'}
            description={
              isDelayed
                ? 'All patients for this medication have upcoming appointments.'
                : 'Add next appointment dates to move patients here.'
            }
          />
        ) : (
          <div className="p-3 space-y-1">
            {patients.map(p => <PatientRow key={p.id} patient={p} />)}
          </div>
        )}
      </div>
    </div>
  )
}
