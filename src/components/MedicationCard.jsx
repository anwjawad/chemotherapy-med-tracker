import React, { useEffect, useRef, useState } from 'react'
import { Users, Clock, MoreVertical, Edit2, Trash2, ChevronRight, CalendarX, Pill } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { formatDate } from '../utils/helpers'
import SyncBadge from './SyncBadge'

const PALETTES = [
  { bg: 'from-violet-600 to-indigo-600',  icon: 'bg-white/20 text-white', bar: 'from-violet-400 to-indigo-500' },
  { bg: 'from-rose-500 to-pink-600',       icon: 'bg-white/20 text-white', bar: 'from-rose-400 to-pink-500' },
  { bg: 'from-amber-500 to-orange-500',    icon: 'bg-white/20 text-white', bar: 'from-amber-400 to-orange-400' },
  { bg: 'from-teal-500 to-cyan-600',       icon: 'bg-white/20 text-white', bar: 'from-teal-400 to-cyan-500' },
  { bg: 'from-blue-600 to-sky-500',        icon: 'bg-white/20 text-white', bar: 'from-blue-400 to-sky-400' },
  { bg: 'from-emerald-500 to-green-600',   icon: 'bg-white/20 text-white', bar: 'from-emerald-400 to-green-500' },
  { bg: 'from-fuchsia-600 to-purple-600',  icon: 'bg-white/20 text-white', bar: 'from-fuchsia-400 to-purple-500' },
  { bg: 'from-red-600 to-rose-500',        icon: 'bg-white/20 text-white', bar: 'from-red-400 to-rose-400' },
]

function getPalette(name = '') {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return PALETTES[Math.abs(hash) % PALETTES.length]
}

function initials(name = '') {
  return name.split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 3)
}

export default function MedicationCard({ medication }) {
  const { state, dispatch } = useApp()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  // IntersectionObserver: animate the progress bar only when the card
  // scrolls into the viewport — feels more alive than animating immediately.
  const progressRef = useRef(null)
  const [barVisible, setBarVisible] = useState(false)

  useEffect(() => {
    const el = progressRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setBarVisible(true); obs.disconnect() } },
      { threshold: 0.4 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const patients      = state.patients.filter(p => p.medicationId === medication.id)
  const delayed       = patients.filter(p => p.status === 'delayed')
  const scheduled     = patients.filter(p => p.status === 'scheduled')
  const total         = patients.length
  const scheduledRatio = total > 0 ? scheduled.length / total : 0
  const palette       = getPalette(medication.medicationName)

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div
      className="card medication-card group overflow-hidden"
      onClick={() => dispatch({ type: 'SELECT_MEDICATION', payload: medication.id })}
    >
      {/* Coloured header band */}
      <div className={`bg-gradient-to-br ${palette.bg} px-5 pt-5 pb-4 relative overflow-hidden`}>
        <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10" />
        <div className="absolute -bottom-6 -right-2 w-16 h-16 rounded-full bg-white/10" />

        <div className="relative flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-xl ${palette.icon} flex items-center justify-center shrink-0 backdrop-blur-sm border border-white/20 text-sm font-bold`}>
              {initials(medication.medicationName) || <Pill size={16} />}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-white text-lg leading-tight tracking-tight drop-shadow-sm truncate">
                {medication.medicationName}
              </h3>
              {medication.notes
                ? <p className="text-white/70 text-xs mt-0.5 truncate">{medication.notes}</p>
                : <p className="text-white/50 text-xs mt-0.5">No notes</p>
              }
            </div>
          </div>

          {/* Menu trigger — fixed: opacity + color + bg all transition */}
          <div className="relative shrink-0" ref={menuRef} onClick={e => e.stopPropagation()}>
            <button
              className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/20 opacity-0 group-hover:opacity-100"
              style={{ transition: 'opacity 150ms ease-out, color 150ms ease-out, background-color 150ms ease-out' }}
              onClick={() => setMenuOpen(o => !o)}
            >
              <MoreVertical size={15} />
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 top-8 w-40 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-10 animate-slide-up"
                style={{ transformOrigin: 'top right' }}
              >
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  style={{ transition: 'background-color 120ms ease-out' }}
                  onClick={() => { setMenuOpen(false); dispatch({ type: 'OPEN_MODAL', modalType: 'editMedication', data: medication }) }}
                >
                  <Edit2 size={14} /> Edit
                </button>
                <button
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  style={{ transition: 'background-color 120ms ease-out' }}
                  onClick={() => { setMenuOpen(false); dispatch({ type: 'OPEN_MODAL', modalType: 'deleteMedication', data: medication }) }}
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="relative mt-2">
          <SyncBadge id={medication.id} />
        </div>
      </div>

      <div className="p-5">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-red-50 rounded-xl p-3 border border-red-100">
            <div className="flex items-center gap-1.5 mb-1">
              <CalendarX size={13} className="text-red-500" />
              <span className="text-xs text-red-600 font-medium">Delayed</span>
            </div>
            <p className="text-2xl font-bold text-red-700">{delayed.length}</p>
          </div>
          <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
            <div className="flex items-center gap-1.5 mb-1">
              <Users size={13} className="text-emerald-500" />
              <span className="text-xs text-emerald-600 font-medium">Scheduled</span>
            </div>
            <p className="text-2xl font-bold text-emerald-700">{scheduled.length}</p>
          </div>
        </div>

        {/* Progress bar — animates from 0 → actual when card enters viewport */}
        {total > 0 && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-slate-400 mb-1.5">
              <span>{Math.round(scheduledRatio * 100)}% scheduled</span>
              <span>{total} total</span>
            </div>
            <div ref={progressRef} className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${palette.bar} rounded-full`}
                style={{
                  width: barVisible ? `${scheduledRatio * 100}%` : '0%',
                  transition: barVisible ? 'width 700ms cubic-bezier(0.23,1,0.32,1)' : 'none',
                }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-50">
          <div className="flex items-center gap-1">
            <Clock size={11} />
            {medication.updatedAt
              ? `Updated ${formatDate(medication.updatedAt.split('T')[0])}`
              : 'No updates yet'}
          </div>
          <span
            className="flex items-center gap-1 text-indigo-400 font-medium group-hover:text-indigo-600"
            style={{ transition: 'color 150ms ease-out' }}
          >
            Open <ChevronRight size={12} />
          </span>
        </div>
      </div>
    </div>
  )
}
