import { generateId, now } from './helpers'

const MEDICATION_NAMES = [
  'Perjeta',
  'Gleevec',
  'Tasigna',
  'Alimta',
  'Keytruda',
  'Revolade',
  'Kisqali',
  'Ibrance',
  'Iclusig',
  'Nexavar',
  'Avastin',
  'Giotrif',
  'Jakavi',
  'Zytiga',
  'Doxil',
  'Imnovid',
  'Revlimid',
  'TDM-1 (Kadcyla)',
  'Alecensa',
]

export function buildSeedMedications() {
  const ts = now()
  return MEDICATION_NAMES.map(name => ({
    id: generateId(),
    medicationName: name,
    notes: '',
    createdAt: ts,
    updatedAt: ts,
  }))
}
