import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/api';
import { theme } from '../theme';
import Card from '../components/Card';
import LoadingScreen from '../components/LoadingScreen';
import Button from '../components/Button';

export default function FinesScreen() {
  const [finances, setFinances] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState('');

  const fetchFinances = async () => {
    setLoadError('');
    try {
      const response = await api.get('/borrows/financial');
      setFinances(response.data.summary);
    } catch (error) {
      console.error('Failed to fetch finances', error);
      setLoadError(error.response?.data?.message || 'Could not load your financial details. Check your connection and try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFinances();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchFinances();
  }, []);

  if (loading && !refreshing) {
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
    totalDepositsPaid: 0, totalDepositsPending: 0, totalFinesPaid: 0, totalFinesPending: 0 
  };
  const ownerStats = finances?.owner || { 
    totalDepositsCollected: 0, totalFinesCollected: 0 
  };

  const renderStatCard = (title, amount, icon, color, subtitle) => (
    <Card style={styles.statCard}>
      <View style={styles.statHeader}>
        <View style={[styles.iconBg, { backgroundColor: `${color}15` }]}>
          <Ionicons name={icon} size={24} color={color} />
        </View>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <View style={styles.amountContainer}>
        <Text style={styles.currencySymbol}>₹</Text>
        <Text style={[styles.statAmount, { color }]}>{amount.toFixed(2)}</Text>
      </View>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </Card>
  );

  const renderProgressBar = (paid, pending, colorPaid, colorPending) => {
    const total = paid + pending;
    if (total === 0) return null;
    
    const paidPct = (paid / total) * 100;
    const pendingPct = (pending / total) * 100;

    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${paidPct}%`, backgroundColor: colorPaid }]} />
          <View style={[styles.progressBarFill, { width: `${pendingPct}%`, backgroundColor: colorPending }]} />
        </View>
        <View style={styles.progressLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colorPaid }]} />
            <Text style={styles.legendText}>Paid (₹{paid})</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colorPending }]} />
            <Text style={styles.legendText}>Pending (₹{pending})</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.secondary]} />
      }
    >
      {loadError ? (
        <View style={styles.inlineError}>
          <Ionicons name="alert-circle-outline" size={18} color={theme.colors.error} />
          <Text style={styles.inlineErrorText}>{loadError}</Text>
        </View>
      ) : null}
      <Text style={styles.sectionTitle}>As Borrower</Text>
      
      <View style={styles.row}>
        {renderStatCard(
          'Deposits Paid', 
          borrowerStats.totalDepositsPaid, 
          'shield-checkmark-outline', 
          theme.colors.success
        )}
        {renderStatCard(
          'Deposits Pending', 
          borrowerStats.totalDepositsPending, 
          'shield-half-outline', 
          theme.colors.accent
        )}
      </View>

      <View style={styles.row}>
        {renderStatCard(
          'Fines Paid', 
          borrowerStats.totalFinesPaid, 
          'cash-outline', 
          theme.colors.primary
        )}
        {renderStatCard(
          'Fines Pending', 
          borrowerStats.totalFinesPending, 
          'alert-circle-outline', 
          theme.colors.error
        )}
      </View>

      {(borrowerStats.totalFinesPaid > 0 || borrowerStats.totalFinesPending > 0) && (
        <Card style={styles.vizCard}>
          <Text style={styles.vizTitle}>Fines Breakdown</Text>
          {renderProgressBar(
            borrowerStats.totalFinesPaid, 
            borrowerStats.totalFinesPending, 
            theme.colors.primary, 
            theme.colors.error
          )}
        </Card>
      )}

      <Text style={[styles.sectionTitle, styles.marginTop]}>As Owner/Lender</Text>
      
      <View style={styles.row}>
        {renderStatCard(
          'Deposits Collected', 
          ownerStats.totalDepositsCollected, 
          'wallet-outline', 
          theme.colors.success
        )}
        {renderStatCard(
          'Fines Collected', 
          ownerStats.totalFinesCollected, 
          'trending-up-outline', 
          theme.colors.secondary
        )}
      </View>
    </ScrollView>
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
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
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
  inlineError: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
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
  scrollContent: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    marginLeft: theme.spacing.xs,
  },
  marginTop: {
    marginTop: theme.spacing.lg,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  statCard: {
    flex: 1,
    marginHorizontal: theme.spacing.xs / 2,
    padding: theme.spacing.md,
  },
  statHeader: {
    marginBottom: theme.spacing.sm,
  },
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  statTitle: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.weights.medium,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  currencySymbol: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textSecondary,
    marginTop: 4,
    marginRight: 2,
  },
  statAmount: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: theme.typography.weights.bold,
  },
  statSubtitle: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  vizCard: {
    padding: theme.spacing.md,
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.md,
  },
  vizTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text,
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
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: theme.spacing.xs,
  },
  legendText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
  },
});
