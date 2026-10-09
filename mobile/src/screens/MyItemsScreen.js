import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  Alert,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import api from '../api/api';
import { theme } from '../theme';
import { Card, Badge, EmptyState } from '../components';

const MyItemsScreen = () => {
  const navigation = useNavigation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState('');

  const fetchMyItems = async () => {
    setLoadError('');
    try {
      const response = await api.get('/items/mine');
      setItems(response.data.items || []);
    } catch (error) {
      console.error('Error fetching my items:', error);
      setLoadError(error.response?.data?.message || 'Failed to load your items. Check your connection and try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchMyItems();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchMyItems();
  };

  const handleToggleStatus = async (id, currentStatus) => {
    if (currentStatus === 'lent') return;
    try {
      await api.put(`/items/${id}/toggle`);
      fetchMyItems();
    } catch (error) {
      console.error('Error toggling status:', error);
      Alert.alert('Error', 'Failed to update item status.');
    }
  };

  const handleDelete = (id) => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/items/${id}`);
              setItems(items.filter(item => item._id !== id));
            } catch (error) {
              console.error('Error deleting item:', error);
              Alert.alert('Error', 'Failed to delete item.');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }) => {
    const isAvailable = item.status === 'available';
    const isLent = item.status === 'lent';
    const statusLabel = isAvailable ? 'AVAILABLE' : isLent ? 'LENT OUT' : 'HIDDEN';
    const listingContext = isAvailable
      ? 'LISTED IN BROWSE'
      : isLent
        ? 'WITH A BORROWER'
        : 'HIDDEN FROM BROWSE';
    const categoryTone = {
      books: '#85bdd1',
      electronics: '#85bdd1',
      sports: theme.colors.noticeRed,
      kitchen: theme.colors.accent,
      stationery: '#c0a878',
    }[item.category?.toLowerCase()] || theme.colors.secondary;

    return (
      <Card style={styles.itemCard}>
        <View style={styles.cardHeader}>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.listingLabel}>{listingContext}</Text>
            <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
            <View style={[styles.categoryStamp, { borderColor: categoryTone }]}>
              <Text style={[styles.itemCategory, { color: categoryTone }]}>{item.category?.toUpperCase()}</Text>
            </View>
          </View>
          <Badge 
            label={statusLabel}
            color={isAvailable ? theme.colors.success : (isLent ? theme.colors.accent : theme.colors.textSecondary)}
          />
        </View>
        <View style={[styles.imageFrame, { backgroundColor: `${categoryTone}18` }]}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.itemImage} resizeMode="cover" />
          ) : (
            <View style={styles.imageFallback}>
              <Ionicons name="cube-outline" size={32} color={categoryTone} />
              <Text style={[styles.imageFallbackText, { color: categoryTone }]}>{item.category || 'Shared item'}</Text>
            </View>
          )}
        </View>

        <View style={styles.financialRow}>
          <Text style={styles.financialText}>
            Deposit: <Text style={styles.financialValue}>₹{item.depositAmount}</Text>
          </Text>
          <Text style={styles.financialDivider}>•</Text>
          <Text style={styles.financialText}>
            Fine: <Text style={styles.financialValue}>₹{item.finePerDay}/day</Text>
          </Text>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity 
            style={[
              styles.actionButton, 
              styles.toggleButton,
              isLent && styles.disabledButton
            ]}
            onPress={() => handleToggleStatus(item._id, item.status)}
            disabled={isLent}
          >
            <Ionicons 
              name={isAvailable ? 'eye-off-outline' : 'eye-outline'}
              size={18} 
              color={isLent ? theme.colors.textSecondary : theme.colors.primary} 
            />
            <Text style={[
              styles.actionText, 
              styles.toggleText,
              isLent && styles.disabledText
            ]}>
              {isAvailable ? 'Unlist' : 'List Item'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDelete(item._id)}
          >
            <Ionicons name="trash-outline" size={18} color={theme.colors.error} />
            <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerEyebrow}>YOUR NOTICEBOARD</Text>
          <Text style={styles.headerTitle}>My items</Text>
        </View>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('AddItem')}
          accessibilityRole="button"
          accessibilityLabel="Add an item"
        >
          <Ionicons name="add" size={24} color={theme.colors.surface} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            <View style={styles.inventoryStrip}>
              <View style={styles.inventoryCell}>
                <Text style={styles.inventoryValue}>{items.length}</Text>
                <Text style={styles.inventoryLabel}>TOTAL</Text>
              </View>
              <View style={styles.inventoryRule} />
              <View style={styles.inventoryCell}>
                <Text style={styles.inventoryValue}>{items.filter((item) => item.status === 'available').length}</Text>
                <Text style={styles.inventoryLabel}>AVAILABLE</Text>
              </View>
              <View style={styles.inventoryRule} />
              <View style={styles.inventoryCell}>
                <Text style={styles.inventoryValue}>{items.filter((item) => item.status === 'lent').length}</Text>
                <Text style={styles.inventoryLabel}>LENT OUT</Text>
              </View>
              <View style={styles.inventoryRule} />
              <View style={styles.inventoryCell}>
                <Text style={styles.inventoryValue}>{items.filter((item) => item.status === 'unavailable').length}</Text>
                <Text style={styles.inventoryLabel}>HIDDEN</Text>
              </View>
            </View>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.secondary} />
                <Text style={styles.loadingText}>Loading your items...</Text>
              </View>
            ) : null}
            {loadError ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{loadError}</Text>
                <TouchableOpacity onPress={fetchMyItems} style={styles.retryButton}>
                  <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
          />
        }
        ListEmptyComponent={
          !loading && !loadError ? (
            <EmptyState
              title="No items listed yet"
              subtitle="Add your first item to start sharing with the community."
              icon="cube-outline"
              actionTitle="Add item"
              onAction={() => navigation.navigate('AddItem')}
            />
          ) : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerEyebrow: {
    color: theme.colors.noticeRed,
    fontSize: 10,
    fontWeight: theme.typography.weights.bold,
    letterSpacing: 1.4,
    marginBottom: 3,
  },
  headerTitle: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
  },
  addButton: {
    backgroundColor: theme.colors.noticeRed,
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.card,
  },
  listContent: {
    padding: theme.spacing.md,
    flexGrow: 1,
  },
  inventoryStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceRaised,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderBottomWidth: 3,
    borderBottomColor: theme.colors.paperShade,
  },
  inventoryCell: {
    flex: 1,
    alignItems: 'center',
  },
  inventoryValue: {
    color: theme.colors.primary,
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
  },
  inventoryLabel: {
    color: theme.colors.textSecondary,
    fontSize: 8,
    fontWeight: theme.typography.weights.bold,
    letterSpacing: 0.4,
    marginTop: 2,
  },
  inventoryRule: {
    width: 1,
    height: 28,
    backgroundColor: theme.colors.border,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl * 2,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.sm,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#33221e',
    borderWidth: 1,
    borderColor: '#69443a',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  errorText: {
    color: theme.colors.error,
    flex: 1,
    marginRight: theme.spacing.sm,
    fontSize: theme.typography.sizes.sm,
  },
  retryButton: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
  },
  retryText: {
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.bold,
  },
  itemCard: {
    marginBottom: theme.spacing.md,
  },
  imageFrame: {
    width: '100%',
    height: 160,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  imageFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageFallbackText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: theme.spacing.xs,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  headerTitleContainer: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  itemName: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text,
    marginBottom: 2,
  },
  listingLabel: {
    color: theme.colors.inkMuted,
    fontSize: 9,
    fontWeight: theme.typography.weights.bold,
    letterSpacing: 1.1,
    marginBottom: 3,
  },
  categoryStamp: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
    marginTop: 3,
    transform: [{ rotate: '-1deg' }],
  },
  itemCategory: {
    fontSize: 9,
    fontWeight: theme.typography.weights.medium,
    letterSpacing: 0.7,
  },
  financialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.md,
  },
  financialText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
  },
  financialValue: {
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
  },
  financialDivider: {
    marginHorizontal: theme.spacing.sm,
    color: theme.colors.border,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.sm,
    gap: theme.spacing.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
  },
  toggleButton: {
    backgroundColor: theme.colors.primary + '10',
  },
  deleteButton: {
    backgroundColor: theme.colors.error + '10',
  },
  disabledButton: {
    backgroundColor: theme.colors.background,
    opacity: 0.6,
  },
  actionText: {
    marginLeft: 6,
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
  },
  toggleText: {
    color: theme.colors.primary,
  },
  deleteText: {
    color: theme.colors.error,
  },
  disabledText: {
    color: theme.colors.textSecondary,
  },
});

export default MyItemsScreen;
