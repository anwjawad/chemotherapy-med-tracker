import React, { useEffect, useRef } from 'react'
import { Edit2, Trash2, RotateCcw, Phone, Calendar, Clock } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { formatDate, getDaysSince, getDaysUntil, delayLabel } from '../utils/helpers'
import SyncBadge from './SyncBadge'

export default function PatientRow({ patient }) {
  const { state, dispatch, returnToDelayed } = useApp()
  const isHighlighted = state.highlightedPatientId === patient.id
  const rowRef = useRef(null)

  useEffect(() => {
    if (isHighlighted && rowRef.current) {
      rowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [isHighlighted])

  const daysSince = getDaysSince(patient.lastAppointment)
  const daysUntil = patient.nextAppointment ? getDaysUntil(patient.nextAppointment) : null

  const handleReturnToDelayed = async (e) => {
    e.stopPropagation()
    if (!window.confirm(`Return "${patient.patientName}" to the delayed list by clearing their next appointment?`)) return
    await returnToDelayed(patient)
  }

  return (
    <div
      ref={rowRef}
      className={`group flex flex-col sm:flex-row items-start sm:items-center gap-3 px-4 py-3.5 rounded-xl border transition-all duration-150 ${
        isHighlighted
          ? 'row-highlight border-yellow-200 bg-yellow-50'
          : 'border-transparent hover:bg-slate-50 hover:border-slate-200'
      }`}
    >
      {/* Avatar */}
      <div className={`w-9 h-9 rounded-xl shrink-0 flex items-center justify-center text-sm font-bold ${
        patient.status === 'delayed' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
      }`}>
        {patient.patientName?.[0]?.toUpperCase() || '?'}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 grid sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-1">
        {/* Name + Profile */}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="font-semibold text-slate-800 text-sm truncate">{patient.patientName}</p>
            <SyncBadge id={patient.id} />
          </div>
          <p className="font-mono text-xs text-slate-500">#{patient.profileNumber}</p>
        </div>

        {/* Dose */}
        <div className="flex flex-col justify-center">
          <span className="inline-block text-xs bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-full w-fit font-medium">
            {patient.dose}
          </span>
        </div>

        {/* Last Appointment */}
        <div className="flex flex-col gap-0.5">
          <span className="flex items-center gap-1 text-xs text-slate-500">
            <Clock size={11} className="shrink-0" />
            {patient.lastAppointment ? formatDate(patient.lastAppointment) : 'No last appt.'}
          </span>
          {patient.status === 'delayed' && daysSince !== null && (
            <span className={`text-xs font-medium ${
              daysSince > 60 ? 'text-red-600' : daysSince > 30 ? 'text-orange-600' : 'text-amber-600'
            }`}>
              {delayLabel(daysSince)}
            </span>
          )}
        </div>

        {/* Next Appointment / Phone */}
        <div className="flex flex-col gap-0.5">
          {patient.nextAppointment ? (
            <span className="flex items-center gap-1 text-xs text-emerald-600">
              <Calendar size={11} className="shrink-0" />
              {formatDate(patient.nextAppointment)}
              {daysUntil !== null && (
                <span className="text-xs text-emerald-500">
                  ({daysUntil === 0 ? 'today' : daysUntil > 0 ? `in ${daysUntil}d` : `${Math.abs(daysUntil)}d ago`})
                </span>
              )}
            </span>
          ) : (
            <span className="text-xs text-slate-400">No next appt.</span>
          )}
          {patient.phoneNumber && (
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <Phone size={11} /> {patient.phoneNumber}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
        {patient.status === 'scheduled' && (
          <button
            className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors"
            title="Return to delayed"
            onClick={handleReturnToDelayed}
          >
            <RotateCcw size={14} />
          </button>
        )}
        <button
          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
          title="Edit patient"
          onClick={(e) => {
            e.stopPropagation()
            dispatch({ type: 'OPEN_MODAL', modalType: 'editPatient', data: patient })
          }}
        >
          <Edit2 size={14} />
        </button>
        <button
          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
          title="Delete patient"
          onClick={(e) => {
            e.stopPropagation()
            dispatch({ type: 'OPEN_MODAL', modalType: 'deletePatient', data: patient })
          }}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}
