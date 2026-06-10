import React, { useState, useMemo, useEffect } from 'react'
import {
  Search, X, Plus, Printer, Calendar, Syringe,
  Users, Edit2, Trash2, CalendarDays, ChevronDown, ChevronUp, Upload,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import EmptyState from './EmptyState'
import SyncBadge from './SyncBadge'
import FiveFuCalendarSidebar from './FiveFuCalendarSidebar'
import { formatDate } from '../utils/helpers'
import { printFiveFuDay, printFiveFuRange, printFiveFuAll } from '../utils/fiveFuPrint'

const TODAY = new Date().toISOString().split('T')[0]

function formatDateLong(dateStr) {
  if (!dateStr) return '—'
  try {
    const [year, month, day] = dateStr.split('-')
    if (!year || !month || !day) return dateStr
    return `${parseInt(day)}/${parseInt(month)}/${year}`
  } catch {
    return dateStr
  }
}

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

export default function FiveFuPage() {
  const { state, dispatch } = useApp()
  const patients = state.fiveFuPatients || []

  const [search,      setSearch]      = useState('')
  const [filterDate,  setFilterDate]  = useState('')
  const [filterFrom,  setFilterFrom]  = useState('')
  const [filterTo,    setFilterTo]    = useState('')
  const [showMobileCal, setShowMobileCal] = useState(false)

  const setFilterDateOnly = (val) => { setFilterDate(val); setFilterFrom(''); setFilterTo('') }
  const setFilterRange    = (from, to) => { setFilterDate(''); setFilterFrom(from); setFilterTo(to) }

  const hasActiveFilters = search || filterDate || filterFrom || filterTo

  const clearFilters = () => {
    setSearch(''); setFilterDate(''); setFilterFrom(''); setFilterTo('')
  }

  // ── Filtered + sorted ─────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let result = [...patients]

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(p =>
        p.name?.toLowerCase().includes(q) || p.fileNumber?.toLowerCase().includes(q)
      )
    }

    if (filterDate) {
      result = result.filter(p => p.appointmentDate === filterDate)
    } else {
      if (filterFrom) result = result.filter(p => p.appointmentDate >= filterFrom)
      if (filterTo)   result = result.filter(p => p.appointmentDate <= filterTo)
    }

    result.sort((a, b) => {
      const dc = (a.appointmentDate || '').localeCompare(b.appointmentDate || '')
      return dc !== 0 ? dc : (a.name || '').localeCompare(b.name || '')
    })

    return result
  }, [patients, search, filterDate, filterFrom, filterTo])

  // ── Grouped by date ───────────────────────────────────────────────────────
  const grouped = useMemo(() => {
    const map = {}
    filtered.forEach(p => {
      const d = p.appointmentDate || '—'
      if (!map[d]) map[d] = []
      map[d].push(p)
    })
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b))
  }, [filtered])

  const todayCount = patients.filter(p => p.appointmentDate === TODAY).length

  // ── Print handlers ────────────────────────────────────────────────────────
  const handlePrint = () => {
    if (filterDate) return printFiveFuDay(filtered, filterDate)
    if (filterFrom || filterTo) return printFiveFuRange(filtered, filterFrom, filterTo)
    printFiveFuAll(filtered)
  }

  const handlePrintToday = () => {
    const todayPts = patients.filter(p => p.appointmentDate === TODAY)
    printFiveFuDay(todayPts, TODAY)
  }

  const printLabel = filterDate
    ? `Print Day (${filtered.length})`
    : (filterFrom || filterTo)
      ? `Print Range (${filtered.length})`
      : `Print All (${filtered.length})`

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Patients" value={patients.length}  color="teal"   icon={<Users        size={17} />} />
        <StatCard label="Today"          value={todayCount}       color="indigo" icon={<CalendarDays size={17} />} />
        <StatCard label="Filtered"       value={filtered.length}  color="slate"  icon={<Search       size={17} />} />
        <StatCard label="Date Groups"    value={grouped.length}   color="purple" icon={<Calendar     size={17} />} />
      </div>

      {/* Toolbar card */}
      <div className="card p-4 space-y-3">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-0">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="input-field pl-9 pr-8"
              placeholder="Search by patient name or file number…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                style={{ transition: 'color 120ms ease-out' }}
                onClick={() => setSearch('')}
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Date filters */}
          <div className="flex flex-wrap gap-2 items-center">
            <div className="flex items-center gap-1.5">
              <label className="text-xs text-slate-500 font-medium shrink-0">Day:</label>
              <input
                type="date"
                className="input-field text-sm py-2"
                value={filterDate}
                onChange={e => setFilterDateOnly(e.target.value)}
                title="Filter by a single appointment date"
              />
            </div>

            <span className="text-slate-300 text-sm hidden sm:block">|</span>

            <div className="flex items-center gap-1.5">
              <label className="text-xs text-slate-500 font-medium shrink-0">From:</label>
              <input
                type="date"
                className="input-field text-sm py-2"
                value={filterFrom}
                onChange={e => setFilterRange(e.target.value, filterTo)}
                title="From date"
              />
              <span className="text-xs text-slate-400">to</span>
              <input
                type="date"
                className="input-field text-sm py-2"
                value={filterTo}
                onChange={e => setFilterRange(filterFrom, e.target.value)}
                title="To date"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 shrink-0 flex-wrap">
            <button
              className="btn-primary bg-teal-600 hover:bg-teal-700"
              onClick={() => dispatch({ type: 'OPEN_MODAL', modalType: 'addFiveFuPatient' })}
              title="Add a single patient"
            >
              <Plus size={14} />
              <span className="hidden sm:inline">Add Patient</span>
            </button>
            <button
              className="btn-secondary"
              onClick={() => dispatch({ type: 'OPEN_MODAL', modalType: 'bulkImportFiveFu' })}
              title="Bulk import patients from a list"
            >
              <Upload size={14} />
              <span className="hidden sm:inline">Bulk Import</span>
            </button>
            <button
              onClick={() => setShowMobileCal(c => !c)}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border shadow-sm lg:hidden ${
                showMobileCal
                  ? 'bg-teal-50 border-teal-200 text-teal-700'
                  : 'bg-white border-slate-200 text-slate-700'
              }`}
              style={{ transition: 'background-color 150ms ease-out, border-color 150ms ease-out, transform 160ms ease-out' }}
              title="Toggle appointment calendar"
            >
              <CalendarDays size={14} />
              <span className="hidden sm:inline">Calendar</span>
            </button>

            {hasActiveFilters && (
              <button className="btn-secondary" onClick={clearFilters}>
                <X size={13} />
                <span className="hidden sm:inline">Clear</span>
              </button>
            )}
            <button className="btn-secondary" onClick={handlePrintToday} title="Print today's 5-FU patients">
              <Printer size={14} />
              <span className="hidden sm:inline">Today ({todayCount})</span>
            </button>
            <button className="btn-secondary" onClick={handlePrint} title="Print the current filtered list">
              <Printer size={14} />
              <span className="hidden sm:inline">{printLabel}</span>
            </button>
          </div>
        </div>

        {/* Active filter summary */}
        {hasActiveFilters && (
          <p className="text-xs text-teal-700 bg-teal-50 border border-teal-100 rounded-lg px-3 py-1.5">
            {filterDate && `Showing appointments on ${formatDateLong(filterDate)}`}
            {(filterFrom || filterTo) && `Showing appointments ${filterFrom ? `from ${filterFrom}` : ''}${filterTo ? ` to ${filterTo}` : ''}`}
            {search && ` · matching "${search}"`}
            {' '}— {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Two-column layout: patient list + calendar sidebar */}
      <div className="flex gap-5 items-start">
        {/* ── Main content ──────────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-4">
          {showMobileCal && (
            <div className="lg:hidden">
              <FiveFuCalendarSidebar
                patients={patients}
                selectedDate={filterDate}
                onDaySelect={setFilterDateOnly}
              />
            </div>
          )}

          {patients.length === 0 ? (
            <EmptyState
              icon={<Syringe size={26} />}
              title="No 5-FU patients yet"
              description="Add a patient to start tracking 5-FU treatment appointments."
              action={
                <button
                  className="btn-primary bg-teal-600 hover:bg-teal-700"
                  onClick={() => dispatch({ type: 'OPEN_MODAL', modalType: 'addFiveFuPatient' })}
                >
                  <Plus size={15} />
                  Add First Patient
                </button>
              }
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<Search size={24} />}
              title="No patients match"
              description="Try adjusting your filters or search term."
              action={
                <button className="btn-secondary" onClick={clearFilters}>
                  <X size={14} /> Clear Filters
                </button>
              }
            />
          ) : (
            grouped.map(([date, groupPatients]) => (
              <DateGroup
                key={date}
                date={date}
                patients={groupPatients}
                onPrintDay={() => printFiveFuDay(groupPatients, date)}
              />
            ))
          )}
        </div>

        {/* ── Desktop calendar sidebar ──────────────────────── */}
        <div className="hidden lg:block w-64 shrink-0">
          <FiveFuCalendarSidebar
            patients={patients}
            selectedDate={filterDate}
            onDaySelect={setFilterDateOnly}
          />
        </div>
      </div>
    </div>
  )
}

// ── Date group ────────────────────────────────────────────────────────────────
function DateGroup({ date, patients, onPrintDay }) {
  const [collapsed, setCollapsed] = useState(false)
  const isToday = date === TODAY
  const isPast  = date < TODAY && date !== '—'

  return (
    <div className="card overflow-hidden animate-fade-in">
      {/* Group header */}
      <div
        className={`px-5 py-3.5 flex items-center justify-between border-b cursor-pointer select-none ${
          isToday ? 'bg-teal-600 border-teal-700'
          : isPast ? 'bg-slate-700 border-slate-800'
          : 'bg-slate-800 border-slate-900'
        }`}
        onClick={() => setCollapsed(c => !c)}
      >
        <div className="flex items-center gap-3">
          <CalendarDays size={16} className="text-white/80 shrink-0" />
          <div>
            <span className="font-semibold text-white text-sm">
              {date === '—' ? 'No Date Assigned' : formatDateLong(date)}
            </span>
            {isToday && (
              <span className="ml-2 text-[11px] bg-white/20 text-white px-2 py-0.5 rounded-full font-medium">
                Today
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-white/70 font-medium">
            {patients.length} patient{patients.length !== 1 ? 's' : ''}
          </span>
          <button
            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10"
            style={{ transition: 'color 120ms ease-out, background-color 120ms ease-out' }}
            onClick={e => { e.stopPropagation(); onPrintDay() }}
            title="Print this day's patients"
          >
            <Printer size={14} />
          </button>
          <span className="text-white/50">
            {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </span>
        </div>
      </div>

      {/* Animated collapse using CSS grid trick — no JS height measurement needed */}
      <div
        style={{
          display: 'grid',
          gridTemplateRows: collapsed ? '0fr' : '1fr',
          transition: 'grid-template-rows 250ms cubic-bezier(0.23,1,0.32,1)',
        }}
      >
        <div style={{ overflow: 'hidden' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide w-10">#</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Patient Name</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">File #</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Protocol</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">5-FU Dose</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((p, idx) => (
                  <PatientRow key={p.id} patient={p} index={idx + 1} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Patient row ───────────────────────────────────────────────────────────────
function PatientRow({ patient, index }) {
  const { dispatch } = useApp()

  return (
    <tr className="group border-b border-slate-50 last:border-0 hover:bg-teal-50/40" style={{ transition: 'background-color 100ms ease-out' }}>
      <td className="px-4 py-3 text-slate-400 text-xs font-semibold tabular-nums">{index}</td>

      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-xs font-bold bg-teal-100 text-teal-700">
            {patient.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-800 text-sm leading-tight">{patient.name || '—'}</p>
            <SyncBadge id={patient.id} />
          </div>
        </div>
      </td>

      <td className="px-4 py-3">
        <span className="font-mono text-sm text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg">
          {patient.fileNumber || '—'}
        </span>
      </td>

      <td className="px-4 py-3">
        <span className="inline-block text-xs bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-1 rounded-full font-medium whitespace-nowrap">
          {patient.protocol || '—'}
        </span>
      </td>

      <td className="px-4 py-3">
        <span className="text-sm text-slate-700 font-medium">{patient.fiveFuDose || '—'}</span>
      </td>

      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
          style={{ transition: 'opacity 150ms ease-out' }}
        >
          <button
            className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50"
            style={{ transition: 'color 120ms ease-out, background-color 120ms ease-out' }}
            title="Edit patient"
            onClick={() => dispatch({ type: 'OPEN_MODAL', modalType: 'editFiveFuPatient', data: patient })}
          >
            <Edit2 size={14} />
          </button>
          <button
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
            style={{ transition: 'color 120ms ease-out, background-color 120ms ease-out' }}
            title="Delete patient"
            onClick={() => dispatch({ type: 'OPEN_MODAL', modalType: 'deleteFiveFuPatient', data: patient })}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  )
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, color, icon }) {
  const displayed = useCountUp(value)

  const colors = {
    teal:   'bg-teal-50 border-teal-100 text-teal-600',
    indigo: 'bg-indigo-50 border-indigo-100 text-indigo-600',
    slate:  'bg-slate-50 border-slate-100 text-slate-600',
    purple: 'bg-purple-50 border-purple-100 text-purple-600',
  }
  const valColors = {
    teal:   'text-teal-700',
    indigo: 'text-indigo-700',
    slate:  'text-slate-700',
    purple: 'text-purple-700',
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
