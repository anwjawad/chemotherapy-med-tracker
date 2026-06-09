import React from 'react'
import { Check, AlertCircle, Loader } from 'lucide-react'
import { useApp } from '../context/AppContext'

export default function SyncBadge({ id }) {
  const { state } = useApp()
  const status = state.syncStatus?.[id]

  if (!status) return null

  if (status === 'syncing') return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-full">
      <Loader size={9} className="animate-spin" />
      Syncing…
    </span>
  )

  if (status === 'synced') return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded-full animate-fade-in">
      <Check size={9} />
      Saved to Sheet
    </span>
  )

  if (status === 'error') return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-full">
      <AlertCircle size={9} />
      Sync failed
    </span>
  )

  return null
}
