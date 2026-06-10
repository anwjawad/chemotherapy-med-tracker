const GAS_URL = import.meta.env.VITE_GAS_URL

// ── LocalStorage mock (used when VITE_GAS_URL is not set) ──────────────────
const MOCK_KEYS = { medications: 'mdt_medications', patients: 'mdt_patients', fiveFuPatients: 'mdt_fivefu' }

function mockGet(key) {
  try { return JSON.parse(localStorage.getItem(MOCK_KEYS[key]) || '[]') } catch { return [] }
}
function mockSet(key, data) {
  localStorage.setItem(MOCK_KEYS[key], JSON.stringify(data))
}

function mockListMedications() { return mockGet('medications') }
function mockCreateMedication(data) {
  const list = mockGet('medications'); list.push(data); mockSet('medications', list); return data
}
function mockUpdateMedication(data) {
  const list = mockGet('medications').map(m => m.id === data.id ? data : m)
  mockSet('medications', list); return data
}
function mockDeleteMedication(id) {
  mockSet('medications', mockGet('medications').filter(m => m.id !== id))
  mockSet('patients', mockGet('patients').filter(p => p.medicationId !== id))
  return { id }
}
function mockListPatients() { return mockGet('patients') }
function mockCreatePatient(data) {
  const list = mockGet('patients'); list.push(data); mockSet('patients', list); return data
}
function mockUpdatePatient(data) {
  const list = mockGet('patients').map(p => p.id === data.id ? data : p)
  mockSet('patients', list); return data
}
function mockDeletePatient(id) {
  mockSet('patients', mockGet('patients').filter(p => p.id !== id)); return { id }
}

// ── 5-FU Patient mock functions ────────────────────────────────────────────
function mockListFiveFuPatients() { return mockGet('fiveFuPatients') }
function mockCreateFiveFuPatient(data) {
  const list = mockGet('fiveFuPatients'); list.push(data); mockSet('fiveFuPatients', list); return data
}
function mockUpdateFiveFuPatient(data) {
  const list = mockGet('fiveFuPatients').map(p => p.id === data.id ? data : p)
  mockSet('fiveFuPatients', list); return data
}
function mockDeleteFiveFuPatient(id) {
  mockSet('fiveFuPatients', mockGet('fiveFuPatients').filter(p => p.id !== id)); return { id }
}
function mockCreateFiveFuPatientsBulk(patients) {
  const list = mockGet('fiveFuPatients')
  patients.forEach(p => list.push(p))
  mockSet('fiveFuPatients', list)
  return patients
}

// ── GAS fetch ──────────────────────────────────────────────────────────────
async function callGAS(action, data = {}) {
  const params = new URLSearchParams({ action, data: JSON.stringify(data) })
  const res = await fetch(`${GAS_URL}?${params}`, { redirect: 'follow' })
  if (!res.ok) throw new Error(`Network error: ${res.status}`)
  const json = await res.json()
  if (!json.success) throw new Error(json.error || 'API error')
  return json.data
}

// ── Exported API (switches between mock and GAS) ───────────────────────────
function useMock() { return !GAS_URL || GAS_URL.includes('YOUR_SCRIPT_ID') }

export const listMedications = () =>
  useMock() ? Promise.resolve(mockListMedications()) : callGAS('listMedications')

export const createMedication = (data) =>
  useMock() ? Promise.resolve(mockCreateMedication(data)) : callGAS('createMedication', data)

export const updateMedication = (data) =>
  useMock() ? Promise.resolve(mockUpdateMedication(data)) : callGAS('updateMedication', data)

export const deleteMedication = (id) =>
  useMock() ? Promise.resolve(mockDeleteMedication(id)) : callGAS('deleteMedication', { id })

export const listPatients = () =>
  useMock() ? Promise.resolve(mockListPatients()) : callGAS('listPatients')

export const createPatient = (data) =>
  useMock() ? Promise.resolve(mockCreatePatient(data)) : callGAS('createPatient', data)

export const updatePatient = (data) =>
  useMock() ? Promise.resolve(mockUpdatePatient(data)) : callGAS('updatePatient', data)

export const deletePatient = (id) =>
  useMock() ? Promise.resolve(mockDeletePatient(id)) : callGAS('deletePatient', { id })

export const isMockMode = useMock

// ── 5-FU Patient API ───────────────────────────────────────────────────────
export const listFiveFuPatients = () =>
  useMock() ? Promise.resolve(mockListFiveFuPatients()) : callGAS('listFiveFuPatients')

export const createFiveFuPatient = (data) =>
  useMock() ? Promise.resolve(mockCreateFiveFuPatient(data)) : callGAS('createFiveFuPatient', data)

export const updateFiveFuPatient = (data) =>
  useMock() ? Promise.resolve(mockUpdateFiveFuPatient(data)) : callGAS('updateFiveFuPatient', data)

export const deleteFiveFuPatient = (id) =>
  useMock() ? Promise.resolve(mockDeleteFiveFuPatient(id)) : callGAS('deleteFiveFuPatient', { id })

export const createFiveFuPatientsBulk = (patients) =>
  useMock() ? Promise.resolve(mockCreateFiveFuPatientsBulk(patients)) : callGAS('createFiveFuPatientsBulk', patients)
