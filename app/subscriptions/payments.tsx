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
import ErrorBoundary from '../../components/ErrorBoundary';

interface Payment {
  id: string;
  payment_id: string;
  subscription_id: string;
  plan_name: string;
  amount: number;
  payment_type: string;
  payment_method: string;
  payment_status: string;
  transaction_id?: string;
  invoice_number: string;
  payment_date: string;
}

function PaymentHistory() {
  const { colors } = useTheme();
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/subscriptions/my-payments');
      setPayments(response.data);
    } catch (error: any) {
      showErrorAlert(error, 'Failed to load payment history');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPayments();
    setRefreshing(false);
  };

  const getPaymentTypeColor = (type: string) => {
    const typeColors: any = {
      'New Subscription': '#10b981',
      'Renewal': '#3b82f6',
      'Refund': '#ef4444',
    };
    return typeColors[type] || '#6b7280';
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
    paymentCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    paymentHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    amount: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.text,
    },
    refundAmount: {
      color: '#ef4444',
    },
    typeBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    typeText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '600',
    },
    planName: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
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
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment History</Text>
        </View>
        <ListSkeleton count={5} />
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
        <Text style={styles.headerTitle}>Payment History</Text>
        <Text style={styles.headerSubtitle}>All your subscription payments</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {payments.length === 0 ? (
          <EmptyState
            icon="card-outline"
            title="No Payments Yet"
            message="Your payment history will appear here once you subscribe to a plan"
          />
        ) : (
          payments.map((payment) => (
            <View key={payment.id} style={styles.paymentCard}>
              <View style={styles.paymentHeader}>
                <Text style={[styles.amount, payment.amount < 0 && styles.refundAmount]}>
                  ₹{Math.abs(payment.amount)}
                </Text>
                <View
                  style={[
                    styles.typeBadge,
                    { backgroundColor: getPaymentTypeColor(payment.payment_type) },
                  ]}
                >
                  <Text style={styles.typeText}>{payment.payment_type}</Text>
                </View>
              </View>

              <Text style={styles.planName}>{payment.plan_name}</Text>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Payment Date</Text>
                <Text style={styles.detailValue}>
                  {new Date(payment.payment_date).toLocaleDateString()}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Payment Method</Text>
                <Text style={styles.detailValue}>{payment.payment_method}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Invoice Number</Text>
                <Text style={styles.detailValue}>{payment.invoice_number}</Text>
              </View>

              {payment.transaction_id && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Transaction ID</Text>
                  <Text style={styles.detailValue}>{payment.transaction_id}</Text>
                </View>
              )}

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status</Text>
                <Text
                  style={[
                    styles.detailValue,
                    { color: payment.payment_status === 'Success' ? '#10b981' : '#ef4444' },
                  ]}
                >
                  {payment.payment_status}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

export default function PaymentHistoryWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <PaymentHistory />
    </ErrorBoundary>
  );
}
