# Restaurant Matchmaker — Implementation Plan

> A Tinder-like application for matching on food delivery places with a partner. This plan consolidates requirements from the specification and maps them against the existing implementation.

---

## 1. Executive Summary

**Core Concept:** Two users join a session, both swipe left/right on food delivery places (20 swipes each), and when both swipe right on the same place it's stored as a match. After both finish, they see their agreed-upon options.

**Current State:** The project already has a solid foundation—Expo/React Native, Firebase/Firestore, Foursquare API for restaurants, session creation, join flow, swipe recording, and match detection.

**Plan Focus:** Fill gaps (20-swipe limit, session history, invite UX), add authentication, harden data handling, and prioritize future enhancements.

---

## 2. Core Requirements (Distilled)

| # | Requirement | Status |
|---|-------------|--------|
| 1 | User invites another user → both enter swipe mode | ✅ Exists |
| 2 | Swipe left = not interested, right = interested | ✅ Exists |
| 3 | Both swipe right on same place → store as match | ✅ Exists |
| 4 | 20 swipes per session per user limit | ⚠️ Needs implementation |
| 5 | After both done swiping → show matches | ✅ Exists (matches.tsx) |
| 6 | Food delivery places: data source & display | ✅ Foursquare + fallback |
| 7 | Session handling & storage | ✅ Firestore |
| 8 | User handling & storage | ⚠️ Device ID only; auth needed |
| 9 | Authentication | ❌ Not implemented |
| 10 | Invite mechanism | ✅ Session code + deep link |
| 11 | Session history & match history | ❌ Not implemented |
| 12 | Responsive, secure, scalable, fast, simple UI | 🎯 Design goals |

---

## 3. Architecture Overview

### 3.1 Tech Stack (Current)

- **Frontend:** Expo (React Native) — iOS, Android, Web
- **Backend:** Firebase (Firestore, Cloud Functions)
- **Restaurant Data:** Foursquare API (Cloud Function proxy)
- **Identity:** Device ID (no auth)

### 3.2 Data Model

```
sessions/
  {sessionId}/
    - id, createdAt, createdBy, partnerId, status, filters, restaurantIds
    swipes/
      {restaurantId}/
        - restaurantId, creatorSwipe, partnerSwipe, isMatch, updatedAt
```

### 3.3 Key Decisions

| Topic | Decision | Rationale |
|-------|----------|-----------|
| Restaurant data | Foursquare (Hoboken-focused) + local fallback | Free tier, location-aware, good coverage |
| Session ID | 8-char UUID segment | Short, shareable, no collisions |
| Identity | Device ID → migrate to Firebase Auth | Anonymous auth for MVP, then email/social |
| Real-time | Firestore `onSnapshot` | Sync swipes and session state live |
| Swipe limit | Enforce in client + Firestore rules | Prevents abuse, clear UX |

---

## 4. Gap Analysis & Implementation Roadmap

### Phase 1: Core Completeness (High Priority)

1. **20-swipe limit per user per session**
   - Track `creatorSwipesCount` and `partnerSwipesCount` on session doc
   - Increment on each swipe; block new swipes when ≥ 20
   - Firestore rules: validate count before write
   - UI: progress indicator (e.g., "12/20 swipes")

2. **Session completion detection**
   - Mark session `completed` when both users have used 20 swipes
   - Auto-transition to matches view when both done
   - Optional: Cloud Function to auto-complete on conditions

3. **Invite UX improvements**
   - Copy session link to clipboard
   - QR code for in-person join
   - Share sheet (native share) for link

### Phase 2: Authentication & Users (High Priority)

4. **Firebase Authentication**
   - Anonymous auth for quick start (preserve device flow)
   - Email/password or Google sign-in for persistent identity
   - Migrate `createdBy`/`partnerId` from device ID to UID

5. **User profile (minimal)**
   - Display name
   - Optional avatar
   - Stored in `users/{uid}`

### Phase 3: History & Persistence (Medium Priority)

6. **Session history**
   - Query `sessions` where `createdBy == uid` or `partnerId == uid`
   - List past sessions with date, partner, match count
   - Link to past matches

7. **Match history per session**
   - Already stored in `swipes` subcollection
   - Add `matches` collection or derived view for quick access
   - Allow re-opening completed sessions to view matches

### Phase 4: Polish & Non-Core Features (Lower Priority)

8. **Notifications**
   - Push: "Your partner matched on [Restaurant]!"
   - FCM + Expo Notifications

9. **Messages**
   - In-app chat per session (e.g., "Let's go with Sushi Lounge")
   - Firestore `messages` subcollection

