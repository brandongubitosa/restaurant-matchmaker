import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Modal,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SessionFilters, CUISINE_OPTIONS, PRICE_OPTIONS, TransactionFilter } from '../types';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface FilterModalProps {
  visible: boolean;
  initialFilters?: SessionFilters;
  onClose: () => void;
  onApply: (filters: SessionFilters) => Promise<void>;
  isLoading?: boolean;
}

const defaultFilters: SessionFilters = {
  cuisines: [],
  priceRange: [],
  transactionType: 'any',
};

const TRANSACTION_OPTIONS: { value: TransactionFilter; label: string; icon: string }[] = [
  { value: 'any', label: 'Any', icon: 'restaurant' },
  { value: 'delivery', label: 'Delivery', icon: 'bicycle' },
  { value: 'pickup', label: 'Pickup', icon: 'bag-handle' },
];

export default function FilterModal({
  visible,
  initialFilters = defaultFilters,
  onClose,
  onApply,
  isLoading = false,
}: FilterModalProps) {
  const [filters, setFilters] = useState<SessionFilters>(initialFilters);

  const toggleCuisine = (alias: string) => {
    setFilters((prev) => ({
      ...prev,
      cuisines: prev.cuisines.includes(alias)
        ? prev.cuisines.filter((c) => c !== alias)
        : [...prev.cuisines, alias],
    }));
  };

  const togglePrice = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      priceRange: prev.priceRange.includes(value)
        ? prev.priceRange.filter((p) => p !== value)
        : [...prev.priceRange, value],
    }));
  };

  const handleApply = async () => {
    await onApply(filters);
    // Don't close here - parent will close on success
  };

  const handleReset = () => {
    setFilters(defaultFilters);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#333" />
          </Pressable>
          <Text style={styles.title}>Filters</Text>
          <Pressable onPress={handleReset} style={styles.resetButton}>
            <Text style={styles.resetText}>Reset</Text>
          </Pressable>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Order Type */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Order Type</Text>
            <Text style={styles.sectionSubtitle}>
              How do you want to get your food?
            </Text>
            <View style={styles.transactionRow}>
              {TRANSACTION_OPTIONS.map((option) => (
                <Pressable
                  key={option.value}
                  style={[
                    styles.transactionButton,
                    filters.transactionType === option.value &&
                      styles.transactionButtonActive,
                  ]}
                  onPress={() =>
                    setFilters((prev) => ({ ...prev, transactionType: option.value }))
                  }
                >
                  <Ionicons
                    name={option.icon as any}
                    size={20}
                    color={filters.transactionType === option.value ? '#fff' : '#666'}
                  />
                  <Text
                    style={[
                      styles.transactionButtonText,
                      filters.transactionType === option.value &&
                        styles.transactionButtonTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Price Range */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Price Range</Text>
            <Text style={styles.sectionSubtitle}>
              Select one or more price levels
            </Text>
            <View style={styles.priceRow}>
              {PRICE_OPTIONS.map((option) => (
                <Pressable
                  key={option.value}
                  style={[
                    styles.priceButton,
                    filters.priceRange.includes(option.value) &&
                      styles.priceButtonActive,
                  ]}
                  onPress={() => togglePrice(option.value)}
                >
                  <Text
                    style={[
                      styles.priceButtonText,
                      filters.priceRange.includes(option.value) &&
                        styles.priceButtonTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Cuisines */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cuisines</Text>
            <Text style={styles.sectionSubtitle}>
              Leave empty to show all cuisines
            </Text>
            <View style={styles.cuisineGrid}>
              {CUISINE_OPTIONS.map((cuisine) => (
                <Pressable
                  key={cuisine.alias}
                  style={[
                    styles.cuisineChip,
                    filters.cuisines.includes(cuisine.alias) &&
                      styles.cuisineChipActive,
                  ]}
                  onPress={() => toggleCuisine(cuisine.alias)}
                >
                  <Text
                    style={[
                      styles.cuisineChipText,
                      filters.cuisines.includes(cuisine.alias) &&
                        styles.cuisineChipTextActive,
                    ]}
                  >
                    {cuisine.title}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Bottom padding for scroll */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Apply Button */}
        <View style={styles.footer}>
          <Pressable
            style={[styles.applyButton, isLoading && styles.applyButtonDisabled]}
            onPress={handleApply}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.applyButtonText}>Finding restaurants...</Text>
              </>
            ) : (
              <>
                <Text style={styles.applyButtonText}>Start Swiping</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  resetButton: {
    padding: 4,
  },
  resetText: {
    fontSize: 16,
    color: '#FF6B6B',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  transactionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  transactionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    gap: 6,
  },
  transactionButtonActive: {
    backgroundColor: '#FF6B6B',
  },
  transactionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  transactionButtonTextActive: {
    color: '#fff',
  },
  priceRow: {
    flexDirection: 'row',
    gap: 12,
  },
  priceButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  priceButtonActive: {
    backgroundColor: '#FF6B6B',
  },
  priceButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
  },
  priceButtonTextActive: {
    color: '#fff',
  },
  cuisineGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  cuisineChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  cuisineChipActive: {
    backgroundColor: '#FF6B6B',
  },
  cuisineChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  cuisineChipTextActive: {
    color: '#fff',
  },
  footer: {
    padding: 20,
    paddingBottom: 36,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#FF6B6B',
    gap: 8,
  },
  applyButtonDisabled: {
    opacity: 0.7,
  },
  applyButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
});
