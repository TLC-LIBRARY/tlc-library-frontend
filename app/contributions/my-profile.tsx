import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import { format } from 'date-fns';

export default function MyProfile() {
  const { token, user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [memberData, setMemberData] = useState<any>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  // Reload profile when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadProfile();
    }, [])
  );

  const loadProfile = async () => {
    try {
      console.log('Loading member profile...');
      const response = await api.get('/api/contributions/members/my-profile');
      console.log('Profile response:', response.data);
      
      if (response.data) {
        setMemberData(response.data);
      } else {
        console.log('No member data found');
        Alert.alert('Profile Not Found', 'No member profile found. Please contact admin.');
      }
    } catch (error: any) {
      console.error('Failed to load profile:', error);
      console.error('Error response:', error.response?.data);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to load profile');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadProfile();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#6200ee" style={{ marginTop: 100 }} />
      </SafeAreaView>
    );
  }

  if (!memberData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => (router.canGoBack() ? router.back() : router.push('/(tabs)'))} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Profile</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="person-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No member profile found</Text>
          <Text style={styles.emptySubtext}>Please contact admin to register as a member</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (router.canGoBack() ? router.back() : router.push('/(tabs)'))} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.profileCard}>
          <TouchableOpacity 
            style={styles.avatarContainer}
            onPress={() => router.push('/contributions/edit-profile')}
          >
            {memberData.profile_image ? (
              <Image source={{ uri: memberData.profile_image }} style={styles.profileImage} />
            ) : (
              <View style={styles.placeholderAvatar}>
                <Ionicons name="person" size={48} color="#6200ee" />
              </View>
            )}
            <View style={styles.editIconBadge}>
              <Ionicons name="create" size={16} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.name}>{memberData.full_name}</Text>
          <Text style={styles.memberId}>{memberData.custom_id || memberData.member_id}</Text>
          <View style={[styles.statusBadge, memberData.status === 'Active' ? styles.activeStatus : styles.inactiveStatus]}>
            <Text style={styles.statusText}>{memberData.status}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contribution Details</Text>
          
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="pricetag" size={20} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Plan</Text>
                <Text style={styles.infoValue}>{memberData.plan}</Text>
              </View>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="calendar" size={20} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Frequency</Text>
                <Text style={styles.infoValue}>{memberData.frequency}</Text>
              </View>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="cash" size={20} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Total Paid</Text>
                <Text style={styles.infoValue}>₹{memberData.total_paid}</Text>
              </View>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="time" size={20} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Next Due Date</Text>
                <Text style={styles.infoValue}>
                  {format(new Date(memberData.next_due_date), 'MMM dd, yyyy')}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="calendar-outline" size={20} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Joined On</Text>
                <Text style={styles.infoValue}>
                  {format(new Date(memberData.registration_date), 'MMM dd, yyyy')}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="mail" size={20} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{memberData.email}</Text>
              </View>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="call" size={20} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Mobile</Text>
                <Text style={styles.infoValue}>{memberData.mobile}</Text>
              </View>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="location" size={20} color="#666" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Address</Text>
                <Text style={styles.infoValue}>{memberData.address}</Text>
              </View>
            </View>
          </View>
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
  profileCard: {
    backgroundColor: '#fff',
    alignItems: 'center',
    padding: 24,
    marginBottom: 16,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
    position: 'relative',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#6200ee',
  },
  placeholderAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f3e5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#6200ee',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  memberId: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  activeStatus: {
    backgroundColor: '#c8e6c9',
  },
  inactiveStatus: {
    backgroundColor: '#ffcdd2',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  infoRow: {
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});