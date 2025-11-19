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
  Platform,
  Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useOverdueCheck } from '../../hooks/useOverdueCheck';
import { Ionicons } from '@expo/vector-icons';
import api from '../../utils/api';
import { processContributionPayment } from '../../utils/razorpay';

export default function WelfareContribution() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { isAccessRestricted, refreshOverdueStatus, loading: overdueLoading } = useOverdueCheck();

  const [amount, setAmount] = useState('');
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    loadSummary();
  }, []);

  const loadSummary = async () => {
    try {
      const response = await api.get('/api/welfare-contribution/my-summary');
      setSummary(response.data);
      
      // Also get member ID for payment
      if (user?.email) {
        try {
          const memberResponse = await api.get('/api/contributions/members/my-profile');
          if (memberResponse.data?.member_id) {
            setMemberId(memberResponse.data.member_id);
          }
        } catch (error) {
          console.error('Error loading member ID:', error);
        }
      }
    } catch (error) {
      console.error('Error loading summary:', error);
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleSubmit = async () => {
    // Check for restrictions
    if (isAccessRestricted()) {
      Alert.alert(
        'Access Restricted',
        'You have overdue payments. Please clear your dues first.',
        [
          {
            text: 'View Overdues',
            onPress: () => router.push('/member-connect/overdue-summary')
          },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
      return;
    }

    // Validation
    if (!amount || parseFloat(amount) < 100) {
      Alert.alert('Invalid Amount', 'Minimum contribution amount is ₹100');
      return;
    }

    if (!memberId) {
      Alert.alert('Error', 'Member ID not found. Please try refreshing the page.');
      return;
    }

    // Show confirmation before payment
    Alert.alert(
      'Confirm Payment',
      `You are about to pay ₹${parseFloat(amount).toLocaleString()} via Razorpay.\n\nThis is an online payment and will be processed securely.`,
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
    try {
      setLoading(true);
      setShowPaymentModal(true);

      const amountValue = parseFloat(amount);
      const result = await processContributionPayment(
        memberId!,
        amountValue,
        user?.email,
        user?.mobile || '',
        remarks || undefined
      );

      setShowPaymentModal(false);

      if (result.success) {
        // Navigate to success screen
        router.push({
          pathname: '/payment/success',
          params: {
            payment_id: result.payment_id,
            order_id: result.order_id,
            amount: amountValue.toString(),
            payment_type: 'contribution',
            receipt_number: result.data?.data?.receipt_number || ''
          }
        });

        // Reset form
        setAmount('');
        setRemarks('');
        
        // Reload summary and refresh overdue status
        loadSummary();
        refreshOverdueStatus();
      } else {
        // Navigate to failure screen
        router.push({
          pathname: '/payment/failure',
          params: {
            error: result.error || 'Payment failed',
            payment_type: 'contribution'
          }
        });
      }
    } catch (error: any) {
      setShowPaymentModal(false);
      console.error('Payment error:', error);
      Alert.alert('Payment Error', error.message || 'Failed to process payment');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Welfare Contribution</Text>
        <TouchableOpacity onPress={() => router.push('/member-connect/welfare-history')} style={styles.historyButton}>
          <Ionicons name="time" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Summary Cards */}
        {!loadingSummary && summary && (
          <View style={styles.summaryContainer}>
            <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
              <Ionicons name="cash" size={28} color="#4caf50" />
              <Text style={[styles.summaryValue, { color: colors.text }]}>
                {formatCurrency(summary.total_contributed || 0)}
              </Text>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total Contributed</Text>
            </View>

            <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
              <Ionicons name="repeat" size={28} color="#2196f3" />
              <Text style={[styles.summaryValue, { color: colors.text }]}>
                {summary.contribution_count || 0}
              </Text>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Contributions</Text>
            </View>

            {summary.last_contribution_date && (
              <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
                <Ionicons name="calendar" size={28} color="#ff9800" />
                <Text style={[styles.summaryValue, { color: colors.text, fontSize: 14 }]}>
                  {formatDate(summary.last_contribution_date)}
                </Text>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Last Contribution</Text>
              </View>
            )}
          </View>
        )}

        {/* Info Banner */}
        <View style={[styles.infoBanner, { backgroundColor: colors.card }]}>
          <Ionicons name="information-circle" size={24} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.text }]}>
            Your contribution supports welfare activities and helps fellow members in need.
          </Text>
        </View>

        {/* Contribution Form */}
        <View style={[styles.formContainer, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Make a Contribution</Text>

          {/* Amount */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Amount *</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.currencySymbol, { color: colors.textSecondary }]}>₹</Text>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={amount}
                onChangeText={setAmount}
                placeholder="Minimum ₹100"
                placeholderTextColor={colors.textSecondary}
                keyboardType="decimal-pad"
              />
            </View>
            <Text style={[styles.helperText, { color: colors.textSecondary }]}>
              Minimum contribution: ₹100
            </Text>
          </View>

          {/* Payment Info Banner */}
          <View style={[styles.paymentInfoBanner, { backgroundColor: '#e8f5e9', borderColor: '#4caf50' }]}>
            <Ionicons name="card" size={24} color="#4caf50" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.paymentInfoTitle, { color: '#2e7d32' }]}>
                Secure Online Payment
              </Text>
              <Text style={[styles.paymentInfoText, { color: '#388e3c' }]}>
                All contributions are processed securely via Razorpay. You can pay using UPI, Cards, or Net Banking.
              </Text>
            </View>
          </View>

          {/* Remarks */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Remarks (Optional)</Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              value={remarks}
              onChangeText={setRemarks}
              placeholder="Add any notes or comments"
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: colors.primary }, (loading || overdueLoading || isAccessRestricted() || !memberId) && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading || overdueLoading || isAccessRestricted() || !memberId}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="card" size={20} color="#fff" />
                <Text style={styles.submitButtonText}>
                  {isAccessRestricted() ? 'Access Restricted - Clear Dues First' : !memberId ? 'Loading...' : 'Pay via Razorpay'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Payment Processing Modal */}
        <Modal
          visible={showPaymentModal}
          transparent
          animationType="fade"
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.modalText, { color: colors.text }]}>Processing Payment...</Text>
              <Text style={[styles.modalSubtext, { color: colors.textSecondary }]}>
                Please do not close this window
              </Text>
            </View>
          </View>
        </Modal>

        {/* Help Section */}
        <View style={[styles.helpSection, { backgroundColor: colors.card }]}>
          <Text style={[styles.helpTitle, { color: colors.text }]}>Need Help?</Text>
          <Text style={[styles.helpText, { color: colors.textSecondary }]}>
            • Contributions are voluntary and support community welfare
          </Text>
          <Text style={[styles.helpText, { color: colors.textSecondary }]}>
            • You can contribute any amount above ₹100
          </Text>
          <Text style={[styles.helpText, { color: colors.textSecondary }]}>
            • View your contribution history by tapping the clock icon above
          </Text>
          <Text style={[styles.helpText, { color: colors.textSecondary }]}>
            • For offline contributions, admin will record your payment
          </Text>
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
  historyButton: {
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
    alignItems: 'center',
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
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8
  },
  summaryLabel: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center'
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    gap: 12
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20
  },
  formContainer: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16
  },
  inputGroup: {
    marginBottom: 16
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top'
  },
  helperText: {
    fontSize: 12,
    marginTop: 4
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden'
  },
  picker: {
    height: 50
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
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
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8
  },
  paymentInfoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1
  },
  paymentInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4
  },
  paymentInfoText: {
    fontSize: 12,
    lineHeight: 16
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContent: {
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    minWidth: 200,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8
      },
      android: {
        elevation: 8
      }
    })
  },
  modalText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8
  },
  modalSubtext: {
    fontSize: 14,
    textAlign: 'center'
  }
});