import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import api from '../api/api';
import { theme } from '../theme';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';
import LoadingScreen from '../components/LoadingScreen';
import ExternalPaymentModal from '../components/ExternalPaymentModal';

const TABS = ['My Loans', 'Overdue', 'Requests', 'Lending', 'Summary'];
const formatStatus = (status) => {
  if (status === 'repaid_pending') return 'AWAITING CONFIRMATION';
  if (status === 'repaid') return 'PAID';
  if (status === 'disbursement_pending') return 'ACCEPTED · AWAITING FUNDS';
  if (status === 'disbursement_sent') return 'FUNDS SENT · AWAITING RECEIPT';
  return (status || 'unknown').replace(/_/g, ' ').toUpperCase();
};
const isLoanOverdue = (loan) => loan.status === 'overdue'
  || (loan.status === 'active' && new Date(loan.dueDate).getTime() < Date.now());

const MoneyLoansScreen = () => {
  const [activeTab, setActiveTab] = useState('My Loans');
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [acting, setActing] = useState('');
  const [payment, setPayment] = useState(null);
  const navigation = useNavigation();

  const fetchLoans = useCallback(async () => {
    setLoadError('');
    try {
      let response;
      switch (activeTab) {
        case 'My Loans':
          response = await api.get('/money-loans/mine');
          setLoans(response.data.loans || []);
          break;
        case 'Overdue': {
          const [borrowedResponse, lendingResponse] = await Promise.all([
            api.get('/money-loans/mine'),
            api.get('/money-loans/lending'),
          ]);
          setLoans([
            ...(borrowedResponse.data.loans || [])
              .filter(isLoanOverdue)
              .map((loan) => ({ ...loan, loanSide: 'borrower' })),
            ...(lendingResponse.data.loans || [])
              .filter(isLoanOverdue)
              .map((loan) => ({ ...loan, loanSide: 'lender' })),
          ]);
          break;
        }
        case 'Requests':
          response = await api.get('/money-loans/incoming');
          setLoans(response.data.requests || []);
          break;
        case 'Lending':
          response = await api.get('/money-loans/lending');
          setLoans(response.data.loans || []);
          break;
        case 'Summary':
          response = await api.get('/money-loans/financial');
          setSummaryData(response.data.summary);
          break;
        default:
          throw new Error('Unknown money-loan section.');
      }
    } catch (error) {
      console.error('Error fetching loans:', error);
      setLoadError(error.response?.data?.message || 'Could not load loan information. Pull down to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchLoans();
    }, [fetchLoans])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchLoans();
  }, [fetchLoans]);

  const handleStatusChange = async (id, action, showAlerts = true) => {
    const requestKey = `${id}:${action}`;
    setActing(requestKey);
    try {
      let endpoint;
      switch (action) {
        case 'repay':
          endpoint = `/money-loans/${id}/repay`;
          break;
        case 'accept':
          endpoint = `/money-loans/${id}/accept`;
          break;
        case 'report-disbursement':
          endpoint = `/money-loans/${id}/report-disbursement`;
          break;
        case 'confirm-disbursement':
          endpoint = `/money-loans/${id}/confirm-disbursement`;
          break;
        case 'reject':
          endpoint = `/money-loans/${id}/reject`;
          break;
        case 'confirm-repay':
          endpoint = `/money-loans/${id}/confirm-repay`;
          break;
        default:
          throw new Error('Unsupported loan action.');
      }
      
      await api.put(endpoint);
      await fetchLoans();
      if (showAlerts) Alert.alert('Updated', 'The loan status has been updated.');
      return true;
    } catch (error) {
      console.error(`Error updating loan ${id} with action ${action}:`, error);
      if (!showAlerts) throw error;
      Alert.alert('Could not update loan', error.response?.data?.message || 'Please try again.');
      return false;
    } finally {
      setActing('');
    }
  };

  const confirmAction = (loan, action) => {
    if (action === 'repay') {
      setPayment({
        id: loan._id,
        amount: loan.totalRepayable || loan.amount,
        title: 'Repay Loan',
        reference: loan._id?.slice(0, 7).toUpperCase(),
      });
      return;
    }
    if (action === 'report-disbursement') {
      setPayment({
        id: loan._id,
        action,
        amount: loan.amount,
        title: 'Record Loan Funds Sent',
        reference: loan._id?.slice(0, 7).toUpperCase(),
      });
      return;
    }

    const messages = {
      accept: {
        title: 'Accept loan request?',
        message: `Accept the ₹${loan.amount} loan request? You will still need to send the funds outside BorrowBack and mark them sent.`,
        confirm: 'Accept request',
      },
      'confirm-disbursement': {
        title: 'Confirm loan funds received?',
        message: 'Confirm only after you have received the loan funds outside BorrowBack.',
        confirm: 'Confirm received',
      },
      reject: {
        title: 'Reject loan request?',
        message: 'The borrower will be notified that you declined this request.',
        confirm: 'Reject request',
      },
      'confirm-repay': {
        title: 'Confirm repayment received?',
        message: 'Only confirm after you have received the repayment outside BorrowBack.',
        confirm: 'Confirm received',
      },
    };
    const copy = messages[action];
    Alert.alert(copy.title, copy.message, [
      { text: 'Cancel', style: 'cancel' },
      { text: copy.confirm, style: action === 'reject' ? 'destructive' : 'default', onPress: () => handleStatusChange(loan._id, action) },
    ]);
  };

  const ratePerson = async (loan, side, rating) => {
    try {
      await api.put(`/money-loans/${loan._id}/rate-${side}`, { rating });
      await fetchLoans();
      Alert.alert('Thank you', 'Your rating has been saved.');
    } catch (error) {
      console.error(`Error rating ${side} for loan ${loan._id}:`, error);
      Alert.alert('Could not save rating', error.response?.data?.message || 'Please try again.');
    }
  };

  const chooseRating = (loan, side) => {
    Alert.alert(`Rate ${side === 'lender' ? 'lender' : 'borrower'}`, 'Choose a rating from 1 to 5 stars.', [
      ...[1, 2, 3, 4, 5].map((rating) => ({
        text: `${rating} ★`,
        onPress: () => ratePerson(loan, side, rating),
      })),
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const renderMyLoansItem = ({ item }) => {
    const totalRepayable = item.totalRepayable ?? item.amount + (item.amount * (item.interestRate / 100));
    const displayStatus = isLoanOverdue(item) ? 'overdue' : item.status;
    
    return (
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.userName}>{item.lender?.name || 'Lender'}</Text>
          <Badge status={displayStatus} label={formatStatus(displayStatus)} />
        </View>
        <View style={styles.loanDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount:</Text>
            <Text style={styles.detailValue}>₹{item.amount}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Interest Rate:</Text>
            <Text style={styles.detailValue}>{item.interestRate}%</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Total Repayable:</Text>
            <Text style={[styles.detailValue, { fontWeight: 'bold', color: theme.colors.primary }]}>
              ₹{totalRepayable.toFixed(2)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Due Date:</Text>
            <Text style={styles.detailValue}>{new Date(item.dueDate).toLocaleDateString()}</Text>
          </View>
          {item.borrower?.phone ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Borrower phone:</Text>
              <Text style={styles.detailValue}>{item.borrower.phone}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.actionContainer}>
          {['active', 'overdue'].includes(item.status) && (
            <>
              <Text style={styles.paymentHint}>
                Pay the lender using your agreed method, then record it here.
              </Text>
              <Button
                title={acting === `${item._id}:repay` ? 'Saving...' : 'Pay Now'}
                onPress={() => confirmAction(item, 'repay')}
                disabled={Boolean(acting)}
                style={styles.actionButton}
              />
            </>
          )}
          {item.status === 'disbursement_pending' && (
            <Text style={styles.waitingText}>Your request was accepted. Waiting for the lender to send and record the funds.</Text>
          )}
          {item.status === 'disbursement_sent' && (
            <>
              <Text style={styles.waitingText}>The lender marked the funds sent. Confirm only after you receive them.</Text>
              <Button
                title="Confirm Funds Received"
                onPress={() => confirmAction(item, 'confirm-disbursement')}
                disabled={Boolean(acting)}
                style={styles.actionButton}
              />
            </>
          )}
          {item.status === 'repaid_pending' && (
            <Text style={styles.waitingText}>Repayment recorded — waiting for lender confirmation.</Text>
          )}
          {item.status === 'repaid' && !item.lenderRating && (
            <Button 
              title="Rate Lender" 
              variant="outline"
              onPress={() => chooseRating(item, 'lender')}
              style={styles.actionButton}
            />
          )}
          {item.lenderRating ? <Text style={styles.ratingSaved}>Your lender rating: {item.lenderRating}/5</Text> : null}
        </View>
      </Card>
    );
  };

  const renderRequestsItem = ({ item }) => (
    <Card style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.userName}>{item.borrower?.name || 'Borrower'}</Text>
        <Text style={styles.amountText}>₹{Number(item.amount).toLocaleString('en-IN')}</Text>
      </View>
      <View style={styles.loanDetails}>
        <Text style={styles.purposeText}><Text style={{fontWeight: 'bold'}}>Purpose:</Text> {item.purpose}</Text>
        {item.note ? <Text style={styles.noteText}>Note: {item.note}</Text> : null}
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Interest Rate:</Text>
          <Text style={styles.detailValue}>{item.interestRate}%</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Due Date:</Text>
          <Text style={styles.detailValue}>{new Date(item.dueDate).toLocaleDateString()}</Text>
        </View>
        {item.borrower?.phone ? (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Borrower phone:</Text>
            <Text style={styles.detailValue}>{item.borrower.phone}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.buttonRow}>
        <Button 
          title="Reject" 
          variant="outline"
          onPress={() => confirmAction(item, 'reject')}
          disabled={Boolean(acting)}
          style={[styles.flexButton, { borderColor: theme.colors.error }]}
          textStyle={{ color: theme.colors.error }}
        />
        <View style={{ width: theme.spacing.md }} />
        <Button 
          title="Accept" 
          onPress={() => confirmAction(item, 'accept')}
          disabled={Boolean(acting)}
          style={styles.flexButton}
        />
      </View>
    </Card>
  );

  const renderLendingItem = ({ item }) => (
    <Card style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.userName}>{item.borrower?.name || 'Borrower'}</Text>
        <Badge status={isLoanOverdue(item) ? 'overdue' : item.status} label={formatStatus(isLoanOverdue(item) ? 'overdue' : item.status)} />
      </View>
      <View style={styles.loanDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Amount Lent:</Text>
          <Text style={styles.detailValue}>₹{Number(item.amount).toLocaleString('en-IN')}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Total repayable:</Text>
          <Text style={styles.detailValue}>₹{Number(item.totalRepayable || item.amount).toLocaleString('en-IN')}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Due Date:</Text>
          <Text style={styles.detailValue}>{new Date(item.dueDate).toLocaleDateString()}</Text>
        </View>
      </View>

      <View style={styles.actionContainer}>
        {item.status === 'disbursement_pending' && (
          <>
            <Text style={styles.paymentHint}>After sending the loan amount outside BorrowBack, report it here. The borrower must confirm receipt before the loan becomes active.</Text>
            <Button
              title="I Sent the Loan Funds"
              onPress={() => confirmAction(item, 'report-disbursement')}
              disabled={Boolean(acting)}
              style={styles.actionButton}
            />
          </>
        )}
        {item.status === 'disbursement_sent' && (
          <Text style={styles.waitingText}>Funds marked as sent · waiting for borrower to confirm receipt.</Text>
        )}
        {isLoanOverdue(item) && (
          <Text style={styles.waitingText}>Repayment is overdue — waiting for the borrower to record payment.</Text>
        )}
        {item.status === 'repaid_pending' && (
          <Button 
            title={acting === `${item._id}:confirm-repay` ? 'Saving...' : 'Confirm Repayment Received'}
            onPress={() => confirmAction(item, 'confirm-repay')}
            disabled={Boolean(acting)}
            style={styles.actionButton}
          />
        )}
        {item.status === 'repaid' && !item.borrowerRating && (
          <Button
            title="Rate Borrower"
            variant="outline"
            onPress={() => chooseRating(item, 'borrower')}
            style={styles.actionButton}
          />
        )}
        {item.borrowerRating ? <Text style={styles.ratingSaved}>Your borrower rating: {item.borrowerRating}/5</Text> : null}
      </View>
    </Card>
  );

  const renderSummary = () => {
    if (!summaryData) return null;

    return (
      <ScrollView 
        style={styles.summaryContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.sectionTitle}>As Borrower</Text>
        <View style={styles.summaryGrid}>
          <Card style={[styles.summaryCard, { backgroundColor: theme.colors.surface }]}>
            <Text style={styles.summaryLabel}>Total Borrowed</Text>
            <Text style={[styles.summaryValue, { color: theme.colors.primary }]}>₹{summaryData.borrower.totalBorrowed || 0}</Text>
          </Card>
          <Card style={[styles.summaryCard, { backgroundColor: theme.colors.surface }]}>
            <Text style={styles.summaryLabel}>Total Repaid</Text>
            <Text style={[styles.summaryValue, { color: theme.colors.success }]}>₹{summaryData.borrower.totalRepaid || 0}</Text>
          </Card>
          <Card style={[styles.summaryCard, { backgroundColor: theme.colors.surface }]}>
            <Text style={styles.summaryLabel}>Total Pending</Text>
            <Text style={[styles.summaryValue, { color: theme.colors.accent }]}>₹{summaryData.borrower.totalPending || 0}</Text>
          </Card>
          <Card style={[styles.summaryCard, { backgroundColor: theme.colors.surface }]}>
            <Text style={styles.summaryLabel}>Awaiting confirmation</Text>
            <Text style={[styles.summaryValue, { color: theme.colors.accent }]}>₹{summaryData.borrower.awaitingConfirmation || 0}</Text>
          </Card>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: theme.spacing.lg }]}>As Lender</Text>
        <View style={styles.summaryGrid}>
          <Card style={[styles.summaryCard, { backgroundColor: theme.colors.surface }]}>
            <Text style={styles.summaryLabel}>Total Lent</Text>
            <Text style={[styles.summaryValue, { color: theme.colors.primary }]}>₹{summaryData.lender.totalLent || 0}</Text>
          </Card>
          <Card style={[styles.summaryCard, { backgroundColor: theme.colors.surface }]}>
            <Text style={styles.summaryLabel}>Total Recovered</Text>
            <Text style={[styles.summaryValue, { color: theme.colors.success }]}>₹{summaryData.lender.totalRecovered || 0}</Text>
          </Card>
          <Card style={[styles.summaryCard, { backgroundColor: theme.colors.surface }]}>
            <Text style={styles.summaryLabel}>Outstanding</Text>
            <Text style={[styles.summaryValue, { color: theme.colors.accent }]}>₹{summaryData.lender.totalOutstanding || 0}</Text>
          </Card>
        </View>
      </ScrollView>
    );
  };

  if (loading && !refreshing) {
    return <LoadingScreen message="Loading loans..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loadError ? (
        <View style={styles.errorContainer}>
          <Ionicons name="cloud-offline-outline" size={24} color={theme.colors.error} />
          <Text style={styles.errorText}>{loadError}</Text>
          <Button title="Retry" onPress={onRefresh} style={styles.retryButton} />
        </View>
      ) : activeTab === 'Summary' ? (
        renderSummary()
      ) : (
        <FlatList
          data={loans}
          keyExtractor={(item) => item._id || item.id}
          renderItem={({ item }) => {
            if (activeTab === 'Overdue') {
              return item.loanSide === 'borrower'
                ? renderMyLoansItem({ item })
                : renderLendingItem({ item });
            }
            return activeTab === 'My Loans' ? renderMyLoansItem({ item }) :
              activeTab === 'Requests' ? renderRequestsItem({ item }) :
              renderLendingItem({ item });
          }}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <EmptyState 
              icon="wallet-outline" 
              title="No Loans Found" 
              message={
                activeTab === 'Overdue'
                  ? 'Loans past their due date will appear here.'
                  : activeTab === 'My Loans'
                    ? 'Request a peer loan to see its status and repayment details here.'
                  : `You have no ${activeTab.toLowerCase()} at the moment.`
              }
            />
          }
        />
      )}

      {activeTab === 'My Loans' && (
        <TouchableOpacity 
          style={styles.fab}
          onPress={() => navigation.navigate('MoneyLoanRequest')}
        >
          <Ionicons name="add" size={24} color={theme.colors.surface} />
        </TouchableOpacity>
      )}
      <ExternalPaymentModal
        visible={Boolean(payment)}
        title={payment?.title}
        amount={payment?.amount}
        reference={payment?.reference}
        onClose={() => setPayment(null)}
        onConfirm={() => handleStatusChange(payment.id, payment.action || 'repay', false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  tabContainer: {
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tabScroll: {
    paddingHorizontal: theme.spacing.md,
  },
  tab: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    marginRight: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.background,
  },
  activeTab: {
    backgroundColor: theme.colors.primary,
  },
  tabText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.normal,
    color: theme.colors.textSecondary,
  },
  activeTabText: {
    color: theme.colors.surface,
  },
  listContainer: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl * 2,
  },
  card: {
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  userName: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text,
  },
  amountText: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
  },
  loanDetails: {
    marginBottom: theme.spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  detailLabel: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.normal,
    color: theme.colors.textSecondary,
  },
  detailValue: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.normal,
    color: theme.colors.text,
  },
  waitingText: {
    color: theme.colors.accent,
    fontSize: theme.typography.sizes.sm,
    lineHeight: 20,
    marginTop: theme.spacing.sm,
  },
  ratingSaved: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.sm,
    marginTop: theme.spacing.sm,
  },
  purposeText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.normal,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  noteText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.normal,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: theme.spacing.sm,
  },
  actionContainer: {
    marginTop: theme.spacing.sm,
  },
  paymentHint: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.xs,
    lineHeight: 18,
    marginTop: theme.spacing.sm,
  },
  actionButton: {
    marginTop: theme.spacing.sm,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  flexButton: {
    flex: 1,
  },
  summaryContainer: {
    flex: 1,
    padding: theme.spacing.md,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  errorText: {
    color: theme.colors.error,
    textAlign: 'center',
  },
  retryButton: {
    maxWidth: 180,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  summaryGrid: {
    flexDirection: 'column',
    gap: theme.spacing.md,
  },
  summaryCard: {
    padding: theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  summaryLabel: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textSecondary,
  },
  summaryValue: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
  },
  fab: {
    position: 'absolute',
    bottom: theme.spacing.xl,
    right: theme.spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.card,
  },
});

export default MoneyLoansScreen;
