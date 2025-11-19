import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import OverdueAlertBanner from '../../components/OverdueAlertBanner';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function ContriTrackHome() {
  const { token, user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [memberData, setMemberData] = useState<any>(null);

  // DEBUG: Log user role
  console.log('ContriTrackHome - User Role:', user?.role);
  console.log('ContriTrackHome - User Object:', user);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      if (user?.role === 'admin') {
        const response = await axios.get(`${API_URL}/api/contributions/dashboard/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(response.data);
      } else {
        // Load member's own data
        const memberResponse = await axios.get(`${API_URL}/api/contributions/members`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (memberResponse.data.length > 0) {
          setMemberData(memberResponse.data[0]);
        }
      }
    } catch (error) {
      console.log('Error loading data:', error);
    } finally {
      setLoading(false);
    }
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
      <ScrollView>
        <View style={styles.header}>
          <Image 
            source={require('../../assets/library-logo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>TLC_LIBRARY</Text>
          <Text style={styles.subtitle}>Contribution Management</Text>
        </View>

        {user?.role === 'admin' && stats ? (
          <>
            {/* Admin Dashboard Stats */}
            <View style={styles.statsContainer}>
              <Text style={styles.sectionTitle}>Today's Overview</Text>
              
              <View style={styles.statRow}>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>₹{stats.total_contributions_today.toFixed(0)}</Text>
                  <Text style={styles.statLabel}>Today</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>₹{stats.total_contributions_month.toFixed(0)}</Text>
                  <Text style={styles.statLabel}>This Month</Text>
                </View>
              </View>

              <View style={styles.statRow}>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{stats.total_members}</Text>
                  <Text style={styles.statLabel}>Total Members</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{stats.active_members}</Text>
                  <Text style={styles.statLabel}>Active</Text>
                </View>
              </View>

              {stats.overdue_count > 0 && (
                <TouchableOpacity 
                  style={styles.overdueAlert}
                  onPress={() => router.push('/contributions/overdue')}
                >
                  <Ionicons name="warning" size={24} color="#f44336" />
                  <Text style={styles.overdueText}>
                    {stats.overdue_count} members have overdue payments
                  </Text>
                </TouchableOpacity>
              )}

              <Text style={styles.sectionTitle}>Plan Distribution</Text>
              <View style={styles.planStats}>
                <View style={styles.planItem}>
                  <Text style={styles.planValue}>{stats.basic_members}</Text>
                  <Text style={styles.planLabel}>Basic</Text>
                </View>
                <View style={styles.planItem}>
                  <Text style={styles.planValue}>{stats.standard_members}</Text>
                  <Text style={styles.planLabel}>Standard</Text>
                </View>
                <View style={styles.planItem}>
                  <Text style={styles.planValue}>{stats.premium_members}</Text>
                  <Text style={styles.planLabel}>Premium</Text>
                </View>
              </View>
            </View>

            {/* Admin Actions */}
            <View style={styles.actionsContainer}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => router.push('/contributions/register-member')}
              >
                <Ionicons name="person-add" size={24} color="#fff" />
                <Text style={styles.actionButtonText}>Register New Member</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: '#00897b' }]}
                onPress={() => router.push('/contributions/record-payment')}
              >
                <Ionicons name="cash" size={24} color="#fff" />
                <Text style={styles.actionButtonText}>Record Payment</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: '#1976d2' }]}
                onPress={() => router.push('/contributions/members')}
              >
                <Ionicons name="people" size={24} color="#fff" />
                <Text style={styles.actionButtonText}>View All Members</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: '#7b1fa2' }]}
                onPress={() => router.push('/contributions/payments')}
              >
                <Ionicons name="receipt" size={24} color="#fff" />
                <Text style={styles.actionButtonText}>Payment History</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: '#6200ee' }]}
                onPress={() => router.push('/contributions/admin-member-connect')}
              >
                <Ionicons name="chatbubbles" size={24} color="#fff" />
                <Text style={styles.actionButtonText}>Member Connect</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: '#00897b' }]}
                onPress={() => router.push('/contributions/create-notification')}
              >
                <Ionicons name="notifications" size={24} color="#fff" />
                <Text style={styles.actionButtonText}>Send Notification</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: '#ff5722' }]}
                onPress={() => router.push('/contributions/admin-messages')}
              >
                <Ionicons name="mail" size={24} color="#fff" />
                <Text style={styles.actionButtonText}>Contact Messages</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            {/* Member View */}
            {/* Overdue Alert Banner */}
            <OverdueAlertBanner />
            
            <View style={styles.memberContainer}>
              {memberData && (
                <View style={styles.memberInfoCard}>
                  <View style={styles.memberHeader}>
                    {memberData.profile_image ? (
                      <Image
                        source={{ uri: memberData.profile_image }}
                        style={styles.profileImage}
                      />
                    ) : (
                      <View style={styles.profileImagePlaceholder}>
                        <Ionicons name="person" size={40} color="#fff" />
                      </View>
                    )}
                    <View style={styles.memberInfo}>
                      <Text style={styles.memberName}>{memberData.full_name}</Text>
                      <Text style={styles.memberPlan}>{memberData.plan} Plan - {memberData.frequency}</Text>
                    </View>
                  </View>
                  <View style={styles.memberStats}>
                    <View style={styles.memberStat}>
                      <Text style={styles.memberStatLabel}>Total Paid</Text>
                      <Text style={styles.memberStatValue}>₹{memberData.total_paid}</Text>
                    </View>
                    <View style={styles.memberStat}>
                      <Text style={styles.memberStatLabel}>Next Due</Text>
                      <Text style={styles.memberStatValue}>
                        {new Date(memberData.next_due_date).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
              
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => router.push('/contributions/my-profile')}
              >
                <Ionicons name="person" size={24} color="#fff" />
                <Text style={styles.actionButtonText}>View My Profile</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: '#6200ee' }]}
                onPress={() => router.push('/member-connect')}
              >
                <Ionicons name="chatbubbles" size={24} color="#fff" />
                <Text style={styles.actionButtonText}>Member Connect</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: '#00897b' }]}
                onPress={() => router.push('/contributions/my-payments')}
              >
                <Ionicons name="receipt" size={24} color="#fff" />
                <Text style={styles.actionButtonText}>My Payment History</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: '#1976d2' }]}
                onPress={() => router.push('/contributions/make-payment')}
              >
                <Ionicons name="card" size={24} color="#fff" />
                <Text style={styles.actionButtonText}>Make Online Payment</Text>
              </TouchableOpacity>
            </View>
          </>
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
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  statsContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    marginTop: 8,
  },
  statRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6200ee',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  overdueAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    padding: 16,
    borderRadius: 12,
    marginVertical: 12,
    gap: 12,
  },
  overdueText: {
    flex: 1,
    fontSize: 14,
    color: '#c62828',
    fontWeight: '600',
  },
  planStats: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  planItem: {
    alignItems: 'center',
  },
  planValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#6200ee',
    marginBottom: 4,
  },
  planLabel: {
    fontSize: 12,
    color: '#666',
  },
  actionsContainer: {
    padding: 16,
  },
  memberContainer: {
    padding: 16,
  },
  memberInfoCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 16,
    borderWidth: 3,
    borderColor: '#6200ee',
  },
  profileImagePlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#6200ee',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  memberPlan: {
    fontSize: 15,
    color: '#6200ee',
  },
  memberStats: {
    flexDirection: 'row',
    gap: 20,
  },
  memberStat: {
    flex: 1,
  },
  memberStatLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  memberStatValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
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
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
