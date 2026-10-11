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
    backgroundColor: 'rgba(255,255,255,0.035)',
    borderRadius: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.12)',
    marginVertical: theme.spacing.sm,
  },
});

export default Card;
