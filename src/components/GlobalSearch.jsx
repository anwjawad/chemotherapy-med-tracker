import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Search, X, Clock, CalendarCheck, Pill } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { formatDate } from '../utils/helpers'

export default function GlobalSearch() {
  const { state, dispatch, navigateToPatient } = useApp()
  const { isOpen, query } = state.globalSearch
  const inputRef = useRef(null)

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 50)
  }, [isOpen])

  const results = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    return state.patients.filter(
      p => p.patientName?.toLowerCase().includes(q) || p.profileNumber?.toLowerCase().includes(q)
    ).slice(0, 20)
  }, [query, state.patients])

  if (!isOpen) return null

  const close = () => dispatch({ type: 'SET_SEARCH', payload: { isOpen: false, query: '' } })

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center pt-[10vh] px-4" onClick={e => e.target === e.currentTarget && close()}>
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={close} />

      <div className="relative w-full max-w-2xl animate-slide-up">
        {/* Search Input */}
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100">
            <Search size={18} className="text-slate-400 shrink-0" />
            <input
              ref={inputRef}
              className="flex-1 text-base text-slate-800 placeholder:text-slate-400 outline-none bg-transparent"
              placeholder="Search by patient name or profile number…"
              value={query}
              onChange={e => dispatch({ type: 'SET_SEARCH', payload: { query: e.target.value } })}
            />
            {query && (
              <button onClick={() => dispatch({ type: 'SET_SEARCH', payload: { query: '' } })} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            )}
            <button onClick={close} className="btn-ghost py-1 px-2 text-xs">
              Esc
            </button>
          </div>

          {/* Results */}
          {query.trim() && (
            <div className="max-h-[55vh] overflow-y-auto py-2">
              {results.length === 0 ? (
                <div className="flex flex-col items-center py-10 gap-2 text-slate-400">
                  <Search size={24} />
                  <p className="text-sm">No patients found for "{query}"</p>
                </div>
              ) : (
                <>
                  <p className="px-4 py-2 text-xs text-slate-400 font-medium">
                    {results.length} result{results.length !== 1 ? 's' : ''} found
                  </p>
                  {results.map(p => (
                    <PatientResult key={p.id} patient={p} onClick={() => navigateToPatient(p)} />
                  ))}
                </>
              )}
            </div>
          )}

          {!query.trim() && (
            <div className="px-4 py-6 text-center text-sm text-slate-400">
              Start typing to search across all patients
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function PatientResult({ patient, onClick }) {
  return (
    <button
      className="w-full text-left px-4 py-3 hover:bg-indigo-50 transition-colors group"
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-xl shrink-0 flex items-center justify-center text-sm font-bold ${
          patient.status === 'delayed' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
        }`}>
          {patient.patientName?.[0]?.toUpperCase() || '?'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-800 text-sm">{patient.patientName}</span>
            <span className="font-mono text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
              #{patient.profileNumber}
            </span>
            <span className={patient.status === 'delayed' ? 'badge-delayed' : 'badge-scheduled'}>
              {patient.status === 'delayed' ? '⏳ Delayed' : '✓ Scheduled'}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <Pill size={11} /> {patient.medicationName}
            </span>
            <span className="text-xs text-slate-400">{patient.dose}</span>
            {patient.lastAppointment && (
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <Clock size={11} /> Last: {formatDate(patient.lastAppointment)}
              </span>
            )}
            {patient.nextAppointment && (
              <span className="flex items-center gap-1 text-xs text-emerald-600">
                <CalendarCheck size={11} /> Next: {formatDate(patient.nextAppointment)}
              </span>
            )}
          </div>
        </div>
        <span className="text-xs text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1">
          Open →
        </span>
      </div>
    </button>
  )
}
