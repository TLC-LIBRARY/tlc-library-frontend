import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';

export default function Members() {
  const { token } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadMembers();
  }, []);

  // Auto-refresh when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadMembers();
    }, [])
  );

  const loadMembers = async () => {
    try {
      const response = await api.get('/api/contributions/members');
      setMembers(response.data);
    } catch (error) {
      console.error('Failed to load members:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = members.filter(member =>
    member.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.member_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderMember = ({ item }: { item: any }) => (
    <View style={styles.memberCard}>
      <TouchableOpacity 
        onPress={() => router.push(`/contributions/edit-member?memberId=${item.member_id}`)}
      >
        <View style={styles.memberHeader}>
          <View style={styles.memberIconContainer}>
            {item.profile_image ? (
              <Image source={{ uri: item.profile_image }} style={styles.profileImage} />
            ) : (
              <View style={styles.memberIcon}>
                <Ionicons name="person" size={24} color="#6200ee" />
              </View>
            )}
          </View>
          <View style={styles.memberInfo}>
            <Text style={styles.memberName}>{item.full_name}</Text>
            <Text style={styles.memberEmail}>{item.email}</Text>
            <Text style={styles.memberId}>{item.custom_id || item.member_id}</Text>
          </View>
          <View style={[styles.statusBadge, item.status === 'Active' ? styles.statusActive : styles.statusInactive]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
        <View style={styles.memberDetails}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Plan</Text>
            <Text style={styles.detailValue}>{item.plan}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Frequency</Text>
            <Text style={styles.detailValue}>{item.frequency}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Total Paid</Text>
            <Text style={styles.detailValue}>₹{item.total_paid}</Text>
          </View>
        </View>
      </TouchableOpacity>
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => router.push(`/contributions/manage-plan?memberId=${item.member_id}`)}
        >
          <Ionicons name="swap-horizontal" size={18} color="#6200ee" />
          <Text style={styles.actionButtonText}>Manage Plan</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => router.push(`/contributions/edit-member?memberId=${item.member_id}`)}
        >
          <Ionicons name="create-outline" size={18} color="#2196f3" />
          <Text style={[styles.actionButtonText, { color: '#2196f3' }]}>Edit Details</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (router.canGoBack() ? router.back() : router.push('/(tabs)'))} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Members</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by name, ID, or email"
          placeholderTextColor="#999"
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#6200ee" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredMembers}
          renderItem={renderMember}
          keyExtractor={(item, index) => `member-${item.member_id}-${item.email}-${index}`}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No members found</Text>
            </View>
          }
        />
      )}
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  listContainer: {
    padding: 16,
    paddingTop: 0,
  },
  memberCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  memberIconContainer: {
    marginRight: 12,
  },
  memberIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3e5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f0f0',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  memberEmail: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  memberId: {
    fontSize: 12,
    color: '#999',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusActive: {
    backgroundColor: '#c8e6c9',
  },
  statusInactive: {
    backgroundColor: '#ffcdd2',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  memberDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
    marginBottom: 12,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    gap: 6,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6200ee',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
});