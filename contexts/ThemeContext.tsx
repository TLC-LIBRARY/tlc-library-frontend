import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  colors: {
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    primary: string;
    border: string;
    card: string;
    error: string;
    success: string;
  };
}

const lightColors = {
  background: '#f5f5f5',
  surface: '#ffffff',
  text: '#1a1a1a',
  textSecondary: '#666',
  primary: '#6200ee',
  border: '#e0e0e0',
  card: '#ffffff',
  error: '#f44336',
  success: '#4caf50',
};

const darkColors = {
  background: '#121212',
  surface: '#1e1e1e',
  text: '#ffffff',
  textSecondary: '#b0b0b0',
  primary: '#bb86fc',
  border: '#2c2c2c',
  card: '#2c2c2c',
  error: '#cf6679',
  success: '#81c784',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme_preference');
      if (savedTheme === 'dark') {
        setIsDarkMode(true);
      }
    } catch (error) {
      console.log('Failed to load theme preference:', error);
    }
  };

  const toggleDarkMode = async () => {
    try {
      const newValue = !isDarkMode;
      setIsDarkMode(newValue);
      await AsyncStorage.setItem('theme_preference', newValue ? 'dark' : 'light');
    } catch (error) {
      console.log('Failed to save theme preference:', error);
    }
  };

  const colors = isDarkMode ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
