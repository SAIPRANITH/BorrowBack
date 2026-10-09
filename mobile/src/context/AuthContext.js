import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';
import api from '../api/api';

const AuthContext = createContext();

// Helper: extract user fields from the flat API response (strips success/token)
const extractUser = (data) => {
  if (!data) return null;
  const { success, token, ...user } = data;
  return user;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('userToken');
        if (storedToken) {
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

    return () => {
      logoutListener.remove();
    };
  }, []);

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
      setToken(newToken);
      setUser(extractUser(response.data));
      return extractUser(response.data);
    } catch (e) {
      const msg = e.response?.data?.message || 'Login failed';
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
      setToken(newToken);
      setUser(extractUser(response.data));
      return extractUser(response.data);
    } catch (e) {
      const msg = e.response?.data?.message || 'Registration failed';
      setError(msg);
      throw e;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      setToken(null);
      setUser(null);
      setError(null);
    } catch (e) {
      console.error('Logout failed', e);
    }
  };

  const updateUser = async (data) => {
    try {
      setError(null);
      const response = await api.put('/auth/profile', data);
      // Backend returns flat: { success, _id, name, email, token, ... }
      setUser(extractUser(response.data));
      return extractUser(response.data);
    } catch (e) {
      const msg = e.response?.data?.message || 'Update failed';
      setError(msg);
      throw e;
    }
  };

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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