10. **Payments, reviews, ratings, etc.**
    - Defer; out of scope for MVP
    - Can be planned as separate modules

---

## 5. Data Handling Deep Dive

### 5.1 Users

| Approach | Pros | Cons |
|----------|------|------|
| Device ID (current) | No sign-up, instant use | No cross-device, no history, less secure |
| Anonymous Auth | Same UX, Firebase-backed | Still no cross-device |
| Email/Google Auth | Persistent, cross-device | Friction for first-time users |

**Recommendation:** Start with Anonymous Auth, add upgrade to email/Google. Store `users/{uid}` with `displayName`, `email` (if linked).

### 5.2 Sessions

- **Creation:** Creator sets filters → fetches restaurants → creates session with `restaurantIds` (pre-fetched list)
- **Join:** Partner enters code or clicks link → `joinSession(sessionId, partnerId)`
- **Lifecycle:** `waiting` → `active` (when partner joins) → `completed` (when both hit 20 swipes)
- **Storage:** Firestore `sessions` collection; secure via rules (only participants can read/write)

### 5.3 Food Delivery Places

- **Source:** Foursquare Places API via Cloud Function (keeps API key server-side)
- **Fallback:** Static Hoboken restaurant list in `restaurants.ts`
- **Filters:** Cuisine, price range, delivery/pickup only
- **Display:** Card with image, name, rating, price, distance, categories
- **Location:** Consider user's GPS for dynamic location; default Hoboken for now

### 5.4 Swipes & Matches

- **Storage:** `sessions/{id}/swipes/{restaurantId}`
- **Match logic:** `creatorSwipe === 'right' && partnerSwipe === 'right'`
- **Optimization:** Add `matches` array on session doc for quick reads when both users complete

---

## 6. Security Considerations

1. **Firestore rules**
   - Sessions: read/write only if `createdBy` or `partnerId` matches `request.auth.uid` (once auth is in place)
   - Swipes: same rule; validate swipe count server-side or via Cloud Function

2. **API keys**
   - Foursquare: only in Cloud Functions, never in client
   - Firebase config: acceptable in client (domain-restricted in prod)

3. **Input validation**
   - Session IDs: alphanumeric, max length
   - Swipe values: enum `'left' | 'right'`

---

## 7. UI/UX Guidelines

- **Simple & intuitive:** Minimal taps to create/join, clear swipe affordances
- **Responsive:** Expo supports iOS, Android, Web—test on all
- **Feedback:** Haptic on swipe, match animation, progress indicator
- **Accessibility:** Labels, contrast, touch targets ≥ 44pt

---

## 8. Proposed File/Module Changes

| File/Module | Change |
|-------------|--------|
| `lib/session.ts` | Add `creatorSwipesCount`, `partnerSwipesCount`; enforce 20-swipe limit |
| `hooks/useSession.ts` | Track swipe count; expose `canSwipe`, `isComplete` |
| `app/session/[id].tsx` | Progress bar, block swipes at 20, auto-navigate to matches |
| `lib/firebase.ts` | Add Firebase Auth init |
| `lib/auth.ts` | New: sign-in anonymous, link account, sign out |
| `app/history/index.tsx` | New: list past sessions |
| `firestore.rules` | Auth-based rules; swipe count validation (or via Functions) |
| `functions/src/index.ts` | Optional: `onSwipeCreate` to validate count |

---

## 9. Milestones & Timeline (Suggested)

| Milestone | Scope | Effort (est.) |
|-----------|-------|----------------|
| M1: 20-swipe limit | Count tracking, UI, rules | 1–2 days |
| M2: Session completion UX | Auto-complete, transition to matches | 0.5 day |
| M3: Invite polish | Copy, QR, share sheet | 0.5–1 day |
| M4: Firebase Auth | Anonymous + optional email/Google | 1–2 days |
| M5: Session history | History screen, past matches | 1 day |
| M6: Notifications | Push on match | 1–2 days |

---

## 10. Out of Scope (For Now)

- Payments
- Reviews, ratings, comments
- Likes, dislikes, shares, saves, reports
- Settings, privacy, terms, contact, help, FAQ, feedback, suggestions

These can be added later as separate modules if needed.

---

## 11. Next Steps

1. **Implement 20-swipe limit** (highest impact, closes core spec gap)
2. **Add Firebase Anonymous Auth** (enables secure rules and user history)
3. **Build session history screen**
4. **Iterate on invite flow** (copy, QR, share)

---

*Plan version: 1.0 | Last updated: Feb 3, 2026*
