import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import { showErrorAlert } from '../../utils/errorHandler';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { SkeletonLoader } from '../../components/SkeletonLoader';
import { processSubscriptionPayment } from '../../utils/razorpay';

interface Plan {
  plan_id: string;
  plan_name: string;
  plan_type: string;
  billing_cycle: string;
  price: number;
  original_price?: number;
  discount_percentage?: number;
  duration_months: number;
  features: string[];
  description: string;
}

function SubscribeContent() {
  const { colors } = useTheme();
  const router = useRouter();
  const { plan_id } = useLocalSearchParams();
  
  const { user } = useAuth();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    if (plan_id) {
      fetchPlanDetails();
    }
  }, [plan_id]);

  const fetchPlanDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/plans/${plan_id}`);
      setPlan(response.data);
    } catch (error: any) {
      showErrorAlert(error, 'Failed to Load Plan');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (!plan) {
      Alert.alert('Error', 'Plan information not found');
      return;
    }

    // Show confirmation dialog
    Alert.alert(
      'Confirm Subscription',
      `You are about to subscribe to ${plan.plan_name} for ₹${plan.price.toLocaleString()}.\n\nPayment will be processed securely via Razorpay.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Proceed to Pay', 
          onPress: () => processPayment()
        }
      ]
    );
  };

  const processPayment = async () => {
    if (!plan) return;

    try {
      setSubmitting(true);
      setShowPaymentModal(true);

      const result = await processSubscriptionPayment(
        plan.plan_id,
        plan.price,
        user?.email,
        user?.mobile || '',
        `${plan.plan_name} subscription`
      );

      setShowPaymentModal(false);

      if (result.success) {
        // Show success alert and navigate to my subscription
        Alert.alert(
          'Payment Successful!',
          `Your subscription to ${plan.plan_name} has been activated successfully.`,
          [
            {
              text: 'View Subscription',
              onPress: () => router.push('/subscriptions/my-subscription')
            }
          ]
        );
      } else {
        // Show error alert and stay on current screen
        Alert.alert(
          'Payment Failed',
          result.error || 'Payment could not be processed. Please try again.',
          [
            {
              text: 'Try Again',
              style: 'default'
            }
          ]
        );
      }
    } catch (error: any) {
      setShowPaymentModal(false);
      console.error('Payment error:', error);
      Alert.alert('Payment Error', error.message || 'Failed to process payment');
    } finally {
      setSubmitting(false);
    }
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
    planSummaryCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    planName: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 8,
    },
    planDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 16,
    },
    priceRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      marginBottom: 16,
    },
    currency: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
    },
    price: {
      fontSize: 32,
      fontWeight: '700',
      color: colors.primary,
    },
    billingCycle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginLeft: 8,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 16,
    },
    formSection: {
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
    inputGroup: {
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 8,
    },
    input: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 14,
      color: colors.text,
    },
    selectButton: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
    },
    selectButtonText: {
      fontSize: 14,
      color: colors.text,
    },
    checkboxContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
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
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    checkboxLabel: {
      fontSize: 14,
      color: colors.text,
      flex: 1,
    },
    subscribeButton: {
      backgroundColor: colors.primary,
      paddingVertical: 16,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 8,
    },
    subscribeButtonDisabled: {
      backgroundColor: colors.border,
    },
    subscribeButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
      maxHeight: '70%',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 16,
    },
    methodOption: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    methodOptionSelected: {
      backgroundColor: colors.primary + '20',
    },
    methodOptionText: {
      fontSize: 16,
      color: colors.text,
    },
    confirmModalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    confirmModalContent: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 24,
      width: '100%',
      maxWidth: 400,
    },
    confirmTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 16,
    },
    confirmDetail: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    confirmLabel: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    confirmValue: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    confirmButtons: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 20,
    },
    confirmButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    cancelButton: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    confirmButtonPrimary: {
      backgroundColor: colors.primary,
    },
    cancelButtonText: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '600',
    },
    confirmButtonText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
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
          <Text style={styles.headerTitle}>Subscribe</Text>
        </View>
        <View style={[styles.content, { padding: 16 }]}>
          <SkeletonLoader height={200} style={{ marginBottom: 16 }} />
          <SkeletonLoader height={150} style={{ marginBottom: 16 }} />
          <SkeletonLoader height={100} />
        </View>
      </SafeAreaView>
    );
  }

  if (!plan) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Subscribe to Plan</Text>
        <Text style={styles.headerSubtitle}>Complete your subscription</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Plan Summary */}
        <View style={styles.planSummaryCard}>
          <Text style={styles.planName}>{plan.plan_name}</Text>
          <Text style={styles.planDescription}>{plan.description}</Text>
          
          <View style={styles.priceRow}>
            <Text style={styles.currency}>₹</Text>
            <Text style={styles.price}>{plan.price}</Text>
            <Text style={styles.billingCycle}>/ {plan.billing_cycle}</Text>
          </View>

          <View style={styles.divider} />

          <Text style={[styles.label, { marginBottom: 4 }]}>You will get:</Text>
          {plan.features.map((feature, idx) => (
            <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
              <Text style={{ fontSize: 13, color: colors.textSecondary, marginLeft: 6 }}>
                {feature}
              </Text>
            </View>
          ))}
        </View>

        {/* Payment Information */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Secure Payment</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
            <Text style={{ fontSize: 14, color: colors.textSecondary, marginLeft: 8 }}>
              Payment processed securely via Razorpay
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <Ionicons name="card" size={20} color={colors.primary} />
            <Text style={{ fontSize: 14, color: colors.textSecondary, marginLeft: 8 }}>
              Supports UPI, Cards, Net Banking & Wallets
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.subscribeButton, submitting && styles.subscribeButtonDisabled]}
          onPress={handleSubscribe}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.subscribeButtonText}>Subscribe Now</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Payment Processing Modal */}
      <Modal
        visible={showPaymentModal}
        transparent
        animationType="fade"
      >
        <View style={styles.confirmModalOverlay}>
          <View style={styles.confirmModalContent}>
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.confirmTitle, { marginTop: 16, marginBottom: 8 }]}>
                Processing Payment
              </Text>
              <Text style={styles.confirmLabel}>
                Please complete the payment in the Razorpay window
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

export default function Subscribe() {
  return (
    <ErrorBoundary>
      <SubscribeContent />
    </ErrorBoundary>
  );
}
