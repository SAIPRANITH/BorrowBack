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

    return (
      <Card style={styles.itemCard}>
        <View style={styles.cardHeader}>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.itemCategory}>{item.category?.toUpperCase()}</Text>
          </View>
          <Badge 
            label={item.status.toUpperCase()} 
            color={isAvailable ? theme.colors.success : (isLent ? theme.colors.accent : theme.colors.error)} 
          />
        </View>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.itemImage} resizeMode="cover" />
        ) : null}

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
              name={isAvailable ? "eye-off-outline" : "eye-outline"} 
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
        <Text style={styles.headerTitle}>My Items</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('AddItem')}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
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
  headerTitle: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
  },
  addButton: {
    backgroundColor: theme.colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.card,
  },
  listContent: {
    padding: theme.spacing.md,
    flexGrow: 1,
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
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
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
  itemImage: {
    width: '100%',
    height: 160,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
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
  itemCategory: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.weights.medium,
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
