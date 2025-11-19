import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../../../contexts/ThemeContext';
import api from '../../../../utils/api';
import { showErrorAlert } from '../../../../utils/errorHandler';
import ErrorBoundary from '../../../../components/ErrorBoundary';

function PauseSubscription() {
  const { colors } = useTheme();
  const router = useRouter();
  const { subscription_id } = useLocalSearchParams();
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handlePause = async () => {
    if (!reason.trim()) {
      showErrorAlert(new Error('Please enter a reason'), 'Required Field');
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/subscriptions/admin/${subscription_id}/pause`, {
        reason: reason.trim(),
      });

      showErrorAlert(
        new Error('Subscription paused successfully!'),
        'Success'
      );
      router.back();
    } catch (error: any) {
      showErrorAlert(error, 'Failed to pause subscription');
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
      backgroundColor: '#f59e0b',
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
    pauseButton: {
      backgroundColor: '#f59e0b',
      paddingVertical: 16,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 8,
    },
    pauseButtonDisabled: {
      backgroundColor: colors.border,
    },
    pauseButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    warningText: {
      fontSize: 13,
      color: '#f59e0b',
      marginBottom: 16,
      fontStyle: 'italic',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pause Subscription</Text>
        <Text style={styles.headerSubtitle}>Temporarily suspend subscription</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.formCard}>
          <Text style={styles.warningText}>
            ⚠️ The subscription will be paused. The end date will be extended by the pause duration when resumed.
          </Text>

          <Text style={styles.label}>Reason for Pausing *</Text>
          <TextInput
            style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
            placeholder="Enter reason for pausing subscription"
            placeholderTextColor={colors.textSecondary}
            value={reason}
            onChangeText={setReason}
            multiline
          />

          <TouchableOpacity
            style={[styles.pauseButton, submitting && styles.pauseButtonDisabled]}
            onPress={handlePause}
            disabled={submitting}
          >
            <Text style={styles.pauseButtonText}>
              {submitting ? 'Pausing...' : 'Pause Subscription'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

export default function PauseSubscriptionWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <PauseSubscription />
    </ErrorBoundary>
  );
}
