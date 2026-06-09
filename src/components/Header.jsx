import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Search, Plus, ChevronRight, Pill, Database, Syringe } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { isMockMode } from '../utils/api'

export default function Header() {
  const { state, dispatch } = useApp()
  const inDetail  = state.view === 'medicationDetail'
  const inFiveFu  = state.view === 'fiveFu'
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
              className="flex items-center gap-2 shrink-0"
            >
              <div
                className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shadow-sm"
                style={{ transition: 'background-color 150ms ease-out' }}
              >
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

        {/* ── Tab nav — clip-path indicator ────────────────────────────── */}
        <TabNav inFiveFu={inFiveFu} dispatch={dispatch} />
      </div>
    </header>
  )
}

// ── Clip-path tab indicator ───────────────────────────────────────────────────
// Technique: render two overlapping tab lists.
//   • Base layer  — all tabs in "inactive" style, handles pointer events.
//   • Active overlay — all tabs in "active" style, clipped so only the
//     active tab is visible. clip-path transitions smoothly on tab change,
//     giving a perfect simultaneous text-color + border-color switch that
//     individual CSS color transitions can never achieve.
//
// useLayoutEffect measures the active tab and sets the clip before the first
// paint, so there's no jump. Subsequent changes animate via CSS transition.

const TABS = [
  { id: 0, icon: <Pill    size={13} />, label: 'Medications'  },
  { id: 1, icon: <Syringe size={13} />, label: '5-FU Patients' },
]

const ACTIVE_CLASS = [
  'border-indigo-600 text-indigo-600',
  'border-teal-600   text-teal-700',
]

function TabNav({ inFiveFu, dispatch }) {
  const navRef    = useRef(null)
  const [clip, setClip] = useState(null)
  // Track whether the initial measurement has been applied. The first
  // measurement must skip the CSS transition (element wasn't painted yet);
  // subsequent tab changes should animate.
  const ready = useRef(false)

  const measure = () => {
    const nav = navRef.current
    if (!nav) return
    const btns   = nav.querySelectorAll('[data-tab]')
    const active = btns[inFiveFu ? 1 : 0]
    if (!active) return
    const { left: nl, right: nr } = nav.getBoundingClientRect()
    const { left: tl, right: tr } = active.getBoundingClientRect()
    setClip(`inset(0 ${Math.round(nr - tr)}px 0 ${Math.round(tl - nl)}px)`)
  }

  // Initial: runs synchronously before first paint — no animation fires.
  useLayoutEffect(() => {
    measure()
    ready.current = true
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Subsequent tab changes: runs after paint — CSS transition fires.
  useEffect(() => {
    if (!ready.current) return
    measure()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inFiveFu])

  const onTab0 = () => !inFiveFu ? null : dispatch({ type: 'GO_DASHBOARD' })
  const onTab1 = () =>  inFiveFu ? null : dispatch({ type: 'GO_FIVEFU' })
  const handlers = [onTab0, onTab1]

  return (
    <nav ref={navRef} className="flex -mb-px relative select-none" aria-label="Main navigation">
      {/* ── Base layer: inactive style, receives pointer events ── */}
      {TABS.map((tab, i) => (
        <button
          key={tab.id}
          data-tab={tab.id}
          onClick={handlers[i]}
          className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
          style={{ transition: 'color 150ms ease-out, border-color 150ms ease-out' }}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}

      {/* ── Active overlay: clipped to show only the active tab ── */}
      {clip && (
        <div
          className="absolute inset-0 flex pointer-events-none overflow-hidden"
          aria-hidden="true"
          style={{
            clipPath:   clip,
            transition: ready.current
              ? 'clip-path 220ms cubic-bezier(0.23,1,0.32,1)'
              : 'none',
          }}
        >
          {TABS.map((tab, i) => (
            <button
              key={tab.id}
              tabIndex={-1}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 ${ACTIVE_CLASS[i]}`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      )}
    </nav>
  )
}
