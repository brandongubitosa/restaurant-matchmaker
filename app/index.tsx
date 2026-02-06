import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  TextInput,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SessionFilters, LocationData } from '../types';
import { getDeviceId } from '../lib/deviceId';
import { createSession } from '../lib/session';
import { fetchRestaurants } from '../lib/restaurants';
import { getLocationWithFallback, formatLocationSource } from '../lib/location';
import FilterModal from '../components/FilterModal';

export default function HomeScreen() {
  const router = useRouter();
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);

  useEffect(() => {
    getDeviceId().then(setDeviceId);
  }, []);

  useEffect(() => {
    // Request location on mount
    setIsLoadingLocation(true);
    getLocationWithFallback()
      .then(setLocation)
      .finally(() => setIsLoadingLocation(false));
  }, []);

  const handleCreateSession = async (filters: SessionFilters) => {
    if (!deviceId) {
      setError('Device ID not ready. Please try again.');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      // Add location to filters
      const filtersWithLocation: SessionFilters = {
        ...filters,
        location: location ?? undefined,
      };

      console.log('Fetching restaurants with filters:', filtersWithLocation);

      // Fetch restaurants first to validate we have data
      const restaurants = await fetchRestaurants(filtersWithLocation, location ?? undefined);
      console.log('Fetched restaurants:', restaurants.length);

      if (restaurants.length === 0) {
        setError('No restaurants found with those filters. Try broadening your search.');
        setIsCreating(false);
        return;
      }

      // Create the session
      const restaurantIds = restaurants.map((r) => r.id);
      console.log('Creating session with', restaurantIds.length, 'restaurants');
      const sessionId = await createSession(deviceId, filtersWithLocation, restaurantIds);
      console.log('Session created:', sessionId);

      // Close the filter modal and navigate
      setShowFilters(false);
      router.push(`/session/${sessionId}`);
    } catch (err: any) {
      console.error('Error creating session:', err);
      setError(err?.message || 'Failed to create session. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinSession = async () => {
    if (!joinCode.trim()) {
      setError('Please enter a session code');
      return;
    }

    setIsJoining(true);
    setError(null);

    try {
      // Navigate to the invite handler which will join the session
      router.push(`/invite/${joinCode.trim().toLowerCase()}`);
    } catch (err) {
      setError('Failed to join session');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        {/* Logo/Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Ionicons name="restaurant" size={48} color="#FF6B6B" />
            <Ionicons
              name="heart"
              size={24}
              color="#FF6B6B"
              style={styles.heartIcon}
            />
          </View>
          <Text style={styles.title}>Restaurant Matcher</Text>
          <Text style={styles.subtitle}>
            Find where to eat together
          </Text>
          {/* Location indicator */}
          <View style={styles.locationIndicator}>
            {isLoadingLocation ? (
              <ActivityIndicator size="small" color="#FF6B6B" />
            ) : (
              <>
                <Ionicons
                  name={location?.source === 'gps' ? 'location' : 'location-outline'}
                  size={16}
                  color={location?.source === 'gps' ? '#4CAF50' : '#999'}
                />
                <Text style={[
                  styles.locationText,
                  location?.source === 'gps' && styles.locationTextGps
                ]}>
                  {location ? formatLocationSource(location) : 'Location unavailable'}
                </Text>
              </>
            )}
          </View>
        </View>

        {/* Error Message */}
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={20} color="#FF6B6B" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Main Actions */}
        <View style={styles.actions}>
          {/* Create New Session */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Start a New Session</Text>
            <Text style={styles.sectionDescription}>
              Create a session and invite your partner to swipe on restaurants together
            </Text>
            <Pressable
              style={[styles.primaryButton, isCreating && styles.buttonDisabled]}
              onPress={() => setShowFilters(true)}
              disabled={isCreating}
            >
              {isCreating ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="add-circle" size={24} color="#fff" />
                  <Text style={styles.primaryButtonText}>Create Session</Text>
                </>
              )}
            </Pressable>
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Join Existing Session */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Join a Session</Text>
            <Text style={styles.sectionDescription}>
              Enter the code your partner shared with you
            </Text>
            <View style={styles.joinContainer}>
              <TextInput
                style={styles.codeInput}
                placeholder="Enter session code"
                placeholderTextColor="#999"
                value={joinCode}
                onChangeText={setJoinCode}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Pressable
                style={[
                  styles.joinButton,
                  (!joinCode.trim() || isJoining) && styles.buttonDisabled,
                ]}
                onPress={handleJoinSession}
                disabled={!joinCode.trim() || isJoining}
              >
                {isJoining ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Ionicons name="arrow-forward" size={24} color="#fff" />
                )}
              </Pressable>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Powered by Foursquare
          </Text>
        </View>
      </KeyboardAvoidingView>

      {/* Filter Modal */}
      <FilterModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        onApply={handleCreateSession}
        isLoading={isCreating}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  logoContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  heartIcon: {
    position: 'absolute',
    top: -8,
    right: -16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  locationIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
  },
  locationText: {
    fontSize: 14,
    color: '#999',
  },
  locationTextGps: {
    color: '#4CAF50',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#FF6B6B',
    marginLeft: 8,
  },
  actions: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B6B',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#999',
  },
  joinContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  codeInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333',
  },
  joinButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
  },
});
