import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';

const api = axios.create({
  baseURL: 'http://13.239.116.166/api', // Production EC2 IP
  timeout: 10000,
});

api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error fetching token from AsyncStorage', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      try {
        await AsyncStorage.removeItem('userToken');
        // Signal AuthContext to logout
        DeviceEventEmitter.emit('LOGOUT');
      } catch (e) {
        console.error('Error clearing token on 401', e);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
