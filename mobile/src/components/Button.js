import React from 'react';
import { TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import Text from './ThemedText';
import { theme } from '../theme';

const Button = ({ 
  title, 
  onPress, 
  variant = 'primary', 
  loading = false, 
  disabled = false,
  fullWidth = true,
  size = 'medium',
  style,
  textStyle
}) => {
  const getBackgroundColor = () => {
    if (disabled) return theme.colors.border;
    switch (variant) {
      case 'secondary': return theme.colors.secondary;
      case 'danger': return theme.colors.error;
      case 'outline': return 'transparent';
      case 'primary':
      default:
        return theme.colors.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return theme.colors.textSecondary;
    if (variant === 'outline') return theme.colors.accent;
    return '#080808';
  };

  const getBorderColor = () => {
    if (disabled) return theme.colors.border;
    if (variant === 'outline') return theme.colors.coralLine;
    return 'transparent';
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      style={[
        styles.button,
        size === 'large' && styles.largeButton,
        fullWidth && styles.fullWidth,
        variant === 'primary' && !disabled && styles.primaryShadow,
        { 
          backgroundColor: variant === 'outline' && !disabled
            ? 'rgba(255,73,62,0.055)'
            : getBackgroundColor(),
          borderColor: getBorderColor(),
          borderWidth: variant === 'outline' || disabled ? 1 : 0,
        },
        style,
        (disabled || loading) && styles.disabledButton
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <Text style={[styles.text, { color: getTextColor() }, textStyle, (disabled || loading) && styles.disabledButtonText]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    flexDirection: 'row',
  },
  largeButton: {
    height: 56,
    borderRadius: theme.borderRadius.lg,
  },
  primaryShadow: {
    shadowColor: theme.colors.secondary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.24,
    shadowRadius: 12,
    elevation: 3,
  },
  disabledButton: {
    backgroundColor: '#262626',
    borderColor: 'rgba(255,255,255,0.06)',
    shadowOpacity: 0,
    elevation: 0,
  },
  disabledButtonText: {
    color: '#e5e5e5',
  },
  fullWidth: {
    width: '100%',
  },
  text: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
  },
});

export default Button;
