import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../../contexts/ThemeContext';
import api from '../../../../utils/api';
import { ErrorBoundary } from '../../../../components/ErrorBoundary';

interface Plan {
  plan_id: string;
  plan_name: string;
  price: number;
  billing_cycle: string;
}

function OfflinePaymentContent() {
  const router = useRouter();
  const { colors } = useTheme();

  const [memberEmail, setMemberEmail] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [amount, setAmount] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [showPlanPicker, setShowPlanPicker] = useState(false);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const response = await api.get('/api/plans/all');
      setPlans(response.data.plans || []);
    } catch (error) {
      console.error('Error loading plans:', error);
      Alert.alert('Error', 'Failed to load subscription plans');
    } finally {
      setLoadingPlans(false);
    }
  };

  const handlePlanSelect = (plan: Plan) => {
    setSelectedPlan(plan);
    setAmount(plan.price.toString());
    setShowPlanPicker(false);
  };

  const handleSubmit = async () => {
    // Validation
    if (!memberEmail.trim()) {
      Alert.alert('Validation Error', 'Please enter member email address');
      return;
    }

    if (!selectedPlan) {
      Alert.alert('Validation Error', 'Please select a subscription plan');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid amount');
      return;
    }

    // Confirm before submission
    Alert.alert(
      'Confirm Offline Payment',
      `Record offline payment for:\n\nEmail: ${memberEmail}\nPlan: ${selectedPlan.plan_name}\nAmount: ₹${parseFloat(amount).toLocaleString()}\nReference: ${referenceNumber || 'Auto-generated'}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: () => processOfflinePayment() }
      ]
    );
  };

  const processOfflinePayment = async () => {
    try {
      setLoading(true);

      const paymentData = {
        member_email: memberEmail.trim(),
        plan_id: selectedPlan!.plan_id,
        amount: parseFloat(amount),
        reference_number: referenceNumber.trim() || undefined,
        notes: notes.trim() || undefined
      };

      const response = await api.post('/api/payment/offline-subscription', paymentData);

      Alert.alert(
        '✅ Success!',
        response.data.message || 'Offline payment recorded successfully',
        [
          {
            text: 'Record Another',
            onPress: () => {
              // Reset form
              setMemberEmail('');
              setSelectedPlan(null);
              setAmount('');
              setReferenceNumber('');
              setNotes('');
            }
          },
          {
            text: 'View Subscriptions',
            onPress: () => router.push('/contributions/admin-subscriptions/all')
          }
        ]
      );
    } catch (error: any) {
      console.error('Error recording offline payment:', error);
      Alert.alert(
        'Error',
        error.response?.data?.detail || 'Failed to record offline payment'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Record Offline Payment
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Info Banner */}
        <View style={[styles.infoBanner, { backgroundColor: colors.surface }]}>
          <Ionicons name="information-circle" size={24} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Use this form to record subscription payments received via cash, bank transfer, or other offline methods.
          </Text>
        </View>

        {/* Form */}
        <View style={[styles.formCard, { backgroundColor: colors.surface }]}>
          {/* Member Email */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Member Email *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              value={memberEmail}
              onChangeText={setMemberEmail}
              placeholder="Enter member email address"
              placeholderTextColor={colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          {/* Plan Selection */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Subscription Plan *</Text>
            <TouchableOpacity
              style={[styles.planSelector, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={() => setShowPlanPicker(!showPlanPicker)}
            >
              <Text style={[styles.planSelectorText, { color: selectedPlan ? colors.text : colors.textSecondary }]}>
                {selectedPlan ? `${selectedPlan.plan_name} - ₹${selectedPlan.price}` : 'Select a plan'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            {showPlanPicker && (
              <View style={[styles.planPicker, { backgroundColor: colors.background, borderColor: colors.border }]}>
                {loadingPlans ? (
                  <ActivityIndicator size="small" color={colors.primary} style={{ padding: 20 }} />
                ) : plans.length === 0 ? (
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No plans available</Text>
                ) : (
                  plans.map((plan) => (
                    <TouchableOpacity
                      key={plan.plan_id}
                      style={[
                        styles.planOption,
                        selectedPlan?.plan_id === plan.plan_id && { backgroundColor: colors.primaryLight }
                      ]}
                      onPress={() => handlePlanSelect(plan)}
                    >
                      <View>
                        <Text style={[styles.planOptionName, { color: colors.text }]}>{plan.plan_name}</Text>
                        <Text style={[styles.planOptionCycle, { color: colors.textSecondary }]}>
                          {plan.billing_cycle}
                        </Text>
                      </View>
                      <Text style={[styles.planOptionPrice, { color: colors.primary }]}>
                        ₹{plan.price.toLocaleString()}
                      </Text>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            )}
          </View>

          {/* Amount */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Amount (₹) *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              value={amount}
              onChangeText={setAmount}
              placeholder="Enter amount"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
            />
          </View>

          {/* Reference Number */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Reference Number (Optional)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              value={referenceNumber}
              onChangeText={setReferenceNumber}
              placeholder="e.g., CASH-2025-001"
              placeholderTextColor={colors.textSecondary}
            />
            <Text style={[styles.helpText, { color: colors.textSecondary }]}>
              Leave empty to auto-generate
            </Text>
          </View>

          {/* Notes */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Notes (Optional)</Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add any additional notes"
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: colors.primary }, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.submitButtonText}>Record Payment</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  backButton: {
    padding: 8
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold'
  },
  infoBanner: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4
      },
      android: {
        elevation: 2
      }
    })
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    lineHeight: 20
  },
  formCard: {
    borderRadius: 16,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8
      },
      android: {
        elevation: 4
      }
    })
  },
  inputGroup: {
    marginBottom: 20
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    minHeight: 100
  },
  helpText: {
    fontSize: 12,
    marginTop: 4
  },
  planSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14
  },
  planSelectorText: {
    fontSize: 16
  },
  planPicker: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 12,
    maxHeight: 300,
    overflow: 'hidden'
  },
  planOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)'
  },
  planOptionName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4
  },
  planOptionCycle: {
    fontSize: 12
  },
  planOptionPrice: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  emptyText: {
    textAlign: 'center',
    padding: 20,
    fontSize: 14
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    gap: 8
  },
  submitButtonDisabled: {
    opacity: 0.5
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  }
});

export default function OfflinePayment() {
  return (
    <ErrorBoundary>
      <OfflinePaymentContent />
    </ErrorBoundary>
  );
}
