import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../../../contexts/ThemeContext';
import api from '../../../../utils/api';
import { showErrorAlert } from '../../../../utils/errorHandler';
import ErrorBoundary from '../../../../components/ErrorBoundary';

function TerminateSubscription() {
  const { colors } = useTheme();
  const router = useRouter();
  const { subscription_id } = useLocalSearchParams();
  const [reason, setReason] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleTerminate = async () => {
    if (!reason.trim()) {
      showErrorAlert(new Error('Please enter a reason'), 'Required Field');
      return;
    }

    const refund = refundAmount.trim() ? parseFloat(refundAmount) : 0;
    if (refund < 0) {
      showErrorAlert(new Error('Refund amount cannot be negative'), 'Invalid Input');
      return;
    }

    Alert.alert(
      'Confirm Termination',
      `This will immediately terminate the subscription. ${refund > 0 ? `A refund of ₹${refund} will be processed.` : ''} This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Terminate',
          style: 'destructive',
          onPress: async () => {
            setSubmitting(true);
            try {
              await api.post(`/subscriptions/admin/${subscription_id}/terminate`, {
                reason: reason.trim(),
                refund_amount: refund,
              });

              showErrorAlert(
                new Error('Subscription terminated successfully!'),
                'Success'
              );
              router.back();
            } catch (error: any) {
              showErrorAlert(error, 'Failed to terminate subscription');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: 16,
      paddingVertical: 20,
      backgroundColor: '#ef4444',
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
    formCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
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
      marginBottom: 16,
    },
    terminateButton: {
      backgroundColor: '#ef4444',
      paddingVertical: 16,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 8,
    },
    terminateButtonDisabled: {
      backgroundColor: colors.border,
    },
    terminateButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    warningCard: {
      backgroundColor: '#fef3c7',
      borderRadius: 8,
      padding: 12,
      marginBottom: 16,
      flexDirection: 'row',
      alignItems: 'center',
    },
    warningText: {
      fontSize: 13,
      color: '#92400e',
      marginLeft: 8,
      flex: 1,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terminate Subscription</Text>
        <Text style={styles.headerSubtitle}>Immediate cancellation</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.warningCard}>
          <Ionicons name="warning" size={24} color="#f59e0b" />
          <Text style={styles.warningText}>
            Warning: This action will immediately cancel the subscription and cannot be undone.
          </Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.label}>Reason for Termination *</Text>
          <TextInput
            style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
            placeholder="Enter reason for terminating subscription"
            placeholderTextColor={colors.textSecondary}
            value={reason}
            onChangeText={setReason}
            multiline
          />

          <Text style={styles.label}>Refund Amount (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter refund amount (e.g., 500)"
            placeholderTextColor={colors.textSecondary}
            value={refundAmount}
            onChangeText={setRefundAmount}
            keyboardType="decimal-pad"
          />

          <TouchableOpacity
            style={[styles.terminateButton, submitting && styles.terminateButtonDisabled]}
            onPress={handleTerminate}
            disabled={submitting}
          >
            <Text style={styles.terminateButtonText}>
              {submitting ? 'Terminating...' : 'Terminate Subscription'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

export default function TerminateSubscriptionWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <TerminateSubscription />
    </ErrorBoundary>
  );
}
