# Location Feature Documentation

## Overview

The FinishMyWork platform now includes comprehensive location-based features that help students find tasks in their area and connect with nearby peers. This feature is designed to be scalable and future-proof.

## Features Implemented

### 1. Predefined Location Selection
- **User Signup**: Users must select their location from a predefined list during registration
- **Location Options**: Includes major educational institutions and popular areas in Pune
- **Custom Location**: Option to specify custom locations for areas not in the predefined list

### 2. Location-Aware Task Posting
- **Automatic Location Attachment**: When users post tasks, their location is automatically attached
- **Location Inheritance**: Tasks inherit the poster's location information
- **Database Storage**: Location data is stored in both User and Task models

### 3. Smart Task Filtering
- **Location-Based Prioritization**: Tasks from the user's location are shown first
- **Toggle View**: Users can switch between "my area only" and "all locations"
- **Visual Indicators**: Clear location badges and icons throughout the interface

### 4. Future-Proof Geolocation Support
- **Browser Geolocation API**: Ready for precise location capture
- **Distance Calculations**: Haversine formula implementation for radius filtering
- **Permission Handling**: Proper geolocation permission management

## Database Schema Updates

### User Model
```prisma
model User {
  // ... existing fields
  location      String?  // Predefined location (BMCC, Symbiosis, MIT, etc.)
  latitude      Float?   // Optional geolocation latitude
  longitude     Float?   // Optional geolocation longitude
}
```

### Task Model
```prisma
model Task {
  // ... existing fields
  location    String?     // Predefined location
  latitude    Float?      // Optional geolocation latitude
  longitude   Float?      // Optional geolocation longitude
}
```

## Predefined Locations

The system includes locations for:

### Educational Institutions
- Brihan Maharashtra College of Commerce (BMCC)
- Symbiosis International University
- MIT World Peace University
- Fergusson College
- Savitribai Phule Pune University
- College of Engineering, Pune (COEP)
- Vishwakarma Institute of Technology
- Pune Institute of Computer Technology

### Popular Areas
- Kothrud, FC Road, Viman Nagar
- Koregaon Park, Baner, Aundh
- Hinjewadi, Pimpri, Chinchwad
- Wakad, Balewadi, Katraj
- Swargate, Shivajinagar, Camp Area
- Karve Road, J.M. Road, Senapati Bapat Road
- Law College Road, University Road

## API Endpoints

### User Location
- `GET /api/user/location` - Get current user's location information

### Task Creation
- `POST /api/tasks` - Automatically attaches poster's location to new tasks

## Components

### GeolocationButton
A reusable component for capturing user's current location using the browser's Geolocation API.

```tsx
<GeolocationButton 
  onLocationUpdate={(lat, lng) => handleLocationUpdate(lat, lng)}
  disabled={false}
/>
```

## Future Enhancements

### Radius-Based Filtering
The system is prepared for radius-based filtering with:

```typescript
// Filter tasks within 5km radius
const nearbyTasks = filterTasksByRadius(tasks, userLat, userLon, 5)
```

### Distance Display
Show distance from user to task location:

```typescript
const distance = calculateDistance(userLat, userLon, taskLat, taskLon)
```

### Location-Based Notifications
- Notify users of new tasks in their area
- Alert users when tasks are posted nearby

## Usage Examples

### 1. User Registration with Location
```typescript
const signUpData = {
  name: "John Doe",
  email: "john@example.com",
  location: "BMCC", // or "OTHER" with customLocation
  customLocation: "Custom Area" // if location is "OTHER"
}
```

### 2. Task Filtering by Location
```typescript
// Show only tasks from user's location
const localTasks = tasks.filter(task => task.location === userLocation)

// Show all tasks but prioritize user's location
const sortedTasks = tasks.sort((a, b) => {
  const aIsLocal = a.location === userLocation
  const bIsLocal = b.location === userLocation
  return aIsLocal && !bIsLocal ? -1 : 1
})
```

### 3. Geolocation Capture
```typescript
import { getCurrentLocation } from '@/lib/geolocation'

try {
  const coords = await getCurrentLocation()
  console.log(`Lat: ${coords.latitude}, Lng: ${coords.longitude}`)
} catch (error) {
  console.error('Geolocation error:', error.message)
}
```

## Security Considerations

1. **Location Privacy**: Users can choose not to share precise geolocation
2. **Data Protection**: Location data is stored securely and not shared publicly
3. **Permission Handling**: Proper geolocation permission management
4. **Fallback Options**: System works with predefined locations if geolocation is denied

## Performance Optimizations

1. **Database Indexing**: Location fields are indexed for fast queries
2. **Caching**: User location is cached to reduce database queries
3. **Lazy Loading**: Geolocation is only loaded when needed
4. **Efficient Filtering**: Location-based filtering is optimized for performance

## Testing

### Unit Tests
- Location validation
- Distance calculations
- Geolocation API handling

### Integration Tests
- Task filtering by location
- User registration with location
- Location-based task sorting

### E2E Tests
- Complete user flow with location selection
- Task posting and filtering workflow
- Geolocation permission handling

## Migration Guide

For existing users without location data:

1. **Database Migration**: Add location fields to existing users
2. **Default Values**: Set default location for existing users
3. **User Prompt**: Ask existing users to update their location
4. **Backward Compatibility**: Ensure system works with users without location data

## Monitoring and Analytics

### Metrics to Track
- Location selection distribution
- Geolocation permission rates
- Location-based task completion rates
- User engagement by location

### Dashboard Features
- Location-based user analytics
- Task distribution by area
- Popular locations for tasks
- Geographic user distribution

This location feature makes FinishMyWork more relevant and useful for students by connecting them with nearby peers and tasks, while maintaining privacy and providing future scalability for advanced location-based features.
