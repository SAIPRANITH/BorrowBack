import React from 'react';
import { DeviceEventEmitter, StyleSheet, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import ImmersiveBackground from './src/components/ImmersiveBackground';
import { theme } from './src/theme';
import Text from './src/components/ThemedText';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

class AppErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('The app failed while rendering:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>BorrowBack couldn&apos;t start</Text>
          <Text style={styles.errorMessage}>
            An unexpected error interrupted the app. Try opening it again.
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => this.setState({ hasError: false })}
            style={styles.retryButton}
          >
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  return (
    <AppErrorBoundary>
      <SafeAreaProvider>
        <AuthProvider>
          <StatusBar style="light" />
          <ImmersiveBackground
            onTouchStartCapture={() => DeviceEventEmitter.emit('USER_ACTIVITY')}
          >
            <AppNavigator />
          </ImmersiveBackground>
        </AuthProvider>
      </SafeAreaProvider>
    </AppErrorBoundary>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    backgroundColor: theme.colors.background,
  },
  errorTitle: {
    marginBottom: 10,
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  errorMessage: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    borderRadius: 12,
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  retryText: {
    color: theme.colors.background,
    fontSize: 14,
    fontWeight: '700',
  },
});
