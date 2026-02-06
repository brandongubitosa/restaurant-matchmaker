import { useState, useEffect, useCallback } from 'react';
import { Session, SwipeRecord, Restaurant, SessionFilters, MAX_SWIPES } from '../types';
import {
  createSession,
  getSession,
  joinSession,
  subscribeToSession,
  subscribeToSwipes,
  recordSwipe,
  endSession,
  generateInviteLink,
} from '../lib/session';
import { fetchRestaurants } from '../lib/restaurants';
import { getDeviceId } from '../lib/deviceId';

interface UseSessionReturn {
  // Session state
  session: Session | null;
  isLoading: boolean;
  error: string | null;
  deviceId: string | null;
  isCreator: boolean;

  // Restaurants
  restaurants: Restaurant[];
  currentRestaurantIndex: number;

  // Swipes and matches
  swipes: Map<string, SwipeRecord>;
  matches: Restaurant[];

  // Swipe limit tracking
  swipeCount: number;
  maxSwipes: number;
  canSwipe: boolean;
  isUserComplete: boolean;
  isPartnerComplete: boolean;
  bothComplete: boolean;

  // Actions
  createNewSession: (filters: SessionFilters) => Promise<string>;
  joinExistingSession: (sessionId: string) => Promise<void>;
  handleSwipe: (swipe: 'left' | 'right') => Promise<boolean>;
  getInviteLink: () => string;
  leaveSession: () => Promise<void>;
}

export function useSession(sessionId?: string): UseSessionReturn {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [currentRestaurantIndex, setCurrentRestaurantIndex] = useState(0);
  const [swipes, setSwipes] = useState<Map<string, SwipeRecord>>(new Map());

  // Initialize device ID
  useEffect(() => {
    getDeviceId().then(setDeviceId);
  }, []);

  // Calculate if current user is the session creator
  const isCreator = session?.createdBy === deviceId;

  // Calculate matches from swipes
  const matches = restaurants.filter((restaurant) => {
    const swipe = swipes.get(restaurant.id);
    return swipe?.isMatch === true;
  });

  // Calculate swipe limit state
  const swipeCount = isCreator
    ? (session?.creatorSwipeCount ?? 0)
    : (session?.partnerSwipeCount ?? 0);
  const maxSwipes = MAX_SWIPES;
  const canSwipe = swipeCount < maxSwipes;
  const isUserComplete = isCreator
    ? (session?.creatorCompleted ?? false)
    : (session?.partnerCompleted ?? false);
  const isPartnerComplete = isCreator
    ? (session?.partnerCompleted ?? false)
    : (session?.creatorCompleted ?? false);
  const bothComplete = (session?.creatorCompleted ?? false) && (session?.partnerCompleted ?? false);

  // Subscribe to session updates
  useEffect(() => {
    if (!sessionId) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = subscribeToSession(sessionId, (updatedSession) => {
      setSession(updatedSession);
      setIsLoading(false);

      if (!updatedSession) {
        setError('Session not found');
      }
    });

    return () => unsubscribe();
  }, [sessionId]);

  // Subscribe to swipes
  useEffect(() => {
    if (!sessionId) return;

    const unsubscribe = subscribeToSwipes(sessionId, (updatedSwipes) => {
      setSwipes(updatedSwipes);
    });

    return () => unsubscribe();
  }, [sessionId]);

  // Load restaurants when session becomes active
  useEffect(() => {
    if (!session || session.status !== 'active') return;

    // If restaurants are already loaded, skip
    if (restaurants.length > 0) return;

    setIsLoading(true);
    fetchRestaurants(session.filters, session.filters.location)
      .then((fetchedRestaurants) => {
        setRestaurants(fetchedRestaurants);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching restaurants:', err);
        setError('Failed to load restaurants');
        setIsLoading(false);
      });
  }, [session?.status]);

  // Create a new session
  const createNewSession = useCallback(
    async (filters: SessionFilters): Promise<string> => {
      if (!deviceId) throw new Error('Device ID not available');

      setIsLoading(true);
      setError(null);

      try {
        // Fetch restaurants first
        const fetchedRestaurants = await fetchRestaurants(filters);
        setRestaurants(fetchedRestaurants);

        // Create session with restaurant IDs
        const restaurantIds = fetchedRestaurants.map((r) => r.id);
        const newSessionId = await createSession(deviceId, filters, restaurantIds);

        return newSessionId;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create session';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [deviceId]
  );

  // Join an existing session
  const joinExistingSession = useCallback(
    async (joinSessionId: string): Promise<void> => {
      if (!deviceId) throw new Error('Device ID not available');

      setIsLoading(true);
      setError(null);

      try {
        await joinSession(joinSessionId, deviceId);
        // The subscription will update the session state
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to join session';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [deviceId]
  );

  // Handle swipe action
  const handleSwipe = useCallback(
    async (swipe: 'left' | 'right'): Promise<boolean> => {
      if (!session || !deviceId) return false;

      const currentRestaurant = restaurants[currentRestaurantIndex];
      if (!currentRestaurant) return false;

      try {
        const isMatch = await recordSwipe(
          session.id,
          currentRestaurant.id,
          deviceId,
          isCreator,
          swipe
        );

        // Move to next restaurant
        setCurrentRestaurantIndex((prev) => prev + 1);

        return isMatch;
      } catch (err) {
        console.error('Error recording swipe:', err);
        return false;
      }
    },
    [session, deviceId, restaurants, currentRestaurantIndex, isCreator]
  );

  // Get invite link
  const getInviteLink = useCallback((): string => {
    if (!session) return '';
    return generateInviteLink(session.id);
  }, [session]);

  // Leave/end session
  const leaveSession = useCallback(async (): Promise<void> => {
    if (!session) return;

    try {
      await endSession(session.id);
    } catch (err) {
      console.error('Error ending session:', err);
    }
  }, [session]);

  return {
    session,
    isLoading,
    error,
    deviceId,
    isCreator,
    restaurants,
    currentRestaurantIndex,
    swipes,
    matches,
    swipeCount,
    maxSwipes,
    canSwipe,
    isUserComplete,
    isPartnerComplete,
    bothComplete,
    createNewSession,
    joinExistingSession,
    handleSwipe,
    getInviteLink,
    leaveSession,
  };
}
