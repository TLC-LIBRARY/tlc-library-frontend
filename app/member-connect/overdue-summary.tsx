import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface OverdueRecord {
  id: string;
  overdue_type: string;
  due_amount: number;
  due_date: string;
  overdue_since: string;
  days_overdue: number;
  status: string;
  reference_id?: string;
}

export default function OverdueSummary() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();

  const [overdues, setOverdues] = useState<OverdueRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadOverdues();
  }, []);

  const loadOverdues = async () => {
    try {
      const token = user?.token;
      const response = await axios.get(`${BACKEND_URL}/api/overdue/member/details`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOverdues(response.data);
    } catch (error) {
      console.error('Error loading overdues:', error);
      Alert.alert('Error', 'Failed to load overdue payments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadOverdues();
  };

  const handleResolve = (overdue: OverdueRecord) => {
    if (overdue.overdue_type === 'Welfare') {
      router.push('/member-connect/welfare-contribution');
    } else if (overdue.overdue_type === 'Educational') {
      Alert.alert(
        'Educational Support Payment',
        'Please contact admin to record your installment payment or use the payment feature.',
        [
          { text: 'OK' }
        ]
      );
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Welfare':
        return 'heart';
      case 'Educational':
        return 'school';
      default:
        return 'cash';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Welfare':
        return '#9c27b0';
      case 'Educational':
        return '#2196f3';
      default:
        return '#ff9800';
    }
  };

  const totalOverdue = overdues.reduce((sum, o) => sum + o.due_amount, 0);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Overdue Payments</Text>
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
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Overdue Payments</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        {/* Total Overdue Card */}
        <View style={[styles.totalCard, { backgroundColor: '#d32f2f' }]}>
          <View style={styles.totalIconContainer}>
            <Ionicons name="warning" size={32} color="#fff" />
          </View>
          <View style={styles.totalContent}>
            <Text style={styles.totalLabel}>Total Outstanding</Text>
            <Text style={styles.totalAmount}>{formatCurrency(totalOverdue)}</Text>
            <Text style={styles.totalSubtext}>{overdues.length} overdue payment{overdues.length > 1 ? 's' : ''}</Text>
          </View>
        </View>

        {/* Info Banner */}
        <View style={[styles.infoBanner, { backgroundColor: colors.card }]}>
          <Ionicons name="information-circle" size={20} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.text }]}>
            Clear your overdue payments to restore full access to all features.
          </Text>
        </View>

        {/* Overdue List */}
        <View style={styles.listContainer}>
          {overdues.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="checkmark-circle" size={64} color="#4caf50" />
              <Text style={[styles.emptyText, { color: colors.text }]}>All Clear!</Text>
              <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                You have no overdue payments
              </Text>
            </View>
          ) : (
            overdues.map((overdue) => {
              const typeColor = getTypeColor(overdue.overdue_type);
              const typeIcon = getTypeIcon(overdue.overdue_type);

              return (
                <View key={overdue.id} style={[styles.overdueCard, { backgroundColor: colors.card }]}>
                  <View style={styles.cardHeader}>
                    <View style={[styles.typeIconContainer, { backgroundColor: `${typeColor}20` }]}>
                      <Ionicons name={typeIcon} size={24} color={typeColor} />
                    </View>
                    <View style={styles.cardHeaderText}>
                      <Text style={[styles.overdueType, { color: colors.text }]}>{overdue.overdue_type}</Text>
                      <Text style={[styles.overdueAmount, { color: colors.primary }]}>
                        {formatCurrency(overdue.due_amount)}
                      </Text>
                    </View>
                    <View style={[styles.daysOverdueBadge, { backgroundColor: '#d32f2f20' }]}>
                      <Text style={[styles.daysOverdueText, { color: '#d32f2f' }]}>
                        {overdue.days_overdue}d
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cardDetails}>
                    <View style={styles.detailRow}>
                      <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
                      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Due Date:</Text>
                      <Text style={[styles.detailValue, { color: colors.text }]}>
                        {formatDate(overdue.due_date)}
                      </Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Overdue Since:</Text>
                      <Text style={[styles.detailValue, { color: colors.text }]}>
                        {formatDate(overdue.overdue_since)}
                      </Text>
                    </View>

                    {overdue.reference_id && (
                      <View style={styles.detailRow}>
                        <Ionicons name="document-text-outline" size={16} color={colors.textSecondary} />
                        <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Reference:</Text>
                        <Text style={[styles.detailValue, { color: colors.text }]} numberOfLines={1}>
                          {overdue.reference_id}
                        </Text>
                      </View>
                    )}
                  </View>

                  <TouchableOpacity
                    style={[styles.resolveButton, { backgroundColor: colors.primary }]}
                    onPress={() => handleResolve(overdue)}
                  >
                    <Ionicons name="card" size={18} color="#fff" />
                    <Text style={styles.resolveButtonText}>Resolve Payment</Text>
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </View>

        {/* Help Section */}
        {overdues.length > 0 && (
          <View style={[styles.helpSection, { backgroundColor: colors.card }]}>
            <Text style={[styles.helpTitle, { color: colors.text }]}>Need Help?</Text>
            <Text style={[styles.helpText, { color: colors.textSecondary }]}>
              • Contact admin if you've already made the payment
            </Text>
            <Text style={[styles.helpText, { color: colors.textSecondary }]}>
              • For educational support, payments are recorded by admin
            </Text>
            <Text style={[styles.helpText, { color: colors.textSecondary }]}>
              • Welfare contributions can be made directly through the app
            </Text>
          </View>
        )}
      </ScrollView>
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
  totalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8
      },
      android: {
        elevation: 6
      }
    })
  },
  totalIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16
  },
  totalContent: {
    flex: 1
  },
  totalLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 4
  },
  totalAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4
  },
  totalSubtext: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)'
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    gap: 8
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18
  },
  listContainer: {
    paddingHorizontal: 16
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8
  },
  overdueCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  typeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  cardHeaderText: {
    flex: 1
  },
  overdueType: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2
  },
  overdueAmount: {
    fontSize: 20,
    fontWeight: 'bold'
  },
  daysOverdueBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12
  },
  daysOverdueText: {
    fontSize: 14,
    fontWeight: 'bold'
  },
  cardDetails: {
    gap: 8,
    marginBottom: 12
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  detailLabel: {
    fontSize: 13,
    width: 110
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1
  },
  resolveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8
  },
  resolveButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff'
  },
  helpSection: {
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
    borderRadius: 12
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12
  },
  helpText: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 6
  }
});
