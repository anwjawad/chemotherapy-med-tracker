import React, { useEffect } from 'react'
import { AppProvider, useApp } from './context/AppContext'
import Header from './components/Header'
import Dashboard from './components/Dashboard'
import MedicationDetail from './components/MedicationDetail'
import FiveFuPage from './components/FiveFuPage'
import GlobalSearch from './components/GlobalSearch'
import Toast from './components/Toast'
import AddEditMedication from './components/modals/AddEditMedication'
import AddEditPatient from './components/modals/AddEditPatient'
import AddEditFiveFuPatient from './components/modals/AddEditFiveFuPatient'
import BulkImportFiveFu from './components/modals/BulkImportFiveFu'
import ConfirmDelete from './components/modals/ConfirmDelete'

// ── Skeleton primitives ───────────────────────────────────────────────────────
function Bone({ className = '' }) {
  return <div className={`skeleton rounded-lg ${className}`} />
}

function SkeletonStatCard() {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Bone className="h-3 w-20" />
        <Bone className="h-4 w-4 rounded-full" />
      </div>
      <Bone className="h-8 w-10" />
    </div>
  )
}

function SkeletonMedCard() {
  return (
    <div className="card overflow-hidden">
      <Bone className="h-24 rounded-none" />
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {[0, 1].map(i => (
            <div key={i} className="rounded-xl p-3 bg-slate-50 border border-slate-100 space-y-2">
              <Bone className="h-3 w-14" />
              <Bone className="h-6 w-6" />
            </div>
          ))}
        </div>
        <Bone className="h-2 w-full rounded-full" />
        <div className="flex justify-between pt-1">
          <Bone className="h-3 w-24" />
          <Bone className="h-3 w-10" />
        </div>
      </div>
    </div>
  )
}

// Shows the real app chrome (header) while data loads — much better perceived perf
// than a blank full-page spinner.
function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <SkeletonStatCard key={i} />)}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{ animation: `fadeIn 200ms ease-out ${i * 50}ms both` }}>
            <SkeletonMedCard />
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main app shell ────────────────────────────────────────────────────────────
function AppContent() {
  const { state, loadData } = useApp()

  useEffect(() => { loadData() }, [])

  const { type: modalType } = state.modal

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header always visible — even during load */}
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!state.isInitialized ? (
          <LoadingSkeleton />
        ) : (
          <>
            {state.view === 'dashboard'        && <Dashboard />}
            {state.view === 'medicationDetail' && <MedicationDetail />}
            {state.view === 'fiveFu'           && <FiveFuPage />}
          </>
        )}
      </main>

      {/* Medication modals */}
      {(modalType === 'addMedication'  || modalType === 'editMedication')  && <AddEditMedication />}

      {/* Chemo patient modals */}
      {(modalType === 'addPatient'     || modalType === 'editPatient')     && <AddEditPatient />}

      {/* 5-FU patient modals */}
      {(modalType === 'addFiveFuPatient' || modalType === 'editFiveFuPatient') && <AddEditFiveFuPatient />}
      {modalType === 'bulkImportFiveFu' && <BulkImportFiveFu />}

      {/* Shared delete confirmation */}
      {(modalType === 'deleteMedication' || modalType === 'deletePatient' || modalType === 'deleteFiveFuPatient') && <ConfirmDelete />}

      {/* Overlays */}
      <GlobalSearch />
      <Toast />
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}
