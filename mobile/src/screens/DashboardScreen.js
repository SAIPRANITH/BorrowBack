import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Image,
  Alert
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
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
  const [activeBorrows, setActiveBorrows] = useState([]);
  const [financials, setFinancials] = useState(null);
  const borrowerDeposits = financials?.borrower?.totalDepositsPaid || 0;
  const ownerDeposits = financials?.owner?.totalDepositsCollected || 0;
  const financialBalance = ownerDeposits - borrowerDeposits;

  const fetchData = useCallback(async () => {
    try {
      const [
        itemsRes,
        borrowsRes,
        pendingRes,
        notificationsRes,
        recentRes,
        financialsRes,
      ] = await Promise.all([
        api.get('/items/mine'),
        api.get('/borrows/mine'),
        api.get('/borrows/incoming'),
        api.get('/notifications/unread-count'),
        api.get('/items?sort=-createdAt&limit=5'),
        api.get('/borrows/financial').catch((error) => {
          console.error('Failed to load dashboard financial summary:', error);
          return { data: { summary: null } };
        }),
      ]);

      setStats({
        itemsListed: itemsRes.data.count,
        activeBorrows: borrowsRes.data.borrows.filter(b => b.status === 'active').length,
        pendingRequests: pendingRes.data.count,
        unreadAlerts: notificationsRes.data.count || 0,
      });

      setRecentItems(recentRes.data.items || []);
      setActiveBorrows((borrowsRes.data.borrows || []).filter((borrow) => borrow.status === 'active'));
      setFinancials(financialsRes.data.summary || null);
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
    <View style={styles.safeArea}>
        <ScrollView
          style={styles.container}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.secondary]} />}
        >
        <View style={styles.header}>
          <LinearGradient
            colors={['rgba(255,73,62,0.075)', 'rgba(255,73,62,0.02)', 'transparent']}
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
        </View>

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
            <Text style={styles.sectionTitle}>Your wallet</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Fines')}>
              <Text style={styles.seeAllText}>Finances</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.walletSummary}>
            <View style={styles.walletBalance}>
              <Text style={styles.walletCaption}>Net balance</Text>
              <Text style={[styles.walletAmount, { color: financialBalance >= 0 ? theme.colors.success : theme.colors.error }]}>
                {financialBalance >= 0 ? '+' : '-'}₹{Math.abs(financialBalance).toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={styles.walletRows}>
              <View style={styles.walletRow}>
                <Text style={styles.walletCaption}>Deposits paid</Text>
                <Text style={styles.walletValue}>₹{borrowerDeposits.toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.walletRow}>
                <Text style={styles.walletCaption}>Fines paid</Text>
                <Text style={styles.walletValue}>₹{(financials?.borrower?.totalFinesPaid || 0).toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.walletRow}>
                <Text style={styles.walletCaption}>Deposits held</Text>
                <Text style={styles.walletValue}>₹{ownerDeposits.toLocaleString('en-IN')}</Text>
              </View>
              <View style={styles.walletRow}>
                <Text style={styles.walletCaption}>Fines earned</Text>
                <Text style={styles.walletValue}>₹{(financials?.owner?.totalFinesCollected || 0).toLocaleString('en-IN')}</Text>
              </View>
            </View>
          </View>
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
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Active borrows</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Borrows')}>
              <Text style={styles.seeAllText}>View all</Text>
            </TouchableOpacity>
          </View>
          {activeBorrows.length ? activeBorrows.slice(0, 3).map((borrow) => (
            <TouchableOpacity
              key={borrow._id}
              style={styles.activeBorrowRow}
              onPress={() => borrow.item?._id && navigation.navigate('ItemDetail', { itemId: borrow.item._id })}
              activeOpacity={borrow.item?._id ? 0.8 : 1}
              accessibilityRole={borrow.item?._id ? 'button' : undefined}
            >
              <View style={styles.activeBorrowIcon}>
                <Ionicons name="time-outline" size={19} color={theme.colors.secondary} />
              </View>
              <View style={styles.activeBorrowCopy}>
                <Text style={styles.activeBorrowName} numberOfLines={1}>
                  {borrow.item?.name || 'Borrowed item'}
                </Text>
                <Text style={styles.activeBorrowDue}>
                  Due {borrow.dueDate ? new Date(borrow.dueDate).toLocaleDateString() : 'date unavailable'}
                </Text>
              </View>
              {borrow.item?._id ? <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} /> : null}
            </TouchableOpacity>
          )) : (
            <Text style={styles.emptyBorrows}>You have no active borrows right now.</Text>
          )}
        </View>
        <View style={{ height: 40 }} />
        </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  container: {
    flex: 1,
  },
  header: {
    minHeight: 174,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 22,
    overflow: 'hidden',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.1)',
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
    backgroundColor: 'rgba(8,8,8,0.55)',
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
    backgroundColor: 'rgba(255,255,255,0.045)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
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
  walletSummary: {
    paddingHorizontal: 20,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.12)',
  },
  walletBalance: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  walletRows: {
    gap: theme.spacing.sm,
  },
  walletRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  walletCaption: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.sm,
  },
  walletAmount: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
  },
  walletValue: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
  },
  activeBorrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  activeBorrowIcon: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
    borderRadius: 19,
    backgroundColor: `${theme.colors.secondary}15`,
  },
  activeBorrowCopy: {
    flex: 1,
    minWidth: 0,
  },
  activeBorrowName: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
  },
  activeBorrowDue: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.xs,
    marginTop: 3,
  },
  emptyBorrows: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.sm,
    marginHorizontal: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  statCard: {
    width: '47%',
    backgroundColor: 'transparent',
    padding: 16,
    marginBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.12)',
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
    backgroundColor: 'rgba(255,255,255,0.045)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  actionText: {
    fontSize: 12,
    color: theme.colors.text,
    fontWeight: theme.typography.weights.medium,
    textAlign: 'center',
  },
  recentItemCard: {
    width: 160,
    backgroundColor: 'transparent',
    marginRight: 16,
    overflow: 'hidden',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.12)',
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
  },
});

export default DashboardScreen;
