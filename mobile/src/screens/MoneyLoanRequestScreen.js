import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
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
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const navigation = useNavigation();

  // Form State
  const [selectedLenderId, setSelectedLenderId] = useState(null);
  const [amount, setAmount] = useState('');
  const [interestRate, setInterestRate] = useState('0');
  const [dueDate, setDueDate] = useState('');
  const [purpose, setPurpose] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    fetchLenders();
  }, []);

  const fetchLenders = async () => {
    try {
      const response = await api.get('/money-loans/lenders');
      setLenders(response.data.lenders || []);
    } catch (error) {
      console.error('Error fetching lenders:', error);
      Alert.alert('Error', 'Failed to load potential lenders.');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    const numAmount = parseFloat(amount) || 0;
    const numRate = parseFloat(interestRate) || 0;
    return (numAmount + (numAmount * numRate / 100)).toFixed(2);
  };

  const handleSubmit = async () => {
    if (!selectedLenderId) {
      Alert.alert('Validation Error', 'Please select a lender.');
      return;
    }
    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount < 100) {
      Alert.alert('Validation Error', 'Amount must be at least \u20B9100.');
      return;
    }
    if (!dueDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      Alert.alert('Validation Error', 'Due Date must be in YYYY-MM-DD format.');
      return;
    }
    if (!purpose.trim()) {
      Alert.alert('Validation Error', 'Please provide a purpose for the loan.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/money-loans', {
        lenderId: selectedLenderId,
        amount: numAmount,
        interestRate: parseFloat(interestRate) || 0,
        dueDate,
        purpose,
        note
      });
      Alert.alert('Success', 'Loan request submitted successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error submitting loan request:', error);
      Alert.alert('Error', 'Failed to submit loan request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingScreen message="Loading form..." />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Select a Lender</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.lendersContainer}>
        {lenders.length === 0 ? (
          <Text style={styles.noLendersText}>No lenders available.</Text>
        ) : (
          lenders.map((lender) => (
            <TouchableOpacity
              key={lender.id}
              style={[
                styles.lenderCard,
                selectedLenderId === lender.id && styles.selectedLenderCard
              ]}
              onPress={() => setSelectedLenderId(lender.id)}
            >
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={24} color={selectedLenderId === lender.id ? theme.colors.primary : theme.colors.textSecondary} />
              </View>
              <Text style={[styles.lenderName, selectedLenderId === lender.id && styles.selectedLenderText]}>
                {lender.name}
              </Text>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={12} color={theme.colors.accent} />
                <Text style={styles.ratingText}>{lender.rating || 'New'}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <Card style={styles.formCard}>
        <Text style={styles.cardTitle}>Loan Details</Text>
        
        <Input
          label="Amount (₹)"
          placeholder="Min. 100"
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
        />

        <Input
          label="Interest Rate (%)"
          placeholder="e.g. 5"
          keyboardType="numeric"
          value={interestRate}
          onChangeText={setInterestRate}
        />

        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total Repayable:</Text>
          <Text style={styles.totalValue}>₹{calculateTotal()}</Text>
        </View>

        <Input
          label="Due Date (YYYY-MM-DD)"
          placeholder="2024-12-31"
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

        <Button
          title={submitting ? "Submitting..." : "Submit Request"}
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
});

export default MoneyLoanRequestScreen;
