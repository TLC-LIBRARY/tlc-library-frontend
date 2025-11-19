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
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../utils/api';
import { showErrorAlert } from '../../utils/errorHandler';
import { ListSkeleton } from '../../components/SkeletonLoader';
import { EmptyState } from '../../components/EmptyState';

interface Subscription {
  id: string;
  subscription_id: string;
  plan_name: string;
  plan_type: string;
  billing_cycle: string;
  status: string;
  subscription_start_date: string;
  subscription_end_date: string;
  days_remaining?: number;
  price_paid: number;
  auto_renew: boolean;
  payment_method: string;
  invoice_number: string;
}

export default function SubscriptionHistory() {
  const { colors } = useTheme();
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/subscriptions/my-history');
      setSubscriptions(response.data);
    } catch (error: any) {
      showErrorAlert(error, 'Failed to Load History');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchHistory();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    const statusColors: any = {
      Active: '#10b981',
      Paused: '#f59e0b',
      Cancelled: '#ef4444',
      Expired: '#6b7280',
    };
    return statusColors[status] || '#6b7280';
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
    subscriptionCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    subscriptionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    planName: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      flex: 1,
    },
    statusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    statusText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '600',
    },
    planType: {
      fontSize: 13,
      color: colors.textSecondary,
      marginBottom: 8,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 4,
    },
    detailLabel: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    detailValue: {
      fontSize: 13,
      fontWeight: '500',
      color: colors.text,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32,
    },
    emptyText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 12,
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
          <Text style={styles.headerTitle}>Subscription History</Text>
        </View>
        <View style={styles.content}>
          <ListSkeleton count={3} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Subscription History</Text>
        <Text style={styles.headerSubtitle}>All your past and present subscriptions</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {subscriptions.length === 0 ? (
          <EmptyState
            icon="time-outline"
            title="No History"
            message="You don't have any subscription history yet. Subscribe to a plan to get started!"
            actionLabel="Browse Plans"
            onAction={() => router.push('/api/subscriptions/plans')}
          />
        ) : (
          subscriptions.map((sub) => (
            <View key={sub.id} style={styles.subscriptionCard}>
              <View style={styles.subscriptionHeader}>
                <Text style={styles.planName}>{sub.plan_name}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(sub.status) }]}>
                  <Text style={styles.statusText}>{sub.status}</Text>
                </View>
              </View>

              <Text style={styles.planType}>
                {sub.plan_type} • {sub.billing_cycle}
              </Text>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Start Date</Text>
                <Text style={styles.detailValue}>
                  {new Date(sub.subscription_start_date).toLocaleDateString()}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>End Date</Text>
                <Text style={styles.detailValue}>
                  {new Date(sub.subscription_end_date).toLocaleDateString()}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Amount Paid</Text>
                <Text style={styles.detailValue}>₹{sub.price_paid}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Invoice</Text>
                <Text style={styles.detailValue}>{sub.invoice_number}</Text>
              </View>

              {sub.status === 'Active' && sub.days_remaining !== undefined && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Days Remaining</Text>
                  <Text style={[styles.detailValue, { color: '#10b981' }]}>
                    {sub.days_remaining} days
                  </Text>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
