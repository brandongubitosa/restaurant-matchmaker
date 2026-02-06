import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

// Foursquare Places API configuration
// API key is loaded from functions/.env file
const FOURSQUARE_API_KEY = process.env.FOURSQUARE_API_KEY;
const FOURSQUARE_BASE_URL = 'https://api.foursquare.com/v3';

// Hoboken, NJ coordinates (default)
const DEFAULT_LATITUDE = 40.7439;
const DEFAULT_LONGITUDE = -74.0323;
const DEFAULT_RADIUS = 1609; // 1 mile in meters

// Foursquare category IDs for food
const FOOD_CATEGORY = '13000'; // Food parent category
const RESTAURANT_CATEGORIES: { [key: string]: string } = {
  italian: '13236',
  mexican: '13303',
  chinese: '13099',
  japanese: '13263',
  indian: '13199',
  thai: '13352',
  american: '13068',
  pizza: '13064',
  burgers: '13031',
  seafood: '13338',
  sushi: '13350',
  mediterranean: '13302',
  korean: '13272',
  vietnamese: '13367',
  breakfast_brunch: '13028',
  sandwiches: '13334',
  salad: '13332',
  vegetarian: '13377',
};

// Our normalized Restaurant type
interface Restaurant {
  id: string;
  name: string;
  image_url: string;
  rating: number;
  review_count: number;
  price?: string;
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
  distance?: number;
  is_closed: boolean;
  url: string;
  transactions?: string[];
}

// Foursquare API response types
interface FoursquarePlace {
  fsq_id: string;
  name: string;
  categories: { id: number; name: string; short_name: string; icon: { prefix: string; suffix: string } }[];
  distance: number;
  geocodes: { main: { latitude: number; longitude: number } };
  location: {
    address?: string;
    locality?: string;
    region?: string;
    postcode?: string;
    formatted_address: string;
  };
  photos?: { id: string; prefix: string; suffix: string; width: number; height: number }[];
  rating?: number;
  price?: number;
  tel?: string;
  website?: string;
  hours?: { open_now: boolean };
  stats?: { total_ratings: number };
}

interface FoursquareSearchResponse {
  results: FoursquarePlace[];
}

interface GetRestaurantsParams {
  latitude?: number;
  longitude?: number;
  radius?: number;
  categories?: string;
  price?: string;
  term?: string;
}

// Convert Foursquare place to our Restaurant format
function convertToRestaurant(place: FoursquarePlace): Restaurant {
  // Get the best photo
  let imageUrl = '';
  if (place.photos && place.photos.length > 0) {
    const photo = place.photos[0];
    imageUrl = `${photo.prefix}500x500${photo.suffix}`;
  }

  // Convert price (Foursquare uses 1-4, we display as $-$$$$)
  const priceMap: { [key: number]: string } = { 1: '$', 2: '$$', 3: '$$$', 4: '$$$$' };
  const priceStr = place.price ? priceMap[place.price] : undefined;

  // Convert rating (Foursquare uses 0-10, we normalize to 0-5)
  const rating = place.rating ? Math.round((place.rating / 2) * 10) / 10 : 0;

  // Build categories
  const categories = place.categories.map((cat) => ({
    alias: cat.short_name.toLowerCase().replace(/\s+/g, '_'),
    title: cat.name,
  }));

  // Build location
  const location = {
    address1: place.location.address || '',
    city: place.location.locality || 'Hoboken',
    state: place.location.region || 'NJ',
    zip_code: place.location.postcode || '',
    display_address: [place.location.formatted_address],
  };

  // Determine transactions (Foursquare doesn't have this directly, so we infer)
  const transactions: string[] = [];
  const categoryNames = place.categories.map((c) => c.name.toLowerCase());
  if (categoryNames.some((n) => n.includes('delivery') || n.includes('takeout') || n.includes('fast'))) {
    transactions.push('delivery', 'pickup');
  }

  return {
    id: place.fsq_id,
    name: place.name,
    image_url: imageUrl,
    rating,
    review_count: place.stats?.total_ratings || 0,
    price: priceStr,
    categories,
    location,
    phone: place.tel || '',
    display_phone: place.tel || '',
    distance: place.distance,
    is_closed: place.hours?.open_now === false,
    url: place.website || `https://foursquare.com/v/${place.fsq_id}`,
    transactions,
  };
}

