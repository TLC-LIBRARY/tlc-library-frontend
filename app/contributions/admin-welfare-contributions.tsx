import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import api from '../../utils/api';


interface Contribution {
  id: string;
  member_id: string;
  member_name: string;
  email: string;
  amount: number;
  payment_mode: string;
  transaction_id?: string;
  remarks?: string;
  status: string;
  payment_date: string;
  created_at: string;
}

export default function AdminWelfareContributions() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();

  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [filteredContributions, setFilteredContributions] = useState<Contribution[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('all');
  
  // Record Payment Modal
  const [recordModalVisible, setRecordModalVisible] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [recordAmount, setRecordAmount] = useState('');
  const [recordMode, setRecordMode] = useState('Online');
  const [recordTransactionId, setRecordTransactionId] = useState('');
  const [recordRemarks, setRecordRemarks] = useState('');
  const [recording, setRecording] = useState(false);

  useEffect(() => {
    if (user?.role !== 'admin') {
      const message = 'Admin access required';
      if (Platform.OS === 'web') {
        window.alert(message);
      } else {
        Alert.alert('Access Denied', message);
      }
      router.replace('/contributions/dashboard');
      return;
    }
    loadData();
    loadMembers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, filterMode, contributions]);

  const loadData = async () => {
    try {
      const token = user?.token;

      const [contributionsRes, statsRes] = await Promise.all([
        api.get(`/api/welfare-contribution/admin/list`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        api.get(`/api/welfare-contribution/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setContributions(contributionsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load contributions data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadMembers = async () => {
    try {
      const token = user?.token;
      const response = await api.get(`/api/contributions/members`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMembers(response.data);
    } catch (error) {
      console.error('Error loading members:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const applyFilters = () => {
    let filtered = contributions;

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(c =>
        c.member_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.member_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Payment mode filter
    if (filterMode !== 'all') {
      filtered = filtered.filter(c => c.payment_mode === filterMode);
    }

    setFilteredContributions(filtered);
  };

  const openRecordModal = () => {
    setSelectedMemberId('');
    setRecordAmount('');
    setRecordMode('Cash');
    setRecordTransactionId('');
    setRecordRemarks('');
    setRecordModalVisible(true);
  };

  const recordOfflinePayment = async () => {
    if (!selectedMemberId || !recordAmount || parseFloat(recordAmount) < 100) {
      Alert.alert('Validation Error', 'Please select a member and enter valid amount (minimum ₹100)');
      return;
    }

    try {
      setRecording(true);
      const token = user?.token;

      await axios.post(
        `${BACKEND_URL}/api/welfare-contribution/admin/record`,
        {
          member_id: selectedMemberId,
          amount: parseFloat(recordAmount),
          payment_mode: recordMode,
          transaction_id: recordTransactionId || null,
          remarks: recordRemarks || null
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert('Success', 'Offline payment recorded successfully');
      setRecordModalVisible(false);
      await loadData();
    } catch (error: any) {
      console.error('Error recording payment:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to record payment');
    } finally {
      setRecording(false);
    }
  };

  const deleteContribution = async (contributionId: string) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this contribution record?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = user?.token;
              await axios.delete(
                `${BACKEND_URL}/api/welfare-contribution/admin/contribution/${contributionId}`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              Alert.alert('Success', 'Contribution deleted successfully');
              await loadData();
            } catch (error: any) {
              console.error('Error deleting contribution:', error);
              Alert.alert('Error', 'Failed to delete contribution');
            }
          }
        }
      ]
    );
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <TouchableOpacity onPress={() => router.replace('/contributions/dashboard')} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Welfare Contributions</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => router.replace('/contributions/dashboard')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Welfare Contributions</Text>
        <TouchableOpacity onPress={() => router.push('/contributions/admin-welfare-stats')} style={styles.statsButton}>
          <Ionicons name="stats-chart" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        {/* Quick Stats */}
        {stats && (
          <View style={styles.statsContainer}>
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <Ionicons name="cash" size={20} color="#4caf50" />
              <Text style={[styles.statValue, { color: colors.text }]}>{formatCurrency(stats.total_amount_received)}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Collected</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <Ionicons name="people" size={20} color="#2196f3" />
              <Text style={[styles.statValue, { color: colors.text }]}>{stats.total_contributors}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Contributors</Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <Ionicons name="repeat" size={20} color="#ff9800" />
              <Text style={[styles.statValue, { color: colors.text }]}>{stats.total_contributions}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Count</Text>
            </View>
          </View>
        )}

        {/* Record Payment Button */}
        <TouchableOpacity
          style={[styles.recordButton, { backgroundColor: colors.primary }]}
          onPress={openRecordModal}
        >
          <Ionicons name="add-circle" size={20} color="#fff" />
          <Text style={styles.recordButtonText}>Record Offline Payment</Text>
        </TouchableOpacity>

        {/* Search */}
        <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by name, ID, or email..."
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        {/* Mode Filter */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterChip, filterMode === 'all' && { backgroundColor: colors.primary }]}
            onPress={() => setFilterMode('all')}
          >
            <Text style={[styles.filterText, filterMode === 'all' && { color: '#fff' }]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, filterMode === 'Online' && { backgroundColor: colors.primary }]}
            onPress={() => setFilterMode('Online')}
          >
            <Text style={[styles.filterText, filterMode === 'Online' && { color: '#fff' }]}>Online</Text>
          </TouchableOpacity>
        </View>

        {/* Contributions Table */}
        <View style={styles.tableContainer}>
          <Text style={[styles.tableTitle, { color: colors.text }]}>
            Contributions ({filteredContributions.length})
          </Text>

          {filteredContributions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="wallet-outline" size={64} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No contributions found</Text>
            </View>
          ) : (
            filteredContributions.map((contribution) => (
              <View key={contribution.id} style={[styles.contributionRow, { backgroundColor: colors.card }]}>
                <View style={styles.rowHeader}>
                  <View style={styles.memberInfo}>
                    <Text style={[styles.memberName, { color: colors.text }]}>{contribution.member_name}</Text>
                    <Text style={[styles.memberId, { color: colors.textSecondary }]}>
                      {contribution.member_id} • {contribution.email}
                    </Text>
                  </View>
                  <Text style={[styles.amount, { color: colors.primary }]}>
                    {formatCurrency(contribution.amount)}
                  </Text>
                </View>

                <View style={styles.rowDetails}>
                  <View style={styles.detailItem}>
                    <Ionicons name="card" size={14} color={colors.textSecondary} />
                    <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                      {contribution.payment_mode}
                    </Text>
                  </View>

                  <View style={styles.detailItem}>
                    <Ionicons name="calendar" size={14} color={colors.textSecondary} />
                    <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                      {formatDate(contribution.payment_date)}
                    </Text>
                  </View>

                  {contribution.transaction_id && (
                    <View style={styles.detailItem}>
                      <Ionicons name="receipt" size={14} color={colors.textSecondary} />
                      <Text style={[styles.detailText, { color: colors.textSecondary }]} numberOfLines={1}>
                        {contribution.transaction_id}
                      </Text>
                    </View>
                  )}
                </View>

                {contribution.remarks && (
                  <Text style={[styles.remarks, { color: colors.textSecondary }]} numberOfLines={2}>
                    {contribution.remarks}
                  </Text>
                )}

                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deleteContribution(contribution.id)}
                >
                  <Ionicons name="trash" size={18} color="#d32f2f" />
                  <Text style={styles.deleteText}>Delete</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Record Payment Modal */}
      <Modal
        visible={recordModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setRecordModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Record Offline Payment</Text>
              <TouchableOpacity onPress={() => setRecordModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Select Member *</Text>
                <View style={[styles.pickerContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Picker
                    selectedValue={selectedMemberId}
                    onValueChange={setSelectedMemberId}
                    style={{ color: colors.text }}
                  >
                    <Picker.Item label="-- Select Member --" value="" />
                    {members.map(member => (
                      <Picker.Item
                        key={member.member_id}
                        label={`${member.full_name} (${member.custom_id || member.member_id})`}
                        value={member.custom_id || member.member_id}
                      />
                    ))}
                  </Picker>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Amount *</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  value={recordAmount}
                  onChangeText={setRecordAmount}
                  placeholder="Minimum ₹100"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Payment Mode</Text>
                <View style={[styles.infoBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Ionicons name="information-circle" size={20} color={colors.primary} />
                  <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                    All welfare contributions must be paid online via Razorpay.  Admin can record reference for tracking.
                  </Text>
                </View>
                <View style={[styles.pickerContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Picker
                    selectedValue={recordMode}
                    onValueChange={setRecordMode}
                    style={{ color: colors.text }}
                    enabled={false}
                  >
                    <Picker.Item label="Online (Razorpay)" value="Online" />
                  </Picker>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Transaction ID (Optional)</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  value={recordTransactionId}
                  onChangeText={setRecordTransactionId}
                  placeholder="Enter transaction ID"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Remarks (Optional)</Text>
                <TextInput
                  style={[styles.textArea, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  value={recordRemarks}
                  onChangeText={setRecordRemarks}
                  placeholder="Add any notes"
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setRecordModalVisible(false)}
                disabled={recording}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton, { backgroundColor: colors.primary }]}
                onPress={recordOfflinePayment}
                disabled={recording}
              >
                {recording ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Record Payment</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 16,
    paddingHorizontal: 16
  },
  backButton: {
    padding: 4
  },
  statsButton: {
    padding: 4
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center'
  },
  scrollView: {
    flex: 1
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12
  },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4
      },
      android: {
        elevation: 3
      }
    })
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
    textAlign: 'center'
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 14,
    borderRadius: 8,
    gap: 8
  },
  recordButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600'
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
    gap: 8
  },
  searchInput: {
    flex: 1,
    fontSize: 14
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8
  },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ddd'
  },
  filterText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666'
  },
  tableContainer: {
    padding: 16
  },
  tableTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16
  },
  contributionRow: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2
      },
      android: {
        elevation: 2
      }
    })
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8
  },
  memberInfo: {
    flex: 1,
    marginRight: 8
  },
  memberName: {
    fontSize: 15,
    fontWeight: '600'
  },
  memberId: {
    fontSize: 12,
    marginTop: 2
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  rowDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  detailText: {
    fontSize: 12
  },
  remarks: {
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 8
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingVertical: 4
  },
  deleteText: {
    fontSize: 13,
    color: '#d32f2f',
    fontWeight: '500'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 16
  },
  modalContent: {
    borderRadius: 12,
    maxHeight: '90%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8
      },
      android: {
        elevation: 8
      }
    })
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  modalBody: {
    padding: 16,
    maxHeight: 400
  },
  inputGroup: {
    marginBottom: 16
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top'
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden'
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0'
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  cancelButton: {
    backgroundColor: '#e0e0e0'
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666'
  },
  submitButton: {
    backgroundColor: '#007bff'
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff'
  }
});
