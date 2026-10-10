import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../api/api';
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

const getDepositStatus = (borrow) => borrow.depositStatus
  || (Number(borrow.depositAmount ?? borrow.item?.depositAmount) > 0
    ? (borrow.depositPaid ? (['returned', 'rejected'].includes(borrow.status) ? 'return_pending' : 'held') : 'pending')
    : 'not_required');

const DEPOSIT_STATUS_LABELS = {
  not_required: 'Not required',
  pending: 'Unpaid',
  payment_pending: 'Awaiting owner confirmation',
  held: 'Received by owner',
  return_pending: 'Awaiting owner return',
  return_sent: 'Awaiting your acknowledgement',
  returned: 'Returned and acknowledged',
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
      else if (action === 'confirm-deposit') endpoint = `/borrows/${id}/confirm-deposit`;
      else if (action === 'reject-deposit') endpoint = `/borrows/${id}/reject-deposit`;
      else if (action === 'return-deposit') endpoint = `/borrows/${id}/return-deposit`;
      else if (action === 'acknowledge-deposit-return') endpoint = `/borrows/${id}/acknowledge-deposit-return`;
      else if (action === 'confirm-fine') endpoint = `/borrows/${id}/confirm-fine`;
      else if (action === 'reject-fine') endpoint = `/borrows/${id}/reject-fine`;
      else throw new Error('Unsupported borrow action.');

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
    const amount = action === 'pay-fine' ? item.fineAmount : item.depositAmount;
    setPayment({
      action,
      id: item._id,
      amount,
      title: action === 'pay-fine'
        ? 'Record Fine Payment'
        : action === 'return-deposit'
          ? 'Return Security Deposit'
          : 'Record Security Deposit',
      reference: item._id?.slice(0, 7).toUpperCase(),
    });
  };

  const renderMyBorrowsItem = ({ item }) => {
    const depositStatus = getDepositStatus(item);
    const depositConfirmed = ['held', 'return_pending', 'return_sent', 'returned'].includes(depositStatus);
    return (
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleContainer}>
            <Text style={styles.itemName}>{item.item?.name || 'Unknown Item'}</Text>
            <Text style={styles.personName}>From: {item.owner?.name || 'Unknown'}</Text>
          </View>
          <Badge status={item.status} label={item.status} />
        </View>
        {(item.depositAmount > 0 || (item.fineAmount > 0 && item.status === 'returned')) && (
          <View style={styles.paymentStates}>
            {item.depositAmount > 0 && (
              <View style={[styles.paymentState, depositConfirmed ? styles.paymentPaid : styles.paymentUnpaid]}>
                <Ionicons
                  name={depositConfirmed ? 'checkmark-circle' : 'time-outline'}
                  size={14}
                  color={depositConfirmed ? theme.colors.success : theme.colors.accent}
                />
                <Text style={[styles.paymentStateText, depositConfirmed ? styles.paymentPaidText : styles.paymentUnpaidText]}>
                  Deposit · {DEPOSIT_STATUS_LABELS[depositStatus] || 'Unpaid'}
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
                  Fine · {item.finePaid
                    ? 'Paid'
                    : item.finePaymentStatus === 'payment_pending'
                      ? 'Awaiting owner confirmation'
                      : 'Unpaid'}
                </Text>
              </View>
            )}
          </View>
        )}
        <View style={styles.datesContainer}>
          <Text style={styles.dateText}>Due: {new Date(item.dueDate).toLocaleDateString()}</Text>
        </View>

        <View style={styles.actionContainer}>
          {['active', 'overdue'].includes(item.status) && !item.returnSignaledAt && (
            <Button title="Signal Return" onPress={() => handleAction('signal-return', item._id, item)} style={styles.actionButton} />
          )}
          {item.returnSignaledAt && item.status !== 'returned' && (
            <Text style={styles.dateText}>Return signalled · waiting for owner confirmation</Text>
          )}
          {['pending', 'active', 'overdue'].includes(item.status) && depositStatus === 'pending' && Number(item.depositAmount) > 0 && (
            <Button
              title={item.status === 'pending' ? 'Pay Deposit to Continue' : 'Record Deposit Paid'}
              onPress={() => confirmExternalPayment('pay-deposit', item)}
              style={styles.actionButton}
            />
          )}
          {depositStatus === 'payment_pending' && (
            <Text style={styles.dateText}>Deposit payment reported · waiting for owner confirmation</Text>
          )}
          {depositStatus === 'return_pending' && (
            <Text style={styles.dateText}>The owner needs to return your deposit</Text>
          )}
          {depositStatus === 'return_sent' && ['returned', 'rejected'].includes(item.status) && (
            <Button
              title="Acknowledge Deposit Received"
              onPress={() => Alert.alert(
                'Confirm deposit received?',
                'Acknowledge only after you have received the deposit from the owner.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'I received it', onPress: () => handleAction('acknowledge-deposit-return', item._id) },
                ]
              )}
              style={styles.actionButton}
            />
          )}
          {item.status === 'returned' && item.finePaymentStatus === 'payment_pending' && (
            <Text style={styles.dateText}>Fine payment reported · waiting for owner confirmation</Text>
          )}
          {item.status === 'returned' && item.fineAmount > 0 && !item.finePaid && item.finePaymentStatus !== 'payment_pending' && (
            <Button title={`Record Fine Paid (₹${item.fineAmount})`} onPress={() => confirmExternalPayment('pay-fine', item)} style={[styles.actionButton, {backgroundColor: theme.colors.error}]} />
          )}
        </View>
      </Card>
    );
  };

  const renderRequestsItem = ({ item }) => {
    const depositStatus = getDepositStatus(item);
    const depositAmount = Number(item.depositAmount ?? item.item?.depositAmount ?? 0);
    const depositReady = depositAmount <= 0 || depositStatus === 'held';
    return (
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
      {depositAmount > 0 && (
        <Text style={styles.dateText}>Deposit ₹{depositAmount} · {DEPOSIT_STATUS_LABELS[depositStatus] || 'Unpaid'}</Text>
      )}
      {depositStatus === 'payment_pending' && (
        <View style={styles.actionContainer}>
          <Button
            title="Confirm Deposit Received"
            onPress={() => Alert.alert(
              'Confirm deposit received?',
              `Confirm only after receiving ₹${depositAmount} from the borrower.`,
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Confirm received', onPress: () => handleAction('confirm-deposit', item._id) },
              ]
            )}
            style={styles.actionButton}
          />
          <Button title="Not Received" variant="outline" onPress={() => handleAction('reject-deposit', item._id)} style={styles.actionButton} />
        </View>
      )}
      {depositAmount > 0 && !depositReady && (
        <Text style={styles.waitingText}>
          {depositStatus === 'payment_pending'
            ? 'Confirm receipt before accepting this request.'
            : 'The borrower must pay and you must confirm the deposit before acceptance.'}
        </Text>
      )}
      <View style={styles.rowActions}>
        <Button title="Reject" onPress={() => handleAction('reject', item._id, item)} disabled={depositStatus === 'payment_pending'} style={[styles.flexBtn, {backgroundColor: theme.colors.error, marginRight: 8}]} />
        <Button title="Accept" onPress={() => handleAction('accept', item._id, item)} disabled={!depositReady} style={[styles.flexBtn, {backgroundColor: theme.colors.success}]} />
      </View>
    </Card>
    );
  };

  const renderLendingItem = ({ item }) => {
    const depositStatus = getDepositStatus(item);
    const depositAmount = Number(item.depositAmount ?? item.item?.depositAmount ?? 0);
    return (
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleContainer}>
            <Text style={styles.itemName}>{item.item?.name || 'Unknown Item'}</Text>
            <Text style={styles.personName}>To: {item.borrower?.name || 'Unknown'}</Text>
          </View>
          <Badge status={item.status} label={item.status} />
        </View>
        <View style={styles.datesContainer}>
          <Text style={styles.dateText}>Due: {new Date(item.dueDate).toLocaleDateString()}</Text>
          {depositAmount > 0 && (
            <Text style={styles.dateText}>Deposit ₹{depositAmount} · {DEPOSIT_STATUS_LABELS[depositStatus] || 'Unpaid'}</Text>
          )}
        </View>
        <View style={styles.actionContainer}>
          {depositStatus === 'payment_pending' && ['pending', 'active', 'overdue'].includes(item.status) && (
            <>
              <Button
                title="Confirm Deposit Received"
                onPress={() => Alert.alert(
                  'Confirm deposit received?',
                  `Confirm only after you have received ₹${depositAmount} from the borrower.`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Confirm received', onPress: () => handleAction('confirm-deposit', item._id) },
                  ]
                )}
                style={styles.actionButton}
              />
              <Button
                title="Not Received"
                variant="outline"
                onPress={() => handleAction('reject-deposit', item._id)}
                style={styles.actionButton}
              />
            </>
          )}
          {['active', 'overdue'].includes(item.status) && depositStatus !== 'payment_pending' && (
            item.returnSignaledAt ? (
              <Button
                title="Confirm Return"
                onPress={() => Alert.alert(
                  'Confirm item returned?',
                  'Confirm only after you have received and checked the item. This completes the return and calculates any late fine.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Confirm return', onPress: () => handleAction('confirm-return', item._id, item) },
                  ]
                )}
                style={styles.actionButton}
              />
            ) : (
              <Text style={styles.dateText}>Waiting for borrower to signal return</Text>
            )
          )}
          {['active', 'overdue'].includes(item.status) && depositStatus === 'payment_pending' && (
            <Text style={styles.dateText}>Resolve the reported deposit payment before confirming the return</Text>
          )}
          {['returned', 'rejected'].includes(item.status) && depositStatus === 'return_pending' && (
            <Button title={`Record Deposit Returned (₹${depositAmount})`} onPress={() => confirmExternalPayment('return-deposit', item)} style={styles.actionButton} />
          )}
          {['returned', 'rejected'].includes(item.status) && depositStatus === 'return_sent' && (
            <Text style={styles.dateText}>Deposit marked returned · waiting for borrower acknowledgement</Text>
          )}
          {item.status === 'returned' && item.finePaymentStatus === 'payment_pending' && (
            <>
              <Button
                title="Confirm Fine Received"
                onPress={() => Alert.alert(
                  'Confirm fine received?',
                  `Confirm only after you have received ₹${item.fineAmount} from the borrower.`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Confirm received', onPress: () => handleAction('confirm-fine', item._id) },
                  ]
                )}
                style={styles.actionButton}
              />
              <Button title="Fine Not Received" variant="outline" onPress={() => handleAction('reject-fine', item._id)} style={styles.actionButton} />
            </>
          )}
        </View>
      </Card>
    );
  };

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

      <View style={styles.activityIntro}>
        <View style={styles.activityIntroIcon}>
          <Ionicons
            name={activeTab === TABS.REQUESTS ? 'file-tray-outline' : activeTab === TABS.LENDING ? 'swap-horizontal-outline' : 'cube-outline'}
            size={21}
            color={theme.colors.secondary}
          />
        </View>
        <View style={styles.activityIntroCopy}>
          <Text style={styles.activityIntroTitle}>
            {activeTab === TABS.REQUESTS ? 'Requests to review' : activeTab === TABS.LENDING ? 'Items you lend' : 'Your borrowed items'}
          </Text>
          <Text style={styles.activityIntroCaption}>
            Keep payments, handover, and return confirmations in the right order.
          </Text>
        </View>
        <View style={styles.activityCount}>
          <Text style={styles.activityCountValue}>{data.length}</Text>
          <Text style={styles.activityCountLabel}>records</Text>
        </View>
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
  activityIntro: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  activityIntroIcon: {
    width: 42,
    height: 42,
    borderRadius: theme.borderRadius.md,
    backgroundColor: '#68aeb814',
    borderWidth: 1,
    borderColor: '#68aeb82e',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  activityIntroCopy: {
    flex: 1,
    minWidth: 0,
  },
  activityIntroTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
  },
  activityIntroCaption: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.xs,
    lineHeight: 17,
    marginTop: 2,
  },
  activityCount: {
    alignItems: 'flex-end',
    marginLeft: theme.spacing.sm,
  },
  activityCountValue: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
  },
  activityCountLabel: {
    color: theme.colors.textSecondary,
    fontSize: 10,
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
