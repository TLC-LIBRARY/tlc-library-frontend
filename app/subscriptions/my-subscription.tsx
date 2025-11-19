import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../utils/api';
import { showErrorAlert } from '../../utils/errorHandler';
import { ErrorBoundary } from '../../components/ErrorBoundary';

interface Subscription {
  id: string;
  subscription_id: string;
  plan_name: string;
  plan_type: string;
  billing_cycle: string;
  status: string;
  subscription_start_date: string;
  subscription_end_date: string;
  days_remaining: number;
  price_paid: number;
  auto_renew: boolean;
  payment_method: string;
  invoice_number: string;
}

function MySubscriptionContent() {
  const { colors } = useTheme();
  const router = useRouter();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelImmediate, setCancelImmediate] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/subscriptions/my-subscription');
      setSubscription(response.data);
    } catch (error: any) {
      if (error.response?.status === 404 || !error.response?.data) {
        setSubscription(null);
      } else {
        showErrorAlert(error, 'Failed to Load Subscription');
      }
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSubscription();
    setRefreshing(false);
  };

  const handleToggleAutoRenew = async () => {
    if (!subscription) return;

    try {
      await api.post(`/subscriptions/${subscription.subscription_id}/toggle-renewal`);
      Alert.alert('Success', `Auto-renewal ${subscription.auto_renew ? 'disabled' : 'enabled'} successfully`);
      fetchSubscription();
    } catch (error: any) {
      showErrorAlert(error, 'Failed to Toggle Auto-Renewal');
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscription) return;

    setCancelling(true);
    try {
      await api.post(`/subscriptions/${subscription.subscription_id}/cancel`, {
        reason: 'User requested cancellation',
        cancel_immediately: cancelImmediate,
      });

      Alert.alert(
        'Success',
        cancelImmediate
          ? 'Subscription cancelled immediately'
          : 'Subscription will end at the end of the current period',
        [{ text: 'OK', onPress: () => fetchSubscription() }]
      );
      setShowCancelModal(false);
    } catch (error: any) {
      showErrorAlert(error, 'Failed to Cancel Subscription');
    } finally {
      setCancelling(false);
    }
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

  const getDaysRemainingColor = (days: number) => {
    if (days <= 3) return '#ef4444';
    if (days <= 7) return '#f59e0b';
    return '#10b981';
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
    statusCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    statusBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      marginBottom: 16,
    },
    statusText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '600',
    },
    planName: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 8,
    },
    planType: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 16,
    },
    daysRemaining: {
      fontSize: 32,
      fontWeight: '700',
      textAlign: 'center',
      marginBottom: 4,
    },
    daysLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 16,
    },
    detailsCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    detailLabel: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    detailValue: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 12,
    },
    actionsCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 12,
      borderRadius: 8,
      marginBottom: 8,
      borderWidth: 1,
    },
    renewButton: {
      backgroundColor: colors.primary + '10',
      borderColor: colors.primary,
    },
    cancelButton: {
      backgroundColor: '#fef3c7',
      borderColor: '#f59e0b',
    },
    historyButton: {
      backgroundColor: colors.background,
      borderColor: colors.border,
    },
    actionButtonText: {
      fontSize: 14,
      fontWeight: '500',
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
      marginBottom: 24,
    },
    browsePlansButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
    },
    browsePlansButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 24,
      width: '100%',
      maxWidth: 400,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 12,
    },
    modalText: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 16,
    },
    checkboxContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      marginBottom: 16,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: colors.border,
      marginRight: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkboxChecked: {
      backgroundColor: '#ef4444',
      borderColor: '#ef4444',
    },
    checkboxLabel: {
      fontSize: 14,
      color: colors.text,
      flex: 1,
    },
    modalButtons: {
      flexDirection: 'row',
      gap: 12,
    },
    modalButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    modalCancelButton: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    modalConfirmButton: {
      backgroundColor: '#ef4444',
    },
    modalButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    modalConfirmButtonText: {
      color: '#fff',
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
          <Text style={styles.headerTitle}>My Subscription</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!subscription) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Subscription</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="document-outline" size={64} color={colors.textSecondary} />
          <Text style={styles.emptyText}>
            You don&apos;t have an active subscription yet{'\n'}Browse available plans to get started
          </Text>
          <TouchableOpacity
            style={styles.browsePlansButton}
            onPress={() => router.push('/api/subscriptions/plans')}
          >
            <Text style={styles.browsePlansButtonText}>Browse Plans</Text>
          </TouchableOpacity>
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
        <Text style={styles.headerTitle}>My Subscription</Text>
        <Text style={styles.headerSubtitle}>Manage your active subscription</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(subscription.status) }]}>
            <Text style={styles.statusText}>{subscription.status?.toUpperCase() || 'UNKNOWN'}</Text>
          </View>

          <Text style={styles.planName}>{subscription.plan_name}</Text>
          <Text style={styles.planType}>
            {subscription.plan_type} • {subscription.billing_cycle}
          </Text>

          <Text style={[styles.daysRemaining, { color: getDaysRemainingColor(subscription.days_remaining) }]}>
            {subscription.days_remaining}
          </Text>
          <Text style={styles.daysLabel}>Days Remaining</Text>
        </View>

        {/* Details Card */}
        <View style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Subscription Details</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Start Date</Text>
            <Text style={styles.detailValue}>
              {new Date(subscription.subscription_start_date).toLocaleDateString()}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>End Date</Text>
            <Text style={styles.detailValue}>
              {new Date(subscription.subscription_end_date).toLocaleDateString()}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount Paid</Text>
            <Text style={styles.detailValue}>₹{subscription.price_paid}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment Method</Text>
            <Text style={styles.detailValue}>{subscription.payment_method}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Invoice Number</Text>
            <Text style={styles.detailValue}>{subscription.invoice_number}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Auto-Renewal</Text>
            <Text style={[styles.detailValue, { color: subscription.auto_renew ? '#10b981' : '#ef4444' }]}>
              {subscription.auto_renew ? 'Enabled' : 'Disabled'}
            </Text>
          </View>
        </View>

        {/* Actions Card */}
        {subscription.status === 'Active' && (
          <View style={styles.actionsCard}>
            <Text style={styles.sectionTitle}>Actions</Text>

            <TouchableOpacity style={[styles.actionButton, styles.renewButton]} onPress={handleToggleAutoRenew}>
              <Text style={[styles.actionButtonText, { color: colors.primary }]}>
                {subscription.auto_renew ? 'Disable' : 'Enable'} Auto-Renewal
              </Text>
              <Ionicons name="sync-outline" size={20} color={colors.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.historyButton]}
              onPress={() => router.push('/api/subscriptions/history')}
            >
              <Text style={[styles.actionButtonText, { color: colors.text }]}>View History</Text>
              <Ionicons name="time-outline" size={20} color={colors.text} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionButton, styles.cancelButton]} onPress={() => setShowCancelModal(true)}>
              <Text style={[styles.actionButtonText, { color: '#f59e0b' }]}>Cancel Subscription</Text>
              <Ionicons name="close-circle-outline" size={20} color="#f59e0b" />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Cancel Modal */}
      <Modal
        visible={showCancelModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCancelModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Cancel Subscription</Text>
            <Text style={styles.modalText}>
              Are you sure you want to cancel your subscription? This action cannot be undone.
            </Text>

            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setCancelImmediate(!cancelImmediate)}
            >
              <View style={[styles.checkbox, cancelImmediate && styles.checkboxChecked]}>
                {cancelImmediate && <Ionicons name="checkmark" size={16} color="#fff" />}
              </View>
              <Text style={styles.checkboxLabel}>Cancel immediately (access ends now)</Text>
            </TouchableOpacity>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setShowCancelModal(false)}
              >
                <Text style={styles.modalButtonText}>Keep Subscription</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={handleCancelSubscription}
                disabled={cancelling}
              >
                {cancelling ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={[styles.modalButtonText, styles.modalConfirmButtonText]}>
                    Cancel
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

export default function MySubscription() {
  return (
    <ErrorBoundary>
      <MySubscriptionContent />
    </ErrorBoundary>
  );
}
