import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getDeviceId } from '../../lib/deviceId';
import { joinSession, getSession } from '../../lib/session';

export default function InviteScreen() {
  const { id: sessionId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    handleJoinSession();
  }, [sessionId]);

  const handleJoinSession = async () => {
    if (!sessionId) {
      setStatus('error');
      setError('Invalid session code');
      return;
    }

    try {
      setStatus('loading');

      // Get device ID
      const deviceId = await getDeviceId();

      // Check if session exists
      const session = await getSession(sessionId);
      if (!session) {
        setStatus('error');
        setError('Session not found. It may have ended or the code is incorrect.');
        return;
      }

      // Check if session is completed
      if (session.status === 'completed') {
        setStatus('error');
        setError('This session has already ended.');
        return;
      }

      // Check if user is the creator
      if (session.createdBy === deviceId) {
        // Creator accessing their own session - just redirect
        router.replace(`/session/${sessionId}`);
        return;
      }

      // Check if session already has a different partner
      if (session.partnerId && session.partnerId !== deviceId) {
        setStatus('error');
        setError('This session already has another partner.');
        return;
      }

      // If we're already the partner, just redirect
      if (session.partnerId === deviceId) {
        router.replace(`/session/${sessionId}`);
        return;
      }

      // Join the session
      await joinSession(sessionId, deviceId);
      setStatus('success');

      // Redirect to session after a brief moment
      setTimeout(() => {
        router.replace(`/session/${sessionId}`);
      }, 1000);
    } catch (err) {
      console.error('Error joining session:', err);
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Failed to join session');
    }
  };

  if (status === 'loading') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.statusText}>Joining session...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (status === 'success') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
          </View>
          <Text style={styles.successTitle}>You're In!</Text>
          <Text style={styles.successMessage}>Joining the session...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.errorIcon}>
          <Ionicons name="alert-circle" size={80} color="#FF6B6B" />
        </View>
        <Text style={styles.errorTitle}>Couldn't Join</Text>
        <Text style={styles.errorMessage}>{error}</Text>

        <View style={styles.actions}>
          <Pressable style={styles.retryButton} onPress={handleJoinSession}>
            <Ionicons name="refresh" size={20} color="#FF6B6B" />
            <Text style={styles.retryButtonText}>Try Again</Text>
          </Pressable>

          <Pressable style={styles.homeButton} onPress={() => router.replace('/')}>
            <Text style={styles.homeButtonText}>Go Home</Text>
          </Pressable>
        </View>
      </View>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  statusText: {
    fontSize: 18,
    color: '#666',
    marginTop: 20,
  },
  successIcon: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 16,
    color: '#666',
  },
  errorIcon: {
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  actions: {
    width: '100%',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FF6B6B',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  homeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    paddingVertical: 14,
    borderRadius: 12,
  },
  homeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
});
