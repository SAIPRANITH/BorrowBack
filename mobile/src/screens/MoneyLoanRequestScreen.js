import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../api/api';
import { theme } from '../theme';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import LoadingScreen from '../components/LoadingScreen';

const MoneyLoanRequestScreen = () => {
  const [lenders, setLenders] = useState([]);
  const [pendingLoans, setPendingLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [lendersError, setLendersError] = useState('');
  const navigation = useNavigation();

  // Form State
  const [selectedLenderId, setSelectedLenderId] = useState(null);
  const [amount, setAmount] = useState('');
  const [interestRate, setInterestRate] = useState('0');
  const [dueDate, setDueDate] = useState('');
  const [purpose, setPurpose] = useState('');
  const [note, setNote] = useState('');

  const fetchLenders = useCallback(async () => {
    setLendersError('');
    try {
      const [lendersResponse, loansResponse] = await Promise.all([
        api.get('/money-loans/lenders'),
        api.get('/money-loans/mine'),
      ]);
      setLenders(lendersResponse.data.lenders || []);
      setPendingLoans((loansResponse.data.loans || []).filter((loan) => loan.status === 'pending'));
    } catch (error) {
      console.error('Error fetching lenders:', error);
      setLendersError(error.response?.data?.message || 'Could not load lenders. Check your connection and try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLenders();
  }, [fetchLenders]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLenders();
  };

  const selectLender = (lenderId) => {
    const existing = pendingLoans.find((loan) => loan.lender?._id === lenderId);
    setSelectedLenderId(lenderId);
    setAmount(existing ? String(existing.amount) : '');
    setInterestRate(existing ? String(existing.interestRate ?? 0) : '0');
    setDueDate(existing?.dueDate?.slice(0, 10) || '');
    setPurpose(existing?.purpose || '');
    setNote(existing?.note || '');
  };

  const calculateTotal = () => {
    const numAmount = Number(amount) || 0;
    const numRate = Number(interestRate) || 0;
    return (numAmount + (numAmount * numRate / 100)).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleSubmit = async () => {
    setErrorMessage('');
    if (!selectedLenderId) {
      setErrorMessage('Please select a lender.');
      return;
    }
    const numAmount = Number(amount);
    if (!amount || !Number.isFinite(numAmount) || numAmount < 100) {
      setErrorMessage('Enter a valid amount of at least ₹100.');
      return;
    }
    const numInterestRate = Number(interestRate);
    if (!Number.isFinite(numInterestRate) || numInterestRate < 0) {
      setErrorMessage('Enter a valid, non-negative interest rate.');
      return;
    }
    const dateParts = dueDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    const selectedDate = dateParts
      ? new Date(Number(dateParts[1]), Number(dateParts[2]) - 1, Number(dateParts[3]))
      : null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (
      !selectedDate ||
      selectedDate.getFullYear() !== Number(dateParts[1]) ||
      selectedDate.getMonth() !== Number(dateParts[2]) - 1 ||
      selectedDate.getDate() !== Number(dateParts[3]) ||
      selectedDate <= today
    ) {
      setErrorMessage('Choose a valid repayment date in the future (YYYY-MM-DD).');
      return;
    }
    if (!purpose.trim()) {
      setErrorMessage('Please provide a purpose for the loan.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post('/money-loans', {
        lenderId: selectedLenderId,
        amount: numAmount,
        interestRate: numInterestRate,
        dueDate,
        purpose,
        note
      });
      Alert.alert('Loan request', response.data.message || 'Loan request submitted and waiting for lender approval.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error submitting loan request:', error);
      setErrorMessage(error.response?.data?.message || 'Failed to submit loan request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingScreen message="Loading form..." />;
  }

  const pendingLoan = pendingLoans.find((loan) => loan.lender?._id === selectedLenderId);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[theme.colors.secondary]}
        />
      }
    >
      <Text style={styles.sectionTitle}>Select a Lender</Text>
      {lendersError ? (
        <TouchableOpacity
          style={styles.lendersError}
          onPress={fetchLenders}
          accessibilityRole="button"
          accessibilityLabel="Retry loading lenders"
        >
          <Ionicons name="cloud-offline-outline" size={20} color={theme.colors.error} />
          <Text style={styles.lendersErrorText}>{lendersError}</Text>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      ) : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.lendersContainer}>
        {lenders.length === 0 ? (
          <Text style={styles.noLendersText}>
            {lendersError ? 'Lenders could not be loaded.' : 'No lenders available right now.'}
          </Text>
        ) : (
          lenders.map((lender) => (
            <TouchableOpacity
              key={lender._id}
              style={[
                styles.lenderCard,
                selectedLenderId === lender._id && styles.selectedLenderCard
              ]}
              onPress={() => selectLender(lender._id)}
              accessibilityRole="button"
              accessibilityState={{ selected: selectedLenderId === lender._id }}
            >
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={24} color={selectedLenderId === lender._id ? theme.colors.primary : theme.colors.textSecondary} />
              </View>
              <Text style={[styles.lenderName, selectedLenderId === lender._id && styles.selectedLenderText]}>
                {lender.name}
              </Text>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={12} color={theme.colors.accent} />
                <Text style={styles.ratingText}>{lender.averageRating ? lender.averageRating.toFixed(1) : 'New'}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <Card style={styles.formCard}>
        <Text style={styles.cardTitle}>Loan Details</Text>
        {pendingLoan ? (
          <Text style={styles.pendingRequestNotice}>
            You already have a pending request with this lender. Update the terms below and resubmit to update that request.
          </Text>
        ) : null}
        {errorMessage ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={18} color={theme.colors.error} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}
        
        <Input
          label="Amount (₹)"
          placeholder="Min. 100"
          keyboardType="decimal-pad"
          returnKeyType="next"
          value={amount}
          onChangeText={setAmount}
        />

        <Input
          label="Interest Rate (%)"
          placeholder="e.g. 5"
          keyboardType="decimal-pad"
          returnKeyType="next"
          value={interestRate}
          onChangeText={setInterestRate}
        />

        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total Repayable:</Text>
          <Text style={styles.totalValue}>₹{calculateTotal()}</Text>
        </View>

        <Input
          label="Due Date (YYYY-MM-DD, must be in the future)"
          placeholder="YYYY-MM-DD"
          value={dueDate}
          onChangeText={setDueDate}
        />

        <Input
          label="Purpose"
          placeholder="Why do you need this loan?"
          value={purpose}
          onChangeText={setPurpose}
        />

        <Input
          label="Note (Optional)"
          placeholder="Any additional details..."
          multiline
          numberOfLines={3}
          value={note}
          onChangeText={setNote}
        />

        <View style={styles.paymentFlowNotice}>
          <Ionicons name="information-circle-outline" size={18} color={theme.colors.secondary} />
          <View style={styles.paymentFlowCopy}>
            <Text style={styles.paymentFlowText}>
              No payment is due with a request. Once the loan is active, record repayment from your loan card.
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Loans', { screen: 'MoneyLoans' })}
              accessibilityRole="button"
            >
              <Text style={styles.paymentFlowLink}>Track loan payments</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Button
          title={submitting ? "Submitting..." : pendingLoan ? "Update Loan Request" : "Submit Request"}
          onPress={handleSubmit}
          disabled={submitting}
          style={styles.submitButton}
        />
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl * 2,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  lendersContainer: {
    marginBottom: theme.spacing.lg,
    flexDirection: 'row',
  },
  noLendersText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.normal,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  lenderCard: {
    width: 100,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    marginRight: theme.spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    ...theme.shadows.card,
  },
  selectedLenderCard: {
    borderColor: theme.colors.primary,
    backgroundColor: `${theme.colors.primary}10`, // very light primary
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  lenderName: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  selectedLenderText: {
    color: theme.colors.primary,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.normal,
    color: theme.colors.textSecondary,
    marginLeft: 4,
  },
  formCard: {
    padding: theme.spacing.md,
  },
  cardTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  totalLabel: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.normal,
    color: theme.colors.textSecondary,
  },
  totalValue: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
  },
  submitButton: {
    marginTop: theme.spacing.md,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: `${theme.colors.error}40`,
    backgroundColor: `${theme.colors.error}12`,
  },
  pendingRequestNotice: {
    color: theme.colors.accent,
    backgroundColor: `${theme.colors.accent}18`,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    fontSize: theme.typography.sizes.sm,
    lineHeight: 20,
  },
  paymentFlowNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    backgroundColor: `${theme.colors.secondary}10`,
    borderColor: `${theme.colors.secondary}25`,
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  paymentFlowCopy: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  paymentFlowText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.xs,
    lineHeight: 18,
  },
  paymentFlowLink: {
    color: theme.colors.secondary,
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.bold,
  },
  errorText: {
    flex: 1,
    color: theme.colors.error,
    fontSize: theme.typography.sizes.sm,
  },
  lendersError: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3c242a',
    borderWidth: 1,
    borderColor: '#6f3942',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  lendersErrorText: {
    flex: 1,
    color: theme.colors.error,
    fontSize: theme.typography.sizes.sm,
    marginHorizontal: theme.spacing.sm,
  },
  retryText: {
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.bold,
  },
});

export default MoneyLoanRequestScreen;
