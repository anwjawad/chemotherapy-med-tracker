import React, { useState, useMemo, useEffect } from 'react'
import { Search, X, Pill, Users, CalendarX, CalendarCheck, Printer } from 'lucide-react'
import { useApp } from '../context/AppContext'
import MedicationCard from './MedicationCard'
import EmptyState from './EmptyState'
import { printAllDelayed } from '../utils/print'

// Animates a number from 0 → target on mount with an ease-out cubic curve.
function useCountUp(target, duration = 500) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (target === 0) { setCount(0); return }
    let startTime = null
    let raf
    const step = (ts) => {
      if (!startTime) startTime = ts
      const progress = Math.min((ts - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(target * eased))
      if (progress < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  return count
}

export default function Dashboard() {
  const { state, dispatch } = useApp()
  const [search, setSearch] = useState('')

  const allDelayed   = state.patients.filter(p => p.status === 'delayed')
  const allScheduled = state.patients.filter(p => p.status === 'scheduled')

  const filtered = useMemo(() => {
    if (!search.trim()) return state.medications
    const q = search.toLowerCase()
    return state.medications.filter(m => m.medicationName.toLowerCase().includes(q))
  }, [search, state.medications])

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Medications"    value={state.medications.length} color="indigo"  icon={<Pill         size={18} />} />
        <StatCard label="Total Patients" value={state.patients.length}    color="slate"   icon={<Users        size={18} />} />
        <StatCard label="Delayed"        value={allDelayed.length}        color="red"     icon={<CalendarX    size={18} />} />
        <StatCard label="Scheduled"      value={allScheduled.length}      color="emerald" icon={<CalendarCheck size={18} />} />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="input-field pl-9 pr-8"
            placeholder="Filter medications…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              style={{ transition: 'color 120ms ease-out' }}
              onClick={() => setSearch('')}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <button
          className="btn-secondary shrink-0"
          onClick={() => printAllDelayed(state.patients)}
          title="Print all delayed patients across all medications"
        >
          <Printer size={15} />
          Print All Delayed
        </button>
      </div>

      {/* Grid */}
      {state.medications.length === 0 ? (
        <EmptyState
          icon={<Pill size={26} />}
          title="No medications yet"
          description="Add a medication to start tracking patient availability."
          action={
            <button
              className="btn-primary"
              onClick={() => dispatch({ type: 'OPEN_MODAL', modalType: 'addMedication' })}
            >
              Add First Medication
            </button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Search size={24} />}
          title="No medications match"
          description={`No medication found for "${search}"`}
          action={<button className="btn-secondary" onClick={() => setSearch('')}>Clear search</button>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((med, idx) => (
            // Each card staggers in 40ms after the previous one
            <div
              key={med.id}
              style={{ animation: `fadeIn 200ms ease-out ${idx * 40}ms both` }}
            >
              <MedicationCard medication={med} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, color, icon }) {
  const displayed = useCountUp(value)

  const colors = {
    indigo:  'bg-indigo-50 border-indigo-100 text-indigo-600',
    slate:   'bg-slate-50 border-slate-100 text-slate-600',
    red:     'bg-red-50 border-red-100 text-red-600',
    emerald: 'bg-emerald-50 border-emerald-100 text-emerald-600',
  }
  const valColors = {
    indigo:  'text-indigo-700',
    slate:   'text-slate-700',
    red:     'text-red-700',
    emerald: 'text-emerald-700',
  }
  return (
    <div className={`rounded-2xl border p-4 ${colors[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium opacity-70">{label}</span>
        {icon}
      </div>
      <p className={`text-3xl font-bold tabular-nums ${valColors[color]}`}>{displayed}</p>
    </div>
  )
}
