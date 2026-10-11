import React from 'react';
import { DeviceEventEmitter, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import ImmersiveBackground from './src/components/ImmersiveBackground';
import { theme } from './src/theme';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="light" />
        <View
          style={{ flex: 1, backgroundColor: theme.colors.background }}
          onTouchStartCapture={() => DeviceEventEmitter.emit('USER_ACTIVITY')}
        >
          <ImmersiveBackground>
            <AppNavigator />
          </ImmersiveBackground>
        </View>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
