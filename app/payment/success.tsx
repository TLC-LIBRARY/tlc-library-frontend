import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { shareReceipt } from '../../utils/razorpay';
import { Alert } from 'react-native';

export default function PaymentSuccess() {
  const router = useRouter();
  const { colors } = useTheme();
  const params = useLocalSearchParams();
  
  const paymentId = params.payment_id as string;
  const orderId = params.order_id as string;
  const amount = params.amount as string;
  const paymentType = params.payment_type as string;
  const receiptNumber = params.receipt_number as string;
  
  const [downloading, setDownloading] = React.useState(false);

  const handleDownloadReceipt = async () => {
    if (!paymentId) {
      Alert.alert('Error', 'Payment ID not found');
      return;
    }

    try {
      setDownloading(true);
      await shareReceipt(paymentId);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to download receipt');
    } finally {
      setDownloading(false);
    }
  };

  const handleGoHome = () => {
    if (paymentType === 'contribution') {
      router.replace('/member-connect/welfare-history');
    } else {
      router.replace('/subscriptions/my-subscription');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Success Icon */}
      <View style={[styles.iconContainer, { backgroundColor: colors.surface }]}>
        <View style={[styles.iconCircle, { backgroundColor: '#10b981' }]}>
          <Ionicons name="checkmark" size={64} color="#fff" />
        </View>
      </View>

      {/* Success Message */}
      <Text style={[styles.title, { color: colors.text }]}>Payment Successful!</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Your payment has been processed successfully
      </Text>

      {/* Payment Details */}
      <View style={[styles.detailsCard, { backgroundColor: colors.surface }]}>
        {receiptNumber && (
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Receipt Number</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>{receiptNumber}</Text>
          </View>
        )}
        
        {amount && (
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Amount Paid</Text>
            <Text style={[styles.detailValue, { color: '#10b981', fontWeight: 'bold' }]}>₹{amount}</Text>
          </View>
        )}

        {orderId && (
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Order ID</Text>
            <Text style={[styles.detailValue, { color: colors.text, fontSize: 12 }]}>{orderId}</Text>
          </View>
        )}

        {paymentId && (
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Payment ID</Text>
            <Text style={[styles.detailValue, { color: colors.text, fontSize: 12 }]}>{paymentId}</Text>
          </View>
        )}
      </View>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.downloadButton, { backgroundColor: colors.primary }]}
          onPress={handleDownloadReceipt}
          disabled={downloading || !paymentId}
        >
          {downloading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="download" size={20} color="#fff" />
              <Text style={styles.downloadButtonText}>Download Receipt</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.homeButton, { borderColor: colors.border }]}
          onPress={handleGoHome}
        >
          <Text style={[styles.homeButtonText, { color: colors.text }]}>Go to Home</Text>
        </TouchableOpacity>
      </View>

      {/* Info Message */}
      <View style={[styles.infoBox, { backgroundColor: colors.surface }]}>
        <Ionicons name="information-circle" size={20} color={colors.primary} />
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
          A confirmation email has been sent to your registered email address.
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
    marginBottom: 32
  },
  detailsCard: {
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
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  detailLabel: {
    fontSize: 14
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
    marginLeft: 12
  },
  actionsContainer: {
    width: '100%',
    gap: 12,
    marginBottom: 24
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8
  },
  downloadButtonText: {
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
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18
  }
});
