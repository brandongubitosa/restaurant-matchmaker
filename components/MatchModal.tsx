import React, { useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  Pressable,
  Modal,
  Dimensions,
  Linking,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
} from 'react-native-reanimated';
import { Restaurant } from '../types';
import { getCuisineText, formatPrice } from '../lib/restaurants';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface MatchModalProps {
  visible: boolean;
  restaurant: Restaurant | null;
  onClose: () => void;
  onViewMatches: () => void;
}

export default function MatchModal({
  visible,
  restaurant,
  onClose,
  onViewMatches,
}: MatchModalProps) {
  const scale = useSharedValue(0);
  const heartScale = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, { damping: 12 });
      heartScale.value = withSequence(
        withDelay(200, withSpring(1.3, { damping: 8 })),
        withSpring(1, { damping: 10 })
      );
    } else {
      scale.value = 0;
      heartScale.value = 0;
    }
  }, [visible]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  if (!restaurant) return null;

  const openYelp = () => {
    if (restaurant.url) {
      Linking.openURL(restaurant.url);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View style={[styles.card, cardStyle]}>
          {/* Celebration Header */}
          <View style={styles.header}>
            <Animated.View style={heartStyle}>
              <Ionicons name="heart" size={60} color="#FF6B6B" />
            </Animated.View>
            <Text style={styles.title}>It's a Match!</Text>
            <Text style={styles.subtitle}>
              You both liked {restaurant.name}
            </Text>
          </View>

          {/* Restaurant Card */}
          <View style={styles.restaurantCard}>
            {restaurant.image_url ? (
              <Image
                source={{ uri: restaurant.image_url }}
                style={styles.image}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.image, styles.placeholderImage]}>
                <Ionicons name="restaurant" size={40} color="#ccc" />
              </View>
            )}

            <View style={styles.info}>
              <Text style={styles.name}>{restaurant.name}</Text>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={14} color="#FFD700" />
                <Text style={styles.rating}>{restaurant.rating.toFixed(1)}</Text>
                <Text style={styles.separator}>•</Text>
                <Text style={styles.price}>{formatPrice(restaurant.price)}</Text>
              </View>
              <Text style={styles.cuisine}>{getCuisineText(restaurant)}</Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable style={styles.yelpButton} onPress={openYelp}>
              <Text style={styles.yelpButtonText}>View on Yelp</Text>
              <Ionicons name="open-outline" size={16} color="#D32323" />
            </Pressable>

            <View style={styles.buttonRow}>
              <Pressable style={styles.secondaryButton} onPress={onClose}>
                <Text style={styles.secondaryButtonText}>Keep Swiping</Text>
              </Pressable>
              <Pressable style={styles.primaryButton} onPress={onViewMatches}>
                <Text style={styles.primaryButtonText}>View Matches</Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: SCREEN_WIDTH * 0.85,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  restaurantCard: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    borderRadius: 16,
    overflow: 'hidden',
    width: '100%',
    marginBottom: 24,
  },
  image: {
    width: 100,
    height: 100,
  },
  placeholderImage: {
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  rating: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
    color: '#333',
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
  cuisine: {
    fontSize: 13,
    color: '#666',
  },
  actions: {
    width: '100%',
  },
  yelpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#D32323',
    borderRadius: 12,
  },
  yelpButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D32323',
    marginRight: 6,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  primaryButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
