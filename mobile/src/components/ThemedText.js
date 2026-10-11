import React, { forwardRef } from 'react';
import { Text as NativeText } from 'react-native';
import { theme } from '../theme';

const ThemedText = forwardRef(({ style, ...props }, ref) => (
  <NativeText
    ref={ref}
    {...props}
    style={[{ color: theme.colors.text }, style]}
  />
));

ThemedText.displayName = 'ThemedText';

export default ThemedText;
