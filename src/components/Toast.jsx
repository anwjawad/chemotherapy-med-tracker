import React from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import { useApp } from '../context/AppContext'

const ICONS = {
  success: <CheckCircle size={16} className="text-emerald-500 shrink-0" />,
  error: <XCircle size={16} className="text-red-500 shrink-0" />,
  warning: <AlertTriangle size={16} className="text-amber-500 shrink-0" />,
  info: <Info size={16} className="text-indigo-500 shrink-0" />,
}

const BORDERS = {
  success: 'border-emerald-200',
  error: 'border-red-200',
  warning: 'border-amber-200',
  info: 'border-indigo-200',
}

export default function Toast() {
  const { state, dispatch } = useApp()

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
      {state.toasts.map(toast => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 bg-white rounded-xl shadow-lg border px-4 py-3 min-w-[280px] max-w-sm pointer-events-auto animate-slide-in-right ${BORDERS[toast.type] || 'border-slate-200'}`}
        >
          {ICONS[toast.type] || ICONS.info}
          <span className="text-sm text-slate-700 flex-1">{toast.message}</span>
          <button
            onClick={() => dispatch({ type: 'REMOVE_TOAST', payload: toast.id })}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
