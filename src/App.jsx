import React, { useEffect } from 'react'
import { AppProvider, useApp } from './context/AppContext'
import Header from './components/Header'
import Dashboard from './components/Dashboard'
import MedicationDetail from './components/MedicationDetail'
import FiveFuPage from './components/FiveFuPage'
import GlobalSearch from './components/GlobalSearch'
import Toast from './components/Toast'
import Spinner from './components/Spinner'
import AddEditMedication from './components/modals/AddEditMedication'
import AddEditPatient from './components/modals/AddEditPatient'
import AddEditFiveFuPatient from './components/modals/AddEditFiveFuPatient'
import ConfirmDelete from './components/modals/ConfirmDelete'

function AppContent() {
  const { state, loadData } = useApp()

  useEffect(() => { loadData() }, [])

  if (!state.isInitialized) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <Spinner size="xl" />
        <p className="text-slate-500 text-sm">Loading MedTracker…</p>
      </div>
    )
  }

  const { type: modalType } = state.modal

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {state.view === 'dashboard' && <Dashboard />}
        {state.view === 'medicationDetail' && <MedicationDetail />}
        {state.view === 'fiveFu' && <FiveFuPage />}
      </main>

      {/* Medication modals */}
      {(modalType === 'addMedication' || modalType === 'editMedication') && <AddEditMedication />}

      {/* Chemo patient modals */}
      {(modalType === 'addPatient' || modalType === 'editPatient') && <AddEditPatient />}

      {/* 5-FU patient modals */}
      {(modalType === 'addFiveFuPatient' || modalType === 'editFiveFuPatient') && <AddEditFiveFuPatient />}

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
