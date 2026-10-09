import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';
import LoadingScreen from '../components/LoadingScreen';
import ExternalPaymentModal from '../components/ExternalPaymentModal';

const TABS = {
  MINE: 'MINE',
  REQUESTS: 'REQUESTS',
  LENDING: 'LENDING',
};

export default function BorrowsScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState(TABS.MINE);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payment, setPayment] = useState(null);

  const fetchBorrows = async () => {
    try {
      let endpoint = '';
      if (activeTab === TABS.MINE) endpoint = '/borrows/mine';
      else if (activeTab === TABS.REQUESTS) endpoint = '/borrows/incoming';
      else if (activeTab === TABS.LENDING) endpoint = '/borrows/lending';

      const response = await api.get(endpoint);
      const rows = activeTab === TABS.MINE
        ? response.data.borrows
        : activeTab === TABS.REQUESTS
          ? response.data.requests
          : response.data.history;
      setData(rows || []);
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

  const handleAction = async (action, id, { silent = false } = {}) => {
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
      if (!silent) Alert.alert('Success', 'Action completed successfully.');
      await fetchBorrows();
      return true;
    } catch (error) {
      if (silent) throw error;
      Alert.alert('Error', error.response?.data?.message || 'Action failed.');
      return false;
    }
  };

  const confirmExternalPayment = (action, item) => {
    const label = action === 'pay-fine' ? 'fine' : 'security deposit';
    const amount = action === 'pay-fine' ? item.fineAmount : item.depositAmount;
    setPayment({
      action,
      id: item._id,
      amount,
      title: action === 'pay-fine' ? 'Record Fine Payment' : 'Record Security Deposit',
      reference: item._id?.slice(0, 7).toUpperCase(),
    });
  };

  const renderMyBorrowsItem = ({ item }) => (
    <Card style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleContainer}>
          <Text style={styles.itemName}>{item.item?.name || 'Unknown Item'}</Text>
          <Text style={styles.personName}>From: {item.owner?.name || 'Unknown'}</Text>
        </View>
        <Badge
          status={item.status}
          label={item.status} 
        />
      </View>
      {(item.depositAmount > 0 || (item.fineAmount > 0 && item.status === 'returned')) && (
        <View style={styles.paymentStates}>
          {item.depositAmount > 0 && (
            <View style={[styles.paymentState, item.depositPaid ? styles.paymentPaid : styles.paymentUnpaid]}>
              <Ionicons
                name={item.depositPaid ? 'checkmark-circle' : 'time-outline'}
                size={14}
                color={item.depositPaid ? theme.colors.success : theme.colors.accent}
              />
              <Text style={[styles.paymentStateText, item.depositPaid ? styles.paymentPaidText : styles.paymentUnpaidText]}>
                Deposit · {item.depositPaid ? 'PAID' : 'UNPAID'}
              </Text>
            </View>
          )}
          {item.fineAmount > 0 && item.status === 'returned' && (
            <View style={[styles.paymentState, item.finePaid ? styles.paymentPaid : styles.paymentUnpaid]}>
              <Ionicons
                name={item.finePaid ? 'checkmark-circle' : 'time-outline'}
                size={14}
                color={item.finePaid ? theme.colors.success : theme.colors.accent}
              />
              <Text style={[styles.paymentStateText, item.finePaid ? styles.paymentPaidText : styles.paymentUnpaidText]}>
                Fine · {item.finePaid ? 'PAID' : 'UNPAID'}
              </Text>
            </View>
          )}
        </View>
      )}
      <View style={styles.datesContainer}>
        <Text style={styles.dateText}>Due: {new Date(item.dueDate).toLocaleDateString()}</Text>
      </View>
      
      <View style={styles.actionContainer}>
        {item.status === 'active' && (
          <Button title="Signal Return" onPress={() => handleAction('signal-return', item._id, item)} style={styles.actionButton} />
        )}
        {(item.status === 'active' || item.status === 'returned') && !item.depositPaid && item.depositAmount > 0 && (
          <Button title="Record Deposit Paid" onPress={() => confirmExternalPayment('pay-deposit', item)} style={styles.actionButton} />
        )}
        {item.status === 'returned' && item.fineAmount > 0 && !item.finePaid && (
          <Button title={`Record Fine Paid (₹${item.fineAmount})`} onPress={() => confirmExternalPayment('pay-fine', item)} style={[styles.actionButton, {backgroundColor: theme.colors.error}]} />
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
        <Badge status="pending" label="Pending" />
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
          status={item.status}
          label={item.status} 
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
      <View style={styles.shortcutRow}>
        <TouchableOpacity
          style={styles.shortcutButton}
          onPress={() => navigation.navigate('MoneyLoans')}
          accessibilityRole="button"
        >
          <Ionicons name="cash-outline" size={18} color={theme.colors.secondary} />
          <Text style={styles.shortcutText}>Money Loans</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.shortcutButton}
          onPress={() => navigation.getParent()?.navigate('Home', { screen: 'Fines' })}
          accessibilityRole="button"
        >
          <Ionicons name="wallet-outline" size={18} color={theme.colors.secondary} />
          <Text style={styles.shortcutText}>Financials</Text>
        </TouchableOpacity>
      </View>
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
      <ExternalPaymentModal
        visible={Boolean(payment)}
        title={payment?.title}
        amount={payment?.amount}
        reference={payment?.reference}
        onClose={() => setPayment(null)}
        onConfirm={() => handleAction(payment.action, payment.id, { silent: true })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  shortcutRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    backgroundColor: theme.colors.surface,
  },
  shortcutButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background,
  },
  shortcutText: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
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
  paymentStates: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  paymentState: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 5,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
  },
  paymentPaid: {
    backgroundColor: '#17352f',
    borderColor: '#256b59',
  },
  paymentUnpaid: {
    backgroundColor: '#3d3221',
    borderColor: '#725b30',
  },
  paymentStateText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.bold,
  },
  paymentPaidText: {
    color: theme.colors.success,
  },
  paymentUnpaidText: {
    color: theme.colors.accent,
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
