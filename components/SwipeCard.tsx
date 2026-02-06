import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Restaurant } from '../types';
import { formatDistance, formatPrice, getCuisineText } from '../lib/restaurants';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

interface SwipeCardProps {
  restaurant: Restaurant;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
}

export default function SwipeCard({ restaurant, onSwipeLeft, onSwipeRight }: SwipeCardProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      startX.value = translateX.value;
      startY.value = translateY.value;
    })
    .onUpdate((event) => {
      translateX.value = startX.value + event.translationX;
      translateY.value = startY.value + event.translationY * 0.5;
    })
    .onEnd(() => {
      if (translateX.value > SWIPE_THRESHOLD) {
        translateX.value = withSpring(SCREEN_WIDTH * 1.5);
        runOnJS(onSwipeRight)();
      } else if (translateX.value < -SWIPE_THRESHOLD) {
        translateX.value = withSpring(-SCREEN_WIDTH * 1.5);
        runOnJS(onSwipeLeft)();
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    });

  const cardStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
      [-15, 0, 15],
      Extrapolation.CLAMP
    );

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` },
      ],
    };
  });

  const likeOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP
    ),
  }));

  const nopeOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, 0],
      [1, 0],
      Extrapolation.CLAMP
    ),
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.card, cardStyle]}>
        {/* Restaurant Image */}
        <View style={styles.imageContainer}>
          {restaurant.image_url ? (
            <Image
              source={{ uri: restaurant.image_url }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.image, styles.placeholderImage]}>
              <Ionicons name="restaurant" size={80} color="#ccc" />
            </View>
          )}

          {/* Like/Nope Overlays */}
          <Animated.View style={[styles.stampContainer, styles.likeStamp, likeOpacity]}>
            <Text style={[styles.stampText, styles.likeText]}>LIKE</Text>
          </Animated.View>
          <Animated.View style={[styles.stampContainer, styles.nopeStamp, nopeOpacity]}>
            <Text style={[styles.stampText, styles.nopeText]}>NOPE</Text>
          </Animated.View>
        </View>

        {/* Restaurant Info */}
        <View style={styles.infoContainer}>
          <View style={styles.headerRow}>
            <Text style={styles.name} numberOfLines={1}>
              {restaurant.name}
            </Text>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={styles.rating}>{restaurant.rating.toFixed(1)}</Text>
              <Text style={styles.reviewCount}>({restaurant.review_count})</Text>
            </View>
          </View>

          <View style={styles.detailsRow}>
            <Text style={styles.cuisine}>{getCuisineText(restaurant)}</Text>
            <Text style={styles.separator}>•</Text>
            <Text style={styles.price}>{formatPrice(restaurant.price)}</Text>
            {restaurant.distance && (
              <>
                <Text style={styles.separator}>•</Text>
                <Text style={styles.distance}>{formatDistance(restaurant.distance)}</Text>
              </>
            )}
          </View>

          <Text style={styles.address} numberOfLines={1}>
            {restaurant.location.display_address.join(', ')}
          </Text>

          {/* Transaction badges */}
          {restaurant.transactions && restaurant.transactions.length > 0 && (
            <View style={styles.badgesRow}>
              {restaurant.transactions.includes('delivery') && (
                <View style={styles.badge}>
                  <Ionicons name="bicycle" size={12} color="#4CAF50" />
                  <Text style={styles.badgeText}>Delivery</Text>
                </View>
              )}
              {restaurant.transactions.includes('pickup') && (
                <View style={styles.badge}>
                  <Ionicons name="bag-handle" size={12} color="#2196F3" />
                  <Text style={styles.badgeText}>Pickup</Text>
                </View>
              )}
              {restaurant.transactions.includes('restaurant_reservation') && (
                <View style={styles.badge}>
                  <Ionicons name="calendar" size={12} color="#9C27B0" />
                  <Text style={styles.badgeText}>Reservations</Text>
                </View>
              )}
            </View>
          )}
        </View>

      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  card: {
    width: SCREEN_WIDTH * 0.9,
    height: SCREEN_HEIGHT * 0.7,
    backgroundColor: '#fff',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
    overflow: 'hidden',
  },
  imageContainer: {
    flex: 1,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stampContainer: {
    position: 'absolute',
    top: 40,
    padding: 10,
    borderWidth: 4,
    borderRadius: 10,
    transform: [{ rotate: '-20deg' }],
  },
  likeStamp: {
    right: 20,
    borderColor: '#4CAF50',
  },
  nopeStamp: {
    left: 20,
    borderColor: '#FF6B6B',
  },
  stampText: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  likeText: {
    color: '#4CAF50',
  },
  nopeText: {
    color: '#FF6B6B',
  },
  infoContainer: {
    padding: 16,
    backgroundColor: '#fff',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 10,
    color: '#333',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
    color: '#333',
  },
  reviewCount: {
    fontSize: 14,
    color: '#666',
    marginLeft: 2,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cuisine: {
    fontSize: 14,
    color: '#666',
  },
  separator: {
    marginHorizontal: 6,
    color: '#ccc',
  },
  price: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  distance: {
    fontSize: 14,
    color: '#666',
  },
  address: {
    fontSize: 13,
    color: '#999',
    marginBottom: 8,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
});
