import React, { createContext, useState, useEffect, useContext, useRef, useCallback } from 'react';
import { AppState, DeviceEventEmitter, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import api from '../api/api';

const AuthContext = createContext();
const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000;

// Helper: extract user fields from the flat API response (strips success/token)
const extractUser = (data) => {
  if (!data) return null;
  const { success, token, ...user } = data;
  return user;
};

const registerForPushNotifications = async () => {
  if (Platform.OS === 'web') return;

  const projectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID;
  if (!projectId) {
    console.warn('Push notifications are disabled until EXPO_PUBLIC_EAS_PROJECT_ID is configured.');
    return;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'BorrowBack updates',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'default',
    });
  }

  let { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    ({ status } = await Notifications.requestPermissionsAsync());
  }
  if (status !== 'granted') {
    console.warn('Push notifications are disabled because notification permission was not granted.');
    return;
  }

  const pushToken = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  await api.post('/notifications/push-token', { pushToken });
  await AsyncStorage.setItem('pushToken', pushToken);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const lastActivityAt = useRef(Date.now());

  const fetchUser = async () => {
    try {
      const response = await api.get('/auth/me');
      // Backend returns flat: { success, _id, name, email, phone, ... }
      setUser(extractUser(response.data));
    } catch (e) {
      console.error('Failed to fetch user', e);
      if (e.response?.status === 401) {
        logout();
      }
    }
  };

  const login = async (email, password) => {
    try {
      setError(null);
      const response = await api.post('/auth/login', { email, password });
      // Backend returns flat: { success, _id, name, email, token, ... }
      const newToken = response.data.token;

      await AsyncStorage.setItem('userToken', newToken);
      lastActivityAt.current = Date.now();
      setToken(newToken);
      setUser(extractUser(response.data));
      return extractUser(response.data);
    } catch (e) {
      const msg = e.response?.data?.message
        || (e.code === 'ECONNABORTED'
          ? 'The request timed out. Please try again.'
          : e.message === 'Network Error'
            ? 'Unable to connect. Check your internet connection and try again.'
            : 'Login failed. Please try again.');
      setError(msg);
      throw e;
    }
  };

  const register = async (name, email, password, phone) => {
    try {
      setError(null);
      const response = await api.post('/auth/register', { name, email, password, phone });
      // Backend returns flat: { success, _id, name, email, token, ... }
      const newToken = response.data.token;

      await AsyncStorage.setItem('userToken', newToken);
      lastActivityAt.current = Date.now();
      setToken(newToken);
      setUser(extractUser(response.data));
      return extractUser(response.data);
    } catch (e) {
      const msg = e.response?.data?.message || 'Registration failed';
      setError(msg);
      throw e;
    }
  };

  const logout = useCallback(async () => {
    try {
      const pushToken = await AsyncStorage.getItem('pushToken');
      if (pushToken) {
        try {
          await api.delete('/notifications/push-token', { data: { pushToken } });
        } catch (e) {
          console.error('Failed to unregister push notifications', e);
        }
        await AsyncStorage.removeItem('pushToken');
      }
      await AsyncStorage.removeItem('userToken');
      setToken(null);
      setUser(null);
      setError(null);
    } catch (e) {
      console.error('Logout failed', e);
    }
  }, []);

  useEffect(() => {
    if (!token) return undefined;

    registerForPushNotifications().catch((e) => {
      console.error('Failed to register for push notifications', e);
    });
    return undefined;
  }, [token]);

  useEffect(() => {
    const loadToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('userToken');
        if (storedToken) {
          lastActivityAt.current = Date.now();
          setToken(storedToken);
          await fetchUser();
        }
      } catch (e) {
        console.error('Failed to load token', e);
      } finally {
        setLoading(false);
      }
    };

    loadToken();
    const logoutListener = DeviceEventEmitter.addListener('LOGOUT', logout);

    return () => logoutListener.remove();
  }, [logout]);

  useEffect(() => {
    if (!token) return undefined;

    let inactivityTimer;
    const checkInactivity = () => {
      clearTimeout(inactivityTimer);
      const remaining = INACTIVITY_TIMEOUT_MS - (Date.now() - lastActivityAt.current);
      if (remaining <= 0) {
        logout();
      } else {
        inactivityTimer = setTimeout(checkInactivity, remaining);
      }
    };

    const recordActivity = () => {
      if (AppState.currentState !== 'active') return;
      lastActivityAt.current = Date.now();
      checkInactivity();
    };

    const activitySubscription = DeviceEventEmitter.addListener('USER_ACTIVITY', recordActivity);
    const appStateSubscription = AppState.addEventListener('change', state => {
      if (state === 'active') {
        checkInactivity();
      } else {
        clearTimeout(inactivityTimer);
      }
    });

    checkInactivity();
    return () => {
      clearTimeout(inactivityTimer);
      activitySubscription.remove();
      appStateSubscription.remove();
    };
  }, [token, logout]);

  const updateUser = async (data) => {
    try {
      setError(null);
      const response = await api.put('/auth/profile', data);
      // Backend returns flat: { success, _id, name, email, token, ... }
      if (response.data.token) {
        await AsyncStorage.setItem('userToken', response.data.token);
        setToken(response.data.token);
      }
      setUser(extractUser(response.data));
      return extractUser(response.data);
    } catch (e) {
      const msg = e.response?.data?.message || 'Update failed';
      setError(msg);
      throw e;
    }
  };

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        login,
        register,
        logout,
        updateUser,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
