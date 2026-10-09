import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';
import LoadingScreen from '../components/LoadingScreen';

const TABS = ['My Loans', 'Requests', 'Lending', 'Summary'];

const MoneyLoansScreen = () => {
  const [activeTab, setActiveTab] = useState('My Loans');
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const { user } = useAuth();
  const navigation = useNavigation();

  const fetchLoans = async () => {
    try {
      let response;
      switch (activeTab) {
        case 'My Loans':
          response = await api.get('/money-loans/mine');
          setLoans(response.data.loans || []);
          break;
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
      }
    } catch (error) {
      console.error('Error fetching loans:', error);
      Alert.alert('Error', 'Failed to fetch loan data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchLoans();
    }, [activeTab])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchLoans();
  };

  const handleStatusChange = async (id, action) => {
    try {
      let endpoint = '';
      switch (action) {
        case 'repay':
          endpoint = `/money-loans/${id}/repay`;
          break;
        case 'accept':
          endpoint = `/money-loans/${id}/accept`;
          break;
        case 'reject':
          endpoint = `/money-loans/${id}/reject`;
          break;
        case 'confirm-repay':
          endpoint = `/money-loans/${id}/confirm-repay`;
          break;
      }
      
      await api.put(endpoint);
      Alert.alert('Success', 'Loan successfully updated.');
      onRefresh();
    } catch (error) {
      console.error(`Error updating loan ${id} with action ${action}:`, error);
      Alert.alert('Error', 'Failed to update loan status.');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return theme.colors.primary;
      case 'pending': return theme.colors.accent;
      case 'repaid': return theme.colors.success;
      case 'overdue': return theme.colors.error;
      case 'rejected': return theme.colors.textSecondary;
      default: return theme.colors.primary;
    }
  };

  const renderMyLoansItem = ({ item }) => {
    const totalRepayable = item.amount + (item.amount * (item.interestRate / 100));
    
    return (
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.userName}>{item.lenderName || 'Lender'}</Text>
          <Badge text={item.status.toUpperCase()} color={getStatusColor(item.status)} />
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
        </View>

        <View style={styles.actionContainer}>
          {item.status === 'active' && (
            <Button 
              title="Mark Repaid" 
              onPress={() => handleStatusChange(item.id, 'repay')} 
              style={styles.actionButton}
            />
          )}
          {item.status === 'repaid' && (
            <Button 
              title="Rate Lender" 
              variant="outline"
              onPress={() => Alert.alert('Coming Soon', 'Rating feature is under development.')} 
              style={styles.actionButton}
            />
          )}
        </View>
      </Card>
    );
  };

  const renderRequestsItem = ({ item }) => (
    <Card style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.userName}>{item.borrowerName || 'Borrower'}</Text>
        <Text style={styles.amountText}>₹{item.amount}</Text>
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
      </View>

      <View style={styles.buttonRow}>
        <Button 
          title="Reject" 
          variant="outline"
          onPress={() => handleStatusChange(item.id, 'reject')} 
          style={[styles.flexButton, { borderColor: theme.colors.error }]}
          textStyle={{ color: theme.colors.error }}
        />
        <View style={{ width: theme.spacing.md }} />
        <Button 
          title="Accept" 
          onPress={() => handleStatusChange(item.id, 'accept')} 
          style={styles.flexButton}
        />
      </View>
    </Card>
  );

  const renderLendingItem = ({ item }) => (
    <Card style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.userName}>{item.borrowerName || 'Borrower'}</Text>
        <Badge text={item.status.toUpperCase()} color={getStatusColor(item.status)} />
      </View>
      <View style={styles.loanDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Amount Lent:</Text>
          <Text style={styles.detailValue}>₹{item.amount}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Due Date:</Text>
          <Text style={styles.detailValue}>{new Date(item.dueDate).toLocaleDateString()}</Text>
        </View>
      </View>

      <View style={styles.actionContainer}>
        {item.status === 'repaid_pending' && (
          <Button 
            title="Confirm Repayment" 
            onPress={() => handleStatusChange(item.id, 'confirm-repay')} 
            style={styles.actionButton}
          />
        )}
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
            <Text style={[styles.summaryValue, { color: theme.colors.accent }]}>₹{summaryData.lender.outstanding || 0}</Text>
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

      {activeTab === 'Summary' ? (
        renderSummary()
      ) : (
        <FlatList
          data={loans}
          keyExtractor={(item) => item.id.toString()}
          renderItem={
            activeTab === 'My Loans' ? renderMyLoansItem :
            activeTab === 'Requests' ? renderRequestsItem :
            renderLendingItem
          }
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <EmptyState 
              icon="wallet-outline" 
              title="No Loans Found" 
              message={`You have no ${activeTab.toLowerCase()} at the moment.`} 
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
