import React, { forwardRef } from 'react';
import { TextInput as NativeTextInput } from 'react-native';
import { theme } from '../theme';

const ThemedTextInput = forwardRef(({ placeholderTextColor, style, ...props }, ref) => (
  <NativeTextInput
    ref={ref}
    {...props}
    placeholderTextColor={placeholderTextColor || theme.colors.textSecondary}
    style={[{ color: theme.colors.text }, style]}
  />
));

ThemedTextInput.displayName = 'ThemedTextInput';

export default ThemedTextInput;
