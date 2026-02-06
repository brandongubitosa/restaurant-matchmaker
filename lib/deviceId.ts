import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';

const DEVICE_ID_KEY = 'restaurant_matcher_device_id';

// In-memory cache for web (SecureStore not available on web)
let webDeviceId: string | null = null;

// Generate a random ID using expo-crypto
function generateId(): string {
  return Crypto.randomUUID();
}

export async function getDeviceId(): Promise<string> {
  if (Platform.OS === 'web') {
    // For web, use localStorage
    if (webDeviceId) return webDeviceId;

    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem(DEVICE_ID_KEY);
      if (stored) {
        webDeviceId = stored;
        return stored;
      }

      const newId = generateId();
      localStorage.setItem(DEVICE_ID_KEY, newId);
      webDeviceId = newId;
      return newId;
    }

    // Fallback if localStorage not available
    webDeviceId = generateId();
    return webDeviceId;
  }

  // For native, use SecureStore
  try {
    const existingId = await SecureStore.getItemAsync(DEVICE_ID_KEY);
    if (existingId) {
      return existingId;
    }

    const newId = generateId();
    await SecureStore.setItemAsync(DEVICE_ID_KEY, newId);
    return newId;
  } catch (error) {
    console.error('Error accessing SecureStore:', error);
    // Fallback to a generated ID if SecureStore fails
    return generateId();
  }
}
