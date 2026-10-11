import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import Text from '../components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import api from '../api/api';
import { theme } from '../theme';
import EmptyState from '../components/EmptyState';
import LoadingScreen from '../components/LoadingScreen';
import Button from '../components/Button';

const getNotificationIcon = (type) => {
  switch (type) {
    case 'request': return { name: 'hand-left-outline', color: theme.colors.accent };
    case 'approval': return { name: 'checkmark-circle-outline', color: theme.colors.success };
    case 'rejection': return { name: 'close-circle-outline', color: theme.colors.error };
    case 'reminder': return { name: 'time-outline', color: theme.colors.primary };
    case 'overdue': return { name: 'alert-circle-outline', color: theme.colors.error };
    case 'fine': return { name: 'cash-outline', color: theme.colors.error };
    case 'return': return { name: 'return-down-back-outline', color: theme.colors.secondary };
    case 'rating': return { name: 'star-outline', color: theme.colors.accent };
    default: return { name: 'notifications-outline', color: theme.colors.textSecondary };
  }
};

const formatTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays}d ago`;
  return date.toLocaleDateString();
};

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');

  const unreadCount = notifications.filter((notification) => notification.status === 'unread').length;
  const visibleNotifications = filter === 'unread'
    ? notifications.filter((notification) => notification.status === 'unread')
    : notifications;

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data.notifications || []);
    } catch (error) {
      console.error('Failed to fetch notifications', error);
      Alert.alert('Error', error.response?.data?.message || 'Could not load notifications. Pull down to try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [fetchNotifications])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications();
  }, []);

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => 
        prev.map(notif => notif._id === id ? { ...notif, status: 'read' } : notif)
      );
    } catch (error) {
      console.error('Failed to mark notification as read', error);
      Alert.alert('Error', error.response?.data?.message || 'Could not mark notification as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(notif => ({ ...notif, status: 'read' })));
    } catch (error) {
      console.error('Failed to mark all as read', error);
      Alert.alert('Error', 'Could not mark all notifications as read');
    }
  };

  const renderItem = ({ item }) => {
    const iconStyle = getNotificationIcon(item.type);
    const isUnread = item.status === 'unread';
    
    return (
      <TouchableOpacity 
        style={[styles.notificationCard, isUnread && styles.unreadCard]}
        onPress={() => {
          if (isUnread) markAsRead(item._id);
        }}
        activeOpacity={0.8}
      >
        <View style={[styles.iconContainer, { backgroundColor: `${iconStyle.color}15` }]}>
          <Ionicons name={iconStyle.name} size={24} color={iconStyle.color} />
        </View>
        <View style={styles.contentContainer}>
          <Text style={[styles.message, isUnread && styles.unreadMessage]}>
            {item.message}
          </Text>
          <Text style={styles.timeAgo}>{formatTimeAgo(item.createdAt)}</Text>
        </View>
        {isUnread && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return <LoadingScreen message="Loading notifications..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.filterBar}>
          <TouchableOpacity
            style={[styles.filterTab, filter === 'all' && styles.activeFilterTab]}
            onPress={() => setFilter('all')}
            accessibilityRole="button"
            accessibilityState={{ selected: filter === 'all' }}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.activeFilterText]}>
              All
            </Text>
            <Text style={styles.filterCount}>{notifications.length}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, filter === 'unread' && styles.activeFilterTab]}
            onPress={() => setFilter('unread')}
            accessibilityRole="button"
            accessibilityState={{ selected: filter === 'unread' }}
          >
            <Text style={[styles.filterText, filter === 'unread' && styles.activeFilterText]}>
              Unread
            </Text>
            <Text style={styles.filterCount}>{unreadCount}</Text>
          </TouchableOpacity>
        </View>
        <Button 
          title="Mark All Read" 
          onPress={markAllAsRead} 
          style={styles.markAllBtn}
          textStyle={styles.markAllText}
          disabled={unreadCount === 0}
        />
      </View>
      <FlatList
        data={visibleNotifications}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.secondary]} />
        }
        ListEmptyComponent={
          <EmptyState 
            icon="notifications-off-outline" 
            title="No notifications yet" 
            message="You're all caught up! When something happens, you'll see it here." 
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  filterBar: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    alignSelf: 'stretch',
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeFilterTab: {
    borderBottomColor: theme.colors.secondary,
  },
  filterText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
  },
  activeFilterText: {
    color: theme.colors.text,
  },
  filterCount: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.xs,
  },
  markAllBtn: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: `${theme.colors.secondary}15`,
    borderRadius: theme.borderRadius.full,
  },
  markAllText: {
    color: theme.colors.secondary,
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
  },
  listContainer: {
    padding: theme.spacing.sm,
    flexGrow: 1,
  },
  notificationCard: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    backgroundColor: 'transparent',
    borderRadius: 0,
    marginBottom: theme.spacing.sm,
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  unreadCard: {
    backgroundColor: `${theme.colors.secondary}05`,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.secondary,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  contentContainer: {
    flex: 1,
  },
  message: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text,
    lineHeight: 20,
    marginBottom: 4,
  },
  unreadMessage: {
    fontWeight: theme.typography.weights.semibold,
  },
  timeAgo: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.secondary,
    marginLeft: theme.spacing.sm,
  },
});
