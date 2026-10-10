import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../api/api';
import { theme } from '../theme';
import Card from '../components/Card';
import LoadingScreen from '../components/LoadingScreen';
import Button from '../components/Button';
import ExternalPaymentModal from '../components/ExternalPaymentModal';

const formatMoney = (amount) => Number(amount || 0).toLocaleString('en-IN', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export default function FinesScreen() {
  const [finances, setFinances] = useState(null);
  const [borrows, setBorrows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [payment, setPayment] = useState(null);
  const [acting, setActing] = useState('');
  const navigation = useNavigation();

  const fetchFinances = useCallback(async () => {
    setLoadError('');
    try {
      const [financeResponse, borrowResponse] = await Promise.all([
        api.get('/borrows/financial'),
        api.get('/borrows/mine'),
      ]);
      if (!financeResponse.data?.summary || !Array.isArray(borrowResponse.data?.borrows)) {
        throw new Error('The server returned incomplete financial information. Please try again.');
      }
      setFinances(financeResponse.data.summary);
      setBorrows(borrowResponse.data.borrows);
      return true;
    } catch (error) {
      console.error('Failed to fetch finances', error);
      setLoadError(error.response?.data?.message || error.message || 'Could not load your financial details. Check your connection and try again.');
      return false;
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchFinances();
  }, [fetchFinances]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchFinances();
  }, [fetchFinances]);

  const duePayments = useMemo(() => borrows.flatMap((borrow) => {
    const payments = [];
    if (
      ['active', 'returned'].includes(borrow.status)
      && !borrow.depositPaid
      && Number(borrow.depositAmount) > 0
    ) {
      payments.push({
        id: `${borrow._id}:pay-deposit`,
        borrowId: borrow._id,
        action: 'pay-deposit',
        label: 'Security deposit',
        amount: borrow.depositAmount,
        icon: 'shield-checkmark-outline',
      });
    }
    if (borrow.status === 'returned' && !borrow.finePaid && Number(borrow.fineAmount) > 0) {
      payments.push({
        id: `${borrow._id}:pay-fine`,
        borrowId: borrow._id,
        action: 'pay-fine',
        label: 'Late fine',
        amount: borrow.fineAmount,
        icon: 'alert-circle-outline',
      });
    }
    return payments.map((entry) => ({
      ...entry,
      itemName: borrow.item?.name || 'Borrowed item',
      ownerName: borrow.owner?.name || 'Item owner',
      reference: borrow._id?.slice(0, 7).toUpperCase(),
    }));
  }), [borrows]);

  const recordPayment = async () => {
    if (!payment) return false;
    setActing(payment.id);
    try {
      await api.put(`/borrows/${payment.borrowId}/${payment.action}`);
      await fetchFinances();
      return true;
    } catch (error) {
      console.error(`Failed to record ${payment.action}`, error);
      throw error;
    } finally {
      setActing('');
    }
  };

  if (loading) {
    return <LoadingScreen message="Loading financial details..." />;
  }

  if (!finances && loadError) {
    return (
      <View style={styles.errorState}>
        <View style={styles.errorIcon}>
          <Ionicons name="cloud-offline-outline" size={30} color={theme.colors.error} />
        </View>
        <Text style={styles.errorTitle}>Financial details unavailable</Text>
        <Text style={styles.errorMessage}>{loadError}</Text>
        <Button title="Try again" onPress={onRefresh} loading={refreshing} />
      </View>
    );
  }

  const borrowerStats = finances?.borrower || {
    totalDepositsPaid: 0,
    totalDepositsPending: 0,
    totalFinesPaid: 0,
    totalFinesPending: 0,
  };
  const ownerStats = finances?.owner || {
    totalDepositsCollected: 0,
    totalFinesCollected: 0,
  };
  const amountDue = duePayments.reduce((total, entry) => total + Number(entry.amount || 0), 0);

  const renderStatCard = (title, amount, icon, color, subtitle) => (
    <Card style={styles.statCard}>
      <View style={styles.statHeader}>
        <View style={[styles.iconBg, { backgroundColor: `${color}15` }]}>
          <Ionicons name={icon} size={22} color={color} />
        </View>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <Text style={[styles.statAmount, { color }]}>₹{formatMoney(amount)}</Text>
      {subtitle ? <Text style={styles.statSubtitle}>{subtitle}</Text> : null}
    </Card>
  );

  const renderProgressBar = (paid, pending, colorPaid, colorPending) => {
    const paidAmount = Number(paid || 0);
    const pendingAmount = Number(pending || 0);
    const total = paidAmount + pendingAmount;
    if (!total) return null;

    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { flex: paidAmount, backgroundColor: colorPaid }]} />
          <View style={[styles.progressBarFill, { flex: pendingAmount, backgroundColor: colorPending }]} />
        </View>
        <View style={styles.progressLegend}>
          <Text style={styles.legendText}>Paid ₹{formatMoney(paidAmount)}</Text>
          <Text style={styles.legendText}>Pending ₹{formatMoney(pendingAmount)}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.secondary]} />
        }
      >
        {loadError ? (
          <View style={styles.inlineError}>
            <Ionicons name="alert-circle-outline" size={20} color={theme.colors.error} />
            <Text style={styles.inlineErrorText}>{loadError}</Text>
          </View>
        ) : null}

        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <View style={styles.heroIcon}>
              <Ionicons name="wallet-outline" size={22} color="#ffffff" />
            </View>
            <Text style={styles.heroEyebrow}>CAMPUS LEDGER · YOUR FINANCIALS</Text>
          </View>
          <Text style={styles.heroTitle}>Stay on top of what’s due.</Text>
          <Text style={styles.heroCaption}>Track deposits and fines in one place.</Text>
          <View style={styles.heroTotal}>
            <View>
              <Text style={styles.heroTotalLabel}>Ready to record</Text>
              <Text style={styles.heroAmount}>₹{formatMoney(amountDue)}</Text>
            </View>
            <View style={styles.heroCount}>
              <Text style={styles.heroCountValue}>{duePayments.length}</Text>
              <Text style={styles.heroCountLabel}>payments</Text>
            </View>
          </View>
        </View>

        <Button
          title="Manage peer loans and repayments"
          onPress={() => navigation.navigate('Activity', { screen: 'MoneyLoans' })}
          style={styles.loanButton}
        />

        <View style={styles.paymentHeading}>
          <View>
            <Text style={styles.sectionTitle}>Payments to record</Text>
            <Text style={styles.sectionCaption}>Record payments after you’ve paid outside BorrowBack.</Text>
          </View>
        </View>

        {duePayments.length ? duePayments.map((entry) => (
          <Card key={entry.id} style={styles.paymentCard}>
            <View style={styles.paymentCardTop}>
              <View style={[styles.paymentIcon, entry.action === 'pay-fine' && styles.fineIcon]}>
                <Ionicons
                  name={entry.icon}
                  size={20}
                  color={entry.action === 'pay-fine' ? theme.colors.error : theme.colors.secondary}
                />
              </View>
              <View style={styles.paymentCopy}>
                <Text style={styles.paymentTitle}>{entry.label}</Text>
                <Text style={styles.paymentItem} numberOfLines={1}>{entry.itemName}</Text>
                <Text style={styles.paymentOwner}>To {entry.ownerName}</Text>
              </View>
              <Text style={styles.paymentAmount}>₹{formatMoney(entry.amount)}</Text>
            </View>
            <TouchableOpacity
              style={styles.recordButton}
              onPress={() => setPayment({
                id: entry.id,
                borrowId: entry.borrowId,
                action: entry.action,
                amount: entry.amount,
                title: entry.action === 'pay-fine' ? 'Record Fine Payment' : 'Record Security Deposit',
                reference: entry.reference,
              })}
              disabled={Boolean(acting)}
              accessibilityRole="button"
              accessibilityLabel={`Record ${entry.label} for ${entry.itemName}, ₹${formatMoney(entry.amount)}`}
              accessibilityState={{ disabled: Boolean(acting) }}
            >
              {acting === entry.id
                ? <ActivityIndicator size="small" color={theme.colors.surface} />
                : <Ionicons name="checkmark-circle-outline" size={18} color={theme.colors.surface} />}
              <Text style={styles.recordButtonText}>I paid outside the app</Text>
            </TouchableOpacity>
          </Card>
        )) : (
          <View style={styles.allCaughtUp}>
            <View style={styles.caughtUpIcon}>
              <Ionicons name="checkmark-done-outline" size={25} color={theme.colors.success} />
            </View>
            <Text style={styles.caughtUpTitle}>You’re all caught up</Text>
            <Text style={styles.caughtUpCopy}>Any deposits or fines that need recording will show up here.</Text>
          </View>
        )}

        <Text style={[styles.sectionTitle, styles.sectionSpaced]}>As borrower</Text>
        <View style={styles.row}>
          {renderStatCard('Deposits paid', borrowerStats.totalDepositsPaid, 'shield-checkmark-outline', theme.colors.success)}
          {renderStatCard('Deposits pending', borrowerStats.totalDepositsPending, 'shield-half-outline', theme.colors.accent)}
        </View>
        <View style={styles.row}>
          {renderStatCard('Fines paid', borrowerStats.totalFinesPaid, 'cash-outline', theme.colors.primary)}
          {renderStatCard('Fines pending', borrowerStats.totalFinesPending, 'alert-circle-outline', theme.colors.error)}
        </View>

        {(Number(borrowerStats.totalFinesPaid) > 0 || Number(borrowerStats.totalFinesPending) > 0) ? (
          <Card style={styles.vizCard}>
            <Text style={styles.vizTitle}>Fine payment progress</Text>
            {renderProgressBar(
              borrowerStats.totalFinesPaid,
              borrowerStats.totalFinesPending,
              theme.colors.primary,
              theme.colors.error
            )}
          </Card>
        ) : null}

        <Text style={[styles.sectionTitle, styles.sectionSpaced]}>As owner / lender</Text>
        <View style={styles.row}>
          {renderStatCard('Deposits collected', ownerStats.totalDepositsCollected, 'wallet-outline', theme.colors.success)}
          {renderStatCard('Fines collected', ownerStats.totalFinesCollected, 'trending-up-outline', theme.colors.secondary)}
        </View>
      </ScrollView>

      <ExternalPaymentModal
        visible={Boolean(payment)}
        title={payment?.title}
        amount={payment?.amount}
        reference={payment?.reference}
        onClose={() => setPayment(null)}
        onConfirm={recordPayment}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  errorState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.xl,
  },
  errorIcon: {
    width: 64,
    height: 64,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3c242a',
    marginBottom: theme.spacing.md,
  },
  errorTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  errorMessage: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.sm,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  scrollContent: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  hero: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderBottomWidth: 4,
    borderBottomColor: theme.colors.accent,
    ...theme.shadows.card,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  heroIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#ffffff18',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  heroEyebrow: {
    color: theme.colors.accent,
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.bold,
    letterSpacing: 1.2,
  },
  heroTitle: {
    color: theme.colors.surface,
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
  },
  heroCaption: {
    color: '#f0ead9',
    fontSize: theme.typography.sizes.sm,
    marginTop: theme.spacing.xs,
  },
  heroTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#fffaf055',
    marginTop: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  loanButton: {
    marginBottom: theme.spacing.lg,
  },
  heroTotalLabel: {
    color: theme.colors.accent,
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  heroAmount: {
    color: theme.colors.surface,
    fontSize: 32,
    fontWeight: theme.typography.weights.bold,
    marginTop: 2,
  },
  heroCount: {
    alignItems: 'flex-end',
  },
  heroCountValue: {
    color: theme.colors.surface,
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
  },
  heroCountLabel: {
    color: '#f0ead9',
    fontSize: theme.typography.sizes.xs,
  },
  paymentHeading: {
    marginBottom: theme.spacing.sm,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
  },
  sectionCaption: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.xs,
    lineHeight: 18,
    marginTop: 3,
  },
  paymentCard: {
    marginBottom: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  paymentCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#fffaf026',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  fineIcon: {
    backgroundColor: '#ef444414',
  },
  paymentCopy: {
    flex: 1,
    minWidth: 0,
  },
  paymentTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
  },
  paymentItem: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.xs,
    marginTop: 3,
  },
  paymentOwner: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.xs,
    marginTop: 2,
  },
  paymentAmount: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
    marginLeft: theme.spacing.xs,
  },
  recordButton: {
    minHeight: 46,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  recordButtonText: {
    color: theme.colors.surface,
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
  },
  allCaughtUp: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginTop: theme.spacing.xs,
  },
  caughtUpIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#10b98116',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  caughtUpTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
  },
  caughtUpCopy: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.sm,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: theme.spacing.xs,
  },
  sectionSpaced: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: -theme.spacing.xs / 2,
  },
  statCard: {
    flex: 1,
    marginHorizontal: theme.spacing.xs / 2,
    marginBottom: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  statHeader: {
    marginBottom: theme.spacing.sm,
  },
  iconBg: {
    width: 36,
    height: 36,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  statTitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.semibold,
  },
  statAmount: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
  },
  statSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.xs,
    marginTop: theme.spacing.xs,
  },
  vizCard: {
    padding: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  vizTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    marginBottom: theme.spacing.md,
  },
  progressContainer: {
    marginTop: theme.spacing.xs,
  },
  progressBarBg: {
    height: 12,
    backgroundColor: theme.colors.border,
    borderRadius: theme.borderRadius.full,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
  },
  progressLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.sm,
  },
  legendText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.xs,
  },
  inlineError: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3c242a',
    borderWidth: 1,
    borderColor: '#6f3942',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  inlineErrorText: {
    flex: 1,
    color: theme.colors.error,
    fontSize: theme.typography.sizes.sm,
    marginLeft: theme.spacing.sm,
  },
});
