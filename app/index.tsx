import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';

export default function Index() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log('Index.tsx: useEffect triggered', { user: !!user, loading });
    if (!loading) {
      // Add delay to ensure state is fully settled after logout
      const timer = setTimeout(() => {
        console.log('Index.tsx: Timer fired, checking user state', { user: !!user });
        if (user) {
          console.log('Index.tsx: User exists, redirecting to tabs');
          router.replace('/(tabs)');
        } else {
          console.log('Index.tsx: No user, redirecting to welcome');
          router.replace('/(auth)/welcome');
        }
      }, 200);
      
      return () => clearTimeout(timer);
    }
  }, [user, loading, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#6200ee" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});
