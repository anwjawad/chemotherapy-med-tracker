export function generateId() {
  return crypto.randomUUID()
}

export function determineStatus(nextAppointment) {
  return nextAppointment && nextAppointment.trim() !== '' ? 'scheduled' : 'delayed'
}

export function formatDate(dateStr) {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return dateStr
  }
}

export function formatDateTime(isoStr) {
  if (!isoStr) return '—'
  try {
    return new Date(isoStr).toLocaleString('en-GB', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return isoStr
  }
}

export function getDaysSince(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr + 'T00:00:00')
  const now = new Date()
  const diff = Math.floor((now - d) / (1000 * 60 * 60 * 24))
  return isNaN(diff) ? null : diff
}

export function getDaysUntil(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr + 'T00:00:00')
  const now = new Date()
  const diff = Math.floor((d - now) / (1000 * 60 * 60 * 24))
  return isNaN(diff) ? null : diff
}

export function sortDelayedPatients(patients) {
  return [...patients].sort((a, b) => {
    if (!a.lastAppointment && !b.lastAppointment) return 0
    if (!a.lastAppointment) return 1
    if (!b.lastAppointment) return -1
    return new Date(a.lastAppointment) - new Date(b.lastAppointment)
  })
}

export function sortScheduledPatients(patients) {
  return [...patients].sort((a, b) => {
    if (!a.nextAppointment && !b.nextAppointment) return 0
    if (!a.nextAppointment) return 1
    if (!b.nextAppointment) return -1
    return new Date(a.nextAppointment) - new Date(b.nextAppointment)
  })
}

export function delayColor(days) {
  if (days === null || days === undefined) return 'gray'
  if (days > 90) return 'red'
  if (days > 60) return 'orange'
  if (days > 30) return 'amber'
  return 'yellow'
}

export function delayLabel(days) {
  if (days === null || days === undefined) return null
  if (days < 0) return 'Future'
  if (days === 0) return 'Today'
  if (days === 1) return '1 day ago'
  return `${days} days ago`
}

export function applyPatientFilters(patients, filters) {
  let result = [...patients]

  if (filters.search) {
    const q = filters.search.toLowerCase()
    result = result.filter(
      p => p.patientName?.toLowerCase().includes(q) || p.profileNumber?.toLowerCase().includes(q)
    )
  }

  if (filters.status && filters.status !== 'all') {
    result = result.filter(p => p.status === filters.status)
  }

  if (filters.lastApptFrom) {
    result = result.filter(p => p.lastAppointment >= filters.lastApptFrom)
  }
  if (filters.lastApptTo) {
    result = result.filter(p => p.lastAppointment <= filters.lastApptTo)
  }
  if (filters.nextApptFrom) {
    result = result.filter(p => p.nextAppointment && p.nextAppointment >= filters.nextApptFrom)
  }
  if (filters.nextApptTo) {
    result = result.filter(p => p.nextAppointment && p.nextAppointment <= filters.nextApptTo)
  }

  return result
}

export function now() {
  return new Date().toISOString()
}
