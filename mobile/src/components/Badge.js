import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme';

const getBadgeStyles = (status) => {
  switch (status?.toLowerCase()) {
    case 'pending':
    case 'lent': // for money loans
      return { bg: '#fef3c7', text: '#d97706' }; // amber/orange
    case 'active':
    case 'approved':
      return { bg: '#e0f2fe', text: '#0284c7' }; // blue
    case 'available':
    case 'returned':
    case 'repaid':
      return { bg: '#d1fae5', text: '#059669' }; // emerald/green
    case 'overdue':
    case 'rejected':
      return { bg: '#fee2e2', text: '#dc2626' }; // red
    default:
      return { bg: theme.colors.border, text: theme.colors.textSecondary };
  }
};

const Badge = ({ status, label }) => {
  const { bg, text } = getBadgeStyles(status);
  
  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: text }]}>
        {label || status?.toUpperCase()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs / 2,
    borderRadius: theme.borderRadius.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.bold,
  },
});

export default Badge;
