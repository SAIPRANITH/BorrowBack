import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme';

const getBadgeStyles = (status) => {
  switch (status?.toLowerCase()) {
    case 'pending':
    case 'repaid_pending':
    case 'lent': // for money loans
      return { bg: '#493a22', text: theme.colors.accent };
    case 'active':
    case 'approved':
      return { bg: '#20382b', text: theme.colors.success };
    case 'available':
    case 'returned':
    case 'repaid':
      return { bg: '#20382b', text: theme.colors.success };
    case 'overdue':
    case 'rejected':
      return { bg: '#402724', text: theme.colors.error };
    default:
      return { bg: theme.colors.border, text: theme.colors.textSecondary };
  }
};

const Badge = ({ status, label, text: badgeText, color, backgroundColor }) => {
  const { bg, text: textColor } = getBadgeStyles(status);
  const resolvedTextColor = color || textColor;
  
  return (
    <View style={[styles.container, { backgroundColor: backgroundColor || (color ? `${color}20` : bg) }]}>
      <Text style={[styles.text, { color: resolvedTextColor }]}>
        {label || badgeText || status?.replace(/_/g, ' ').toUpperCase()}
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
