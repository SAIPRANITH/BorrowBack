import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme';

const PlaceholderScreen = ({ title, route }) => {
  // If title is passed as prop, use it, else try route params, else generic text
  const screenTitle = title || route?.params?.title || route?.name || 'Placeholder';

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{screenTitle} Screen</Text>
      <Text style={styles.subtext}>Coming Soon</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  text: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  subtext: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textSecondary,
  },
});

export default PlaceholderScreen;
