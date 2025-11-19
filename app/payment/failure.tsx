import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export default function PaymentFailure() {
  const router = useRouter();
  const { colors } = useTheme();
  const params = useLocalSearchParams();
  
  const error = params.error as string || 'Payment could not be completed';
  const paymentType = params.payment_type as string;

  const handleRetry = () => {
    router.back();
  };

  const handleGoHome = () => {
    if (paymentType === 'contribution') {
      router.replace('/member-connect/welfare-contribution');
    } else {
      router.replace('/subscriptions/plans');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Error Icon */}
      <View style={[styles.iconContainer, { backgroundColor: colors.surface }]}>
        <View style={[styles.iconCircle, { backgroundColor: '#ef4444' }]}>
          <Ionicons name="close" size={64} color="#fff" />
        </View>
      </View>

      {/* Error Message */}
      <Text style={[styles.title, { color: colors.text }]}>Payment Failed</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        {error}
      </Text>

      {/* Common Reasons */}
      <View style={[styles.reasonsCard, { backgroundColor: colors.surface }]}>
        <Text style={[styles.reasonsTitle, { color: colors.text }]}>Common Reasons:</Text>
        <View style={styles.reasonItem}>
          <Ionicons name="ellipse" size={6} color={colors.textSecondary} />
          <Text style={[styles.reasonText, { color: colors.textSecondary }]}>
            Insufficient balance in your account
          </Text>
        </View>
        <View style={styles.reasonItem}>
          <Ionicons name="ellipse" size={6} color={colors.textSecondary} />
          <Text style={[styles.reasonText, { color: colors.textSecondary }]}>
            Payment cancelled by user
          </Text>
        </View>
        <View style={styles.reasonItem}>
          <Ionicons name="ellipse" size={6} color={colors.textSecondary} />
          <Text style={[styles.reasonText, { color: colors.textSecondary }]}>
            Network connectivity issues
          </Text>
        </View>
        <View style={styles.reasonItem}>
          <Ionicons name="ellipse" size={6} color={colors.textSecondary} />
          <Text style={[styles.reasonText, { color: colors.textSecondary }]}>
            Card declined or expired
          </Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={handleRetry}
        >
          <Ionicons name="refresh" size={20} color="#fff" />
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.homeButton, { borderColor: colors.border }]}
          onPress={handleGoHome}
        >
          <Text style={[styles.homeButtonText, { color: colors.text }]}>Go Back</Text>
        </TouchableOpacity>
      </View>

      {/* Support */}
      <View style={[styles.supportBox, { backgroundColor: colors.surface }]}>
        <Ionicons name="help-circle" size={20} color={colors.primary} />
        <Text style={[styles.supportText, { color: colors.textSecondary }]}>
          Need help? Contact our support team at support@tlclibrary.com
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center'
  },
  iconContainer: {
    marginBottom: 32,
    borderRadius: 100,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8
      },
      android: {
        elevation: 5
      }
    })
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center'
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 20
  },
  reasonsCard: {
    width: '100%',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
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
  reasonsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12
  },
  reasonText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20
  },
  actionsContainer: {
    width: '100%',
    gap: 12,
    marginBottom: 24
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  homeButton: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center'
  },
  homeButtonText: {
    fontSize: 16,
    fontWeight: '600'
  },
  supportBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12
  },
  supportText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18
  }
});
