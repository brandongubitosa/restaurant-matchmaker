import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  SafeAreaView,
  ActivityIndicator,
  Share,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useSession } from '../../hooks/useSession';
import SwipeCard from '../../components/SwipeCard';
import MatchModal from '../../components/MatchModal';
import { Restaurant } from '../../types';

export default function SessionScreen() {
  const { id: sessionId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const {
    session,
    isLoading,
    error,
    isCreator,
    restaurants,
    currentRestaurantIndex,
    matches,
    handleSwipe,
    getInviteLink,
    leaveSession,
    swipeCount,
    maxSwipes,
    canSwipe,
    isUserComplete,
    isPartnerComplete,
    bothComplete,
  } = useSession(sessionId);

  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchedRestaurant, setMatchedRestaurant] = useState<Restaurant | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  const currentRestaurant = restaurants[currentRestaurantIndex];
  const isOutOfRestaurants = currentRestaurantIndex >= restaurants.length || !canSwipe;
  const isWaitingForPartner = session?.status === 'waiting';
  const isWaitingForPartnerToComplete = isUserComplete && !isPartnerComplete;

  const onSwipe = useCallback(
    async (direction: 'left' | 'right') => {
      const isMatch = await handleSwipe(direction);
      if (isMatch && currentRestaurant) {
        setMatchedRestaurant(currentRestaurant);
        setShowMatchModal(true);
      }
    },
    [handleSwipe, currentRestaurant]
  );

  const copyInviteLink = async () => {
    const link = getInviteLink();
    await Clipboard.setStringAsync(link);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const shareInviteLink = async () => {
    const link = getInviteLink();
    const sessionCode = session?.id || '';

    try {
      await Share.share({
        message: Platform.OS === 'ios'
          ? `Join me on Restaurant Matcher! Use code: ${sessionCode}\n\nOr open: ${link}`
          : `Join me on Restaurant Matcher! Use code: ${sessionCode}`,
        url: Platform.OS === 'ios' ? link : undefined,
      });
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  const handleViewMatches = () => {
    setShowMatchModal(false);
    router.push('/session/matches');
  };

  // Auto-navigate to matches when both users complete
  useEffect(() => {
    if (bothComplete) {
      router.push('/session/matches');
    }
  }, [bothComplete, router]);

  const handleEndSession = async () => {
    await leaveSession();
    router.replace('/');
  };

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.loadingText}>Loading session...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error || !session) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Ionicons name="alert-circle" size={64} color="#FF6B6B" />
          <Text style={styles.errorTitle}>Session Not Found</Text>
          <Text style={styles.errorMessage}>
            {error || 'This session may have ended or the code is incorrect.'}
          </Text>
          <Pressable style={styles.backButton} onPress={() => router.replace('/')}>
            <Text style={styles.backButtonText}>Go Home</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // Waiting for partner state (creator only)
  if (isWaitingForPartner && isCreator) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.replace('/')} style={styles.headerButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </Pressable>
          <Text style={styles.headerTitle}>Waiting for Partner</Text>
          <View style={styles.headerButton} />
        </View>

        <View style={styles.waitingContent}>
          <View style={styles.codeCard}>
            <Text style={styles.codeLabel}>Session Code</Text>
            <Text style={styles.codeValue}>{session.id}</Text>
          </View>

          <Text style={styles.waitingText}>
            Share this code with your partner to start swiping together!
          </Text>

          <View style={styles.shareButtons}>
            <Pressable
              style={[styles.shareButton, styles.copyButton]}
              onPress={copyInviteLink}
            >
              <Ionicons
                name={linkCopied ? 'checkmark' : 'copy'}
                size={20}
                color="#666"
              />
              <Text style={styles.copyButtonText}>
                {linkCopied ? 'Copied!' : 'Copy Link'}
              </Text>
            </Pressable>

            <Pressable
              style={[styles.shareButton, styles.shareMainButton]}
              onPress={shareInviteLink}
            >
              <Ionicons name="share" size={20} color="#fff" />
              <Text style={styles.shareMainButtonText}>Share</Text>
            </Pressable>
          </View>

          <View style={styles.waitingIndicator}>
            <ActivityIndicator size="small" color="#FF6B6B" />
            <Text style={styles.waitingIndicatorText}>
              Waiting for partner to join...
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Waiting for partner to complete their swipes
  if (isWaitingForPartnerToComplete && !isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.replace('/')} style={styles.headerButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </Pressable>
          <Text style={styles.headerTitle}>Waiting for Partner</Text>
          <View style={styles.headerButton} />
        </View>

        <View style={styles.centerContent}>
          <Ionicons name="hourglass" size={80} color="#FF6B6B" />
          <Text style={styles.doneTitle}>You're all done!</Text>
          <Text style={styles.doneMessage}>
            Waiting for your partner to finish swiping...
          </Text>
          <Text style={styles.swipeStats}>
            You have {matches.length} match{matches.length !== 1 ? 'es' : ''} so far
          </Text>

          <View style={styles.waitingIndicator}>
            <ActivityIndicator size="small" color="#FF6B6B" />
            <Text style={styles.waitingIndicatorText}>
              Partner is swiping...
            </Text>
          </View>

          {matches.length > 0 && (
            <Pressable
              style={styles.viewMatchesButton}
              onPress={() => router.push('/session/matches')}
            >
              <Ionicons name="heart" size={20} color="#fff" />
              <Text style={styles.viewMatchesButtonText}>Preview Matches</Text>
            </Pressable>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // Out of restaurants state
  if (isOutOfRestaurants && !isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.replace('/')} style={styles.headerButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </Pressable>
          <Text style={styles.headerTitle}>All Done!</Text>
          <View style={styles.headerButton} />
        </View>

        <View style={styles.centerContent}>
          <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
          <Text style={styles.doneTitle}>You've seen all restaurants!</Text>
          <Text style={styles.doneMessage}>
            You have {matches.length} match{matches.length !== 1 ? 'es' : ''}
          </Text>

          {matches.length > 0 && (
            <Pressable
              style={styles.viewMatchesButton}
              onPress={() => router.push('/session/matches')}
            >
              <Ionicons name="heart" size={20} color="#fff" />
              <Text style={styles.viewMatchesButtonText}>View Matches</Text>
            </Pressable>
          )}

          <Pressable style={styles.endSessionButton} onPress={handleEndSession}>
            <Text style={styles.endSessionButtonText}>End Session</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // Main swiping view
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleEndSession} style={styles.headerButton}>
          <Ionicons name="close" size={24} color="#333" />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.progressText}>
            {swipeCount} / {maxSwipes}
          </Text>
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${(swipeCount / maxSwipes) * 100}%` },
              ]}
            />
          </View>
        </View>
        <Pressable
          onPress={() => router.push('/session/matches')}
          style={styles.headerButton}
        >
          <View style={styles.matchesButton}>
            <Ionicons name="heart" size={24} color="#FF6B6B" />
            {matches.length > 0 && (
              <View style={styles.matchesBadge}>
                <Text style={styles.matchesBadgeText}>{matches.length}</Text>
              </View>
            )}
          </View>
        </Pressable>
      </View>

      {/* Swipe Area */}
      <View style={styles.swipeContainer}>
        {currentRestaurant ? (
          <SwipeCard
            restaurant={currentRestaurant}
            onSwipeLeft={() => onSwipe('left')}
            onSwipeRight={() => onSwipe('right')}
          />
        ) : (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color="#FF6B6B" />
            <Text style={styles.loadingText}>Loading restaurants...</Text>
          </View>
        )}
      </View>

      {/* Match Modal */}
      <MatchModal
        visible={showMatchModal}
        restaurant={matchedRestaurant}
        onClose={() => setShowMatchModal(false)}
        onViewMatches={handleViewMatches}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerCenter: {
    alignItems: 'center',
  },
  progressText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  progressBarContainer: {
    width: 100,
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    marginTop: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FF6B6B',
    borderRadius: 2,
  },
  swipeStats: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    marginBottom: 24,
  },
  matchesButton: {
    position: 'relative',
  },
  matchesBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  matchesBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  waitingContent: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeCard: {
    backgroundColor: '#fff',
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 24,
  },
  codeLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  codeValue: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FF6B6B',
    letterSpacing: 4,
  },
  waitingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  shareButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  copyButton: {
    backgroundColor: '#f0f0f0',
  },
  copyButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  shareMainButton: {
    backgroundColor: '#FF6B6B',
  },
  shareMainButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  waitingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  waitingIndicatorText: {
    fontSize: 14,
    color: '#999',
  },
  swipeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  doneMessage: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
  },
  viewMatchesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  viewMatchesButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  endSessionButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  endSessionButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#999',
  },
});
