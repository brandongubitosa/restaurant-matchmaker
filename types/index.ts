// Maximum swipes per person per session
export const MAX_SWIPES = 10;

// Restaurant type from Yelp API
export interface Restaurant {
  id: string;
  name: string;
  image_url: string;
  rating: number;
  review_count: number;
  price?: string; // $, $$, $$$, $$$$
  categories: { alias: string; title: string }[];
  location: {
    address1: string;
    city: string;
    state: string;
    zip_code: string;
    display_address: string[];
  };
  phone: string;
  display_phone: string;
  distance?: number; // in meters
  is_closed: boolean;
  url: string;
  // Custom flags we add
  transactions?: string[]; // ['delivery', 'pickup', 'restaurant_reservation']
}

// Location data
export interface LocationData {
  latitude: number;
  longitude: number;
  source: 'gps' | 'default';
}

// Session filters
export interface SessionFilters {
  cuisines: string[];
  priceRange: string[]; // ['1', '2', '3', '4'] for $, $$, $$$, $$$$
  deliveryOnly: boolean;
  location?: LocationData;
}

// Session in Firestore
export interface Session {
  id: string;
  createdAt: Date;
  createdBy: string; // device ID
  partnerId: string | null; // device ID of partner
  status: 'waiting' | 'active' | 'completed';
  filters: SessionFilters;
  restaurantIds: string[]; // ordered list of restaurant IDs for this session
  // Swipe tracking
  creatorSwipeCount: number;
  partnerSwipeCount: number;
  creatorCompleted: boolean;
  partnerCompleted: boolean;
}

// Swipe record in Firestore
export interface SwipeRecord {
  restaurantId: string;
  creatorSwipe: 'left' | 'right' | null;
  partnerSwipe: 'left' | 'right' | null;
  isMatch: boolean;
  updatedAt: Date;
}

// User's role in a session
export type UserRole = 'creator' | 'partner';

// Match for display
export interface Match {
  restaurant: Restaurant;
  matchedAt: Date;
}

// Cuisine options for filters
export const CUISINE_OPTIONS = [
  { alias: 'italian', title: 'Italian' },
  { alias: 'mexican', title: 'Mexican' },
  { alias: 'chinese', title: 'Chinese' },
  { alias: 'japanese', title: 'Japanese' },
  { alias: 'indian', title: 'Indian' },
  { alias: 'thai', title: 'Thai' },
  { alias: 'american', title: 'American' },
  { alias: 'pizza', title: 'Pizza' },
  { alias: 'burgers', title: 'Burgers' },
  { alias: 'seafood', title: 'Seafood' },
  { alias: 'sushi', title: 'Sushi' },
  { alias: 'mediterranean', title: 'Mediterranean' },
  { alias: 'korean', title: 'Korean' },
  { alias: 'vietnamese', title: 'Vietnamese' },
  { alias: 'breakfast_brunch', title: 'Breakfast & Brunch' },
  { alias: 'sandwiches', title: 'Sandwiches' },
  { alias: 'salad', title: 'Salad' },
  { alias: 'vegetarian', title: 'Vegetarian' },
] as const;

export const PRICE_OPTIONS = [
  { value: '1', label: '$' },
  { value: '2', label: '$$' },
  { value: '3', label: '$$$' },
  { value: '4', label: '$$$$' },
] as const;
