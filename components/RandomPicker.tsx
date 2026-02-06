import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  Pressable,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { Restaurant } from '../types';
import { formatPrice, getCuisineText } from '../lib/restaurants';

interface RandomPickerProps {
  visible: boolean;
  matches: Restaurant[];
  onClose: () => void;
  onSelect: (restaurant: Restaurant) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.8;
const CARD_HEIGHT = 200;

export default function RandomPicker({
  visible,
  matches,
  onClose,
  onSelect,
}: RandomPickerProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<Restaurant | null>(null);
  const [displayIndex, setDisplayIndex] = useState(0);

  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const startSpin = useCallback(() => {
    if (matches.length < 2) return;

    setIsSpinning(true);
    setWinner(null);

    // Pick a random winner
    const winnerIndex = Math.floor(Math.random() * matches.length);
    const selectedWinner = matches[winnerIndex];

    // Animate through restaurants
    let currentIndex = 0;
    let delay = 50;
    const maxIterations = 20 + winnerIndex;

    const animate = () => {
      setDisplayIndex(currentIndex % matches.length);

      // Slow down as we approach the end
      if (currentIndex >= maxIterations - 5) {
        delay += 50;
      }
      if (currentIndex >= maxIterations - 3) {
        delay += 100;
      }

      if (currentIndex < maxIterations) {
        currentIndex++;
        setTimeout(animate, delay);
      } else {
        // Animation complete - show winner
        setDisplayIndex(winnerIndex);
        setWinner(selectedWinner);
        setIsSpinning(false);

        // Celebration animation
        scale.value = withSequence(
          withTiming(1.1, { duration: 150, easing: Easing.out(Easing.ease) }),
          withTiming(1, { duration: 150, easing: Easing.in(Easing.ease) })
        );
      }
    };

    animate();
  }, [matches, scale]);

  const handleTryAgain = () => {
    setWinner(null);
    startSpin();
  };

  const handleLetsGo = () => {
    if (winner) {
      onSelect(winner);
    }
    onClose();
  };

  const handleClose = () => {
    setWinner(null);
    setIsSpinning(false);
    setDisplayIndex(0);
    onClose();
  };

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const currentRestaurant = matches[displayIndex];

  if (!visible || matches.length === 0) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </Pressable>
            <Text style={styles.title}>
              {winner ? 'Winner!' : 'Pick for Us'}
            </Text>
            <View style={styles.closeButton} />
          </View>

          {/* Slot machine area */}
          <Animated.View style={[styles.cardContainer, animatedCardStyle]}>
            {winner && (
              <View style={styles.trophyBadge}>
                <Ionicons name="trophy" size={24} color="#FFD700" />
              </View>
            )}

            {currentRestaurant && (
              <View style={styles.card}>
                {currentRestaurant.image_url ? (
                  <Image
                    source={{ uri: currentRestaurant.image_url }}
                    style={styles.cardImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.cardImage, styles.placeholderImage]}>
                    <Ionicons name="restaurant" size={40} color="#ccc" />
                  </View>
                )}

                <View style={styles.cardInfo}>
                  <Text style={styles.cardName} numberOfLines={1}>
                    {currentRestaurant.name}
                  </Text>

                  <View style={styles.cardDetails}>
                    <Ionicons name="star" size={14} color="#FFD700" />
                    <Text style={styles.cardRating}>
                      {currentRestaurant.rating.toFixed(1)}
                    </Text>
                    <Text style={styles.cardSeparator}>•</Text>
                    <Text style={styles.cardPrice}>
                      {formatPrice(currentRestaurant.price)}
                    </Text>
                  </View>

                  <Text style={styles.cardCuisine} numberOfLines={1}>
                    {getCuisineText(currentRestaurant)}
                  </Text>
                </View>
              </View>
            )}
          </Animated.View>

          {/* Action buttons */}
          <View style={styles.actions}>
            {!winner && !isSpinning && (
              <Pressable style={styles.spinButton} onPress={startSpin}>
                <Ionicons name="shuffle" size={24} color="#fff" />
                <Text style={styles.spinButtonText}>Spin!</Text>
              </Pressable>
            )}

            {isSpinning && (
              <View style={styles.spinningIndicator}>
                <Ionicons name="refresh" size={24} color="#FF6B6B" />
                <Text style={styles.spinningText}>Spinning...</Text>
              </View>
            )}

            {winner && (
              <View style={styles.winnerActions}>
                <Pressable style={styles.tryAgainButton} onPress={handleTryAgain}>
                  <Ionicons name="refresh" size={20} color="#666" />
                  <Text style={styles.tryAgainButtonText}>Try Again</Text>
                </Pressable>

                <Pressable style={styles.letsGoButton} onPress={handleLetsGo}>
                  <Text style={styles.letsGoButtonText}>Let's Go!</Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: SCREEN_WIDTH * 0.9,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 24,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  cardContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  trophyBadge: {
    position: 'absolute',
    top: -12,
    right: -12,
    backgroundColor: '#fff',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  cardImage: {
    width: '100%',
    height: 120,
  },
  placeholderImage: {
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {
    padding: 16,
  },
  cardName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  cardDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardRating: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginLeft: 4,
  },
  cardSeparator: {
    marginHorizontal: 8,
    color: '#ccc',
  },
  cardPrice: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  cardCuisine: {
    fontSize: 14,
    color: '#666',
  },
  actions: {
    width: '100%',
  },
  spinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B6B',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  spinButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  spinningIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  spinningText: {
    fontSize: 16,
    color: '#FF6B6B',
    fontWeight: '500',
  },
  winnerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  tryAgainButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  tryAgainButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  letsGoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  letsGoButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
