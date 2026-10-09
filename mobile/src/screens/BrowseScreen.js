import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  FlatList,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  SafeAreaView,
  ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/api';
import EmptyState from '../components/EmptyState';
import { theme } from '../theme';

const CATEGORIES = [
  'All',
  'Electronics',
  'Books',
  'Sports',
  'Kitchen',
  'Stationery',
  'Clothing',
  'Tools',
  'Others',
];

const categoryColors = {
  electronics: '#557c91',
  books: theme.colors.success,
  sports: theme.colors.accent,
  kitchen: theme.colors.error,
  stationery: '#87704f',
  clothing: '#aa665b',
  tools: '#747568',
  others: '#a49b85',
};

const categoryIcons = {
  All: 'sparkles-outline',
  Electronics: 'phone-portrait-outline',
  Books: 'book-outline',
  Sports: 'american-football-outline',
  Kitchen: 'restaurant-outline',
  Stationery: 'pencil-outline',
  Clothing: 'shirt-outline',
  Tools: 'hammer-outline',
  Others: 'grid-outline',
};

const BrowseScreen = () => {
  const navigation = useNavigation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  const fetchItems = async () => {
    try {
      let url = `/items?`;
      if (debouncedSearch) {
        url += `search=${encodeURIComponent(debouncedSearch)}&`;
      }
      if (selectedCategory !== 'All') {
        url += `category=${encodeURIComponent(selectedCategory.toLowerCase())}`;
      }

      const response = await api.get(url);
      setItems(response.data.items || []);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchItems();
  }, [debouncedSearch, selectedCategory]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchItems();
    setRefreshing(false);
  }, [debouncedSearch, selectedCategory]);

  const renderCategoryChip = (category) => {
    const isSelected = selectedCategory === category;
    return (
      <TouchableOpacity
        key={category}
        style={[styles.chip, isSelected && styles.chipSelected]}
        onPress={() => setSelectedCategory(category)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected }}
      >
        <Ionicons
          name={categoryIcons[category]}
          size={15}
          color={isSelected ? theme.colors.surface : theme.colors.textSecondary}
        />
        <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
          {category}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderItem = ({ item }) => {
    const placeholderColor = categoryColors[item.category?.toLowerCase()] || categoryColors.others;
    const isAvailable = item.status === 'available';

    return (
      <TouchableOpacity
        style={styles.itemCard}
        onPress={() => navigation.navigate('ItemDetail', { itemId: item._id })}
        activeOpacity={0.9}
        accessibilityRole="button"
        accessibilityLabel={`${item.name}, ${isAvailable ? 'available' : 'lent'}, security deposit ₹${item.depositAmount || 0}`}
      >
        <View style={[styles.itemImage, { backgroundColor: placeholderColor }]}>
          <Ionicons name="image-outline" size={32} color="#ffffff80" />
          {item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
          ) : null}
          <View style={[styles.statusBadge, { backgroundColor: isAvailable ? theme.colors.success : theme.colors.error }]}>
            <Text style={styles.statusText}>{isAvailable ? 'Available' : 'Lent'}</Text>
          </View>
        </View>
        
        <View style={styles.itemContent}>
          <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
          
          <View style={styles.categoryRow}>
            <View style={[styles.categoryBadge, { backgroundColor: placeholderColor + '20' }]}>
              <Text style={[styles.categoryBadgeText, { color: placeholderColor }]}>{item.category}</Text>
            </View>
          </View>

          <View style={styles.itemFooter}>
              <View>
                <Text style={styles.depositLabel}>SECURITY DEPOSIT</Text>
                <Text style={styles.itemDeposit}>₹{item.depositAmount || 0}</Text>
              </View>
            <View style={styles.ownerRow}>
              <Ionicons name="person-circle-outline" size={14} color={theme.colors.textSecondary} />
              <Text style={styles.ownerName} numberOfLines={1}>
                {item.owner?.name ? item.owner.name.split(' ')[0] : 'User'}
              </Text>
              <Ionicons name="star" size={12} color={theme.colors.accent} style={{ marginLeft: 4 }} />
              <Text style={styles.ratingText}>{item.owner?.averageRating?.toFixed(1) || 'NEW'}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerIntro}>
            <View>
              <Text style={styles.headerEyebrow}>THE CAMPUS EXCHANGE</Text>
              <Text style={styles.headerTitle}>Find something useful.</Text>
            </View>
            <View style={styles.resultPill}>
              <Ionicons name="cube-outline" size={14} color={theme.colors.secondary} />
              <Text style={styles.resultText}>{items.length} items</Text>
            </View>
          </View>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={theme.colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search items to borrow..."
              placeholderTextColor={theme.colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
              returnKeyType="search"
              accessibilityLabel="Search items to borrow"
            />
            {searchQuery ? (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                accessibilityRole="button"
                accessibilityLabel="Clear search"
                hitSlop={8}
              >
                <Ionicons name="close-circle" size={19} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        <View style={styles.categoriesWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContent}
          >
            {CATEGORIES.map(renderCategoryChip)}
          </ScrollView>
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={theme.colors.secondary} />
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item._id}
            renderItem={renderItem}
            numColumns={2}
            contentContainerStyle={styles.listContent}
            columnWrapperStyle={styles.columnWrapper}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.secondary]} />
            }
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={64} color={theme.colors.border} style={{ marginBottom: 16 }} />
                <Text style={styles.emptyTitle}>No items found</Text>
                <Text style={styles.emptySubtitle}>Try adjusting your search or category filters.</Text>
              </View>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.lg,
    paddingBottom: 12,
  },
  headerIntro: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  headerEyebrow: {
    color: theme.colors.secondary,
    fontSize: 10,
    fontWeight: theme.typography.weights.bold,
    letterSpacing: 1.2,
    marginBottom: 5,
  },
  headerTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
  },
  resultPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#39775514',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 7,
    borderRadius: theme.borderRadius.full,
    gap: 5,
  },
  resultText: {
    color: theme.colors.secondary,
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.bold,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.paperShade,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchIcon: {
    marginRight: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: theme.typography.sizes.md,
    color: theme.colors.primary,
  },
  categoriesWrapper: {
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingBottom: 12,
  },
  categoriesContent: {
    paddingHorizontal: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: theme.spacing.sm,
  },
  chipSelected: {
    backgroundColor: theme.colors.secondary,
    borderColor: theme.colors.secondary,
  },
  chipText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.weights.medium,
  },
  chipTextSelected: {
    color: theme.colors.surface,
    fontWeight: theme.typography.weights.semibold,
  },
  listContent: {
    padding: theme.spacing.md,
    flexGrow: 1,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  itemCard: {
    width: '48%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.card,
  },
  itemImage: {
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  statusBadge: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },
  statusText: {
    color: theme.colors.surface,
    fontSize: 10,
    fontWeight: theme.typography.weights.bold,
    textTransform: 'uppercase',
  },
  itemContent: {
    padding: 12,
  },
  itemName: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  categoryRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  categoryBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: theme.typography.weights.semibold,
    textTransform: 'uppercase',
  },
  itemFooter: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemDeposit: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.secondary,
  },
  depositLabel: {
    color: theme.colors.textSecondary,
    fontSize: 8,
    fontWeight: theme.typography.weights.bold,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  ownerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '55%',
  },
  ownerName: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    marginLeft: 4,
    flexShrink: 1,
  },
  ratingText: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.weights.semibold,
    marginLeft: 2,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  emptySubtitle: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 32,
  }
});

export default BrowseScreen;
