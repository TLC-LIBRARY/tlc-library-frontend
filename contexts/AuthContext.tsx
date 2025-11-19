import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: string;
  profile_picture?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, name: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    console.log('=== AUTH CHECK INITIATED ===');
    try {
      const storedToken = await AsyncStorage.getItem('session_token');
      console.log('Stored token found:', storedToken ? 'YES' : 'NO');
      
      if (storedToken) {
        console.log('Setting token in state first...');
        setToken(storedToken);
        
        // Wait a bit for state to update
        await new Promise(resolve => setTimeout(resolve, 100));
        
        console.log('Fetching user data from /api/auth/me');
        const response = await axios.get(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${storedToken}` }
        });
        console.log('User data received:', response.data);
        setUser(response.data);
        console.log('✅ Auth check complete - user authenticated');
      } else {
        console.log('No token found - user not authenticated');
      }
    } catch (error: any) {
      console.error('=== AUTH CHECK FAILED ===');
      console.error('Error:', error);
      console.error('Response:', error.response?.data);
      await AsyncStorage.removeItem('session_token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
      console.log('=== AUTH CHECK FINISHED ===');
    }
  };

  const login = async (email: string, password: string) => {
    console.log('=== AUTH LOGIN ATTEMPT ===');
    console.log('Email:', email);
    console.log('API URL:', API_URL);
    
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, { email, password });
      console.log('Login response:', response.data);
      
      const { session_token, user: userData } = response.data;
      
      if (!session_token || !userData) {
        console.error('Invalid response: missing session_token or user');
        throw new Error('Invalid response from server');
      }
      
      console.log('Storing session_token in AsyncStorage...');
      await AsyncStorage.setItem('session_token', session_token);
      console.log('Setting token and user in state...');
      setToken(session_token);
      setUser(userData);
      console.log('✅ Login successful! User:', userData);
      return userData;
    } catch (error: any) {
      console.error('=== LOGIN ERROR ===');
      console.error('Error:', error);
      console.error('Response:', error.response?.data);
      throw error;
    }
  };

  const register = async (email: string, name: string, password: string) => {
    const response = await axios.post(`${API_URL}/api/auth/register`, { email, name, password });
    const { session_token, user: userData } = response.data;
    await AsyncStorage.setItem('session_token', session_token);
    setToken(session_token);
    setUser(userData);
  };

  const logout = async () => {
    console.log('AuthContext: logout called');
    try {
      if (token) {
        console.log('AuthContext: calling backend logout API');
        await axios.post(`${API_URL}/api/auth/logout`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('AuthContext: backend logout successful');
      }
    } catch (error) {
      console.log('Logout error:', error);
    } finally {
      // Clear AsyncStorage first
      console.log('AuthContext: clearing AsyncStorage');
      await AsyncStorage.removeItem('session_token');
      console.log('AuthContext: AsyncStorage cleared');
      
      // Then clear state - this order ensures clean logout
      console.log('AuthContext: clearing user and token state');
      setUser(null);
      setToken(null);
      console.log('AuthContext: logout complete, user and token set to null');
      // DON'T set loading state - let checkAuth manage it
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
