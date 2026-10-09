import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Image,
  SafeAreaView,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import Badge from '../components/Badge';
import LoadingScreen from '../components/LoadingScreen';
import { theme } from '../theme';

const DashboardScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    itemsListed: 0,
    activeBorrows: 0,
    pendingRequests: 0,
    unreadAlerts: 0,
  });
  const [recentItems, setRecentItems] = useState([]);

  const fetchData = async () => {
    try {
      const [
        itemsRes,
        borrowsRes,
        pendingRes,
        notificationsRes,
        recentRes,
      ] = await Promise.all([
        api.get('/items/mine'),
        api.get('/borrows/mine'),
        api.get('/borrows/incoming'),
        api.get('/notifications/unread-count'),
        api.get('/items?sort=-createdAt&limit=5'),
      ]);

      setStats({
        itemsListed: itemsRes.data.count,
        activeBorrows: borrowsRes.data.borrows.filter(b => b.status === 'active').length,
        pendingRequests: pendingRes.data.count,
        unreadAlerts: notificationsRes.data.count || 0,
      });

      setRecentItems(recentRes.data.items || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      Alert.alert('Error', 'Could not load your dashboard. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  const renderStatCard = (title, value, icon, color) => (
    <View style={styles.statCard}>
      <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );

  const renderActionBtn = (title, icon, screen) => (
    <TouchableOpacity
      style={styles.actionBtn}
      onPress={() => navigation.navigate(screen)}
      activeOpacity={0.7}
    >
      <View style={styles.actionIconContainer}>
        <Ionicons name={icon} size={28} color={theme.colors.secondary} />
      </View>
      <Text style={styles.actionText}>{title}</Text>
    </TouchableOpacity>
  );

  const renderRecentItem = ({ item }) => {
    const categoryColors = {
      electronics: '#3b82f6',
      books: theme.colors.success,
      sports: theme.colors.accent,
      kitchen: theme.colors.error,
      others: '#8b5cf6',
    };
    const placeholderColor = categoryColors[item.category?.toLowerCase()] || theme.colors.textSecondary;

    return (
      <TouchableOpacity
        style={styles.recentItemCard}
        onPress={() => navigation.navigate('ItemDetail', { itemId: item._id })}
        activeOpacity={0.9}
      >
        <View style={[styles.recentItemImage, { backgroundColor: placeholderColor }]}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          ) : (
            <Ionicons name="cube-outline" size={40} color="#fff" />
          )}
        </View>
        <View style={styles.recentItemInfo}>
          <Text style={styles.recentItemName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.recentItemCategory}>{item.category}</Text>
          <Text style={styles.recentItemDeposit}>₹{item.depositAmount || 0}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.secondary]} />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {user?.name || 'User'}!</Text>
            <Text style={styles.subGreeting}>Welcome back to BorrowBack</Text>
          </View>
          <TouchableOpacity
            style={styles.notificationBtn}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Ionicons name="notifications-outline" size={26} color={theme.colors.primary} />
            {stats.unreadAlerts > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{stats.unreadAlerts > 9 ? '9+' : stats.unreadAlerts}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statsGrid}>
            {renderStatCard('Items Listed', stats.itemsListed, 'list-circle-outline', '#3b82f6')}
            {renderStatCard('Active Borrows', stats.activeBorrows, 'swap-horizontal-outline', theme.colors.success)}
            {renderStatCard('Pending', stats.pendingRequests, 'time-outline', theme.colors.accent)}
            {renderStatCard('Alerts', stats.unreadAlerts, 'alert-circle-outline', theme.colors.error)}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.actionsScroll}>
            {renderActionBtn('Browse', 'search-outline', 'Browse')}
            {renderActionBtn('Add Item', 'add-circle-outline', 'MyItems')}
            {renderActionBtn('Loans', 'cash-outline', 'MoneyLoans')}
            {renderActionBtn('Financials', 'wallet-outline', 'Fines')}
            <View style={{ width: 16 }} />
          </ScrollView>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Recently Added</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Browse')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          {recentItems.length > 0 ? (
            <FlatList
              data={recentItems}
              renderItem={renderRecentItem}
              keyExtractor={(item) => item._id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingLeft: 20, paddingRight: 4, paddingBottom: 20 }}
            />
          ) : (
            <View style={styles.emptyRecent}>
              <Text style={styles.emptyRecentText}>No recent items found.</Text>
            </View>
          )}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  greeting: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
    marginBottom: 4,
  },
  subGreeting: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
  },
  notificationBtn: {
    padding: 8,
    borderRadius: 50,
    backgroundColor: '#f1f5f9',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#e11d48',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: theme.colors.surface,
  },
  badgeText: {
    color: theme.colors.surface,
    fontSize: 10,
    fontWeight: theme.typography.weights.bold,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.primary,
    marginLeft: 20,
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 20,
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.secondary,
    fontWeight: theme.typography.weights.semibold,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  statCard: {
    width: '47%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: 16,
    marginBottom: 16,
    ...theme.shadows.card,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.weights.medium,
  },
  actionsScroll: {
    paddingLeft: 20,
  },
  actionBtn: {
    alignItems: 'center',
    marginRight: 24,
    width: 72,
  },
  actionIconContainer: {
    width: 60,
    height: 60,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    ...theme.shadows.card,
  },
  actionText: {
    fontSize: 12,
    color: theme.colors.text,
    fontWeight: theme.typography.weights.medium,
    textAlign: 'center',
  },
  recentItemCard: {
    width: 160,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    marginRight: 16,
    overflow: 'hidden',
    ...theme.shadows.card,
  },
  recentItemImage: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recentItemInfo: {
    padding: 12,
  },
  recentItemName: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.primary,
    marginBottom: 4,
  },
  recentItemCategory: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 6,
  },
  recentItemDeposit: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.secondary,
  },
  emptyRecent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  emptyRecentText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.sm,
  }
});

export default DashboardScreen;
