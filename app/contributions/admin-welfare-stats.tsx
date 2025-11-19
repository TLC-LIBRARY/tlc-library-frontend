import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import api from '../../utils/api';


export default function AdminWelfareStats() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();

  const [stats, setStats] = useState<any>(null);
  const [contributions, setContributions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user?.role !== 'admin') {
      Alert.alert('Access Denied', 'Admin access required');
      router.back();
      return;
    }
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = user?.token;

      const [statsRes, contributionsRes] = await Promise.all([
        api.get(`/api/welfare-contribution/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        api.get(`/api/welfare-contribution/admin/list?limit=1000`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setStats(statsRes.data);
      setContributions(contributionsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load statistics');
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

  const calculateGrowth = () => {
    if (!stats) return 0;
    const thisMonth = stats.contributions_this_month || 0;
    const lastMonth = (stats.contributions_this_year || 0) - thisMonth;
    if (lastMonth === 0) return 100;
    return ((thisMonth - lastMonth) / lastMonth * 100).toFixed(1);
  };

  const getPaymentModeDistribution = () => {
    const distribution: { [key: string]: number } = {};
    contributions.forEach(c => {
      distribution[c.payment_mode] = (distribution[c.payment_mode] || 0) + 1;
    });
    return distribution;
  };

  const getPaymentModeColor = (mode: string) => {
    const colors: { [key: string]: string } = {
      'Cash': '#4caf50',
      'Online': '#2196f3',
      'UPI': '#9c27b0',
      'Razorpay': '#ff5722'
    };
    return colors[mode] || '#666';
  };

  const getMonthlyTrend = () => {
    // Group contributions by month (last 6 months)
    const monthlyData: { [key: string]: number } = {};
    const now = new Date();
    
    contributions.forEach(c => {
      const date = new Date(c.payment_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + c.amount;
    });

    // Get last 6 months
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const shortMonth = d.toLocaleDateString('en-IN', { month: 'short' });
      months.push({
        label: shortMonth,
        value: monthlyData[key] || 0
      });
    }

    return months;
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Welfare Statistics</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  const modeDistribution = getPaymentModeDistribution();
  const monthlyTrend = getMonthlyTrend();
  const maxTrendValue = Math.max(...monthlyTrend.map(m => m.value), 1);
  const growth = calculateGrowth();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Welfare Statistics</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        {stats && (
          <>
            {/* KPI Cards */}
            <View style={styles.kpiContainer}>
              <View style={[styles.kpiCard, styles.kpiCardLarge, { backgroundColor: colors.card }]}>
                <View style={[styles.kpiIcon, { backgroundColor: '#4caf5020' }]}>
                  <Ionicons name="wallet" size={32} color="#4caf50" />
                </View>
                <View style={styles.kpiContent}>
                  <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>Total Collected</Text>
                  <Text style={[styles.kpiValue, { color: colors.text }]}>
                    {formatCurrency(stats.total_amount_received)}
                  </Text>
                  <Text style={[styles.kpiSubtext, { color: colors.textSecondary }]}>
                    From {stats.total_contributions} contributions
                  </Text>
                </View>
              </View>

              <View style={[styles.kpiCard, { backgroundColor: colors.card }]}>
                <View style={[styles.kpiIconSmall, { backgroundColor: '#2196f320' }]}>
                  <Ionicons name="people" size={24} color="#2196f3" />
                </View>
                <Text style={[styles.kpiLabelSmall, { color: colors.textSecondary }]}>Contributors</Text>
                <Text style={[styles.kpiValueSmall, { color: colors.text }]}>{stats.total_contributors}</Text>
              </View>

              <View style={[styles.kpiCard, { backgroundColor: colors.card }]}>
                <View style={[styles.kpiIconSmall, { backgroundColor: '#ff980820' }]}>
                  <Ionicons name="calendar" size={24} color="#ff9800" />
                </View>
                <Text style={[styles.kpiLabelSmall, { color: colors.textSecondary }]}>This Month</Text>
                <Text style={[styles.kpiValueSmall, { color: colors.text }]}>
                  {formatCurrency(stats.contributions_this_month)}
                </Text>
              </View>

              <View style={[styles.kpiCard, { backgroundColor: colors.card }]}>
                <View style={[styles.kpiIconSmall, { backgroundColor: '#9c27b020' }]}>
                  <Ionicons name="trending-up" size={24} color="#9c27b0" />
                </View>
                <Text style={[styles.kpiLabelSmall, { color: colors.textSecondary }]}>Avg/Person</Text>
                <Text style={[styles.kpiValueSmall, { color: colors.text }]}>
                  {formatCurrency(stats.average_contribution)}
                </Text>
              </View>
            </View>

            {/* Growth Card */}
            <View style={[styles.growthCard, { backgroundColor: colors.card }]}>
              <View style={styles.growthHeader}>
                <Text style={[styles.growthTitle, { color: colors.text }]}>Monthly Growth</Text>
                <View style={[styles.growthBadge, { backgroundColor: parseFloat(growth) >= 0 ? '#4caf5020' : '#d32f2f20' }]}>
                  <Ionicons
                    name={parseFloat(growth) >= 0 ? 'trending-up' : 'trending-down'}
                    size={16}
                    color={parseFloat(growth) >= 0 ? '#4caf50' : '#d32f2f'}
                  />
                  <Text style={[styles.growthPercentage, { color: parseFloat(growth) >= 0 ? '#4caf50' : '#d32f2f' }]}>
                    {Math.abs(parseFloat(growth))}%
                  </Text>
                </View>
              </View>
              <Text style={[styles.growthSubtext, { color: colors.textSecondary }]}>
                Compared to previous month
              </Text>
            </View>

            {/* Monthly Trend Chart */}
            <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.chartTitle, { color: colors.text }]}>Monthly Collection Trend</Text>
              <Text style={[styles.chartSubtitle, { color: colors.textSecondary }]}>Last 6 months</Text>

              <View style={styles.chartContainer}>
                {monthlyTrend.map((month, index) => (
                  <View key={index} style={styles.chartBar}>
                    <Text style={[styles.chartValue, { color: colors.text }]}>
                      {month.value > 0 ? formatCurrency(month.value) : ''}
                    </Text>
                    <View style={styles.barContainer}>
                      <View
                        style={[
                          styles.bar,
                          {
                            height: month.value > 0 ? `${(month.value / maxTrendValue) * 100}%` : 4,
                            backgroundColor: colors.primary,
                            minHeight: month.value > 0 ? 8 : 4
                          }
                        ]}
                      />
                    </View>
                    <Text style={[styles.chartLabel, { color: colors.textSecondary }]}>{month.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Payment Mode Distribution */}
            <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.chartTitle, { color: colors.text }]}>Payment Mode Distribution</Text>
              <Text style={[styles.chartSubtitle, { color: colors.textSecondary }]}>
                Total contributions: {stats.total_contributions}
              </Text>

              <View style={styles.distributionContainer}>
                {Object.entries(modeDistribution).map(([mode, count]) => {
                  const percentage = ((count as number) / stats.total_contributions * 100).toFixed(1);
                  const modeColor = getPaymentModeColor(mode);

                  return (
                    <View key={mode} style={styles.distributionRow}>
                      <View style={styles.distributionLeft}>
                        <View style={[styles.distributionDot, { backgroundColor: modeColor }]} />
                        <Text style={[styles.distributionLabel, { color: colors.text }]}>{mode}</Text>
                      </View>
                      <View style={styles.distributionRight}>
                        <View style={styles.distributionBarContainer}>
                          <View
                            style={[
                              styles.distributionBar,
                              {
                                width: `${percentage}%`,
                                backgroundColor: modeColor
                              }
                            ]}
                          />
                        </View>
                        <Text style={[styles.distributionPercentage, { color: colors.textSecondary }]}>
                          {count} ({percentage}%)
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Additional Stats */}
            <View style={[styles.additionalStatsCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.chartTitle, { color: colors.text }]}>Additional Insights</Text>

              <View style={styles.insightRow}>
                <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                <Text style={[styles.insightLabel, { color: colors.textSecondary }]}>This Year Total:</Text>
                <Text style={[styles.insightValue, { color: colors.text }]}>
                  {formatCurrency(stats.contributions_this_year)}
                </Text>
              </View>

              <View style={styles.insightRow}>
                <Ionicons name="repeat-outline" size={20} color={colors.primary} />
                <Text style={[styles.insightLabel, { color: colors.textSecondary }]}>Avg per Contribution:</Text>
                <Text style={[styles.insightValue, { color: colors.text }]}>
                  {formatCurrency(stats.average_contribution)}
                </Text>
              </View>

              <View style={styles.insightRow}>
                <Ionicons name="calculator-outline" size={20} color={colors.primary} />
                <Text style={[styles.insightLabel, { color: colors.textSecondary }]}>Avg per Contributor:</Text>
                <Text style={[styles.insightValue, { color: colors.text }]}>
                  {formatCurrency(stats.total_amount_received / (stats.total_contributors || 1))}
                </Text>
              </View>
            </View>
          </>
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
  kpiContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12
  },
  kpiCard: {
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
  kpiCardLarge: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: '100%'
  },
  kpiIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16
  },
  kpiContent: {
    flex: 1
  },
  kpiLabel: {
    fontSize: 14,
    marginBottom: 4
  },
  kpiValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4
  },
  kpiSubtext: {
    fontSize: 12
  },
  kpiIconSmall: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12
  },
  kpiLabelSmall: {
    fontSize: 12,
    marginBottom: 4
  },
  kpiValueSmall: {
    fontSize: 20,
    fontWeight: 'bold'
  },
  growthCard: {
    marginHorizontal: 16,
    marginBottom: 16,
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
  growthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  growthTitle: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  growthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4
  },
  growthPercentage: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  growthSubtext: {
    fontSize: 13
  },
  chartCard: {
    marginHorizontal: 16,
    marginBottom: 16,
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
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4
  },
  chartSubtitle: {
    fontSize: 13,
    marginBottom: 16
  },
  chartContainer: {
    flexDirection: 'row',
    height: 180,
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingTop: 20
  },
  chartBar: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4
  },
  chartValue: {
    fontSize: 10,
    marginBottom: 4,
    transform: [{ rotate: '-45deg' }]
  },
  barContainer: {
    width: '100%',
    height: 120,
    justifyContent: 'flex-end',
    alignItems: 'center'
  },
  bar: {
    width: '80%',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4
  },
  chartLabel: {
    fontSize: 11,
    marginTop: 8,
    fontWeight: '500'
  },
  distributionContainer: {
    gap: 16
  },
  distributionRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  distributionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 100,
    gap: 8
  },
  distributionDot: {
    width: 12,
    height: 12,
    borderRadius: 6
  },
  distributionLabel: {
    fontSize: 14,
    fontWeight: '500'
  },
  distributionRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  distributionBarContainer: {
    flex: 1,
    height: 24,
    backgroundColor: '#e0e0e0',
    borderRadius: 12,
    overflow: 'hidden'
  },
  distributionBar: {
    height: '100%',
    borderRadius: 12
  },
  distributionPercentage: {
    fontSize: 12,
    width: 70
  },
  additionalStatsCard: {
    marginHorizontal: 16,
    marginBottom: 24,
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
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  insightLabel: {
    flex: 1,
    fontSize: 14
  },
  insightValue: {
    fontSize: 14,
    fontWeight: '600'
  }
});
