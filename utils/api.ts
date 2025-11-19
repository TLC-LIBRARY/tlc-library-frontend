import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base URL without /api prefix
const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8001';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - automatically add token to all requests
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('session_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token from storage:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors globally
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear storage
      await AsyncStorage.removeItem('session_token');
      // Could trigger logout or redirect to login here
    }
    return Promise.reject(error);
  }
);

export default api;
