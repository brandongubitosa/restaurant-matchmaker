import { Restaurant, SessionFilters, LocationData } from '../types';

// Foursquare API configuration
const FOURSQUARE_API_KEY = 'RTWF1CQOSFGF300JQGVCMTVHXRXA0KXZLWGDGTK2B4JRKSMZ';
const FOURSQUARE_BASE_URL = 'https://api.foursquare.com/v3';

// Hoboken, NJ coordinates
const HOBOKEN_LATITUDE = 40.7439;
const HOBOKEN_LONGITUDE = -74.0323;

// 1 mile radius in meters
const RADIUS_METERS = 1609;

// Foursquare category IDs
const FOOD_CATEGORY = '13000';
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

// Real Hoboken restaurants as fallback data
const HOBOKEN_RESTAURANTS: Restaurant[] = [
  {
    id: 'hoboken-1',
    name: 'Elysian Cafe',
    image_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500',
    rating: 4.5,
    review_count: 892,
    price: '$$',
    categories: [{ alias: 'american', title: 'American' }, { alias: 'bar', title: 'Bar' }],
    location: {
      address1: '1001 Washington St',
      city: 'Hoboken',
      state: 'NJ',
      zip_code: '07030',
      display_address: ['1001 Washington St, Hoboken, NJ 07030'],
    },
    phone: '+12017982202',
    display_phone: '(201) 798-2202',
    distance: 200,
    is_closed: false,
    url: 'https://www.elysiancafe.com',
    transactions: ['pickup', 'delivery'],
  },
  {
    id: 'hoboken-2',
    name: 'Benny Tudino\'s Pizzeria',
    image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500',
    rating: 4.3,
    review_count: 1245,
    price: '$',
    categories: [{ alias: 'pizza', title: 'Pizza' }, { alias: 'italian', title: 'Italian' }],
    location: {
      address1: '622 Washington St',
      city: 'Hoboken',
      state: 'NJ',
      zip_code: '07030',
      display_address: ['622 Washington St, Hoboken, NJ 07030'],
    },
    phone: '+12017926111',
    display_phone: '(201) 792-6111',
    distance: 350,
    is_closed: false,
    url: 'https://www.bennytudinos.com',
    transactions: ['pickup', 'delivery'],
  },
  {
    id: 'hoboken-3',
    name: 'Amanda\'s Restaurant',
    image_url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=500',
    rating: 4.6,
    review_count: 567,
    price: '$$$',
    categories: [{ alias: 'american', title: 'New American' }, { alias: 'brunch', title: 'Brunch' }],
    location: {
      address1: '908 Washington St',
      city: 'Hoboken',
      state: 'NJ',
      zip_code: '07030',
      display_address: ['908 Washington St, Hoboken, NJ 07030'],
    },
    phone: '+12017980101',
    display_phone: '(201) 798-0101',
    distance: 150,
    is_closed: false,
    url: 'https://www.amandasrestaurant.com',
    transactions: ['pickup'],
  },
  {
    id: 'hoboken-4',
    name: 'La Isla Restaurant',
    image_url: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=500',
    rating: 4.4,
    review_count: 723,
    price: '$$',
    categories: [{ alias: 'cuban', title: 'Cuban' }, { alias: 'latin', title: 'Latin American' }],
    location: {
      address1: '104 Washington St',
      city: 'Hoboken',
      state: 'NJ',
      zip_code: '07030',
      display_address: ['104 Washington St, Hoboken, NJ 07030'],
    },
    phone: '+12016596197',
    display_phone: '(201) 659-6197',
    distance: 500,
    is_closed: false,
    url: 'https://www.laislahoboken.com',
    transactions: ['pickup', 'delivery'],
  },
  {
    id: 'hoboken-5',
    name: 'Fiore\'s House of Quality',
    image_url: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500',
    rating: 4.7,
    review_count: 456,
    price: '$',
    categories: [{ alias: 'deli', title: 'Deli' }, { alias: 'sandwiches', title: 'Sandwiches' }],
    location: {
      address1: '414 Adams St',
      city: 'Hoboken',
      state: 'NJ',
      zip_code: '07030',
      display_address: ['414 Adams St, Hoboken, NJ 07030'],
    },
    phone: '+12016593636',
    display_phone: '(201) 659-3636',
    distance: 400,
    is_closed: false,
    url: 'https://www.fioresdeli.com',
    transactions: ['pickup'],
  },
  {
    id: 'hoboken-6',
    name: 'Satay Malaysian Cuisine',
    image_url: 'https://images.unsplash.com/photo-1569058242567-93de6f36f8eb?w=500',
    rating: 4.5,
    review_count: 389,
    price: '$$',
    categories: [{ alias: 'malaysian', title: 'Malaysian' }, { alias: 'asian', title: 'Asian' }],
    location: {
      address1: '95 Washington St',
      city: 'Hoboken',
      state: 'NJ',
      zip_code: '07030',
      display_address: ['95 Washington St, Hoboken, NJ 07030'],
    },
    phone: '+12013865987',
    display_phone: '(201) 386-5987',
    distance: 520,
    is_closed: false,
    url: 'https://www.satayhoboken.com',
    transactions: ['pickup', 'delivery'],
  },
  {
    id: 'hoboken-7',
    name: 'Grimaldi\'s Pizzeria',
    image_url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500',
    rating: 4.2,
    review_count: 612,
    price: '$$',
    categories: [{ alias: 'pizza', title: 'Pizza' }, { alias: 'italian', title: 'Italian' }],
    location: {
      address1: '411 Washington St',
      city: 'Hoboken',
      state: 'NJ',
      zip_code: '07030',
      display_address: ['411 Washington St, Hoboken, NJ 07030'],
    },
    phone: '+12012226992',
    display_phone: '(201) 222-6992',
    distance: 450,
    is_closed: false,
    url: 'https://www.grimaldispizzeria.com',
    transactions: ['pickup', 'delivery'],
  },
  {
    id: 'hoboken-8',
    name: 'Augustino\'s',
    image_url: 'https://images.unsplash.com/photo-1595295333158-4742f28fbd85?w=500',
    rating: 4.4,
    review_count: 534,
    price: '$$',
    categories: [{ alias: 'italian', title: 'Italian' }, { alias: 'pasta', title: 'Pasta' }],
    location: {
      address1: '1104 Washington St',
      city: 'Hoboken',
      state: 'NJ',
      zip_code: '07030',
      display_address: ['1104 Washington St, Hoboken, NJ 07030'],
    },
    phone: '+12014200104',
    display_phone: '(201) 420-0104',
    distance: 180,
    is_closed: false,
    url: 'https://www.augustinoshoboken.com',
    transactions: ['pickup', 'delivery'],
  },
  {
    id: 'hoboken-9',
    name: 'Taqueria Downtown',
    image_url: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500',
    rating: 4.3,
    review_count: 478,
    price: '$',
    categories: [{ alias: 'mexican', title: 'Mexican' }, { alias: 'tacos', title: 'Tacos' }],
    location: {
      address1: '236 Washington St',
      city: 'Hoboken',
      state: 'NJ',
      zip_code: '07030',
      display_address: ['236 Washington St, Hoboken, NJ 07030'],
    },
    phone: '+12017985455',
    display_phone: '(201) 798-5455',
    distance: 480,
    is_closed: false,
    url: 'https://www.taqueriadowntown.com',
    transactions: ['pickup', 'delivery'],
  },
  {
    id: 'hoboken-10',
    name: 'Bin 14',
    image_url: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=500',
    rating: 4.5,
    review_count: 345,
    price: '$$$',
    categories: [{ alias: 'wine_bar', title: 'Wine Bar' }, { alias: 'mediterranean', title: 'Mediterranean' }],
    location: {
      address1: '1314 Washington St',
      city: 'Hoboken',
      state: 'NJ',
      zip_code: '07030',
      display_address: ['1314 Washington St, Hoboken, NJ 07030'],
    },
    phone: '+12019632233',
    display_phone: '(201) 963-2233',
    distance: 280,
    is_closed: false,
    url: 'https://www.bin14.com',
    transactions: ['pickup'],
  },
  {
    id: 'hoboken-11',
    name: 'East LA',
    image_url: 'https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?w=500',
    rating: 4.2,
    review_count: 567,
    price: '$$',
    categories: [{ alias: 'mexican', title: 'Mexican' }, { alias: 'bar', title: 'Bar' }],
    location: {
      address1: '508 Washington St',
      city: 'Hoboken',
      state: 'NJ',
      zip_code: '07030',
      display_address: ['508 Washington St, Hoboken, NJ 07030'],
    },
    phone: '+12012221777',
    display_phone: '(201) 222-1777',
    distance: 380,
    is_closed: false,
    url: 'https://www.eastlahoboken.com',
    transactions: ['pickup', 'delivery'],
  },
  {
    id: 'hoboken-12',
    name: 'Sushi Lounge',
    image_url: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=500',
    rating: 4.4,
    review_count: 423,
    price: '$$$',
    categories: [{ alias: 'sushi', title: 'Sushi' }, { alias: 'japanese', title: 'Japanese' }],
    location: {
      address1: '200 Hudson St',
      city: 'Hoboken',
      state: 'NJ',
      zip_code: '07030',
      display_address: ['200 Hudson St, Hoboken, NJ 07030'],
    },
    phone: '+12013862500',
    display_phone: '(201) 386-2500',
    distance: 350,
    is_closed: false,
    url: 'https://www.sushilounge.com',
    transactions: ['pickup', 'delivery'],
  },
  {
    id: 'hoboken-13',
    name: 'Karma Kafe',
    image_url: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=500',
    rating: 4.3,
    review_count: 312,
    price: '$$',
    categories: [{ alias: 'indian', title: 'Indian' }, { alias: 'vegetarian', title: 'Vegetarian' }],
    location: {
      address1: '505 Washington St',
      city: 'Hoboken',
      state: 'NJ',
      zip_code: '07030',
      display_address: ['505 Washington St, Hoboken, NJ 07030'],
    },
    phone: '+12016107900',
    display_phone: '(201) 610-7900',
    distance: 390,
    is_closed: false,
    url: 'https://www.karmakafe.com',
    transactions: ['pickup', 'delivery'],
  },
  {
    id: 'hoboken-14',
    name: 'Anthony David\'s',
    image_url: 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=500',
    rating: 4.6,
    review_count: 478,
    price: '$$$',
    categories: [{ alias: 'italian', title: 'Italian' }, { alias: 'seafood', title: 'Seafood' }],
    location: {
      address1: '953 Bloomfield St',
      city: 'Hoboken',
      state: 'NJ',
      zip_code: '07030',
      display_address: ['953 Bloomfield St, Hoboken, NJ 07030'],
    },
    phone: '+12012228399',
    display_phone: '(201) 222-8399',
    distance: 320,
    is_closed: false,
    url: 'https://www.anthonydavids.com',
    transactions: ['pickup'],
  },
  {
    id: 'hoboken-15',
    name: 'Ottimo Kitchen + Bar',
    image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500',
    rating: 4.4,
    review_count: 289,
    price: '$$',
    categories: [{ alias: 'italian', title: 'Italian' }, { alias: 'bar', title: 'Bar' }],
    location: {
      address1: '310 Sinatra Dr',
      city: 'Hoboken',
      state: 'NJ',
      zip_code: '07030',
      display_address: ['310 Sinatra Dr, Hoboken, NJ 07030'],
    },
    phone: '+12017983113',
    display_phone: '(201) 798-3113',
    distance: 450,
    is_closed: false,
    url: 'https://www.ottimohoboken.com',
    transactions: ['pickup', 'delivery'],
  },
];

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

