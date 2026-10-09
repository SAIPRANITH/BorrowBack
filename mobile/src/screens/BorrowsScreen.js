import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';
import LoadingScreen from '../components/LoadingScreen';

const TABS = {
  MINE: 'MINE',
  REQUESTS: 'REQUESTS',
  LENDING: 'LENDING',
};

const STATUS_COLORS = {
  pending: theme.colors.accent,
  active: theme.colors.success,
  returned: theme.colors.primary,
  overdue: theme.colors.error,
  rejected: theme.colors.textSecondary,
};

export default function BorrowsScreen() {
  const [activeTab, setActiveTab] = useState(TABS.MINE);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBorrows = async () => {
    try {
      let endpoint = '';
      if (activeTab === TABS.MINE) endpoint = '/borrows/mine';
      else if (activeTab === TABS.REQUESTS) endpoint = '/borrows/incoming';
      else if (activeTab === TABS.LENDING) endpoint = '/borrows/lending';

      const response = await api.get(endpoint);
      setData(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch borrows', error);
      Alert.alert('Error', 'Could not load borrow data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchBorrows();
  }, [activeTab]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchBorrows();
  }, [activeTab]);

  const handleAction = async (action, id, item) => {
    try {
      let endpoint = '';
      let method = 'put';
      if (action === 'signal-return') endpoint = `/borrows/${id}/signal-return`;
      else if (action === 'pay-deposit') endpoint = `/borrows/${id}/pay-deposit`;
      else if (action === 'pay-fine') endpoint = `/borrows/${id}/pay-fine`;
      else if (action === 'accept') endpoint = `/borrows/${id}/accept`;
      else if (action === 'reject') endpoint = `/borrows/${id}/reject`;
      else if (action === 'confirm-return') endpoint = `/borrows/${id}/confirm-return`;

      await api[method](endpoint);
      Alert.alert('Success', 'Action completed successfully.');
      fetchBorrows();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Action failed.');
    }
  };

  const renderMyBorrowsItem = ({ item }) => (
    <Card style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleContainer}>
          <Text style={styles.itemName}>{item.item?.name || 'Unknown Item'}</Text>
          <Text style={styles.personName}>From: {item.owner?.name || 'Unknown'}</Text>
        </View>
        <Badge 
          label={item.status} 
          backgroundColor={STATUS_COLORS[item.status] || theme.colors.textSecondary} 
        />
      </View>
      <View style={styles.datesContainer}>
        <Text style={styles.dateText}>Due: {new Date(item.dueDate).toLocaleDateString()}</Text>
      </View>
      
      <View style={styles.actionContainer}>
        {item.status === 'active' && (
          <Button title="Signal Return" onPress={() => handleAction('signal-return', item._id, item)} style={styles.actionButton} />
        )}
        {(item.status === 'active' || item.status === 'returned') && !item.depositPaid && item.depositAmount > 0 && (
          <Button title="Pay Deposit" onPress={() => handleAction('pay-deposit', item._id, item)} style={styles.actionButton} />
        )}
        {item.status === 'returned' && item.fineAmount > 0 && !item.finePaid && (
          <Button title={`Pay Fine (\u20B9${item.fineAmount})`} onPress={() => handleAction('pay-fine', item._id, item)} style={[styles.actionButton, {backgroundColor: theme.colors.error}]} />
        )}
      </View>
    </Card>
  );

  const renderRequestsItem = ({ item }) => (
    <Card style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleContainer}>
          <Text style={styles.itemName}>{item.item?.name || 'Unknown Item'}</Text>
          <Text style={styles.personName}>By: {item.borrower?.name || 'Unknown'}</Text>
        </View>
        <Badge label="Pending" backgroundColor={theme.colors.accent} />
      </View>
      <View style={styles.datesContainer}>
        <Text style={styles.dateText}>Req: {new Date(item.createdAt).toLocaleDateString()}</Text>
        <Text style={styles.dateText}>Due: {new Date(item.dueDate).toLocaleDateString()}</Text>
      </View>
      <View style={styles.rowActions}>
        <Button title="Reject" onPress={() => handleAction('reject', item._id, item)} style={[styles.flexBtn, {backgroundColor: theme.colors.error, marginRight: 8}]} />
        <Button title="Accept" onPress={() => handleAction('accept', item._id, item)} style={[styles.flexBtn, {backgroundColor: theme.colors.success}]} />
      </View>
    </Card>
  );

  const renderLendingItem = ({ item }) => (
    <Card style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleContainer}>
          <Text style={styles.itemName}>{item.item?.name || 'Unknown Item'}</Text>
          <Text style={styles.personName}>To: {item.borrower?.name || 'Unknown'}</Text>
        </View>
        <Badge 
          label={item.status} 
          backgroundColor={STATUS_COLORS[item.status] || theme.colors.textSecondary} 
        />
      </View>
      <View style={styles.datesContainer}>
        <Text style={styles.dateText}>Due: {new Date(item.dueDate).toLocaleDateString()}</Text>
      </View>
      {item.status === 'active' && (
        <View style={styles.actionContainer}>
          <Button title="Confirm Return" onPress={() => handleAction('confirm-return', item._id, item)} style={styles.actionButton} />
        </View>
      )}
    </Card>
  );

  if (loading && !refreshing) {
    return <LoadingScreen message="Loading borrows..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === TABS.MINE && styles.activeTab]} 
          onPress={() => setActiveTab(TABS.MINE)}
        >
          <Text style={[styles.tabText, activeTab === TABS.MINE && styles.activeTabText]}>My Borrows</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === TABS.REQUESTS && styles.activeTab]} 
          onPress={() => setActiveTab(TABS.REQUESTS)}
        >
          <Text style={[styles.tabText, activeTab === TABS.REQUESTS && styles.activeTabText]}>Requests</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === TABS.LENDING && styles.activeTab]} 
          onPress={() => setActiveTab(TABS.LENDING)}
        >
          <Text style={[styles.tabText, activeTab === TABS.LENDING && styles.activeTabText]}>Lending</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={data}
        keyExtractor={(item) => item._id}
        renderItem={
          activeTab === TABS.MINE ? renderMyBorrowsItem : 
          activeTab === TABS.REQUESTS ? renderRequestsItem : 
          renderLendingItem
        }
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.secondary]} />
        }
        ListEmptyComponent={
          <EmptyState 
            icon="document-text-outline" 
            title={`No ${activeTab.toLowerCase()} found`} 
            message="Check back later." 
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    paddingTop: theme.spacing.md,
    ...theme.shadows.header,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: theme.colors.secondary,
  },
  tabText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.textSecondary,
  },
  activeTabText: {
    color: theme.colors.secondary,
    fontWeight: theme.typography.weights.bold,
  },
  listContainer: {
    padding: theme.spacing.md,
    flexGrow: 1,
  },
  card: {
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  cardTitleContainer: {
    flex: 1,
    paddingRight: theme.spacing.sm,
  },
  itemName: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text,
    marginBottom: 2,
  },
  personName: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
  },
  datesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  dateText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
  },
  actionContainer: {
    marginTop: theme.spacing.sm,
  },
  actionButton: {
    marginTop: theme.spacing.sm,
  },
  rowActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.sm,
  },
  flexBtn: {
    flex: 1,
  },
});
