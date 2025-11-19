import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Switch, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleDarkMode, colors } = useTheme();
  const router = useRouter();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: 16,
    },
    header: {
      alignItems: 'center',
      paddingVertical: 24,
      backgroundColor: colors.surface,
      borderRadius: 12,
      marginBottom: 16,
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: isDarkMode ? colors.border : '#e8eaf6',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    name: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
    },
    email: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 4,
    },
    section: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 12,
      textTransform: 'uppercase',
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      gap: 12,
    },
    menuText: {
      flex: 1,
      fontSize: 16,
      color: colors.text,
    },
    logoutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.surface,
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.error,
    },
    logoutText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.error,
    },
  });

  const handleLogout = async () => {
    console.log('Logout button clicked');
    
    // Use window.confirm for web compatibility
    const confirmed = typeof window !== 'undefined' 
      ? window.confirm('Are you sure you want to logout?')
      : true;
    
    if (!confirmed) {
      console.log('Logout cancelled');
      return;
    }
    
    console.log('Starting logout process...');
    
    try {
      // Clear auth state first
      await logout();
      console.log('Logout completed, navigating directly to welcome...');
      
      // Navigate directly to welcome screen instead of going through index
      router.replace('/(auth)/welcome');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color="#6200ee" />
          </View>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/contributions/my-profile')}
          >
            <Ionicons name="person-outline" size={24} color="#333" />
            <Text style={styles.menuText}>My Profile</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/contributions/settings')}
          >
            <Ionicons name="settings-outline" size={24} color="#333" />
            <Text style={styles.menuText}>Settings</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
          {user?.role === 'admin' && (
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => router.push('/admin')}
            >
              <Ionicons name="shield-checkmark-outline" size={24} color="#6200ee" />
              <Text style={[styles.menuText, { color: '#6200ee' }]}>Admin Panel</Text>
              <Ionicons name="chevron-forward" size={20} color="#6200ee" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contributions</Text>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/contributions/my-payments')}
          >
            <Ionicons name="receipt-outline" size={24} color="#333" />
            <Text style={styles.menuText}>My Payment History</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
          {user?.role === 'admin' && (
            <>
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => router.push('/contributions/members')}
              >
                <Ionicons name="people-outline" size={24} color="#333" />
                <Text style={styles.menuText}>All Members</Text>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => router.push('/contributions/payments')}
              >
                <Ionicons name="cash-outline" size={24} color="#333" />
                <Text style={styles.menuText}>All Payments</Text>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/contributions/notifications')}
          >
            <Ionicons name="notifications-outline" size={24} color="#333" />
            <Text style={styles.menuText}>Notifications</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
          <View style={styles.menuItem}>
            <Ionicons name={isDarkMode ? "moon" : "moon-outline"} size={24} color="#333" />
            <Text style={styles.menuText}>Dark Mode</Text>
            <Switch 
              value={isDarkMode} 
              onValueChange={toggleDarkMode}
              trackColor={{ false: '#ccc', true: '#bb86fc' }}
              thumbColor={isDarkMode ? '#6200ee' : '#f4f3f4'}
            />
          </View>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/contributions/help-support')}
          >
            <Ionicons name="help-circle-outline" size={24} color="#333" />
            <Text style={styles.menuText}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>

        <Pressable 
          style={({ pressed }) => [
            styles.logoutButton,
            pressed && { opacity: 0.7 }
          ]} 
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={24} color="#f44336" />
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
