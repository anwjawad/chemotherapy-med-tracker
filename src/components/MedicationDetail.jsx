import React, { useState, useMemo } from 'react'
import {
  ChevronLeft, Edit2, Trash2, Plus, Search, X, Filter,
  Printer, SlidersHorizontal, ChevronDown,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import PatientList from './PatientList'
import EmptyState from './EmptyState'
import Spinner from './Spinner'
import {
  sortDelayedPatients, sortScheduledPatients, applyPatientFilters, formatDate,
} from '../utils/helpers'
import { printFilteredList, printDelayedForMedication, printScheduledForMedication } from '../utils/print'

const SORT_OPTIONS = [
  { value: 'default', label: 'Default (by status)' },
  { value: 'mostDelayed', label: 'Most Delayed First' },
  { value: 'nearestAppt', label: 'Nearest Appointment' },
  { value: 'name', label: 'Patient Name A–Z' },
]

const TABS = [
  { value: 'all', label: 'All' },
  { value: 'delayed', label: 'Delayed' },
  { value: 'scheduled', label: 'Scheduled' },
]

export default function MedicationDetail() {
  const { state, dispatch } = useApp()
  const medication = state.medications.find(m => m.id === state.selectedMedicationId)
  const allPatientsForMed = state.patients.filter(p => p.medicationId === state.selectedMedicationId)

  const [tab, setTab] = useState('all')
  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    lastApptFrom: '', lastApptTo: '', nextApptFrom: '', nextApptTo: '', sort: 'default',
  })

  const setFilter = (k, v) => setFilters(f => ({ ...f, [k]: v }))
  const clearFilters = () => setFilters({ lastApptFrom: '', lastApptTo: '', nextApptFrom: '', nextApptTo: '', sort: 'default' })
  const hasActiveFilters = Object.values(filters).some(v => v && v !== 'default') || search

  const processedPatients = useMemo(() => {
    let result = applyPatientFilters(allPatientsForMed, { search, ...filters })

    if (filters.sort === 'mostDelayed') {
      result = sortDelayedPatients(result)
    } else if (filters.sort === 'nearestAppt') {
      result = sortScheduledPatients(result)
    } else if (filters.sort === 'name') {
      result = [...result].sort((a, b) => (a.patientName || '').localeCompare(b.patientName || ''))
    }

    return result
  }, [allPatientsForMed, search, filters])

  const delayedPatients = useMemo(() => {
    const base = filters.sort === 'default' ? sortDelayedPatients : (p) => p
    const list = processedPatients.filter(p => p.status === 'delayed')
    return filters.sort === 'default' ? sortDelayedPatients(list) : list
  }, [processedPatients, filters.sort])

  const scheduledPatients = useMemo(() => {
    const list = processedPatients.filter(p => p.status === 'scheduled')
    return filters.sort === 'default' ? sortScheduledPatients(list) : list
  }, [processedPatients, filters.sort])

  if (!medication) {
    return (
      <EmptyState
        title="Medication not found"
        description="This medication may have been deleted."
        action={<button className="btn-secondary" onClick={() => dispatch({ type: 'GO_DASHBOARD' })}>Back to Dashboard</button>}
      />
    )
  }

  const visibleDelayed = tab === 'scheduled' ? [] : delayedPatients
  const visibleScheduled = tab === 'delayed' ? [] : scheduledPatients

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <button
          className="btn-ghost"
          onClick={() => dispatch({ type: 'GO_DASHBOARD' })}
        >
          <ChevronLeft size={15} /> Back
        </button>

        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-slate-800 truncate">{medication.medicationName}</h1>
          {medication.notes && (
            <p className="text-sm text-slate-500 truncate">{medication.notes}</p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            className="btn-ghost"
            onClick={() => dispatch({ type: 'OPEN_MODAL', modalType: 'editMedication', data: medication })}
          >
            <Edit2 size={14} /> Edit
          </button>
          <button
            className="btn-ghost text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={() => dispatch({ type: 'OPEN_MODAL', modalType: 'deleteMedication', data: medication })}
          >
            <Trash2 size={14} /> Delete
          </button>
          <button
            className="btn-primary"
            onClick={() => dispatch({ type: 'OPEN_MODAL', modalType: 'addPatient' })}
          >
            <Plus size={15} /> Add Patient
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="input-field pl-9 pr-8"
              placeholder="Search patient name or profile number…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" onClick={() => setSearch('')}>
                <X size={13} />
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex rounded-xl border border-slate-200 overflow-hidden bg-slate-50 shrink-0">
            {TABS.map(t => (
              <button
                key={t.value}
                onClick={() => setTab(t.value)}
                className={`px-4 py-2 text-sm font-medium transition-all duration-150 ${
                  tab === t.value
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {t.label}
                {t.value !== 'all' && (
                  <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                    tab === t.value ? 'bg-white/20' : 'bg-slate-200 text-slate-500'
                  }`}>
                    {t.value === 'delayed' ? delayedPatients.length : scheduledPatients.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="relative shrink-0">
            <select
              className="input-field appearance-none pr-8 cursor-pointer"
              value={filters.sort}
              onChange={e => setFilter('sort', e.target.value)}
            >
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Filter toggle */}
          <button
            className={`btn-secondary shrink-0 ${showFilters ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : ''}`}
            onClick={() => setShowFilters(s => !s)}
          >
            <SlidersHorizontal size={14} />
            <span className="hidden sm:inline">Filters</span>
            {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-indigo-500" />}
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 animate-slide-up">
            <div>
              <label className="label text-xs">Last Appt. From</label>
              <input type="date" className="input-field text-sm" value={filters.lastApptFrom} onChange={e => setFilter('lastApptFrom', e.target.value)} />
            </div>
            <div>
              <label className="label text-xs">Last Appt. To</label>
              <input type="date" className="input-field text-sm" value={filters.lastApptTo} onChange={e => setFilter('lastApptTo', e.target.value)} />
            </div>
            <div>
              <label className="label text-xs">Next Appt. From</label>
              <input type="date" className="input-field text-sm" value={filters.nextApptFrom} onChange={e => setFilter('nextApptFrom', e.target.value)} />
            </div>
            <div>
              <label className="label text-xs">Next Appt. To</label>
              <input type="date" className="input-field text-sm" value={filters.nextApptTo} onChange={e => setFilter('nextApptTo', e.target.value)} />
            </div>
            <div className="col-span-2 sm:col-span-4 flex gap-2">
              <button className="btn-secondary text-xs py-1.5" onClick={clearFilters}>
                <X size={12} /> Clear filters
              </button>
              <button
                className="btn-secondary text-xs py-1.5"
                onClick={() => printFilteredList(processedPatients, `Filtered Patients — ${medication.medicationName}`)}
              >
                <Printer size={12} /> Print filtered results ({processedPatients.length})
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Patient Lists */}
      {tab === 'all' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <PatientList
            patients={visibleDelayed}
            type="delayed"
            medicationName={medication.medicationName}
          />
          <PatientList
            patients={visibleScheduled}
            type="scheduled"
            medicationName={medication.medicationName}
          />
        </div>
      ) : tab === 'delayed' ? (
        <PatientList
          patients={visibleDelayed}
          type="delayed"
          medicationName={medication.medicationName}
        />
      ) : (
        <PatientList
          patients={visibleScheduled}
          type="scheduled"
          medicationName={medication.medicationName}
        />
      )}
    </div>
  )
}
