import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Image,
  ImageBackground,
  SafeAreaView,
  Alert
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import Badge from '../components/Badge';
import LoadingScreen from '../components/LoadingScreen';
import { theme } from '../theme';
import Text from '../components/ThemedText';

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

  const fetchData = useCallback(async () => {
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
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

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

  const renderActionBtn = (title, icon, screen, params) => (
    <TouchableOpacity
      style={styles.actionBtn}
      onPress={() => navigation.navigate(screen, params)}
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
      electronics: theme.colors.secondary,
      books: theme.colors.success,
      sports: theme.colors.accent,
      kitchen: theme.colors.error,
      others: '#7e7257',
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
      <ImageBackground
        source={require('../../assets/bg-dashboard.jpg')}
        imageStyle={styles.ambientImage}
        style={styles.ambientBackground}
      >
        <LinearGradient
          colors={['rgba(5,5,5,0.42)', 'rgba(8,8,8,0.74)', 'rgba(8,8,8,0.91)']}
          locations={[0, 0.48, 1]}
          style={styles.ambientOverlay}
        />
        <View pointerEvents="none" style={styles.ambientGrid}>
          <View style={styles.ambientGridLine} />
          <View style={styles.ambientGridLine} />
          <View style={styles.ambientGridLine} />
        </View>
        <ScrollView
          style={styles.container}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.secondary]} />}
        >
        <ImageBackground
          source={require('../../assets/bg-dashboard.jpg')}
          imageStyle={styles.headerImage}
          style={styles.header}
        >
          <LinearGradient
            colors={['rgba(5,5,5,0.78)', 'rgba(22,8,8,0.58)', 'rgba(5,5,5,0.78)']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.headerOverlay}
          />
          <View style={styles.headerAccentLine} />
          <View style={styles.headerTop}>
            <View style={styles.headerCopy}>
              <Text style={styles.headerEyebrow}>BORROWBACK</Text>
              <Text style={styles.greeting}>Hi, {user?.name || 'there'}.</Text>
              <Text style={styles.subGreeting}>See what's available and keep up with your borrows.</Text>
            </View>
            <TouchableOpacity
              style={styles.notificationBtn}
              onPress={() => navigation.navigate('Notifications')}
              accessibilityRole="button"
              accessibilityLabel={stats.unreadAlerts ? `Notifications, ${stats.unreadAlerts} unread` : 'Notifications'}
            >
              <Ionicons name="notifications-outline" size={23} color={theme.colors.text} />
              {stats.unreadAlerts > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{stats.unreadAlerts > 9 ? '9+' : stats.unreadAlerts}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
          <View style={styles.headerFooter}>
            <Ionicons name="heart" size={13} color={theme.colors.secondary} />
            <Text style={styles.headerFooterText}>Borrow what you need. Lend what you can.</Text>
          </View>
        </ImageBackground>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your activity</Text>
          <View style={styles.statsGrid}>
            {renderStatCard('Items Listed', stats.itemsListed, 'list-circle-outline', theme.colors.secondary)}
            {renderStatCard('Active Borrows', stats.activeBorrows, 'swap-horizontal-outline', theme.colors.success)}
            {renderStatCard('Pending', stats.pendingRequests, 'time-outline', theme.colors.accent)}
            {renderStatCard('Alerts', stats.unreadAlerts, 'alert-circle-outline', theme.colors.error)}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.actionsScroll}>
            {renderActionBtn('Browse', 'search-outline', 'Browse')}
            {renderActionBtn('Borrows', 'hand-left-outline', 'Borrows')}
            {renderActionBtn('Add Item', 'add-circle-outline', 'Profile', { screen: 'AddItem' })}
            {renderActionBtn('Loans', 'cash-outline', 'Loans', { screen: 'MoneyLoans' })}
            {renderActionBtn('Finances', 'wallet-outline', 'Home', { screen: 'Fines' })}
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
      </ImageBackground>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  ambientBackground: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  ambientImage: {
    opacity: 0.55,
  },
  ambientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  ambientGrid: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  ambientGridLine: {
    height: '100%',
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: 'rgba(255,255,255,0.08)',
  },
  container: {
    flex: 1,
  },
  header: {
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    minHeight: 174,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,73,62,0.28)',
    ...theme.shadows.card,
  },
  headerImage: {
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  headerAccentLine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: theme.colors.secondary,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerCopy: {
    flex: 1,
    paddingRight: theme.spacing.md,
  },
  headerEyebrow: {
    color: theme.colors.accent,
    fontSize: 10,
    fontWeight: theme.typography.weights.bold,
    letterSpacing: 1.2,
    marginBottom: 7,
  },
  greeting: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    marginBottom: 4,
  },
  subGreeting: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
  },
  headerFooter: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(5, 5, 5, 0.8)',
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
    marginTop: theme.spacing.lg,
  },
  headerFooterText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.medium,
    marginLeft: 6,
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(5, 5, 5, 0.8)',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: theme.colors.error,
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
    color: theme.colors.text,
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
    backgroundColor: 'rgba(17,17,17,0.88)',
    borderRadius: theme.borderRadius.lg,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#303030',
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
    borderRadius: 20,
    backgroundColor: 'rgba(17,17,17,0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
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
    backgroundColor: 'rgba(17,17,17,0.88)',
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
    color: theme.colors.text,
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
