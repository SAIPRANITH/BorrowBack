import React from 'react';
import { DeviceEventEmitter, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="light" />
        <View
          style={{ flex: 1 }}
          onTouchStartCapture={() => DeviceEventEmitter.emit('USER_ACTIVITY')}
        >
          <AppNavigator />
        </View>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
