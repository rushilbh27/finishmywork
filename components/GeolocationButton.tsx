'use client'

import { useState } from 'react'
import { MapPinIcon } from '@heroicons/react/24/outline'
import { getCurrentLocation } from '@/lib/geolocation'
import toast from 'react-hot-toast'

interface GeolocationButtonProps {
  onLocationUpdate: (latitude: number, longitude: number) => void
  disabled?: boolean
}

export function GeolocationButton({ onLocationUpdate, disabled = false }: GeolocationButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleGetLocation = async () => {
    setIsLoading(true)
    
    try {
      const coordinates = await getCurrentLocation()
      onLocationUpdate(coordinates.latitude, coordinates.longitude)
      toast.success('Location updated successfully!')
    } catch (error: any) {
      console.error('Geolocation error:', error)
      
      let errorMessage = 'Failed to get your location'
      if (error.code === 1) {
        errorMessage = 'Location access denied. Please enable location permissions.'
      } else if (error.code === 2) {
        errorMessage = 'Location unavailable. Please check your connection.'
      } else if (error.code === 3) {
        errorMessage = 'Location request timed out. Please try again.'
      }
      
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleGetLocation}
      disabled={disabled || isLoading}
      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <MapPinIcon className="h-4 w-4 mr-2" />
      {isLoading ? 'Getting location...' : 'Use my current location'}
    </button>
  )
}
