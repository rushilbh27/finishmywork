// Geolocation utilities for future radius-based filtering

export interface GeolocationCoordinates {
  latitude: number
  longitude: number
}

export interface GeolocationError {
  code: number
  message: string
}

// Calculate distance between two points using Haversine formula
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371 // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c // Distance in kilometers
}

// Get user's current geolocation
export const getCurrentLocation = (): Promise<GeolocationCoordinates> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject({
        code: 0,
        message: 'Geolocation is not supported by this browser.'
      })
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        })
      },
      (error) => {
        reject({
          code: error.code,
          message: error.message
        })
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    )
  })
}

// Filter tasks within a certain radius (for future use)
export const filterTasksByRadius = (
  tasks: any[],
  userLat: number,
  userLon: number,
  radiusKm: number
): any[] => {
  return tasks.filter(task => {
    if (!task.latitude || !task.longitude) return false
    
    const distance = calculateDistance(
      userLat,
      userLon,
      task.latitude,
      task.longitude
    )
    
    return distance <= radiusKm
  })
}

// Get location permission status
export const getLocationPermissionStatus = async (): Promise<PermissionState> => {
  if (!navigator.permissions) {
    return 'prompt'
  }
  
  try {
    const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName })
    return result.state
  } catch (error) {
    return 'prompt'
  }
}
