import React, { useState, useEffect, useRef } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import { useApp } from '../context/AppContext'

const ICONS = {
  success: <CheckCircle  size={16} className="text-emerald-500 shrink-0" />,
  error:   <XCircle     size={16} className="text-red-500 shrink-0" />,
  warning: <AlertTriangle size={16} className="text-amber-500 shrink-0" />,
  info:    <Info        size={16} className="text-indigo-500 shrink-0" />,
}

const BORDERS = {
  success: 'border-emerald-200',
  error:   'border-red-200',
  warning: 'border-amber-200',
  info:    'border-indigo-200',
}

const SWIPE_THRESHOLD_PX  = 80
const SWIPE_THRESHOLD_VEL = 0.35  // px/ms

function ToastItem({ toast, onRemove }) {
  const [visible,   setVisible]   = useState(false)
  const [dragX,     setDragX]     = useState(0)
  const [dragging,  setDragging]  = useState(false)
  const [dismissed, setDismissed] = useState(false)

  const startX   = useRef(0)
  const startMs  = useRef(0)

  // Enter animation: one rAF gives the browser a rendered frame to transition FROM
  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(id)
  }, [])

  // ── Touch handlers (swipe-right to dismiss) ───────────────────────────────
  const onTouchStart = (e) => {
    startX.current  = e.touches[0].clientX
    startMs.current = Date.now()
    setDragging(true)
  }

  const onTouchMove = (e) => {
    if (!dragging) return
    const delta = Math.max(0, e.touches[0].clientX - startX.current)
    setDragX(delta)
  }

  const onTouchEnd = () => {
    const elapsed  = Math.max(1, Date.now() - startMs.current)
    const velocity = dragX / elapsed

    if (dragX > SWIPE_THRESHOLD_PX || velocity > SWIPE_THRESHOLD_VEL) {
      setDismissed(true)
      setTimeout(onRemove, 280)
    } else {
      setDragX(0)
    }
    setDragging(false)
  }

  // ── Derived style values ──────────────────────────────────────────────────
  const translateX = dismissed
    ? 'calc(100% + 24px)'
    : visible
      ? `${dragX}px`
      : 'calc(100% + 24px)'

  const opacity = dismissed
    ? 0
    : visible
      ? Math.max(0, 1 - dragX / 180)
      : 0

  const transition = dragging
    ? 'opacity 60ms linear'   // only fade opacity while dragging, no transform lag
    : 'transform 300ms cubic-bezier(0.23,1,0.32,1), opacity 250ms ease-out'

  return (
    <div
      className={`flex items-center gap-3 bg-white rounded-xl shadow-lg border px-4 py-3 min-w-[280px] max-w-sm pointer-events-auto cursor-grab active:cursor-grabbing ${BORDERS[toast.type] || 'border-slate-200'}`}
      style={{
        transform:  `translateX(${translateX})`,
        opacity,
        transition,
        touchAction: 'pan-y',  // allow vertical scroll, capture horizontal
      }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {ICONS[toast.type] || ICONS.info}
      <span className="text-sm text-slate-700 flex-1">{toast.message}</span>
      <button
        onClick={onRemove}
        className="text-slate-400 hover:text-slate-600"
        style={{ transition: 'color 150ms ease-out' }}
      >
        <X size={14} />
      </button>
    </div>
  )
}

export default function Toast() {
  const { state, dispatch } = useApp()

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
      {state.toasts.map(toast => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onRemove={() => dispatch({ type: 'REMOVE_TOAST', payload: toast.id })}
        />
      ))}
    </div>
  )
}
