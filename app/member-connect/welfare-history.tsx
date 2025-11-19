import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import api from '../../utils/api';

interface Contribution {
  id: string;
  amount: number;
  payment_mode: string;
  transaction_id?: string;
  remarks?: string;
  status: string;
  payment_date: string;
  created_at: string;
}

export default function WelfareHistory() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();

  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [historyResponse, summaryResponse] = await Promise.all([
        api.get('/api/welfare-contribution/history'),
        api.get('/api/welfare-contribution/my-summary')
      ]);

      setContributions(historyResponse.data);
      setSummary(summaryResponse.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const getPaymentModeIcon = (mode: string) => {
    switch (mode) {
      case 'Cash':
        return 'cash';
      case 'Online':
        return 'globe';
      case 'UPI':
        return 'phone-portrait';
      case 'Razorpay':
        return 'card';
      default:
        return 'wallet';
    }
  };

  const getPaymentModeColor = (mode: string) => {
    switch (mode) {
      case 'Cash':
        return '#4caf50';
      case 'Online':
        return '#2196f3';
      case 'UPI':
        return '#9c27b0';
      case 'Razorpay':
        return '#ff5722';
      default:
        return colors.primary;
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Contribution History</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading history...</Text>
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
        <Text style={styles.headerTitle}>Contribution History</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        {/* Summary Cards */}
        {summary && (
          <View style={styles.summaryContainer}>
            <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
              <View style={styles.summaryHeader}>
                <Ionicons name="cash" size={24} color="#4caf50" />
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total Contributed</Text>
              </View>
              <Text style={[styles.summaryValue, { color: colors.text }]}>
                {formatCurrency(summary.total_contributed || 0)}
              </Text>
            </View>

            <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
              <View style={styles.summaryHeader}>
                <Ionicons name="repeat" size={24} color="#2196f3" />
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total Contributions</Text>
              </View>
              <Text style={[styles.summaryValue, { color: colors.text }]}>
                {summary.contribution_count || 0}
              </Text>
            </View>

            {summary.contribution_count > 0 && (
              <>
                <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
                  <View style={styles.summaryHeader}>
                    <Ionicons name="trending-up" size={24} color="#ff9800" />
                    <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Average</Text>
                  </View>
                  <Text style={[styles.summaryValue, { color: colors.text }]}>
                    {formatCurrency((summary.total_contributed || 0) / (summary.contribution_count || 1))}
                  </Text>
                </View>

                {summary.last_contribution_date && (
                  <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
                    <View style={styles.summaryHeader}>
                      <Ionicons name="calendar" size={24} color="#9c27b0" />
                      <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Last Contribution</Text>
                    </View>
                    <Text style={[styles.summaryValue, { color: colors.text, fontSize: 14 }]}>
                      {formatDate(summary.last_contribution_date)}
                    </Text>
                    <Text style={[styles.summarySubValue, { color: colors.textSecondary }]}>
                      {formatCurrency(summary.last_contribution_amount || 0)}
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>
        )}

        {/* Contributions List */}
        <View style={styles.listContainer}>
          <Text style={[styles.listTitle, { color: colors.text }]}>
            All Contributions ({contributions.length})
          </Text>

          {contributions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="wallet-outline" size={64} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No contributions yet</Text>
              <Text style={[styles.emptySubText, { color: colors.textSecondary }]}>
                Your welfare contributions will appear here
              </Text>
            </View>
          ) : (
            contributions.map((contribution, index) => {
              const modeColor = getPaymentModeColor(contribution.payment_mode);
              const modeIcon = getPaymentModeIcon(contribution.payment_mode);

              return (
                <View
                  key={contribution.id}
                  style={[styles.contributionCard, { backgroundColor: colors.card }]}
                >
                  <View style={styles.contributionHeader}>
                    <View style={[styles.modeIcon, { backgroundColor: `${modeColor}20` }]}>
                      <Ionicons name={modeIcon} size={20} color={modeColor} />
                    </View>
                    <View style={styles.contributionInfo}>
                      <Text style={[styles.contributionAmount, { color: colors.text }]}>
                        {formatCurrency(contribution.amount)}
                      </Text>
                      <Text style={[styles.contributionDate, { color: colors.textSecondary }]}>
                        {formatDate(contribution.payment_date)} • {formatTime(contribution.payment_date)}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: '#4caf5020' }]}>
                      <Text style={[styles.statusText, { color: '#4caf50' }]}>
                        {contribution.status}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.contributionDetails}>
                    <View style={styles.detailRow}>
                      <Ionicons name="card" size={16} color={colors.textSecondary} />
                      <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                        Payment Mode:
                      </Text>
                      <Text style={[styles.detailValue, { color: colors.text }]}>
                        {contribution.payment_mode}
                      </Text>
                    </View>

                    {contribution.transaction_id && (
                      <View style={styles.detailRow}>
                        <Ionicons name="receipt" size={16} color={colors.textSecondary} />
                        <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                          Transaction ID:
                        </Text>
                        <Text style={[styles.detailValue, { color: colors.text }]} numberOfLines={1}>
                          {contribution.transaction_id}
                        </Text>
                      </View>
                    )}

                    {contribution.remarks && (
                      <View style={styles.detailRow}>
                        <Ionicons name="chatbox" size={16} color={colors.textSecondary} />
                        <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                          Remarks:
                        </Text>
                        <Text style={[styles.detailValue, { color: colors.text }]} numberOfLines={2}>
                          {contribution.remarks}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>
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
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8
  },
  summaryLabel: {
    fontSize: 12,
    flex: 1
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold'
  },
  summarySubValue: {
    fontSize: 12,
    marginTop: 4
  },
  listContainer: {
    padding: 16
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16
  },
  emptySubText: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center'
  },
  contributionCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3
      },
      android: {
        elevation: 2
      }
    })
  },
  contributionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  modeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  contributionInfo: {
    flex: 1
  },
  contributionAmount: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  contributionDate: {
    fontSize: 12,
    marginTop: 2
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600'
  },
  contributionDetails: {
    gap: 8
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  detailText: {
    fontSize: 13
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1
  }
});
