import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import { format } from 'date-fns';

export default function AdminPanel() {
  const { token, user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [recentMembers, setRecentMembers] = useState<any[]>([]);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [overdueMembers, setOverdueMembers] = useState<any[]>([]);

  useEffect(() => {
    // Check if user is admin
    if (user?.role !== 'admin') {
      const message = 'You do not have admin permissions';
      if (Platform.OS === 'web') {
        window.alert(message);
      } else {
        Alert.alert('Access Denied', message);
      }
      router.replace('/(auth)/admin-login');
      return;
    }
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsRes, membersRes, paymentsRes, overdueRes] = await Promise.all([
        api.get('/api/contributions/dashboard/stats'),
        api.get('/api/contributions/members'),
        api.get('/api/contributions/payments'),
        api.get('/api/contributions/payments/overdue')
      ]);

      setStats(statsRes.data);
      // Get last 5 members
      setRecentMembers(membersRes.data.slice(0, 5));
      // Get last 5 payments
      setRecentPayments(paymentsRes.data.slice(0, 5));
      setOverdueMembers(overdueRes.data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      const errorMsg = 'Failed to load dashboard data';
      if (Platform.OS === 'web') {
        console.error(errorMsg);
      } else {
        Alert.alert('Error', errorMsg);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#6200ee" style={{ marginTop: 100 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.replace('/contributions/dashboard')} style={styles.backButton}>
            <Ionicons name="apps" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Admin Control Panel</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Key Stats Overview */}
        {stats && (
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>Today's Overview</Text>
            
            <View style={styles.statsGrid}>
              <LinearGradient
                colors={['#6200ee', '#7c4dff']}
                style={styles.statCard}
              >
                <Ionicons name="cash" size={32} color="#fff" />
                <Text style={styles.statValue}>₹{stats.total_contributions_today.toFixed(0)}</Text>
                <Text style={styles.statLabel}>Today's Collection</Text>
              </LinearGradient>

              <LinearGradient
                colors={['#00897b', '#26a69a']}
                style={styles.statCard}
              >
                <Ionicons name="calendar" size={32} color="#fff" />
                <Text style={styles.statValue}>₹{stats.total_contributions_month.toFixed(0)}</Text>
                <Text style={styles.statLabel}>This Month</Text>
              </LinearGradient>

              <LinearGradient
                colors={['#e91e63', '#f06292']}
                style={styles.statCard}
              >
                <Ionicons name="people" size={32} color="#fff" />
                <Text style={styles.statValue}>{stats.total_members}</Text>
                <Text style={styles.statLabel}>Total Members</Text>
              </LinearGradient>

              <LinearGradient
                colors={['#ff9800', '#ffb74d']}
                style={styles.statCard}
              >
                <Ionicons name="checkmark-circle" size={32} color="#fff" />
                <Text style={styles.statValue}>{stats.active_members}</Text>
                <Text style={styles.statLabel}>Active Members</Text>
              </LinearGradient>
            </View>

            {/* Plan Distribution */}
            <View style={styles.planDistribution}>
              <Text style={styles.subsectionTitle}>Plan Distribution</Text>
              <View style={styles.planRow}>
                <View style={styles.planItem}>
                  <View style={[styles.planDot, { backgroundColor: '#6200ee' }]} />
                  <Text style={styles.planText}>Basic: {stats.basic_members}</Text>
                </View>
                <View style={styles.planItem}>
                  <View style={[styles.planDot, { backgroundColor: '#00897b' }]} />
                  <Text style={styles.planText}>Standard: {stats.standard_members}</Text>
                </View>
                <View style={styles.planItem}>
                  <View style={[styles.planDot, { backgroundColor: '#e91e63' }]} />
                  <Text style={styles.planText}>Premium: {stats.premium_members}</Text>
                </View>
              </View>
            </View>

            {/* Payment Methods */}
            <View style={styles.planDistribution}>
              <Text style={styles.subsectionTitle}>Payment Methods</Text>
              <View style={styles.planRow}>
                <View style={styles.planItem}>
                  <Ionicons name="cash" size={16} color="#666" />
                  <Text style={styles.planText}>Cash: {stats.cash_payments}</Text>
                </View>
                <View style={styles.planItem}>
                  <Ionicons name="card" size={16} color="#666" />
                  <Text style={styles.planText}>Online: {stats.online_payments}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Overdue Alert */}
        {overdueMembers.length > 0 && (
          <TouchableOpacity 
            style={styles.overdueAlert}
            onPress={() => router.push('/contributions/overdue')}
          >
            <Ionicons name="warning" size={28} color="#f44336" />
            <View style={{ flex: 1 }}>
              <Text style={styles.overdueTitle}>Overdue Payments!</Text>
              <Text style={styles.overdueText}>
                {overdueMembers.length} member{overdueMembers.length > 1 ? 's' : ''} have overdue payments
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#f44336" />
          </TouchableOpacity>
        )}

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: '#6200ee' }]}
              onPress={() => router.push('/contributions/register-member')}
            >
              <Ionicons name="person-add" size={28} color="#fff" />
              <Text style={styles.actionButtonText}>Register{'\n'}Member</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: '#00897b' }]}
              onPress={() => router.push('/contributions/record-payment')}
            >
              <Ionicons name="cash" size={28} color="#fff" />
              <Text style={styles.actionButtonText}>Record{'\n'}Payment</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: '#1976d2' }]}
              onPress={() => router.push('/contributions/members')}
            >
              <Ionicons name="people" size={28} color="#fff" />
              <Text style={styles.actionButtonText}>All{'\n'}Members</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: '#7b1fa2' }]}
              onPress={() => router.push('/contributions/payments')}
            >
              <Ionicons name="receipt" size={28} color="#fff" />
              <Text style={styles.actionButtonText}>Payment{'\n'}History</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Members */}
        <View style={styles.listSection}>
          <View style={styles.listHeader}>
            <Text style={styles.sectionTitle}>Recent Members</Text>
            <TouchableOpacity onPress={() => router.push('/contributions/members')}>
              <Text style={styles.viewAllText}>View All →</Text>
            </TouchableOpacity>
          </View>
          {recentMembers.map((member) => (
            <TouchableOpacity
              key={member.member_id}
              style={styles.listItem}
              onPress={() => router.push(`/contributions/member-detail?id=${member.member_id}`)}
            >
              <View style={styles.listItemIcon}>
                <Ionicons name="person" size={20} color="#6200ee" />
              </View>
              <View style={styles.listItemContent}>
                <Text style={styles.listItemTitle}>{member.full_name}</Text>
                <Text style={styles.listItemSubtitle}>{member.member_id} • {member.plan}</Text>
              </View>
              <View style={[styles.statusDot, member.status === 'Active' ? styles.activeDot : styles.inactiveDot]} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Payments */}
        <View style={styles.listSection}>
          <View style={styles.listHeader}>
            <Text style={styles.sectionTitle}>Recent Payments</Text>
            <TouchableOpacity onPress={() => router.push('/contributions/payments')}>
              <Text style={styles.viewAllText}>View All →</Text>
            </TouchableOpacity>
          </View>
          {recentPayments.map((payment) => (
            <View key={payment.receipt_number} style={styles.listItem}>
              <View style={[styles.listItemIcon, { backgroundColor: '#e8f5e9' }]}>
                <Ionicons name="checkmark-circle" size={20} color="#00897b" />
              </View>
              <View style={styles.listItemContent}>
                <Text style={styles.listItemTitle}>₹{payment.amount}</Text>
                <Text style={styles.listItemSubtitle}>
                  {payment.member_name} • {format(new Date(payment.payment_date), 'MMM dd')}
                </Text>
              </View>
              <View style={[styles.methodBadge, payment.payment_method === 'Cash' ? styles.cashBadge : styles.onlineBadge]}>
                <Text style={styles.methodText}>{payment.payment_method}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Insights */}
        <View style={styles.insightsSection}>
          <Text style={styles.sectionTitle}>Financial Insights</Text>
          {stats && (
            <>
              <View style={styles.insightItem}>
                <Text style={styles.insightLabel}>Average Monthly Collection</Text>
                <Text style={styles.insightValue}>
                  ₹{Math.round(stats.total_contributions_year / 12)}
                </Text>
              </View>
              <View style={styles.insightItem}>
                <Text style={styles.insightLabel}>Total Year Collection</Text>
                <Text style={styles.insightValue}>₹{stats.total_contributions_year.toFixed(0)}</Text>
              </View>
              <View style={styles.insightItem}>
                <Text style={styles.insightLabel}>Active Member Rate</Text>
                <Text style={styles.insightValue}>
                  {((stats.active_members / stats.total_members) * 100).toFixed(1)}%
                </Text>
              </View>
            </>
          )}
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
    padding: 16,
    backgroundColor: '#6200ee',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  statsSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
    textAlign: 'center',
  },
  planDistribution: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
  },
  planRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  planItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  planDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  planText: {
    fontSize: 14,
    color: '#333',
  },
  overdueAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    gap: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  overdueTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#c62828',
    marginBottom: 2,
  },
  overdueText: {
    fontSize: 13,
    color: '#d32f2f',
  },
  actionsSection: {
    padding: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  listSection: {
    padding: 16,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewAllText: {
    fontSize: 14,
    color: '#6200ee',
    fontWeight: '600',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
  },
  listItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3e5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  listItemSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  activeDot: {
    backgroundColor: '#4caf50',
  },
  inactiveDot: {
    backgroundColor: '#f44336',
  },
  methodBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  cashBadge: {
    backgroundColor: '#ff9800',
  },
  onlineBadge: {
    backgroundColor: '#1976d2',
  },
  methodText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  insightsSection: {
    padding: 16,
    marginBottom: 24,
  },
  insightItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  insightLabel: {
    fontSize: 14,
    color: '#666',
  },
  insightValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6200ee',
  },
});
