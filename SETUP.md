# Restaurant Matcher - Setup Guide

A Tinder-like app for choosing restaurants in Hoboken, NJ with your partner!

## Quick Start

### 1. Get a Foursquare API Key (FREE - 100K calls/month)

1. Go to [https://foursquare.com/developers](https://foursquare.com/developers)
2. Click "Get Started" and create a free account
3. Create a new project
4. Go to your project → API Keys
5. Copy your **API Key**

### 2. Set Up Firebase

1. Go to [https://console.firebase.google.com](https://console.firebase.google.com)
2. Create a new project (or use existing)
3. Enable **Firestore Database**:
   - Click "Build" → "Firestore Database"
   - Click "Create database"
   - Choose "Start in test mode" (for development)
   - Select a location close to you
4. Get your Firebase config:
   - Click the gear icon → "Project settings"
   - Scroll to "Your apps" → Click "Add app" → Web
   - Copy the `firebaseConfig` object

### 3. Configure the App

1. Open `lib/firebase.ts` and replace the config:

```typescript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

### 4. Deploy Cloud Functions

```bash
# Install Firebase CLI if you haven't
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in this project
firebase init

# Select: Functions, Firestore
# Use existing project
# Select your project
# Use TypeScript
# Don't overwrite existing files

# Set your Foursquare API key
firebase functions:config:set foursquare.api_key="YOUR_FOURSQUARE_API_KEY"

# Deploy functions
cd functions
npm install
npm run build
cd ..
firebase deploy --only functions

# Deploy Firestore rules
firebase deploy --only firestore:rules
```

### 5. Run the App

```bash
# Start the Expo development server
npm start

# Or run directly on a platform:
npm run ios      # iOS Simulator
npm run android  # Android Emulator
npm run web      # Web browser
```

### 6. Test on Your Phone

1. Download **Expo Go** from the App Store or Play Store
2. Scan the QR code from the terminal
3. The app will load on your phone!

## How to Use

### Creating a Session

1. Open the app and tap "Create Session"
2. Choose your filters:
   - Toggle "Delivery/Pickup Only" if you want food delivered
   - Select price ranges ($, $$, $$$, $$$$)
   - Pick cuisine types you're interested in
3. Tap "Start Swiping"
4. Share the session code or link with your partner

### Joining a Session

1. Your partner shares a code (e.g., `a1b2c3d4`)
2. Enter the code on the home screen
3. Tap the arrow to join
4. Both start swiping!

### Swiping

- **Swipe right** or tap the heart if you like the restaurant
- **Swipe left** or tap X if you don't
- When both of you swipe right → **It's a Match!**
- View all matches by tapping the heart icon

## Project Structure

```
restaurant-matcher/
├── app/                    # Screens (Expo Router)
│   ├── index.tsx           # Home screen
│   ├── session/[id].tsx    # Swiping screen
│   ├── session/matches.tsx # Matches list
│   └── invite/[id].tsx     # Join via link
├── components/             # Reusable components
│   ├── SwipeCard.tsx       # Swipe gesture card
│   ├── MatchModal.tsx      # "It's a match" popup
│   └── FilterModal.tsx     # Filter selection
├── lib/                    # Business logic
│   ├── firebase.ts         # Firebase config
│   ├── session.ts          # Session CRUD
│   ├── restaurants.ts      # Restaurant fetching
│   └── deviceId.ts         # Device identification
├── hooks/                  # React hooks
│   └── useSession.ts       # Session state management
├── types/                  # TypeScript types
│   └── index.ts
└── functions/              # Firebase Cloud Functions
    └── src/index.ts        # Foursquare API proxy
```

## Troubleshooting

### "Failed to create session" error
- Check your Firebase config in `lib/firebase.ts`
- Make sure Firestore is enabled in your Firebase project
- Verify your Cloud Functions are deployed

### No restaurants showing
- Make sure your Foursquare API key is set correctly
- Check if Cloud Functions deployed successfully:
  ```bash
  firebase functions:log
  ```

### Deep links not working
- For iOS: Links work automatically with Expo Go
- For Android: Links work after building a standalone app

## API Limits (Foursquare Free Tier)

- **100,000 API calls per month** - plenty for personal use!
- No credit card required
- Results include photos, ratings, hours, and more

## Scaling for Production

When you're ready to publish:

1. **Security**: Update `firestore.rules` to add proper authentication
2. **Domain**: Set up a custom domain for web sharing
3. **Analytics**: Add Firebase Analytics
4. **Auth**: Add user accounts instead of device IDs
5. **Build**: Create standalone builds with EAS Build

```bash
npx eas build --platform all
```

Enjoy finding restaurants together!