export const getRestaurants = functions.https.onCall(
  async (data: GetRestaurantsParams, context) => {
    // Check if Foursquare API key is configured
    if (!FOURSQUARE_API_KEY) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Foursquare API key not configured. Please set it using firebase functions:config:set foursquare.api_key="YOUR_KEY"'
      );
    }

    const {
      latitude = DEFAULT_LATITUDE,
      longitude = DEFAULT_LONGITUDE,
      radius = DEFAULT_RADIUS,
      categories,
      price,
    } = data;

    // Build Foursquare category filter
    let categoryFilter = FOOD_CATEGORY; // Default to all food
    if (categories) {
      const categoryList = categories.split(',');
      const fsqCategories = categoryList
        .map((cat) => RESTAURANT_CATEGORIES[cat.trim()])
        .filter(Boolean);
      if (fsqCategories.length > 0) {
        categoryFilter = fsqCategories.join(',');
      }
    }

    // Build price filter (Foursquare uses min_price and max_price)
    let priceParams = '';
    if (price) {
      const prices = price.split(',').map(Number);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      priceParams = `&min_price=${minPrice}&max_price=${maxPrice}`;
    }

    // Build the Foursquare API URL
    const url = `${FOURSQUARE_BASE_URL}/places/search?` +
      `ll=${latitude},${longitude}` +
      `&radius=${Math.min(radius, 100000)}` + // Foursquare max is 100km
      `&categories=${categoryFilter}` +
      `&limit=50` +
      `&sort=RATING` +
      `&fields=fsq_id,name,categories,distance,geocodes,location,photos,rating,price,tel,website,hours,stats` +
      priceParams;

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: FOURSQUARE_API_KEY,
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Foursquare API error:', response.status, errorText);
        throw new functions.https.HttpsError(
          'internal',
          `Foursquare API error: ${response.status}`
        );
      }

      const fsqData: FoursquareSearchResponse = await response.json();

      // Convert to our Restaurant format
      const restaurants = fsqData.results.map(convertToRestaurant);

      // Filter out closed restaurants
      const openRestaurants = restaurants.filter((r) => !r.is_closed);

      return {
        restaurants: openRestaurants,
        total: openRestaurants.length,
      };
    } catch (error) {
      console.error('Error fetching restaurants:', error);

      if (error instanceof functions.https.HttpsError) {
        throw error;
      }

      throw new functions.https.HttpsError(
        'internal',
        'Failed to fetch restaurants from Foursquare'
      );
    }
  }
);

// Cached version to reduce API calls
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes (longer cache since restaurant data doesn't change often)

export const getRestaurantsCached = functions.https.onCall(
  async (data: GetRestaurantsParams, context) => {
    const cacheKey = JSON.stringify(data);
    const cached = cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('Returning cached restaurants');
      return cached.data;
    }

    // Get fresh data
    if (!FOURSQUARE_API_KEY) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Foursquare API key not configured'
      );
    }

    const {
      latitude = DEFAULT_LATITUDE,
      longitude = DEFAULT_LONGITUDE,
      radius = DEFAULT_RADIUS,
      categories,
      price,
    } = data;

    let categoryFilter = FOOD_CATEGORY;
    if (categories) {
      const categoryList = categories.split(',');
      const fsqCategories = categoryList
        .map((cat) => RESTAURANT_CATEGORIES[cat.trim()])
        .filter(Boolean);
      if (fsqCategories.length > 0) {
        categoryFilter = fsqCategories.join(',');
      }
    }

    let priceParams = '';
    if (price) {
      const prices = price.split(',').map(Number);
      priceParams = `&min_price=${Math.min(...prices)}&max_price=${Math.max(...prices)}`;
    }

    const url = `${FOURSQUARE_BASE_URL}/places/search?` +
      `ll=${latitude},${longitude}` +
      `&radius=${Math.min(radius, 100000)}` +
      `&categories=${categoryFilter}` +
      `&limit=50` +
      `&sort=RATING` +
      `&fields=fsq_id,name,categories,distance,geocodes,location,photos,rating,price,tel,website,hours,stats` +
      priceParams;

    const response = await fetch(url, {
      headers: {
        Authorization: FOURSQUARE_API_KEY,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new functions.https.HttpsError('internal', 'Foursquare API error');
    }

    const fsqData: FoursquareSearchResponse = await response.json();
    const restaurants = fsqData.results.map(convertToRestaurant);
    const openRestaurants = restaurants.filter((r) => !r.is_closed);

    const result = {
      restaurants: openRestaurants,
      total: openRestaurants.length,
    };

    cache.set(cacheKey, { data: result, timestamp: Date.now() });

    return result;
  }
);
