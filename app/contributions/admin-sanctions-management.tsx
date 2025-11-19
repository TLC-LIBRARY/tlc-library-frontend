import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import api from '../../utils/api';


interface Sanction {
  id: string;
  sanction_id: string;
  member_id: string;
  member_name: string;
  application_id: string;
  approved_amount: number;
  service_fee: number;
  installments: number;
  installment_amount: number;
  balance_due: number;
  paid_installments: number;
  remaining_installments: number;
  amount_paid: number;
  next_due_date: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface SanctionStats {
  total_sanctions: number;
  total_disbursed: number;
  total_received: number;
  total_pending: number;
}

interface PaymentHistory {
  id: string;
  installment_number: number;
  amount_paid: number;
  payment_date: string;
  payment_mode: string;
  transaction_id?: string;
  remarks?: string;
}

export default function AdminSanctionsManagement() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();

  const [sanctions, setSanctions] = useState<Sanction[]>([]);
  const [filteredSanctions, setFilteredSanctions] = useState<Sanction[]>([]);
  const [stats, setStats] = useState<SanctionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'completed'>('all');
  
  // Payment modal state
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedSanction, setSelectedSanction] = useState<Sanction | null>(null);
  const [installmentNumber, setInstallmentNumber] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentMode, setPaymentMode] = useState('Offline');
  const [transactionId, setTransactionId] = useState('');
  const [remarks, setRemarks] = useState('');
  const [recordingPayment, setRecordingPayment] = useState(false);
  
  // Payment history modal
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Check admin access first
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    if (user.role !== 'admin') {
      setTimeout(() => {
        Alert.alert('Access Denied', 'Admin access required', [
          {
            text: 'OK',
            onPress: () => router.replace('/(tabs)')
          }
        ]);
      }, 100);
      return;
    }
    
    loadData();
  }, [user]);

  useEffect(() => {
    applyFilter();
  }, [activeFilter, sanctions]);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = user?.token;

      // Fetch sanctions with details
      const sanctionsRes = await api.get(`/api/educational-support/admin/sanctions-detailed`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Fetch stats
      const statsRes = await api.get(`/api/educational-support/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSanctions(sanctionsRes.data);
      setStats({
        total_sanctions: statsRes.data.sanctions.total_sanctions || 0,
        total_disbursed: statsRes.data.financial.total_disbursed || 0,
        total_received: statsRes.data.financial.total_received || 0,
        total_pending: statsRes.data.financial.total_pending || 0
      });
    } catch (error: any) {
      console.error('Error loading sanctions:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to load sanctions data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const applyFilter = () => {
    if (activeFilter === 'all') {
      setFilteredSanctions(sanctions);
    } else if (activeFilter === 'active') {
      setFilteredSanctions(sanctions.filter(s => s.status === 'Active'));
    } else if (activeFilter === 'completed') {
      setFilteredSanctions(sanctions.filter(s => s.status === 'Completed'));
    }
  };

  const openPaymentModal = (sanction: Sanction) => {
    setSelectedSanction(sanction);
    setInstallmentNumber('');
    setAmountPaid(sanction.installment_amount.toString());
    setPaymentMode('Offline');
    setTransactionId('');
    setRemarks('');
    setPaymentModalVisible(true);
  };

  const recordPayment = async () => {
    if (!selectedSanction) return;

    if (!installmentNumber || !amountPaid) {
      Alert.alert('Validation Error', 'Please enter installment number and amount');
      return;
    }

    const instNum = parseInt(installmentNumber);
    if (isNaN(instNum) || instNum < 1 || instNum > selectedSanction.installments) {
      Alert.alert('Invalid Installment', `Installment number must be between 1 and ${selectedSanction.installments}`);
      return;
    }

    try {
      setRecordingPayment(true);

      const response = await api.post(
        `/api/educational-support/admin/sanction/${selectedSanction.sanction_id}/record-payment`,
        {
          installment_number: instNum,
          amount_paid: parseFloat(amountPaid),
          payment_mode: paymentMode,
          transaction_id: transactionId || null,
          remarks: remarks || ''
        }
      );

      Alert.alert(
        '✅ Success',
        `Installment payment recorded successfully!\n\nAmount: ₹${parseFloat(amountPaid).toLocaleString()}\nRemaining Balance: ₹${(selectedSanction.balance_due - parseFloat(amountPaid)).toLocaleString()}`
      );
      setPaymentModalVisible(false);
      await loadData();
    } catch (error: any) {
      console.error('Error recording payment:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to record payment');
    } finally {
      setRecordingPayment(false);
    }
  };

  const viewPaymentHistory = async (sanction: Sanction) => {
    setSelectedSanction(sanction);
    setLoadingHistory(true);
    setHistoryModalVisible(true);

    try {
      const response = await api.get(
        `/api/educational-support/admin/sanction/${sanction.sanction_id}/payments`
      );
      setPaymentHistory(response.data);
    } catch (error: any) {
      console.error('Error loading payment history:', error);
      Alert.alert('Error', 'Failed to load payment history');
      setPaymentHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Access control guard
  if (!user || user.role !== 'admin') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sanctions Management</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Ionicons name="lock-closed" size={60} color="#d32f2f" />
          <Text style={[styles.loadingText, { color: colors.text, marginTop: 16 }]}>
            Access Denied - Admin Only
          </Text>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sanctions Management</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading sanctions...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sanctions Management</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        {/* Summary Bar */}
        {stats && (
          <View style={styles.summaryContainer}>
            <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
              <Ionicons name="document-text" size={20} color={colors.primary} />
              <Text style={[styles.summaryValue, { color: colors.text }]}>{stats.total_sanctions}</Text>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total Sanctions</Text>
            </View>

            <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
              <Ionicons name="cash" size={20} color="#28a745" />
              <Text style={[styles.summaryValue, { color: colors.text }]}>{formatCurrency(stats.total_disbursed)}</Text>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Disbursed</Text>
            </View>

            <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
              <Ionicons name="checkmark-circle" size={20} color="#007bff" />
              <Text style={[styles.summaryValue, { color: colors.text }]}>{formatCurrency(stats.total_received)}</Text>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Received</Text>
            </View>

            <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
              <Ionicons name="time" size={20} color="#ff9800" />
              <Text style={[styles.summaryValue, { color: colors.text }]}>{formatCurrency(stats.total_pending)}</Text>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Pending</Text>
            </View>
          </View>
        )}

        {/* Filter Buttons */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              activeFilter === 'all' && { backgroundColor: colors.primary }
            ]}
            onPress={() => setActiveFilter('all')}
          >
            <Text style={[styles.filterText, activeFilter === 'all' && styles.filterTextActive]}>
              All ({sanctions.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              activeFilter === 'active' && { backgroundColor: colors.primary }
            ]}
            onPress={() => setActiveFilter('active')}
          >
            <Text style={[styles.filterText, activeFilter === 'active' && styles.filterTextActive]}>
              Active ({sanctions.filter(s => s.status === 'Active').length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              activeFilter === 'completed' && { backgroundColor: colors.primary }
            ]}
            onPress={() => setActiveFilter('completed')}
          >
            <Text style={[styles.filterText, activeFilter === 'completed' && styles.filterTextActive]}>
              Completed ({sanctions.filter(s => s.status === 'Completed').length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Sanctions Table */}
        <View style={styles.tableContainer}>
          {filteredSanctions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={64} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No sanctions found</Text>
            </View>
          ) : (
            <>
              {/* Table Header */}
              <View style={[styles.tableHeader, { backgroundColor: colors.card }]}>
                <Text style={[styles.tableHeaderText, { color: colors.text, flex: 1.2 }]}>Member</Text>
                <Text style={[styles.tableHeaderText, { color: colors.text, flex: 1 }]}>Sanction ID</Text>
                <Text style={[styles.tableHeaderText, { color: colors.text, flex: 0.8 }]}>Amount</Text>
                <Text style={[styles.tableHeaderText, { color: colors.text, flex: 0.8 }]}>Installments</Text>
                <Text style={[styles.tableHeaderText, { color: colors.text, flex: 0.8 }]}>Paid/Rem</Text>
                <Text style={[styles.tableHeaderText, { color: colors.text, flex: 0.7 }]}>Status</Text>
                <Text style={[styles.tableHeaderText, { color: colors.text, flex: 1 }]}>Actions</Text>
              </View>

              {/* Table Rows */}
              {filteredSanctions.map((sanction) => (
                <View key={sanction.id} style={[styles.tableRow, { backgroundColor: colors.card }]}>
                  <View style={{ flex: 1.2 }}>
                    <Text style={[styles.tableText, { color: colors.text }]} numberOfLines={1}>
                      {sanction.member_name}
                    </Text>
                    <Text style={[styles.tableSubText, { color: colors.textSecondary }]}>
                      {sanction.member_id}
                    </Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={[styles.tableText, { color: colors.text }]} numberOfLines={1}>
                      {sanction.sanction_id}
                    </Text>
                  </View>

                  <View style={{ flex: 0.8 }}>
                    <Text style={[styles.tableText, { color: colors.text }]}>
                      {formatCurrency(sanction.approved_amount)}
                    </Text>
                  </View>

                  <View style={{ flex: 0.8 }}>
                    <Text style={[styles.tableText, { color: colors.text }]}>
                      {sanction.installments}
                    </Text>
                  </View>

                  <View style={{ flex: 0.8 }}>
                    <Text style={[styles.tableText, { color: colors.text }]}>
                      {sanction.paid_installments}/{sanction.remaining_installments}
                    </Text>
                    <Text style={[styles.tableSubText, { color: colors.textSecondary }]}>
                      {formatCurrency(sanction.amount_paid)}
                    </Text>
                  </View>

                  <View style={{ flex: 0.7 }}>
                    <View
                      style={[
                        styles.statusBadge,
                        sanction.status === 'Active' && { backgroundColor: '#28a745' },
                        sanction.status === 'Completed' && { backgroundColor: '#007bff' }
                      ]}
                    >
                      <Text style={styles.statusText}>{sanction.status}</Text>
                    </View>
                  </View>

                  <View style={{ flex: 1, flexDirection: 'row', gap: 8 }}>
                    {sanction.status === 'Active' && (
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: colors.primary }]}
                        onPress={() => openPaymentModal(sanction)}
                      >
                        <Ionicons name="add-circle" size={18} color="#fff" />
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: '#007bff' }]}
                      onPress={() => viewPaymentHistory(sanction)}
                    >
                      <Ionicons name="list" size={18} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </>
          )}
        </View>
      </ScrollView>

      {/* Payment Recording Modal */}
      <Modal
        visible={paymentModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPaymentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Record Installment Payment</Text>
              <TouchableOpacity onPress={() => setPaymentModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {selectedSanction && (
                <>
                  <Text style={[styles.modalInfo, { color: colors.textSecondary }]}>
                    Sanction: {selectedSanction.sanction_id}
                  </Text>
                  <Text style={[styles.modalInfo, { color: colors.textSecondary }]}>
                    Member: {selectedSanction.member_name} ({selectedSanction.member_id})
                  </Text>
                  <Text style={[styles.modalInfo, { color: colors.textSecondary, marginBottom: 16 }]}>
                    Balance Due: {formatCurrency(selectedSanction.balance_due)}
                  </Text>

                  <Text style={[styles.inputLabel, { color: colors.text }]}>Installment Number *</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                    value={installmentNumber}
                    onChangeText={setInstallmentNumber}
                    placeholder="Enter installment number (1-N)"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="number-pad"
                  />

                  <Text style={[styles.inputLabel, { color: colors.text }]}>Amount Paid *</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                    value={amountPaid}
                    onChangeText={setAmountPaid}
                    placeholder="Enter amount"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="decimal-pad"
                  />

                  <Text style={[styles.inputLabel, { color: colors.text }]}>Payment Mode</Text>
                  <View style={styles.paymentModeContainer}>
                    <TouchableOpacity
                      style={[
                        styles.paymentModeButton,
                        paymentMode === 'Offline' && { backgroundColor: colors.primary }
                      ]}
                      onPress={() => setPaymentMode('Offline')}
                    >
                      <Text style={[styles.paymentModeText, paymentMode === 'Offline' && { color: '#fff' }]}>
                        Offline
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.paymentModeButton,
                        paymentMode === 'Online' && { backgroundColor: colors.primary }
                      ]}
                      onPress={() => setPaymentMode('Online')}
                    >
                      <Text style={[styles.paymentModeText, paymentMode === 'Online' && { color: '#fff' }]}>
                        Online
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={[styles.inputLabel, { color: colors.text }]}>Transaction ID (Optional)</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                    value={transactionId}
                    onChangeText={setTransactionId}
                    placeholder="Enter transaction ID"
                    placeholderTextColor={colors.textSecondary}
                  />

                  <Text style={[styles.inputLabel, { color: colors.text }]}>Remarks (Optional)</Text>
                  <TextInput
                    style={[styles.input, styles.textArea, { backgroundColor: colors.background, color: colors.text }]}
                    value={remarks}
                    onChangeText={setRemarks}
                    placeholder="Enter remarks"
                    placeholderTextColor={colors.textSecondary}
                    multiline
                    numberOfLines={3}
                  />
                </>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setPaymentModalVisible(false)}
                disabled={recordingPayment}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton, { backgroundColor: colors.primary }]}
                onPress={recordPayment}
                disabled={recordingPayment}
              >
                {recordingPayment ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Record Payment</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Payment History Modal */}
      <Modal
        visible={historyModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setHistoryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Payment History</Text>
              <TouchableOpacity onPress={() => setHistoryModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {selectedSanction && (
                <>
                  <Text style={[styles.modalInfo, { color: colors.textSecondary }]}>
                    Sanction: {selectedSanction.sanction_id}
                  </Text>
                  <Text style={[styles.modalInfo, { color: colors.textSecondary, marginBottom: 16 }]}>
                    Member: {selectedSanction.member_name}
                  </Text>

                  {loadingHistory ? (
                    <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 24 }} />
                  ) : paymentHistory.length === 0 ? (
                    <View style={styles.emptyHistoryContainer}>
                      <Ionicons name="receipt-outline" size={48} color={colors.textSecondary} />
                      <Text style={[styles.emptyText, { color: colors.textSecondary, marginTop: 8 }]}>
                        No payment history
                      </Text>
                    </View>
                  ) : (
                    paymentHistory.map((payment, index) => (
                      <View
                        key={payment.id}
                        style={[styles.historyCard, { backgroundColor: colors.background }]}
                      >
                        <View style={styles.historyHeader}>
                          <Text style={[styles.historyInstallment, { color: colors.text }]}>
                            Installment #{payment.installment_number}
                          </Text>
                          <Text style={[styles.historyAmount, { color: colors.primary }]}>
                            {formatCurrency(payment.amount_paid)}
                          </Text>
                        </View>
                        <Text style={[styles.historyDetail, { color: colors.textSecondary }]}>
                          Date: {formatDate(payment.payment_date)}
                        </Text>
                        <Text style={[styles.historyDetail, { color: colors.textSecondary }]}>
                          Mode: {payment.payment_mode}
                        </Text>
                        {payment.transaction_id && (
                          <Text style={[styles.historyDetail, { color: colors.textSecondary }]}>
                            Transaction ID: {payment.transaction_id}
                          </Text>
                        )}
                        {payment.remarks && (
                          <Text style={[styles.historyDetail, { color: colors.textSecondary }]}>
                            Remarks: {payment.remarks}
                          </Text>
                        )}
                      </View>
                    ))
                  )}
                </>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton, { backgroundColor: colors.primary, flex: 1 }]}
                onPress={() => setHistoryModalVisible(false)}
              >
                <Text style={styles.submitButtonText}>Close</Text>
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
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 16,
    paddingHorizontal: 16
  },
  backButton: {
    marginRight: 16
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff'
  },
  scrollView: {
    flex: 1
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16
  },
  summaryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12
  },
  summaryCard: {
    flex: 1,
    minWidth: 150,
    padding: 16,
    borderRadius: 12,
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
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8
  },
  summaryLabel: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center'
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12
  },
  filterButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center'
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666'
  },
  filterTextActive: {
    color: '#fff'
  },
  tableContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: 'bold'
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2
      },
      android: {
        elevation: 2
      }
    })
  },
  tableText: {
    fontSize: 14,
    fontWeight: '500'
  },
  tableSubText: {
    fontSize: 11,
    marginTop: 2
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignSelf: 'flex-start'
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fff'
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 16,
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
  modalInfo: {
    fontSize: 14,
    marginBottom: 4
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 6
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top'
  },
  paymentModeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6
  },
  paymentModeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center'
  },
  paymentModeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666'
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
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  cancelButton: {
    backgroundColor: '#e0e0e0'
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666'
  },
  submitButton: {
    backgroundColor: '#007bff'
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff'
  },
  historyCard: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  historyInstallment: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  historyAmount: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  historyDetail: {
    fontSize: 13,
    marginTop: 4
  },
  emptyHistoryContainer: {
    alignItems: 'center',
    paddingVertical: 32
  }
});