// Convert Foursquare place to our Restaurant format
function convertToRestaurant(place: FoursquarePlace): Restaurant {
  let imageUrl = '';
  if (place.photos && place.photos.length > 0) {
    const photo = place.photos[0];
    imageUrl = `${photo.prefix}500x500${photo.suffix}`;
  }

  const priceMap: { [key: number]: string } = { 1: '$', 2: '$$', 3: '$$$', 4: '$$$$' };
  const priceStr = place.price ? priceMap[place.price] : undefined;

  // Convert rating (Foursquare uses 0-10, we normalize to 0-5)
  const rating = place.rating ? Math.round((place.rating / 2) * 10) / 10 : 0;

  const categories = place.categories.map((cat) => ({
    alias: cat.short_name.toLowerCase().replace(/\s+/g, '_'),
    title: cat.name,
  }));

  const location = {
    address1: place.location.address || '',
    city: place.location.locality || 'Hoboken',
    state: place.location.region || 'NJ',
    zip_code: place.location.postcode || '',
    display_address: [place.location.formatted_address],
  };

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

// Filter restaurants based on session filters
function filterRestaurants(restaurants: Restaurant[], filters: SessionFilters): Restaurant[] {
  let filtered = [...restaurants];

  // Filter by cuisine
  if (filters.cuisines.length > 0) {
    filtered = filtered.filter((r) =>
      r.categories.some((cat) =>
        filters.cuisines.some((cuisine) =>
          cat.alias.includes(cuisine) || cat.title.toLowerCase().includes(cuisine)
        )
      )
    );
  }

  // Filter by price
  if (filters.priceRange.length > 0) {
    const priceMap: { [key: string]: string } = { '1': '$', '2': '$$', '3': '$$$', '4': '$$$$' };
    const allowedPrices = filters.priceRange.map((p) => priceMap[p]);
    filtered = filtered.filter((r) => r.price && allowedPrices.includes(r.price));
  }

  // Filter by transaction type
  if (filters.transactionType === 'delivery') {
    filtered = filtered.filter((r) => r.transactions?.includes('delivery'));
  } else if (filters.transactionType === 'pickup') {
    filtered = filtered.filter((r) => r.transactions?.includes('pickup'));
  }
  // 'any' means no filtering

  return filtered;
}

// Fetch restaurants from Foursquare or use fallback
export async function fetchRestaurants(
  filters: SessionFilters,
  location?: LocationData
): Promise<Restaurant[]> {
  // Use provided location or default to Hoboken
  const lat = location?.latitude ?? HOBOKEN_LATITUDE;
  const lng = location?.longitude ?? HOBOKEN_LONGITUDE;

  // Build Foursquare category filter
  let categoryFilter = FOOD_CATEGORY;
  if (filters.cuisines.length > 0) {
    const fsqCategories = filters.cuisines
      .map((cat) => RESTAURANT_CATEGORIES[cat])
      .filter(Boolean);
    if (fsqCategories.length > 0) {
      categoryFilter = fsqCategories.join(',');
    }
  }

  // Build price filter
  let priceParams = '';
  if (filters.priceRange.length > 0) {
    const prices = filters.priceRange.map(Number);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    priceParams = `&min_price=${minPrice}&max_price=${maxPrice}`;
  }

  // Build the API URL
  const url = `${FOURSQUARE_BASE_URL}/places/search?` +
    `ll=${lat},${lng}` +
    `&radius=${RADIUS_METERS}` +
    `&categories=${categoryFilter}` +
    `&limit=50` +
    `&sort=RATING` +
    `&fields=fsq_id,name,categories,distance,geocodes,location,photos,rating,price,tel,website,hours,stats` +
    priceParams;

  try {
    console.log('Attempting Foursquare API call...');
    const response = await fetch(url, {
      headers: {
        Authorization: FOURSQUARE_API_KEY,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Foursquare API error:', response.status, errorText);
      console.log('Using fallback Hoboken restaurant data...');
      // Use fallback data
      const filtered = filterRestaurants(HOBOKEN_RESTAURANTS, filters);
      return shuffleArray(filtered.length > 0 ? filtered : HOBOKEN_RESTAURANTS);
    }

    const data = await response.json();
    let restaurants = data.results.map(convertToRestaurant);

    // Filter out closed restaurants
    restaurants = restaurants.filter((r: Restaurant) => !r.is_closed);

    if (restaurants.length === 0) {
      console.log('No Foursquare results, using fallback data...');
      const filtered = filterRestaurants(HOBOKEN_RESTAURANTS, filters);
      return shuffleArray(filtered.length > 0 ? filtered : HOBOKEN_RESTAURANTS);
    }

    // Shuffle for variety
    return shuffleArray(restaurants);
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    console.log('Using fallback Hoboken restaurant data...');
    // Use fallback data on any error
    const filtered = filterRestaurants(HOBOKEN_RESTAURANTS, filters);
    return shuffleArray(filtered.length > 0 ? filtered : HOBOKEN_RESTAURANTS);
  }
}

// Shuffle array using Fisher-Yates algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Get a single restaurant by ID (from cached data)
export function getRestaurantById(
  restaurants: Restaurant[],
  id: string
): Restaurant | undefined {
  return restaurants.find((r) => r.id === id);
}

// Format distance for display
export function formatDistance(meters?: number): string {
  if (!meters) return '';
  const miles = meters / 1609.34;
  if (miles < 0.1) {
    return `${Math.round(meters)} m`;
  }
  return `${miles.toFixed(1)} mi`;
}

// Format price for display
export function formatPrice(price?: string): string {
  return price || 'N/A';
}

// Get cuisine display text
export function getCuisineText(restaurant: Restaurant): string {
  if (!restaurant.categories || restaurant.categories.length === 0) {
    return 'Restaurant';
  }
  return restaurant.categories.map((c) => c.title).join(', ');
}
