import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Image,
  Pressable,
  SafeAreaView,
  Linking,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSession } from '../../hooks/useSession';
import { Restaurant } from '../../types';
import { formatPrice, getCuisineText, formatDistance } from '../../lib/restaurants';
import RandomPicker from '../../components/RandomPicker';

export default function MatchesScreen() {
  const router = useRouter();
  // Get session ID from previous route if available
  const params = useLocalSearchParams();
  const { matches } = useSession(params.id as string | undefined);
  const [showPicker, setShowPicker] = useState(false);

  const openUrl = (url: string) => {
    Linking.openURL(url);
  };

  const handlePickerSelect = (restaurant: Restaurant) => {
    openUrl(restaurant.url);
  };

  const renderRestaurant = ({ item }: { item: Restaurant }) => (
    <Pressable style={styles.card} onPress={() => openUrl(item.url)}>
      {item.image_url ? (
        <Image
          source={{ uri: item.image_url }}
          style={styles.image}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.image, styles.placeholderImage]}>
          <Ionicons name="restaurant" size={32} color="#ccc" />
        </View>
      )}

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>

        <View style={styles.ratingRow}>
          <Ionicons name="star" size={14} color="#FFD700" />
          <Text style={styles.rating}>{item.rating.toFixed(1)}</Text>
          <Text style={styles.reviewCount}>({item.review_count})</Text>
          <Text style={styles.separator}>•</Text>
          <Text style={styles.price}>{formatPrice(item.price)}</Text>
        </View>

        <Text style={styles.cuisine} numberOfLines={1}>
          {getCuisineText(item)}
        </Text>

        <Text style={styles.address} numberOfLines={1}>
          {item.location.display_address.join(', ')}
        </Text>

        {/* Transaction badges */}
        {item.transactions && item.transactions.length > 0 && (
          <View style={styles.badgesRow}>
            {item.transactions.includes('delivery') && (
              <View style={styles.badge}>
                <Ionicons name="bicycle" size={10} color="#4CAF50" />
                <Text style={styles.badgeText}>Delivery</Text>
              </View>
            )}
            {item.transactions.includes('pickup') && (
              <View style={styles.badge}>
                <Ionicons name="bag-handle" size={10} color="#2196F3" />
                <Text style={styles.badgeText}>Pickup</Text>
              </View>
            )}
          </View>
        )}
      </View>

      <View style={styles.chevron}>
        <Ionicons name="chevron-forward" size={20} color="#ccc" />
      </View>
    </Pressable>
  );

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="heart-outline" size={80} color="#ddd" />
      <Text style={styles.emptyTitle}>No Matches Yet</Text>
      <Text style={styles.emptyMessage}>
        Keep swiping to find restaurants you both like!
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </Pressable>
        <Text style={styles.headerTitle}>Your Matches</Text>
        <View style={styles.matchCount}>
          <Text style={styles.matchCountText}>{matches.length}</Text>
        </View>
      </View>

      {/* Pick for us button - show only if 2+ matches */}
      {matches.length >= 2 && (
        <Pressable style={styles.pickButton} onPress={() => setShowPicker(true)}>
          <Ionicons name="shuffle" size={20} color="#fff" />
          <Text style={styles.pickButtonText}>Can't decide? Pick for us!</Text>
        </Pressable>
      )}

      <FlatList
        data={matches}
        renderItem={renderRestaurant}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.list,
          matches.length === 0 && styles.emptyList,
        ]}
        ListEmptyComponent={EmptyState}
        showsVerticalScrollIndicator={false}
      />

      {/* Random Picker Modal */}
      <RandomPicker
        visible={showPicker}
        matches={matches}
        onClose={() => setShowPicker(false)}
        onSelect={handlePickerSelect}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  matchCount: {
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  matchCountText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  pickButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B6B',
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  pickButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  list: {
    padding: 16,
  },
  emptyList: {
    flex: 1,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  image: {
    width: 100,
    height: 100,
  },
  placeholderImage: {
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  name: {
    fontSize: 16,
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
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 4,
    color: '#333',
  },
  reviewCount: {
    fontSize: 12,
    color: '#666',
    marginLeft: 2,
  },
  separator: {
    marginHorizontal: 6,
    color: '#ccc',
  },
  price: {
    fontSize: 13,
    color: '#4CAF50',
    fontWeight: '600',
  },
  cuisine: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  address: {
    fontSize: 11,
    color: '#999',
    marginBottom: 6,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    color: '#666',
    marginLeft: 2,
  },
  chevron: {
    justifyContent: 'center',
    paddingRight: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
