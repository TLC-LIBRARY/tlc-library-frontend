import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Picker } from '@react-native-picker/picker';
import api from '../../utils/api';
import { format } from 'date-fns';


interface Application {
  id: string;
  member_id: string;
  member_name: string;
  email: string;
  plan_type: string;
  purpose: string;
  requested_amount: number;
  supporting_docs: string[];
  status: string;
  approved_amount: number | null;
  installment_count: number | null;
  installment_amount: number | null;
  remarks: string | null;
  created_at: string;
  approval_date: string | null;
}

export default function AdminEducationalSupport() {
  const { token } = useAuth();
  const router = useRouter();
  const { colors } = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApps, setFilteredApps] = useState<Application[]>([]);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState<any>(null);
  
  // Approval Modal
  const [approvalModalVisible, setApprovalModalVisible] = useState(false);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');
  const [approvedAmount, setApprovedAmount] = useState('');
  const [installmentCount, setInstallmentCount] = useState('');
  const [startMonth, setStartMonth] = useState('');
  const [remarks, setRemarks] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterApplications();
  }, [selectedFilter, searchQuery, applications]);

  const loadData = async () => {
    try {
      const [appsResponse, statsResponse] = await Promise.all([
        api.get('/api/educational-support/admin/applications'),
        api.get('/api/educational-support/admin/stats')
      ]);
      
      setApplications(appsResponse.data);
      setStats(statsResponse.data);
    } catch (error) {
      console.error('Failed to load data:', error);
      Alert.alert('Error', 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const filterApplications = () => {
    let filtered = applications;

    if (selectedFilter !== 'all') {
      filtered = filtered.filter(app => app.status === selectedFilter);
    }

    if (searchQuery.trim()) {
      filtered = filtered.filter(app =>
        app.member_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.member_id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredApps(filtered);
  };

  const openApprovalModal = (app: Application, action: 'approve' | 'reject') => {
    setSelectedApp(app);
    setApprovalAction(action);
    setApprovedAmount(action === 'approve' ? app.requested_amount.toString() : '');
    setInstallmentCount('');
    setStartMonth('');
    setRemarks('');
    setApprovalModalVisible(true);
  };

  const handleApprove = async () => {
    if (!approvedAmount || !installmentCount || !startMonth) {
      Alert.alert('Validation Error', 'Please fill all required fields');
      return;
    }

    const amount = parseFloat(approvedAmount);
    const installments = parseInt(installmentCount);

    if (amount < 5000 || amount > 100000) {
      Alert.alert('Validation Error', 'Amount must be between ₹5,000 and ₹1,00,000');
      return;
    }

    if (installments < 1 || installments > 60) {
      Alert.alert('Validation Error', 'Installments must be between 1 and 60');
      return;
    }

    setProcessing(true);
    try {
      await api.put(
        `/api/educational-support/admin/application/${selectedApp?.id}/approve`,
        {
          approved_amount: amount,
          installment_count: installments,
          start_month: startMonth,
          remarks: remarks
        }
      );

      Alert.alert('Success', 'Application approved successfully! Sanction created and member notified.');
      setApprovalModalVisible(false);
      loadData();
    } catch (error: any) {
      console.error('Approve error:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to approve application');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!remarks.trim()) {
      Alert.alert('Validation Error', 'Please provide remarks for rejection');
      return;
    }

    setProcessing(true);
    try {
      await api.put(
        `/api/educational-support/admin/application/${selectedApp?.id}/reject`,
        { remarks: remarks.trim() }
      );

      Alert.alert('Success', 'Application rejected. Member has been notified.');
      setApprovalModalVisible(false);
      loadData();
    } catch (error: any) {
      console.error('Reject error:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to reject application');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return '#ff9800';
      case 'Approved': return '#4caf50';
      case 'Rejected': return '#d32f2f';
      default: return '#999';
    }
  };

  const renderStatsCard = () => {
    if (!stats) return null;

    return (
      <View style={[styles.statsContainer, { backgroundColor: colors.surface }]}>
        <View style={styles.statCard}>
          <Ionicons name="document-text" size={24} color="#6200ee" />
          <Text style={[styles.statValue, { color: colors.text }]}>{stats.applications.total}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="time" size={24} color="#ff9800" />
          <Text style={[styles.statValue, { color: colors.text }]}>{stats.applications.pending}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Pending</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="checkmark-circle" size={24} color="#4caf50" />
          <Text style={[styles.statValue, { color: colors.text }]}>{stats.applications.approved}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Approved</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="close-circle" size={24} color="#d32f2f" />
          <Text style={[styles.statValue, { color: colors.text }]}>{stats.applications.rejected}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Rejected</Text>
        </View>
      </View>
    );
  };

  const renderApplication = (app: Application) => {
    const statusColor = getStatusColor(app.status);

    return (
      <View key={app.id} style={[styles.appCard, { backgroundColor: colors.surface, borderLeftColor: statusColor }]}>
        <View style={styles.appHeader}>
          <View style={styles.memberInfo}>
            <View style={styles.memberRow}>
              <Ionicons name="person-circle" size={20} color={colors.primary} />
              <Text style={[styles.memberName, { color: colors.text }]}>
                {app.member_name}
              </Text>
            </View>
            <Text style={[styles.memberId, { color: colors.textSecondary }]}>
              {app.member_id} • {app.plan_type}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {app.status}
            </Text>
          </View>
        </View>

        <View style={styles.purposeRow}>
          <Ionicons name="school" size={16} color={colors.primary} />
          <Text style={[styles.purposeText, { color: colors.primary }]}>
            {app.purpose}
          </Text>
        </View>

        <View style={styles.amountRow}>
          <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>
            Requested:
          </Text>
          <Text style={[styles.amountValue, { color: colors.text }]}>
            ₹{app.requested_amount.toLocaleString()}
          </Text>
        </View>

        {app.approved_amount && (
          <View style={styles.amountRow}>
            <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>
              Approved:
            </Text>
            <Text style={[styles.approvedValue, { color: '#4caf50' }]}>
              ₹{app.approved_amount.toLocaleString()} ({app.installment_count}x ₹{app.installment_amount})
            </Text>
          </View>
        )}

        {app.supporting_docs.length > 0 && (
          <View style={[styles.docsRow, { backgroundColor: colors.background }]}>
            <Ionicons name="document-attach" size={16} color={colors.primary} />
            <Text style={[styles.docsText, { color: colors.text }]}>
              {app.supporting_docs.length} document(s) attached
            </Text>
          </View>
        )}

        {app.remarks && (
          <View style={[styles.remarksBox, { backgroundColor: `${statusColor}15` }]}>
            <Text style={[styles.remarksText, { color: colors.text }]}>
              {app.remarks}
            </Text>
          </View>
        )}

        <View style={styles.appFooter}>
          <Text style={[styles.dateText, { color: colors.textSecondary }]}>
            {format(new Date(app.created_at), 'dd MMM yyyy')}
          </Text>
          
          {app.status === 'Pending' && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: '#4caf5020' }]}
                onPress={() => openApprovalModal(app, 'approve')}
              >
                <Ionicons name="checkmark" size={16} color="#4caf50" />
                <Text style={[styles.actionBtnText, { color: '#4caf50' }]}>Approve</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: '#d32f2f20' }]}
                onPress={() => openApprovalModal(app, 'reject')}
              >
                <Ionicons name="close" size={16} color="#d32f2f" />
                <Text style={[styles.actionBtnText, { color: '#d32f2f' }]}>Reject</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Educational Support</Text>
        <TouchableOpacity 
          onPress={() => router.push('/contributions/admin-sanctions-management')}
          style={styles.sanctionsButton}
        >
          <Ionicons name="receipt" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {renderStatsCard()}

      {/* Financial Summary */}
      {stats && (
        <View style={[styles.financialCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.financialTitle, { color: colors.text }]}>
            Total Approved Amount
          </Text>
          <Text style={[styles.financialAmount, { color: '#4caf50' }]}>
            ₹{stats.financial.total_approved_amount.toLocaleString()}
          </Text>
        </View>
      )}

      {/* Search */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
        <Ionicons name="search" size={20} color={colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search by name or ID..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContainer}
      >
        {['all', 'Pending', 'Approved', 'Rejected'].map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterTab,
              { borderColor: colors.border },
              selectedFilter === filter && { backgroundColor: colors.primary, borderColor: colors.primary }
            ]}
            onPress={() => setSelectedFilter(filter)}
          >
            <Text
              style={[
                styles.filterText,
                { color: selectedFilter === filter ? '#fff' : colors.textSecondary }
              ]}
            >
              {filter === 'all' ? 'All' : filter}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Applications List */}
      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView style={styles.appsList} contentContainerStyle={styles.appsListContent}>
          {filteredApps.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-outline" size={64} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No applications found
              </Text>
            </View>
          ) : (
            <>
              <Text style={[styles.resultCount, { color: colors.textSecondary }]}>
                {filteredApps.length} {filteredApps.length === 1 ? 'application' : 'applications'}
              </Text>
              {filteredApps.map(renderApplication)}
            </>
          )}
        </ScrollView>
      )}

      {/* Approval/Rejection Modal */}
      <Modal visible={approvalModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {approvalAction === 'approve' ? 'Approve Application' : 'Reject Application'}
              </Text>
              <TouchableOpacity onPress={() => setApprovalModalVisible(false)}>
                <Ionicons name="close" size={28} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={[styles.memberInfoBox, { backgroundColor: colors.background }]}>
                <Text style={[styles.memberInfoText, { color: colors.text }]}>
                  {selectedApp?.member_name} ({selectedApp?.member_id})
                </Text>
                <Text style={[styles.memberInfoSubtext, { color: colors.textSecondary }]}>
                  Requested: ₹{selectedApp?.requested_amount.toLocaleString()} for {selectedApp?.purpose}
                </Text>
              </View>

              {approvalAction === 'approve' ? (
                <>
                  <Text style={[styles.label, { color: colors.text }]}>Approved Amount *</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                    placeholder="5000 - 100000"
                    placeholderTextColor={colors.textSecondary}
                    value={approvedAmount}
                    onChangeText={setApprovedAmount}
                    keyboardType="numeric"
                  />

                  <Text style={[styles.label, { color: colors.text }]}>Installments (Months) *</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                    placeholder="1 - 60"
                    placeholderTextColor={colors.textSecondary}
                    value={installmentCount}
                    onChangeText={setInstallmentCount}
                    keyboardType="numeric"
                  />

                  {approvedAmount && installmentCount && (
                    <View style={[styles.calcBox, { backgroundColor: `${colors.primary}15` }]}>
                      <Text style={[styles.calcText, { color: colors.text }]}>
                        Monthly Installment: ₹{(parseFloat(approvedAmount) / parseInt(installmentCount || '1')).toFixed(2)}
                      </Text>
                    </View>
                  )}

                  <Text style={[styles.label, { color: colors.text }]}>Start Month *</Text>
                  <View style={[styles.pickerContainer, { backgroundColor: colors.background }]}>
                    <Picker
                      selectedValue={startMonth}
                      onValueChange={setStartMonth}
                      style={[styles.picker, { color: colors.text }]}
                    >
                      <Picker.Item label="Select month..." value="" />
                      <Picker.Item label="January" value="January" />
                      <Picker.Item label="February" value="February" />
                      <Picker.Item label="March" value="March" />
                      <Picker.Item label="April" value="April" />
                      <Picker.Item label="May" value="May" />
                      <Picker.Item label="June" value="June" />
                      <Picker.Item label="July" value="July" />
                      <Picker.Item label="August" value="August" />
                      <Picker.Item label="September" value="September" />
                      <Picker.Item label="October" value="October" />
                      <Picker.Item label="November" value="November" />
                      <Picker.Item label="December" value="December" />
                    </Picker>
                  </View>
                </>
              ) : null}

              <Text style={[styles.label, { color: colors.text }]}>
                Remarks {approvalAction === 'reject' ? '*' : '(Optional)'}
              </Text>
              <TextInput
                style={[styles.textArea, { backgroundColor: colors.background, color: colors.text }]}
                placeholder={approvalAction === 'approve' ? "Additional notes..." : "Reason for rejection..."}
                placeholderTextColor={colors.textSecondary}
                value={remarks}
                onChangeText={setRemarks}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </ScrollView>

            <TouchableOpacity
              style={[
                styles.submitButton,
                { backgroundColor: approvalAction === 'approve' ? '#4caf50' : '#d32f2f' }
              ]}
              onPress={approvalAction === 'approve' ? handleApprove : handleReject}
              disabled={processing}
            >
              {processing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {approvalAction === 'approve' ? 'Approve & Create Sanction' : 'Reject Application'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 4,
  },
  sanctionsButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
  },
  statCard: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
  },
  financialCard: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  financialTitle: {
    fontSize: 14,
    marginBottom: 4,
  },
  financialAmount: {
    fontSize: 28,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  filterScroll: {
    maxHeight: 60,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  appsList: {
    flex: 1,
  },
  appsListContent: {
    padding: 16,
  },
  resultCount: {
    fontSize: 13,
    marginBottom: 12,
  },
  appCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  appHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  memberInfo: {
    flex: 1,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '700',
  },
  memberId: {
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  purposeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  purposeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  amountLabel: {
    fontSize: 14,
  },
  amountValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  approvedValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  docsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
    gap: 6,
  },
  docsText: {
    fontSize: 13,
  },
  remarksBox: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  remarksText: {
    fontSize: 13,
    lineHeight: 18,
  },
  appFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  dateText: {
    fontSize: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
  },
  modalBody: {
    maxHeight: 400,
  },
  memberInfoBox: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  memberInfoText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  memberInfoSubtext: {
    fontSize: 14,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  pickerContainer: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  textArea: {
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    minHeight: 80,
  },
  calcBox: {
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  calcText: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  submitButton: {
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});