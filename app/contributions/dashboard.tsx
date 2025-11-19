import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import { format } from 'date-fns';

export default function Dashboard() {
  const { token, logout } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      const response = await api.get('/api/contributions/dashboard/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardStats();
  };

  const handleLogout = async () => {
    const confirmed = Platform.OS === 'web' 
      ? window.confirm('Are you sure you want to logout?')
      : await new Promise((resolve) => {
          Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
              { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Logout', style: 'destructive', onPress: () => resolve(true) }
            ]
          );
        });

    if (confirmed) {
      try {
        await logout();
        router.replace('/(auth)/admin-login');
      } catch (error) {
        console.error('Logout failed:', error);
      }
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Dashboard</Text>
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
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity onPress={onRefresh}>
            <Ionicons name="refresh" size={24} color="#6200ee" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#d32f2f" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6200ee']} />}
      >
        <Text style={styles.dateText}>As of {format(new Date(), 'dd MMM yyyy, hh:mm a')}</Text>

        {/* Member Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Member Statistics</Text>
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: '#e3f2fd' }]}>
              <Ionicons name="people" size={32} color="#1976d2" />
              <Text style={styles.statValue}>{stats?.total_members || 0}</Text>
              <Text style={styles.statLabel}>Total Members</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#e8f5e9' }]}>
              <Ionicons name="checkmark-circle" size={32} color="#388e3c" />
              <Text style={styles.statValue}>{stats?.active_members || 0}</Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>
          </View>
        </View>

        {/* Contribution Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contribution Statistics</Text>
          
          <View style={styles.contributionCard}>
            <View style={styles.contributionHeader}>
              <Ionicons name="today" size={20} color="#6200ee" />
              <Text style={styles.contributionTitle}>Today</Text>
            </View>
            <Text style={styles.contributionAmount}>₹{stats?.contributions_today || 0}</Text>
          </View>

          <View style={styles.contributionCard}>
            <View style={styles.contributionHeader}>
              <Ionicons name="calendar" size={20} color="#00897b" />
              <Text style={styles.contributionTitle}>This Month</Text>
            </View>
            <Text style={styles.contributionAmount}>₹{stats?.contributions_month || 0}</Text>
          </View>

          <View style={styles.contributionCard}>
            <View style={styles.contributionHeader}>
              <Ionicons name="calendar-outline" size={20} color="#1976d2" />
              <Text style={styles.contributionTitle}>This Year</Text>
            </View>
            <Text style={styles.contributionAmount}>₹{stats?.contributions_year || 0}</Text>
          </View>
        </View>

        {/* Plan Distribution */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Plan Distribution</Text>
          {stats?.plan_distribution && Object.entries(stats.plan_distribution).map(([plan, count]: any) => (
            <View key={plan} style={styles.planRow}>
              <View style={styles.planInfo}>
                <Ionicons 
                  name="pricetag" 
                  size={20} 
                  color={plan === 'Basic' ? '#ff9800' : plan === 'Standard' ? '#00897b' : '#6200ee'} 
                />
                <Text style={styles.planName}>{plan}</Text>
              </View>
              <Text style={styles.planCount}>{count} members</Text>
            </View>
          ))}
        </View>

        {/* Payment Methods */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Methods</Text>
          {stats?.payment_methods && Object.entries(stats.payment_methods).map(([method, count]: any) => (
            <View key={method} style={styles.methodRow}>
              <View style={styles.methodInfo}>
                <Ionicons 
                  name={method === 'Cash' ? 'cash' : 'card'} 
                  size={20} 
                  color={method === 'Cash' ? '#388e3c' : '#1976d2'} 
                />
                <Text style={styles.methodName}>{method}</Text>
              </View>
              <Text style={styles.methodCount}>{count} payments</Text>
            </View>
          ))}
        </View>

        {/* Member Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Member Management</Text>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/contributions/members')}
          >
            <Ionicons name="people" size={24} color="#fff" />
            <Text style={styles.actionText}>View All Members</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#7c4dff' }]}
            onPress={() => router.push('/contributions/register-member')}
          >
            <Ionicons name="person-add" size={24} color="#fff" />
            <Text style={styles.actionText}>Register New Member</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#5e35b1' }]}
            onPress={() => router.push('/contributions/members')}
          >
            <Ionicons name="settings" size={24} color="#fff" />
            <Text style={styles.actionText}>Member Settings</Text>
          </TouchableOpacity>
        </View>

        {/* Payment Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Management</Text>
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#00897b' }]}
            onPress={() => router.push('/contributions/payments')}
          >
            <Ionicons name="wallet" size={24} color="#fff" />
            <Text style={styles.actionText}>View All Payments</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#00796b' }]}
            onPress={() => router.push('/contributions/record-payment')}
          >
            <Ionicons name="cash" size={24} color="#fff" />
            <Text style={styles.actionText}>Record Payment</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#1976d2' }]}
            onPress={() => router.push('/contributions/reports')}
          >
            <Ionicons name="document-text" size={24} color="#fff" />
            <Text style={styles.actionText}>Generate Report</Text>
          </TouchableOpacity>
        </View>

        {/* Educational Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Educational Support</Text>
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#2196f3' }]}
            onPress={() => router.push('/contributions/admin-educational-applications')}
          >
            <Ionicons name="school" size={24} color="#fff" />
            <Text style={styles.actionText}>Educational Applications</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#1976d2' }]}
            onPress={() => router.push('/contributions/admin-sanctions-management')}
          >
            <Ionicons name="receipt" size={24} color="#fff" />
            <Text style={styles.actionText}>Sanctions Management</Text>
          </TouchableOpacity>
        </View>

        {/* Welfare Contribution */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Welfare Contribution</Text>
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#9c27b0' }]}
            onPress={() => router.push('/contributions/admin-welfare-contributions')}
          >
            <Ionicons name="heart" size={24} color="#fff" />
            <Text style={styles.actionText}>Welfare Dashboard</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#7b1fa2' }]}
            onPress={() => router.push('/contributions/admin-welfare-stats')}
          >
            <Ionicons name="stats-chart" size={24} color="#fff" />
            <Text style={styles.actionText}>Welfare Statistics</Text>
          </TouchableOpacity>
        </View>

        {/* Overdue Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overdue Management</Text>
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#ff9800' }]}
            onPress={() => router.push('/contributions/admin-overdue-management')}
          >
            <Ionicons name="time" size={24} color="#fff" />
            <Text style={styles.actionText}>Overdue Dashboard</Text>
          </TouchableOpacity>
        </View>

        {/* Member Connect */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Member Connect</Text>
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#00897b' }]}
            onPress={() => router.push('/contributions/admin-requests-dashboard')}
          >
            <Ionicons name="chatbubbles" size={24} color="#fff" />
            <Text style={styles.actionText}>Member Requests</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#4caf50' }]}
            onPress={() => router.push('/contributions/admin-help-support')}
          >
            <Ionicons name="help-circle" size={24} color="#fff" />
            <Text style={styles.actionText}>Help & Support</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#2196f3' }]}
            onPress={() => router.push('/contributions/admin-faq-management')}
          >
            <Ionicons name="list" size={24} color="#fff" />
            <Text style={styles.actionText}>FAQ Management</Text>
          </TouchableOpacity>
        </View>

        {/* Notifications & Messages */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications & Messages</Text>
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#ff5722' }]}
            onPress={() => router.push('/contributions/notifications')}
          >
            <Ionicons name="notifications" size={24} color="#fff" />
            <Text style={styles.actionText}>View Notifications</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#e64a19' }]}
            onPress={() => router.push('/contributions/create-notification')}
          >
            <Ionicons name="megaphone" size={24} color="#fff" />
            <Text style={styles.actionText}>Create Notification</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#d84315' }]}
            onPress={() => router.push('/contributions/admin-messages')}
          >
            <Ionicons name="mail" size={24} color="#fff" />
            <Text style={styles.actionText}>Contact Messages</Text>
          </TouchableOpacity>
        </View>

        {/* Plan Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Plan Management</Text>
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#3f51b5' }]}
            onPress={() => router.push('/contributions/admin-plans-management')}
          >
            <Ionicons name="pricetags" size={24} color="#fff" />
            <Text style={styles.actionText}>Manage Plans & Pricing</Text>
          </TouchableOpacity>
        </View>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  dateText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginBottom: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1a1a1a',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  contributionCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  contributionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  contributionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  contributionAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a1a1a',
  },
  planRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  planInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  planName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  planCount: {
    fontSize: 14,
    color: '#666',
  },
  methodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  methodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  methodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  methodCount: {
    fontSize: 14,
    color: '#666',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6200ee',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});