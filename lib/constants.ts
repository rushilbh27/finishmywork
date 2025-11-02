// Predefined locations for the FinishMyWork platform
export const PREDEFINED_LOCATIONS = [
  // Popular Areas in Pune
  { value: 'KOTHRUD', label: 'Kothrud' },
  { value: 'FC_ROAD', label: 'FC Road' },
  { value: 'VIMAN_NAGAR', label: 'Viman Nagar' },
  { value: 'KOREGAON_PARK', label: 'Koregaon Park' },
  { value: 'BANER', label: 'Baner' },
  { value: 'AUNDH', label: 'Aundh' },
  { value: 'HINJEWADI', label: 'Hinjewadi' },
  { value: 'PIMPRI', label: 'Pimpri' },
  { value: 'CHINCHWAD', label: 'Chinchwad' },
  { value: 'WAKAD', label: 'Wakad' },
  { value: 'BALEWADI', label: 'Balewadi' },
  { value: 'KATRAJ', label: 'Katraj' },
  { value: 'SWARGATE', label: 'Swargate' },
  { value: 'SHIVAJINAGAR', label: 'Shivajinagar' },
  { value: 'CAMP', label: 'Camp Area' },
  { value: 'KARVE_ROAD', label: 'Karve Road' },
  { value: 'JM_ROAD', label: 'J.M. Road' },
  { value: 'SENAPATI_BAPAT_ROAD', label: 'Senapati Bapat Road' },
  { value: 'LAW_COLLEGE_ROAD', label: 'Law College Road' },
  { value: 'UNIVERSITY_ROAD', label: 'University Road' },
  
  // Other
  { value: 'OTHER', label: 'Other (Please specify)' }
] as const

export type LocationValue = typeof PREDEFINED_LOCATIONS[number]['value']

// Helper function to get location label by value
export const getLocationLabel = (value: string): string => {
  const location = PREDEFINED_LOCATIONS.find(loc => loc.value === value)
  return location?.label || value
}

// Helper function to get all location values
export const getLocationValues = (): string[] => {
  return PREDEFINED_LOCATIONS.map(loc => loc.value)
}
