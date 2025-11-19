import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { AuthProvider } from '../contexts/AuthContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { PaperProvider } from 'react-native-paper';
import * as SplashScreen from 'expo-splash-screen';
import { Platform } from 'react-native';

// Keep the splash screen visible while we load fonts
SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignore errors on platforms that don't support splash screen
});

export default function RootLayout() {
  useEffect(() => {
    // Hide splash screen after a short delay
    // This prevents font loading timeout issues
    const timer = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {
        // Ignore errors
      });
    }, 100);

    // Add global error handler for fontfaceobserver timeout
    if (Platform.OS === 'web') {
      const originalConsoleError = console.error;
      console.error = (...args: any[]) => {
        // Suppress fontfaceobserver timeout errors
        const errorMessage = args[0]?.toString() || '';
        if (errorMessage.includes('ms timeout exceeded') || errorMessage.includes('fontfaceobserver')) {
          return; // Ignore font loading timeouts
        }
        originalConsoleError.apply(console, args);
      };
    }

    return () => clearTimeout(timer);
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <PaperProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="admin" />
            <Stack.Screen name="books" />
            <Stack.Screen name="contributions" />
            <Stack.Screen name="member-connect" />
            <Stack.Screen name="subscriptions" />
            <Stack.Screen name="payment" />
          </Stack>
        </PaperProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
