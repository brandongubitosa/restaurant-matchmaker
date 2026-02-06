import * as Location from 'expo-location';
import { LocationData } from '../types';

// Default location: Hoboken, NJ
export const DEFAULT_LOCATION: LocationData = {
  latitude: 40.7439,
  longitude: -74.0323,
  source: 'default',
};

// Request foreground location permission
export async function requestLocationPermission(): Promise<boolean> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error requesting location permission:', error);
    return false;
  }
}

// Get current location
export async function getCurrentLocation(): Promise<LocationData | null> {
  try {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      console.log('Location permission denied');
      return null;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      source: 'gps',
    };
  } catch (error) {
    console.error('Error getting current location:', error);
    return null;
  }
}

// Get location with fallback to default
export async function getLocationWithFallback(): Promise<LocationData> {
  const location = await getCurrentLocation();
  return location ?? DEFAULT_LOCATION;
}

// Format location for display
export function formatLocationSource(location: LocationData): string {
  if (location.source === 'gps') {
    return 'Using your location';
  }
  return 'Hoboken, NJ';
}
