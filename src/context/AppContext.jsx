import React, { createContext, useContext, useReducer, useCallback } from 'react'
import * as api from '../utils/api'
import { generateId, determineStatus, now, normalizeDateStr } from '../utils/helpers'
import { buildSeedMedications } from '../utils/seed'

const AppContext = createContext(null)

const initialState = {
  medications: [],
  patients: [],
  fiveFuPatients: [],
  isLoading: false,
  isInitialized: false,
  error: null,
  view: 'dashboard',
  selectedMedicationId: null,
  highlightedPatientId: null,
  modal: { type: null, data: null },
  globalSearch: { isOpen: false, query: '' },
  toasts: [],
  syncStatus: {}, // { [id]: 'syncing' | 'synced' | 'error' }
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING': return { ...state, isLoading: action.payload }
    case 'SET_ERROR': return { ...state, error: action.payload, isLoading: false }
    case 'INIT_DATA': return {
      ...state,
      medications: action.medications,
      patients: action.patients,
      fiveFuPatients: action.fiveFuPatients || [],
      isLoading: false,
      isInitialized: true,
      error: null,
    }
    case 'ADD_MEDICATION': return { ...state, medications: [...state.medications, action.payload] }
    case 'UPDATE_MEDICATION': return {
      ...state,
      medications: state.medications.map(m => m.id === action.payload.id ? action.payload : m),
      patients: state.patients.map(p =>
        p.medicationId === action.payload.id
          ? { ...p, medicationName: action.payload.medicationName }
          : p
      ),
    }
    case 'DELETE_MEDICATION': return {
      ...state,
      medications: state.medications.filter(m => m.id !== action.payload),
      patients: state.patients.filter(p => p.medicationId !== action.payload),
      view: state.selectedMedicationId === action.payload ? 'dashboard' : state.view,
      selectedMedicationId: state.selectedMedicationId === action.payload ? null : state.selectedMedicationId,
    }
    case 'ADD_PATIENT': return { ...state, patients: [...state.patients, action.payload] }
    case 'UPDATE_PATIENT': return {
      ...state,
      patients: state.patients.map(p => p.id === action.payload.id ? action.payload : p),
    }
    case 'DELETE_PATIENT': return {
      ...state,
      patients: state.patients.filter(p => p.id !== action.payload),
    }
    case 'SELECT_MEDICATION': return {
      ...state,
      selectedMedicationId: action.payload,
      view: 'medicationDetail',
      highlightedPatientId: action.highlightPatient || null,
    }
    case 'GO_DASHBOARD': return { ...state, selectedMedicationId: null, view: 'dashboard', highlightedPatientId: null }
    case 'GO_FIVEFU': return { ...state, view: 'fiveFu', selectedMedicationId: null, highlightedPatientId: null }
    case 'SET_HIGHLIGHT': return { ...state, highlightedPatientId: action.payload }
    case 'OPEN_MODAL': return { ...state, modal: { type: action.modalType, data: action.data || null } }
    case 'CLOSE_MODAL': return { ...state, modal: { type: null, data: null } }
    case 'SET_SEARCH': return { ...state, globalSearch: { ...state.globalSearch, ...action.payload } }
    case 'ADD_TOAST': return { ...state, toasts: [...state.toasts, action.payload] }
    case 'REMOVE_TOAST': return { ...state, toasts: state.toasts.filter(t => t.id !== action.payload) }
    case 'SET_SYNC': return { ...state, syncStatus: { ...state.syncStatus, [action.id]: action.status } }
    case 'CLEAR_SYNC': {
      const { [action.id]: _removed, ...rest } = state.syncStatus
      return { ...state, syncStatus: rest }
    }
    // ── 5-FU Patient cases ────────────────────────────────────────────────
    case 'ADD_5FU_PATIENT': return { ...state, fiveFuPatients: [...state.fiveFuPatients, action.payload] }
    case 'UPDATE_5FU_PATIENT': return {
      ...state,
      fiveFuPatients: state.fiveFuPatients.map(p => p.id === action.payload.id ? action.payload : p),
    }
    case 'DELETE_5FU_PATIENT': return {
      ...state,
      fiveFuPatients: state.fiveFuPatients.filter(p => p.id !== action.payload),
    }
    default: return state
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  const showToast = useCallback((message, type = 'success') => {
    const id = generateId()
    dispatch({ type: 'ADD_TOAST', payload: { id, message, type } })
    setTimeout(() => dispatch({ type: 'REMOVE_TOAST', payload: id }), 4500)
  }, [])

  const syncItem = useCallback((id, apiFn) => {
    dispatch({ type: 'SET_SYNC', id, status: 'syncing' })
    apiFn()
      .then(() => {
        dispatch({ type: 'SET_SYNC', id, status: 'synced' })
        setTimeout(() => dispatch({ type: 'CLEAR_SYNC', id }), 2500)
      })
      .catch(err => {
        dispatch({ type: 'SET_SYNC', id, status: 'error' })
        showToast(`Sync failed: ${err.message}`, 'error')
      })
  }, [showToast])

  const loadData = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      let [medications, patients, fiveFuPatients] = await Promise.all([
        api.listMedications(),
        api.listPatients(),
        api.listFiveFuPatients().catch(() => []), // graceful: sheet may not exist yet on GAS
      ])
      medications = medications || []
      patients = (patients || []).map(p => ({
        ...p,
        lastAppointment: normalizeDateStr(p.lastAppointment),
        nextAppointment: normalizeDateStr(p.nextAppointment),
      }))
      fiveFuPatients = (fiveFuPatients || []).map(p => ({
        ...p,
        appointmentDate: normalizeDateStr(p.appointmentDate),
      }))

      // Seed default medications on first ever load (empty store)
      if (medications.length === 0) {
        const seeds = buildSeedMedications()
        for (const med of seeds) await api.createMedication(med)
        medications = seeds
      }

      dispatch({ type: 'INIT_DATA', medications, patients, fiveFuPatients })
    } catch (err) {
      dispatch({ type: 'INIT_DATA', medications: [], patients: [], fiveFuPatients: [] })
      showToast('Could not connect to server — running in local mode.', 'warning')
    }
  }, [showToast])

  // ── Medication CRUD (optimistic) ─────────────────────────────────────────
  const addMedication = useCallback((data) => {
    const medication = { ...data, id: generateId(), createdAt: now(), updatedAt: now() }
    dispatch({ type: 'ADD_MEDICATION', payload: medication })
    dispatch({ type: 'CLOSE_MODAL' })
    syncItem(medication.id, () => api.createMedication(medication))
  }, [syncItem])

  const updateMedication = useCallback((data) => {
    const updated = { ...data, updatedAt: now() }
    dispatch({ type: 'UPDATE_MEDICATION', payload: updated })
    dispatch({ type: 'CLOSE_MODAL' })
    syncItem(updated.id, () => api.updateMedication(updated))
  }, [syncItem])

  const deleteMedication = useCallback((id) => {
    dispatch({ type: 'DELETE_MEDICATION', payload: id })
    dispatch({ type: 'CLOSE_MODAL' })
    showToast('Medication deleted')
    api.deleteMedication(id).catch(err => showToast(`Sync failed: ${err.message}`, 'error'))
  }, [showToast])

  // ── Patient CRUD (optimistic) ────────────────────────────────────────────
  const addPatient = useCallback((data) => {
    const status = determineStatus(data.nextAppointment)
    const patient = { ...data, id: generateId(), status, createdAt: now(), updatedAt: now() }
    dispatch({ type: 'ADD_PATIENT', payload: patient })
    dispatch({ type: 'CLOSE_MODAL' })
    syncItem(patient.id, () => api.createPatient(patient))
  }, [syncItem])

  const updatePatient = useCallback((data) => {
    const status = determineStatus(data.nextAppointment)
    const updated = { ...data, status, updatedAt: now() }
    dispatch({ type: 'UPDATE_PATIENT', payload: updated })
    dispatch({ type: 'CLOSE_MODAL' })
    syncItem(updated.id, () => api.updatePatient(updated))
  }, [syncItem])

  const deletePatient = useCallback((id) => {
    dispatch({ type: 'DELETE_PATIENT', payload: id })
    dispatch({ type: 'CLOSE_MODAL' })
    showToast('Patient record deleted')
    api.deletePatient(id).catch(err => showToast(`Sync failed: ${err.message}`, 'error'))
  }, [showToast])

  const returnToDelayed = useCallback((patient) => {
    const updated = { ...patient, nextAppointment: '', status: 'delayed', updatedAt: now() }
    dispatch({ type: 'UPDATE_PATIENT', payload: updated })
    showToast(`${patient.patientName} returned to delayed list`, 'warning')
    syncItem(updated.id, () => api.updatePatient(updated))
  }, [syncItem, showToast])

  const navigateToPatient = useCallback((patient) => {
    dispatch({ type: 'SELECT_MEDICATION', payload: patient.medicationId, highlightPatient: patient.id })
    dispatch({ type: 'SET_SEARCH', payload: { isOpen: false, query: '' } })
    setTimeout(() => dispatch({ type: 'SET_HIGHLIGHT', payload: null }), 2500)
  }, [])

  // ── 5-FU Patient CRUD (optimistic) ───────────────────────────────────────
  const addFiveFuPatient = useCallback((data) => {
    const patient = { ...data, id: generateId(), createdAt: now(), updatedAt: now() }
    dispatch({ type: 'ADD_5FU_PATIENT', payload: patient })
    dispatch({ type: 'CLOSE_MODAL' })
    syncItem(patient.id, () => api.createFiveFuPatient(patient))
  }, [syncItem])

  const updateFiveFuPatient = useCallback((data) => {
    const updated = { ...data, updatedAt: now() }
    dispatch({ type: 'UPDATE_5FU_PATIENT', payload: updated })
    dispatch({ type: 'CLOSE_MODAL' })
    syncItem(updated.id, () => api.updateFiveFuPatient(updated))
  }, [syncItem])

  const deleteFiveFuPatient = useCallback((id) => {
    dispatch({ type: 'DELETE_5FU_PATIENT', payload: id })
    dispatch({ type: 'CLOSE_MODAL' })
    showToast('5-FU patient record deleted')
    api.deleteFiveFuPatient(id).catch(err => showToast(`Sync failed: ${err.message}`, 'error'))
  }, [showToast])

  const value = {
    state, dispatch, loadData, showToast, syncItem,
    addMedication, updateMedication, deleteMedication,
    addPatient, updatePatient, deletePatient,
    returnToDelayed, navigateToPatient,
    addFiveFuPatient, updateFiveFuPatient, deleteFiveFuPatient,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
