import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../utils/api';
import { format } from 'date-fns';

interface Application {
  id: string;
  purpose: string;
  requested_amount: number;
  status: string;
  approved_amount: number | null;
  installment_count: number | null;
  installment_amount: number | null;
  remarks: string | null;
  created_at: string;
  approval_date: string | null;
}

interface Sanction {
  sanction_id: string;
  approved_amount: number;
  service_fee: number;
  installments: number;
  installment_amount: number;
  balance_due: number;
  next_due_date: string;
  status: string;
  created_at: string;
}

export default function EducationalSupportApplications() {
  const { token } = useAuth();
  const router = useRouter();
  const { colors } = useTheme();
  
  const [activeTab, setActiveTab] = useState<'applications' | 'repayments'>('applications');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [sanctions, setSanctions] = useState<Sanction[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [appsResponse, sanctionsResponse] = await Promise.all([
        api.get('/api/educational-support/my-applications'),
        api.get('/api/educational-support/my-sanctions')
      ]);
      
      setApplications(appsResponse.data);
      setSanctions(sanctionsResponse.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return '#ff9800';
      case 'Approved': return '#4caf50';
      case 'Rejected': return '#d32f2f';
      case 'Active': return '#2196f3';
      case 'Completed': return '#4caf50';
      default: return '#999';
    }
  };

  const renderApplication = (app: Application) => {
    const statusColor = getStatusColor(app.status);

    return (
      <View key={app.id} style={[styles.card, { backgroundColor: colors.surface, borderLeftColor: statusColor }]}>
        <View style={styles.cardHeader}>
          <View style={styles.purposeRow}>
            <Ionicons name="school" size={20} color={colors.primary} />
            <Text style={[styles.purposeText, { color: colors.text }]}>
              {app.purpose}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {app.status}
            </Text>
          </View>
        </View>

        <View style={styles.amountRow}>
          <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>
            Requested Amount:
          </Text>
          <Text style={[styles.amountValue, { color: colors.text }]}>
            ₹{app.requested_amount.toLocaleString()}
          </Text>
        </View>

        {app.approved_amount && (
          <>
            <View style={styles.amountRow}>
              <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>
                Approved Amount:
              </Text>
              <Text style={[styles.approvedAmount, { color: '#4caf50' }]}>
                ₹{app.approved_amount.toLocaleString()}
              </Text>
            </View>
            
            {app.installment_count && app.installment_amount && (
              <View style={[styles.installmentInfo, { backgroundColor: colors.background }]}>
                <Text style={[styles.installmentText, { color: colors.text }]}>
                  {app.installment_count}x ₹{app.installment_amount.toLocaleString()} monthly installments
                </Text>
              </View>
            )}
          </>
        )}

        {app.remarks && (
          <View style={[styles.remarksBox, { backgroundColor: `${statusColor}15` }]}>
            <Ionicons name="information-circle" size={16} color={statusColor} />
            <Text style={[styles.remarksText, { color: colors.text }]}>
              {app.remarks}
            </Text>
          </View>
        )}

        <View style={styles.cardFooter}>
          <Text style={[styles.dateText, { color: colors.textSecondary }]}>
            Applied: {format(new Date(app.created_at), 'dd MMM yyyy')}
          </Text>
          {app.approval_date && (
            <Text style={[styles.dateText, { color: colors.textSecondary }]}>
              Approved: {format(new Date(app.approval_date), 'dd MMM yyyy')}
            </Text>
          )}
        </View>
      </View>
    );
  };

  const renderSanction = (sanction: Sanction) => {
    const statusColor = getStatusColor(sanction.status);
    const progress = ((sanction.approved_amount - sanction.balance_due) / sanction.approved_amount) * 100;

    return (
      <View key={sanction.sanction_id} style={[styles.card, { backgroundColor: colors.surface, borderLeftColor: statusColor }]}>
        <View style={styles.cardHeader}>
          <View style={styles.sanctionIdRow}>
            <Ionicons name="document-text" size={20} color={colors.primary} />
            <Text style={[styles.sanctionIdText, { color: colors.text }]}>
              {sanction.sanction_id}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {sanction.status}
            </Text>
          </View>
        </View>

        <View style={styles.financialGrid}>
          <View style={styles.financialItem}>
            <Text style={[styles.financialLabel, { color: colors.textSecondary }]}>
              Total Amount
            </Text>
            <Text style={[styles.financialValue, { color: colors.text }]}>
              ₹{sanction.approved_amount.toLocaleString()}
            </Text>
          </View>
          <View style={styles.financialItem}>
            <Text style={[styles.financialLabel, { color: colors.textSecondary }]}>
              Balance Due
            </Text>
            <Text style={[styles.financialValue, { color: '#d32f2f' }]}>
              ₹{sanction.balance_due.toLocaleString()}
            </Text>
          </View>
        </View>

        <View style={[styles.progressContainer, { backgroundColor: colors.background }]}>
          <View style={styles.progressHeader}>
            <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
              Repayment Progress
            </Text>
            <Text style={[styles.progressPercent, { color: colors.primary }]}>
              {progress.toFixed(0)}%
            </Text>
          </View>
          <View style={[styles.progressBar, { backgroundColor: '#e0e0e0' }]}>
            <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: colors.primary }]} />
          </View>
        </View>

        <View style={[styles.installmentDetails, { backgroundColor: colors.background }]}>
          <View style={styles.detailRow}>
            <Ionicons name="calendar" size={16} color={colors.textSecondary} />
            <Text style={[styles.detailText, { color: colors.text }]}>
              Monthly: ₹{sanction.installment_amount.toLocaleString()}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="layers" size={16} color={colors.textSecondary} />
            <Text style={[styles.detailText, { color: colors.text }]}>
              {sanction.installments} installments
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Text style={[styles.dateText, { color: colors.textSecondary }]}>
            Next Due: {format(new Date(sanction.next_due_date), 'dd MMM yyyy')}
          </Text>
          <Text style={[styles.serviceFeeText, { color: colors.textSecondary }]}>
            Service Fee: ₹{sanction.service_fee}
          </Text>
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>My Educational Support</Text>
        <TouchableOpacity onPress={() => router.push('/member-connect/educational-support')}>
          <Ionicons name="add-circle" size={28} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={[styles.tabContainer, { backgroundColor: colors.surface }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'applications' && { borderBottomColor: colors.primary, borderBottomWidth: 3 }
          ]}
          onPress={() => setActiveTab('applications')}
        >
          <Ionicons
            name="document-text"
            size={20}
            color={activeTab === 'applications' ? colors.primary : colors.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'applications' ? colors.primary : colors.textSecondary }
            ]}
          >
            Applications ({applications.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'repayments' && { borderBottomColor: colors.primary, borderBottomWidth: 3 }
          ]}
          onPress={() => setActiveTab('repayments')}
        >
          <Ionicons
            name="cash"
            size={20}
            color={activeTab === 'repayments' ? colors.primary : colors.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'repayments' ? colors.primary : colors.textSecondary }
            ]}
          >
            Repayments ({sanctions.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
        >
          {activeTab === 'applications' ? (
            applications.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="document-outline" size={64} color={colors.textSecondary} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No applications yet
                </Text>
                <TouchableOpacity
                  style={[styles.emptyButton, { backgroundColor: colors.primary }]}
                  onPress={() => router.push('/member-connect/educational-support')}
                >
                  <Ionicons name="add" size={20} color="#fff" />
                  <Text style={styles.emptyButtonText}>Apply Now</Text>
                </TouchableOpacity>
              </View>
            ) : (
              applications.map(renderApplication)
            )
          ) : (
            sanctions.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="cash-outline" size={64} color={colors.textSecondary} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No active repayments
                </Text>
                <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                  Your approved applications will appear here
                </Text>
              </View>
            ) : (
              sanctions.map(renderSanction)
            )
          )}
        </ScrollView>
      )}
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  purposeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  purposeText: {
    fontSize: 16,
    fontWeight: '700',
  },
  sanctionIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  sanctionIdText: {
    fontSize: 14,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
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
  approvedAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  installmentInfo: {
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 12,
  },
  installmentText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  remarksBox: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  remarksText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  financialGrid: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  financialItem: {
    flex: 1,
  },
  financialLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  financialValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  progressContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 13,
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: '700',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  installmentDetails: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 16,
  },
  detailRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  dateText: {
    fontSize: 12,
  },
  serviceFeeText: {
    fontSize: 12,
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
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});