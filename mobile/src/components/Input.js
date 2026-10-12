import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Text from './ThemedText';
import TextInput from './ThemedTextInput';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';

const Input = ({
  label,
  error,
  icon,
  secureTextEntry,
  variant = 'default',
  style,
  containerStyle,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View style={[
        variant === 'underline' ? styles.underlineInputContainer : styles.inputContainer,
        variant === 'underline' && isFocused ? styles.underlineInputFocused : isFocused && styles.inputFocused,
        error && styles.inputError
      ]}>
        {icon && (React.isValidElement(icon)
          ? React.cloneElement(icon, {
              size: icon.props.size || 20,
              color: isFocused ? theme.colors.primary : theme.colors.textSecondary,
              style: [styles.icon, icon.props.style],
            })
          : (
            <Ionicons
              name={icon}
              size={20}
              color={isFocused ? theme.colors.primary : theme.colors.textSecondary}
              style={styles.icon}
            />
          ))}
        
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={theme.colors.textSecondary}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          {...props}
        />

        {secureTextEntry && (
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            accessibilityRole="button"
            accessibilityLabel={isPasswordVisible ? 'Hide password' : 'Show password'}
            accessibilityState={{ selected: isPasswordVisible }}
            hitSlop={8}
          >
            <Ionicons
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
    width: '100%',
  },
  label: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: theme.borderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.035)',
    minHeight: 52,
    paddingHorizontal: theme.spacing.md,
  },
  inputFocused: {
    borderColor: 'rgba(255,98,88,0.82)',
    backgroundColor: 'rgba(255,73,62,0.055)',
  },
  underlineInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: theme.borderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.035)',
    minHeight: 52,
    paddingHorizontal: theme.spacing.md,
  },
  underlineInputFocused: {
    borderColor: 'rgba(255,98,88,0.82)',
    backgroundColor: 'rgba(255,73,62,0.055)',
  },
  inputError: {
    borderColor: 'rgba(251,113,133,0.78)',
  },
  icon: {
    marginRight: theme.spacing.sm,
  },
  input: {
    flex: 1,
    height: '100%',
    color: theme.colors.text,
    fontSize: theme.typography.sizes.md,
  },
  eyeButton: {
    padding: theme.spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.typography.sizes.xs,
    marginTop: theme.spacing.xs,
  },
});

export default Input;
