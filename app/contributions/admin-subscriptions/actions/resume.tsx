import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../../../contexts/ThemeContext';
import api from '../../../../utils/api';
import { showErrorAlert } from '../../../../utils/errorHandler';
import ErrorBoundary from '../../../../components/ErrorBoundary';

function ResumeSubscription() {
  const { colors } = useTheme();
  const router = useRouter();
  const { subscription_id } = useLocalSearchParams();
  const [submitting, setSubmitting] = useState(false);

  const handleResume = async () => {
    Alert.alert(
      'Confirm Resume',
      'Are you sure you want to resume this subscription? The end date will be extended by the pause duration.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Resume',
          onPress: async () => {
            setSubmitting(true);
            try {
              await api.post(`/subscriptions/admin/${subscription_id}/resume`);

              showErrorAlert(
                new Error('Subscription resumed successfully!'),
                'Success'
              );
              router.back();
            } catch (error: any) {
              showErrorAlert(error, 'Failed to resume subscription');
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
      backgroundColor: '#10b981',
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
    infoCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    infoText: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 16,
      lineHeight: 20,
    },
    bulletPoint: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 8,
      paddingLeft: 8,
    },
    resumeButton: {
      backgroundColor: '#10b981',
      paddingVertical: 16,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 8,
    },
    resumeButtonDisabled: {
      backgroundColor: colors.border,
    },
    resumeButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Resume Subscription</Text>
        <Text style={styles.headerSubtitle}>Reactivate paused subscription</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            Resuming this subscription will:
          </Text>
          <Text style={styles.bulletPoint}>• Change status back to Active</Text>
          <Text style={styles.bulletPoint}>• Extend the end date by the pause duration</Text>
          <Text style={styles.bulletPoint}>• Notify the member about reactivation</Text>

          <TouchableOpacity
            style={[styles.resumeButton, submitting && styles.resumeButtonDisabled]}
            onPress={handleResume}
            disabled={submitting}
          >
            <Text style={styles.resumeButtonText}>
              {submitting ? 'Resuming...' : 'Resume Subscription'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

export default function ResumeSubscriptionWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <ResumeSubscription />
    </ErrorBoundary>
  );
}
