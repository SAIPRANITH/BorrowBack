import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../theme';

const Card = ({ children, onPress, style, padding = theme.spacing.md }) => {
  const CardComponent = onPress ? TouchableOpacity : View;
  
  return (
    <CardComponent 
      style={[styles.card, { padding }, style]} 
      onPress={onPress}
      activeOpacity={onPress ? 0.9 : 1}
      accessibilityRole={onPress ? 'button' : undefined}
    >
      {children}
    </CardComponent>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.glass,
    borderRadius: theme.borderRadius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
    marginVertical: theme.spacing.sm,
    overflow: 'hidden',
    ...theme.shadows.card,
  },
});

export default Card;
