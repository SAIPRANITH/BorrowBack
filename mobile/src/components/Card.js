import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../theme';

const Card = ({ children, onPress, style, padding = theme.spacing.md }) => {
  const CardComponent = onPress ? TouchableOpacity : View;
  
  return (
    <CardComponent 
      style={[styles.card, { padding }, style]} 
      onPress={onPress}
      activeOpacity={onPress ? 0.86 : 1}
      accessibilityRole={onPress ? 'button' : undefined}
    >
      {children}
    </CardComponent>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.card,
    marginVertical: theme.spacing.sm,
  },
});

export default Card;
