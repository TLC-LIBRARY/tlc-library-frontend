import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../contexts/ThemeContext';
import api from '../../../utils/api';
import { showErrorAlert } from '../../../utils/errorHandler';
import { ListSkeleton } from '../../../components/SkeletonLoader';
import ErrorBoundary from '../../../components/ErrorBoundary';

interface Statistics {
  total_subscriptions: number;
  active_subscriptions: number;
  paused_subscriptions: number;
  expired_subscriptions: number;
  cancelled_subscriptions: number;
  expiring_soon_7_days: number;
  expiring_soon_3_days: number;
  expiring_soon_1_day: number;
  revenue_this_month: number;
  revenue_this_quarter: number;
  revenue_this_year: number;
  total_revenue: number;
  by_plan_type: {
    Basic: number;
    Standard: number;
    Premium: number;
  };
  by_billing_cycle: {
    Monthly: number;
    Quarterly: number;
    'Half-Yearly': number;
    Yearly: number;
  };
  pending_payments: number;
  failed_payments: number;
}

function SubscriptionStatistics() {
  const { colors } = useTheme();
  const router = useRouter();
  const [stats, setStats] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/subscriptions/admin/statistics');
      setStats(response.data);
    } catch (error: any) {
      showErrorAlert(error, 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStatistics();
    setRefreshing(false);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: 16,
      paddingVertical: 20,
      backgroundColor: colors.primary,
    },
    backButton: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    backButtonText: {
      fontSize: 16,
      color: '#fff',
      marginLeft: 4,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: '#fff',
      marginBottom: 4,
    },
    headerSubtitle: {
      fontSize: 14,
      color: '#fff',
      opacity: 0.9,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    section: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 12,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    statCard: {
      flex: 1,
      minWidth: '47%',
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    statCardFull: {
      minWidth: '100%',
    },
    iconContainer: {
      marginBottom: 8,
    },
    statValue: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    revenueCard: {
      backgroundColor: colors.primary + '10',
      borderColor: colors.primary,
    },
    revenueValue: {
      fontSize: 32,
      fontWeight: '700',
      color: colors.primary,
    },
    alertCard: {
      backgroundColor: '#fef3c7',
      borderColor: '#f59e0b',
    },
    alertValue: {
      color: '#f59e0b',
    },
    listSection: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    listItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    listItemLast: {
      borderBottomWidth: 0,
    },
    listLabel: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    listValue: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Subscription Statistics</Text>
        </View>
        <ListSkeleton count={6} />
      </SafeAreaView>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Subscription Statistics</Text>
        <Text style={styles.headerSubtitle}>Complete analytics dashboard</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Revenue Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Revenue</Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, styles.statCardFull, styles.revenueCard]}>
              <View style={styles.iconContainer}>
                <Ionicons name="cash" size={32} color={colors.primary} />
              </View>
              <Text style={styles.revenueValue}>₹{stats.total_revenue.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Total Revenue</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statValue}>₹{stats.revenue_this_month.toLocaleString()}</Text>
              <Text style={styles.statLabel}>This Month</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statValue}>₹{stats.revenue_this_quarter.toLocaleString()}</Text>
              <Text style={styles.statLabel}>This Quarter</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statValue}>₹{stats.revenue_this_year.toLocaleString()}</Text>
              <Text style={styles.statLabel}>This Year</Text>
            </View>
          </View>
        </View>

        {/* Subscription Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subscription Overview</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={styles.iconContainer}>
                <Ionicons name="documents" size={24} color="#6b7280" />
              </View>
              <Text style={styles.statValue}>{stats.total_subscriptions}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.iconContainer}>
                <Ionicons name="checkmark-circle" size={24} color="#10b981" />
              </View>
              <Text style={[styles.statValue, { color: '#10b981' }]}>
                {stats.active_subscriptions}
              </Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.iconContainer}>
                <Ionicons name="pause-circle" size={24} color="#f59e0b" />
              </View>
              <Text style={[styles.statValue, { color: '#f59e0b' }]}>
                {stats.paused_subscriptions}
              </Text>
              <Text style={styles.statLabel}>Paused</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.iconContainer}>
                <Ionicons name="time" size={24} color="#6b7280" />
              </View>
              <Text style={[styles.statValue, { color: '#6b7280' }]}>
                {stats.expired_subscriptions}
              </Text>
              <Text style={styles.statLabel}>Expired</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.iconContainer}>
                <Ionicons name="close-circle" size={24} color="#ef4444" />
              </View>
              <Text style={[styles.statValue, { color: '#ef4444' }]}>
                {stats.cancelled_subscriptions}
              </Text>
              <Text style={styles.statLabel}>Cancelled</Text>
            </View>
          </View>
        </View>

        {/* Expiring Soon Alerts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚠️ Expiring Soon</Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, styles.alertCard]}>
              <Text style={styles.alertValue}>{stats.expiring_soon_1_day}</Text>
              <Text style={styles.statLabel}>Within 1 Day</Text>
            </View>

            <View style={[styles.statCard, styles.alertCard]}>
              <Text style={styles.alertValue}>{stats.expiring_soon_3_days}</Text>
              <Text style={styles.statLabel}>Within 3 Days</Text>
            </View>

            <View style={[styles.statCard, styles.statCardFull, styles.alertCard]}>
              <Text style={styles.alertValue}>{stats.expiring_soon_7_days}</Text>
              <Text style={styles.statLabel}>Within 7 Days</Text>
            </View>
          </View>
        </View>

        {/* By Plan Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>By Plan Type</Text>
          <View style={styles.listSection}>
            <View style={styles.listItem}>
              <Text style={styles.listLabel}>Basic</Text>
              <Text style={styles.listValue}>{stats.by_plan_type.Basic}</Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.listLabel}>Standard</Text>
              <Text style={styles.listValue}>{stats.by_plan_type.Standard}</Text>
            </View>
            <View style={[styles.listItem, styles.listItemLast]}>
              <Text style={styles.listLabel}>Premium</Text>
              <Text style={styles.listValue}>{stats.by_plan_type.Premium}</Text>
            </View>
          </View>
        </View>

        {/* By Billing Cycle */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>By Billing Cycle</Text>
          <View style={styles.listSection}>
            <View style={styles.listItem}>
              <Text style={styles.listLabel}>Monthly</Text>
              <Text style={styles.listValue}>{stats.by_billing_cycle.Monthly}</Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.listLabel}>Quarterly</Text>
              <Text style={styles.listValue}>{stats.by_billing_cycle.Quarterly}</Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.listLabel}>Half-Yearly</Text>
              <Text style={styles.listValue}>{stats.by_billing_cycle['Half-Yearly']}</Text>
            </View>
            <View style={[styles.listItem, styles.listItemLast]}>
              <Text style={styles.listLabel}>Yearly</Text>
              <Text style={styles.listValue}>{stats.by_billing_cycle.Yearly}</Text>
            </View>
          </View>
        </View>

        {/* Payment Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Status</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: '#f59e0b' }]}>
                {stats.pending_payments}
              </Text>
              <Text style={styles.statLabel}>Pending Payments</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: '#ef4444' }]}>
                {stats.failed_payments}
              </Text>
              <Text style={styles.statLabel}>Failed Payments</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function SubscriptionStatisticsWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <SubscriptionStatistics />
    </ErrorBoundary>
  );
}
