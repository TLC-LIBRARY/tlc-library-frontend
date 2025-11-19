import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../utils/api';

interface NotificationPreferences {
  payment_reminders: boolean;
  due_date_alerts: boolean;
  announcements: boolean;
  educational_support: boolean;
  member_connect_replies: boolean;
}

interface UserPreferences {
  notifications: NotificationPreferences;
  push_enabled: boolean;
  dark_mode: boolean;
}

export default function Settings() {
  const { user } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences>({
    notifications: {
      payment_reminders: true,
      due_date_alerts: true,
      announcements: true,
      educational_support: true,
      member_connect_replies: true,
    },
    push_enabled: true,
    dark_mode: false,
  });

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const response = await api.get('/api/auth/preferences');
      if (response.data.preferences) {
        setPreferences(response.data.preferences);
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async (newPreferences: UserPreferences) => {
    setSaving(true);
    try {
      await api.put('/api/auth/preferences', { preferences: newPreferences });
      Alert.alert('✅ Success', 'Preferences updated successfully!');
    } catch (error: any) {
      console.error('Failed to save preferences:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationToggle = (key: keyof NotificationPreferences) => {
    const newPreferences = {
      ...preferences,
      notifications: {
        ...preferences.notifications,
        [key]: !preferences.notifications[key],
      },
    };
    setPreferences(newPreferences);
    savePreferences(newPreferences);
  };

  const handlePushToggle = () => {
    const newPreferences = {
      ...preferences,
      push_enabled: !preferences.push_enabled,
    };
    setPreferences(newPreferences);
    savePreferences(newPreferences);
  };

  const handleDarkModeToggle = () => {
    toggleDarkMode();
    const newPreferences = {
      ...preferences,
      dark_mode: !preferences.dark_mode,
    };
    setPreferences(newPreferences);
    savePreferences(newPreferences);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={{ width: 24 }} />
        </View>
        <ActivityIndicator size="large" color="#6200ee" style={{ marginTop: 100 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Account Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👤 Account Settings</Text>
          
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/contributions/edit-profile')}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="person-outline" size={24} color="#6200ee" />
              <Text style={styles.menuItemText}>Edit Profile</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/contributions/change-password')}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="lock-closed-outline" size={24} color="#6200ee" />
              <Text style={styles.menuItemText}>Change Password</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        {/* Notification Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔔 Notification Preferences</Text>
          <Text style={styles.sectionSubtitle}>Choose which notifications you want to receive</Text>

          <View style={styles.toggleItem}>
            <View style={styles.toggleItemLeft}>
              <Ionicons name="card-outline" size={22} color="#666" />
              <View style={styles.toggleItemText}>
                <Text style={styles.toggleItemTitle}>Payment Reminders</Text>
                <Text style={styles.toggleItemSubtitle}>Get notified about upcoming payments</Text>
              </View>
            </View>
            <Switch
              value={preferences.notifications.payment_reminders}
              onValueChange={() => handleNotificationToggle('payment_reminders')}
              trackColor={{ false: '#ccc', true: '#bb86fc' }}
              thumbColor={preferences.notifications.payment_reminders ? '#6200ee' : '#f4f3f4'}
              disabled={saving}
            />
          </View>

          <View style={styles.toggleItem}>
            <View style={styles.toggleItemLeft}>
              <Ionicons name="calendar-outline" size={22} color="#666" />
              <View style={styles.toggleItemText}>
                <Text style={styles.toggleItemTitle}>Due Date Alerts</Text>
                <Text style={styles.toggleItemSubtitle}>Reminders for payment due dates</Text>
              </View>
            </View>
            <Switch
              value={preferences.notifications.due_date_alerts}
              onValueChange={() => handleNotificationToggle('due_date_alerts')}
              trackColor={{ false: '#ccc', true: '#bb86fc' }}
              thumbColor={preferences.notifications.due_date_alerts ? '#6200ee' : '#f4f3f4'}
              disabled={saving}
            />
          </View>

          <View style={styles.toggleItem}>
            <View style={styles.toggleItemLeft}>
              <Ionicons name="megaphone-outline" size={22} color="#666" />
              <View style={styles.toggleItemText}>
                <Text style={styles.toggleItemTitle}>Announcements</Text>
                <Text style={styles.toggleItemSubtitle}>Library news and updates</Text>
              </View>
            </View>
            <Switch
              value={preferences.notifications.announcements}
              onValueChange={() => handleNotificationToggle('announcements')}
              trackColor={{ false: '#ccc', true: '#bb86fc' }}
              thumbColor={preferences.notifications.announcements ? '#6200ee' : '#f4f3f4'}
              disabled={saving}
            />
          </View>

          <View style={styles.toggleItem}>
            <View style={styles.toggleItemLeft}>
              <Ionicons name="school-outline" size={22} color="#666" />
              <View style={styles.toggleItemText}>
                <Text style={styles.toggleItemTitle}>Educational Support</Text>
                <Text style={styles.toggleItemSubtitle}>Updates on educational assistance</Text>
              </View>
            </View>
            <Switch
              value={preferences.notifications.educational_support}
              onValueChange={() => handleNotificationToggle('educational_support')}
              trackColor={{ false: '#ccc', true: '#bb86fc' }}
              thumbColor={preferences.notifications.educational_support ? '#6200ee' : '#f4f3f4'}
              disabled={saving}
            />
          </View>

          <View style={styles.toggleItem}>
            <View style={styles.toggleItemLeft}>
              <Ionicons name="chatbubbles-outline" size={22} color="#666" />
              <View style={styles.toggleItemText}>
                <Text style={styles.toggleItemTitle}>Member Connect Replies</Text>
                <Text style={styles.toggleItemSubtitle}>Responses to your requests</Text>
              </View>
            </View>
            <Switch
              value={preferences.notifications.member_connect_replies}
              onValueChange={() => handleNotificationToggle('member_connect_replies')}
              trackColor={{ false: '#ccc', true: '#bb86fc' }}
              thumbColor={preferences.notifications.member_connect_replies ? '#6200ee' : '#f4f3f4'}
              disabled={saving}
            />
          </View>
        </View>

        {/* App Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚙️ App Settings</Text>

          <View style={styles.toggleItem}>
            <View style={styles.toggleItemLeft}>
              <Ionicons name={isDarkMode ? 'moon' : 'moon-outline'} size={22} color="#666" />
              <View style={styles.toggleItemText}>
                <Text style={styles.toggleItemTitle}>Dark Mode</Text>
                <Text style={styles.toggleItemSubtitle}>Switch between light and dark theme</Text>
              </View>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={handleDarkModeToggle}
              trackColor={{ false: '#ccc', true: '#bb86fc' }}
              thumbColor={isDarkMode ? '#6200ee' : '#f4f3f4'}
              disabled={saving}
            />
          </View>

          <View style={styles.toggleItem}>
            <View style={styles.toggleItemLeft}>
              <Ionicons name="notifications-outline" size={22} color="#666" />
              <View style={styles.toggleItemText}>
                <Text style={styles.toggleItemTitle}>Push Notifications</Text>
                <Text style={styles.toggleItemSubtitle}>Enable push notifications</Text>
              </View>
            </View>
            <Switch
              value={preferences.push_enabled}
              onValueChange={handlePushToggle}
              trackColor={{ false: '#ccc', true: '#bb86fc' }}
              thumbColor={preferences.push_enabled ? '#6200ee' : '#f4f3f4'}
              disabled={saving}
            />
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="information-circle-outline" size={22} color="#666" />
            <View style={styles.infoItemText}>
              <Text style={styles.infoItemTitle}>App Version</Text>
              <Text style={styles.infoItemValue}>v1.0.0</Text>
            </View>
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ℹ️ About</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/contributions/help-support')}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="help-circle-outline" size={24} color="#666" />
              <Text style={styles.menuItemText}>Help & Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        {saving && (
          <View style={styles.savingIndicator}>
            <ActivityIndicator size="small" color="#6200ee" />
            <Text style={styles.savingText}>Saving...</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#666',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
  },
  toggleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  toggleItemLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toggleItemText: {
    flex: 1,
  },
  toggleItemTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  toggleItemSubtitle: {
    fontSize: 12,
    color: '#999',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  infoItemText: {
    flex: 1,
  },
  infoItemTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  infoItemValue: {
    fontSize: 13,
    color: '#999',
  },
  savingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
  },
  savingText: {
    fontSize: 14,
    color: '#6200ee',
  },
});
