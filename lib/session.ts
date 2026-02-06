import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  runTransaction,
} from 'firebase/firestore';
import * as Crypto from 'expo-crypto';
import { db } from './firebase';
import { Session, SessionFilters, SwipeRecord, MAX_SWIPES } from '../types';

const SESSIONS_COLLECTION = 'sessions';
const SWIPES_COLLECTION = 'swipes';

// Generate a short, shareable session ID (8 characters)
function generateSessionId(): string {
  return Crypto.randomUUID().split('-')[0];
}

// Create a new session
export async function createSession(
  creatorId: string,
  filters: SessionFilters,
  restaurantIds: string[]
): Promise<string> {
  const sessionId = generateSessionId();
  const sessionRef = doc(db, SESSIONS_COLLECTION, sessionId);

  const session: Omit<Session, 'createdAt'> & { createdAt: any } = {
    id: sessionId,
    createdAt: serverTimestamp(),
    createdBy: creatorId,
    partnerId: null,
    status: 'waiting',
    filters,
    restaurantIds,
    creatorSwipeCount: 0,
    partnerSwipeCount: 0,
    creatorCompleted: false,
    partnerCompleted: false,
  };

  await setDoc(sessionRef, session);
  return sessionId;
}

// Get session by ID
export async function getSession(sessionId: string): Promise<Session | null> {
  const sessionRef = doc(db, SESSIONS_COLLECTION, sessionId);
  const snapshot = await getDoc(sessionRef);

  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data();
  return {
    ...data,
    id: snapshot.id,
    createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
  } as Session;
}

// Join a session as partner
export async function joinSession(
  sessionId: string,
  partnerId: string
): Promise<boolean> {
  const sessionRef = doc(db, SESSIONS_COLLECTION, sessionId);
  const snapshot = await getDoc(sessionRef);

  if (!snapshot.exists()) {
    throw new Error('Session not found');
  }

  const session = snapshot.data() as Session;

  // Check if already joined or someone else joined
  if (session.partnerId && session.partnerId !== partnerId) {
    throw new Error('Session already has a partner');
  }

  // Check if user is the creator (can't join own session)
  if (session.createdBy === partnerId) {
    throw new Error('Cannot join your own session');
  }

  // Join the session
  await updateDoc(sessionRef, {
    partnerId,
    status: 'active',
  });

  return true;
}

// Subscribe to session updates
export function subscribeToSession(
  sessionId: string,
  callback: (session: Session | null) => void
): () => void {
  const sessionRef = doc(db, SESSIONS_COLLECTION, sessionId);

  return onSnapshot(sessionRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback(null);
      return;
    }

    const data = snapshot.data();
    callback({
      ...data,
      id: snapshot.id,
      createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
    } as Session);
  });
}

// Record a swipe with transaction-based counting
export async function recordSwipe(
  sessionId: string,
  restaurantId: string,
  deviceId: string,
  isCreator: boolean,
  swipe: 'left' | 'right'
): Promise<boolean> {
  const sessionRef = doc(db, SESSIONS_COLLECTION, sessionId);
  const swipeRef = doc(
    db,
    SESSIONS_COLLECTION,
    sessionId,
    SWIPES_COLLECTION,
    restaurantId
  );

  return runTransaction(db, async (transaction) => {
    // Get current session state
    const sessionDoc = await transaction.get(sessionRef);
    if (!sessionDoc.exists()) {
      throw new Error('Session not found');
    }
    const sessionData = sessionDoc.data() as Session;

    // Check if user has already completed their swipes (default to 0 for backwards compatibility)
    const currentCount = isCreator
      ? (sessionData.creatorSwipeCount ?? 0)
      : (sessionData.partnerSwipeCount ?? 0);
    if (currentCount >= MAX_SWIPES) {
      throw new Error('Maximum swipes reached');
    }

    // Get existing swipe record
    const existingSwipe = await transaction.get(swipeRef);
    let isMatch = false;

    if (!existingSwipe.exists()) {
      // First swipe on this restaurant
      const swipeRecord: SwipeRecord = {
        restaurantId,
        creatorSwipe: isCreator ? swipe : null,
        partnerSwipe: isCreator ? null : swipe,
        isMatch: false,
        updatedAt: new Date(),
      };
      transaction.set(swipeRef, swipeRecord);
    } else {
      // Update existing swipe record
      const data = existingSwipe.data() as SwipeRecord;
      const updateData: Partial<SwipeRecord> = {
        updatedAt: new Date(),
      };

      if (isCreator) {
        updateData.creatorSwipe = swipe;
      } else {
        updateData.partnerSwipe = swipe;
      }

      // Check for match
      const creatorSwipe = isCreator ? swipe : data.creatorSwipe;
      const partnerSwipe = isCreator ? data.partnerSwipe : swipe;
      isMatch = creatorSwipe === 'right' && partnerSwipe === 'right';
      updateData.isMatch = isMatch;

      transaction.update(swipeRef, updateData);
    }

    // Update swipe count
    const newCount = currentCount + 1;
    const isUserCompleted = newCount >= MAX_SWIPES;

    const sessionUpdate: Partial<Session> = {};
    if (isCreator) {
      sessionUpdate.creatorSwipeCount = newCount;
      if (isUserCompleted) {
        sessionUpdate.creatorCompleted = true;
      }
    } else {
      sessionUpdate.partnerSwipeCount = newCount;
      if (isUserCompleted) {
        sessionUpdate.partnerCompleted = true;
      }
    }

    // Check if both users have completed
    const creatorCompleted = isCreator ? isUserCompleted : sessionData.creatorCompleted;
    const partnerCompleted = isCreator ? sessionData.partnerCompleted : isUserCompleted;
    if (creatorCompleted && partnerCompleted) {
      sessionUpdate.status = 'completed';
    }

    transaction.update(sessionRef, sessionUpdate);

    return isMatch;
  });
}

// Subscribe to swipes for a session
export function subscribeToSwipes(
  sessionId: string,
  callback: (swipes: Map<string, SwipeRecord>) => void
): () => void {
  const swipesRef = collection(
    db,
    SESSIONS_COLLECTION,
    sessionId,
    SWIPES_COLLECTION
  );

  return onSnapshot(swipesRef, (snapshot) => {
    const swipes = new Map<string, SwipeRecord>();
    snapshot.docs.forEach((doc) => {
      swipes.set(doc.id, doc.data() as SwipeRecord);
    });
    callback(swipes);
  });
}

// End a session
export async function endSession(sessionId: string): Promise<void> {
  const sessionRef = doc(db, SESSIONS_COLLECTION, sessionId);
  await updateDoc(sessionRef, {
    status: 'completed',
  });
}

// Generate invite link (web URL for sharing)
export function generateInviteLink(sessionId: string): string {
  return `https://restaurantmatchmaker.vercel.app/invite/${sessionId}`;
}
