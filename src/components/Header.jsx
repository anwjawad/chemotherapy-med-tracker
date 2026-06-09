import React, { useEffect } from 'react'
import { Search, Plus, ChevronRight, Pill, Database, Syringe } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { isMockMode } from '../utils/api'

export default function Header() {
  const { state, dispatch } = useApp()
  const inDetail = state.view === 'medicationDetail'
  const inFiveFu = state.view === 'fiveFu'
  const selectedMed = state.medications.find(m => m.id === state.selectedMedicationId)

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        dispatch({ type: 'SET_SEARCH', payload: { isOpen: true } })
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [dispatch])

  return (
    <header className="bg-white border-b border-slate-100 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ── Main row ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between h-14 gap-3">
          {/* Left: Logo + Breadcrumb */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => dispatch({ type: 'GO_DASHBOARD' })}
              className="flex items-center gap-2 shrink-0 group"
            >
              <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shadow-sm group-hover:bg-indigo-700 transition-colors">
                <Pill size={16} className="text-white" />
              </div>
              <span className="font-bold text-slate-800 text-sm hidden sm:block">MedTracker</span>
            </button>

            {inDetail && selectedMed && (
              <>
                <ChevronRight size={14} className="text-slate-300 shrink-0" />
                <span className="text-sm font-medium text-indigo-600 truncate max-w-[160px] sm:max-w-xs">
                  {selectedMed.medicationName}
                </span>
              </>
            )}
          </div>

          {/* Center: Mock mode badge */}
          {isMockMode() && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-amber-700 text-xs font-medium">
              <Database size={11} />
              Local mode
            </div>
          )}

          {/* Right: Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => dispatch({ type: 'SET_SEARCH', payload: { isOpen: true } })}
              className="btn-ghost"
              title="Global search (Ctrl+K)"
            >
              <Search size={15} />
              <span className="hidden sm:inline">Search</span>
              <kbd className="hidden sm:inline text-xs bg-slate-100 border border-slate-200 rounded px-1 py-0.5 font-mono">
                ⌃K
              </kbd>
            </button>

            {!inDetail && !inFiveFu && (
              <button
                className="btn-primary"
                onClick={() => dispatch({ type: 'OPEN_MODAL', modalType: 'addMedication' })}
              >
                <Plus size={15} />
                <span className="hidden sm:inline">Add Medication</span>
                <span className="sm:hidden">Add</span>
              </button>
            )}

            {inDetail && (
              <button
                className="btn-primary"
                onClick={() => dispatch({ type: 'OPEN_MODAL', modalType: 'addPatient' })}
              >
                <Plus size={15} />
                <span className="hidden sm:inline">Add Patient</span>
                <span className="sm:hidden">Add</span>
              </button>
            )}

            {inFiveFu && (
              <button
                className="btn-primary bg-teal-600 hover:bg-teal-700"
                onClick={() => dispatch({ type: 'OPEN_MODAL', modalType: 'addFiveFuPatient' })}
              >
                <Plus size={15} />
                <span className="hidden sm:inline">Add 5-FU Patient</span>
                <span className="sm:hidden">Add</span>
              </button>
            )}
          </div>
        </div>

        {/* ── Tab nav row ──────────────────────────────────────────────── */}
        <nav className="flex gap-0 -mb-px">
          <TabBtn
            active={!inFiveFu}
            onClick={() => !inFiveFu ? null : dispatch({ type: 'GO_DASHBOARD' })}
            icon={<Pill size={13} />}
            label="Medications"
          />
          <TabBtn
            active={inFiveFu}
            onClick={() => inFiveFu ? null : dispatch({ type: 'GO_FIVEFU' })}
            icon={<Syringe size={13} />}
            label="5-FU Patients"
            color="teal"
          />
        </nav>
      </div>
    </header>
  )
}

function TabBtn({ active, onClick, icon, label, color = 'indigo' }) {
  const activeColors = {
    indigo: 'border-indigo-600 text-indigo-600',
    teal: 'border-teal-600 text-teal-700',
  }
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-all duration-150 ${
        active
          ? `${activeColors[color]} bg-transparent`
          : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}
