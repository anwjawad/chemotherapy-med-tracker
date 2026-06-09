import React, { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

const TODAY = new Date().toISOString().split('T')[0]
const DOW = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function getCellStyle(count, isSelected, isToday) {
  if (isSelected) return 'bg-indigo-600 text-white shadow-sm'
  const ring = isToday ? 'ring-2 ring-offset-1 ring-teal-500 ' : ''
  if (count === 0) return ring + (isToday
    ? 'bg-white text-teal-700 font-bold'
    : 'text-slate-300 hover:bg-slate-100 hover:text-slate-500')
  if (count <= 2)  return ring + 'bg-teal-50  text-teal-700 hover:bg-teal-100'
  if (count <= 5)  return ring + 'bg-teal-200 text-teal-900 hover:bg-teal-300'
  if (count <= 9)  return ring + 'bg-teal-400 text-white   hover:bg-teal-500'
  return ring + 'bg-teal-700 text-white hover:bg-teal-800'
}

function fmtMonthYear(year, month) {
  return new Date(year, month).toLocaleDateString('en-GB', {
    month: 'long', year: 'numeric',
  })
}

function fmtDateShort(dateStr) {
  if (!dateStr) return ''
  try {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', {
      weekday: 'short', day: 'numeric', month: 'short',
    })
  } catch { return dateStr }
}

export default function FiveFuCalendarSidebar({ patients, selectedDate, onDaySelect }) {
  const now = new Date()
  const [viewYear, setViewYear]   = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth())

  const countByDate = useMemo(() => {
    const map = {}
    ;(patients || []).forEach(p => {
      if (p.appointmentDate) map[p.appointmentDate] = (map[p.appointmentDate] || 0) + 1
    })
    return map
  }, [patients])

  const monthTotal = useMemo(() => {
    const prefix = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`
    return Object.entries(countByDate)
      .filter(([d]) => d.startsWith(prefix))
      .reduce((s, [, c]) => s + c, 0)
  }, [countByDate, viewYear, viewMonth])

  const cells = useMemo(() => {
    const firstDow    = new Date(viewYear, viewMonth, 1).getDay()
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
    const grid        = Array(firstDow).fill(null)
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      grid.push({ day: d, dateStr, count: countByDate[dateStr] || 0 })
    }
    return grid
  }, [viewYear, viewMonth, countByDate])

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }
  const goToToday = () => {
    const t = new Date(); setViewYear(t.getFullYear()); setViewMonth(t.getMonth())
  }

  const handleDayClick = (cell) => {
    onDaySelect(selectedDate === cell.dateStr ? '' : cell.dateStr)
  }

  const selectedCount = selectedDate ? (countByDate[selectedDate] || 0) : 0

  return (
    <div className="card p-4 sticky top-28 select-none">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
            Calendar
          </p>
          {monthTotal > 0 && (
            <p className="text-[11px] text-teal-600 font-semibold mt-0.5">
              {monthTotal} this month
            </p>
          )}
        </div>

        <div className="flex items-center gap-0.5">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors duration-150"
            aria-label="Previous month"
          >
            <ChevronLeft size={13} strokeWidth={2.5} />
          </button>
          <button
            onClick={goToToday}
            className="px-2 py-1 text-[11px] font-semibold text-slate-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors duration-150 text-center min-w-[88px]"
            title="Jump to today"
          >
            {fmtMonthYear(viewYear, viewMonth)}
          </button>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors duration-150"
            aria-label="Next month"
          >
            <ChevronRight size={13} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* ── Day-of-week headers ────────────────────────────── */}
      <div className="grid grid-cols-7 mb-0.5">
        {DOW.map(d => (
          <div key={d} className="text-center text-[9px] font-semibold text-slate-300 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* ── Day grid ─────────────────────────────────────────── */}
      <div className="grid grid-cols-7 gap-px">
        {cells.map((cell, idx) =>
          !cell ? (
            <div key={`pad-${idx}`} className="min-h-[34px]" />
          ) : (
            <button
              key={cell.dateStr}
              onClick={() => handleDayClick(cell)}
              className={`
                flex flex-col items-center justify-center rounded-lg min-h-[34px]
                transition-all duration-150 cursor-pointer
                focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-1
                ${getCellStyle(cell.count, cell.dateStr === selectedDate, cell.dateStr === TODAY)}
              `}
              title={`${cell.dateStr} · ${cell.count} patient${cell.count !== 1 ? 's' : ''}`}
              aria-label={`${cell.dateStr}, ${cell.count} patient${cell.count !== 1 ? 's' : ''}`}
              aria-pressed={cell.dateStr === selectedDate}
            >
              <span className="text-[11px] font-semibold leading-tight">{cell.day}</span>
              {cell.count > 0 && (
                <span className={`text-[8px] font-bold leading-none ${
                  cell.dateStr === selectedDate ? 'text-white/80' : 'opacity-70'
                }`}>
                  {cell.count}
                </span>
              )}
            </button>
          )
        )}
      </div>

      {/* ── Legend ───────────────────────────────────────────── */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded bg-slate-100 border border-slate-200" title="0 patients" />
          <div className="w-2.5 h-2.5 rounded bg-teal-100" title="1–2 patients" />
          <div className="w-2.5 h-2.5 rounded bg-teal-300" title="3–5 patients" />
          <div className="w-2.5 h-2.5 rounded bg-teal-500" title="6–9 patients" />
          <div className="w-2.5 h-2.5 rounded bg-teal-700" title="10+ patients" />
        </div>
        <span className="text-[9px] text-slate-400 font-medium">Low → High</span>
      </div>

      {/* ── Selected date info ────────────────────────────────── */}
      {selectedDate && (
        <div className="mt-3 p-3 bg-indigo-50 border border-indigo-100 rounded-xl animate-fade-in">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-indigo-800 leading-snug">
                {fmtDateShort(selectedDate)}
              </p>
              <p className="text-[11px] text-indigo-500 mt-0.5">
                {selectedCount} patient{selectedCount !== 1 ? 's' : ''} scheduled
              </p>
            </div>
            <button
              onClick={() => onDaySelect('')}
              className="text-indigo-300 hover:text-indigo-600 transition-colors shrink-0 mt-0.5 p-0.5 rounded"
              title="Clear filter"
              aria-label="Clear date filter"
            >
              <X size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
