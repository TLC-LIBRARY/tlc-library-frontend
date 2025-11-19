/**
 * Razorpay Payment Integration Utility
 * Handles payment flow for Welfare Contributions and Subscriptions
 */

import RazorpayCheckout from 'react-native-razorpay';
import api from './api';
import { Alert, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Buffer } from 'buffer';

// Polyfill for Buffer (required for web)
if (typeof global.Buffer === 'undefined') {
  global.Buffer = Buffer;
}

export interface RazorpayConfig {
  razorpay_key_id: string;
  currency: string;
  theme_color: string;
  business_name: string;
}

export interface PaymentOrder {
  order_id: string;
  amount: number;
  currency: string;
  razorpay_key_id: string;
}

export interface PaymentResult {
  success: boolean;
  payment_id?: string;
  order_id?: string;
  signature?: string;
  error?: string;
  data?: any;
}

/**
 * Get Razorpay configuration from backend
 */
export const getPaymentConfig = async (): Promise<RazorpayConfig> => {
  try {
    const response = await api.get('/api/payment/config');
    return response.data;
  } catch (error: any) {
    console.error('Failed to get payment config:', error);
    throw new Error('Failed to load payment configuration');
  }
};

/**
 * Create a Razorpay order for contribution payment
 */
export const createContributionOrder = async (
  memberId: string,
  amount: number,
  notes?: string
): Promise<PaymentOrder> => {
  try {
    const response = await api.post('/api/payment/create-order', {
      amount: amount,
      payment_type: 'contribution',
      member_id: memberId,
      notes: notes || ''
    });
    return response.data;
  } catch (error: any) {
    console.error('Failed to create contribution order:', error);
    throw new Error(error.response?.data?.detail || 'Failed to create payment order');
  }
};

/**
 * Create a Razorpay order for subscription payment
 */
export const createSubscriptionOrder = async (
  planId: string,
  amount: number,
  notes?: string
): Promise<PaymentOrder> => {
  try {
    const response = await api.post('/api/payment/create-order', {
      amount: amount,
      payment_type: 'subscription',
      plan_id: planId,
      notes: notes || ''
    });
    return response.data;
  } catch (error: any) {
    console.error('Failed to create subscription order:', error);
    throw new Error(error.response?.data?.detail || 'Failed to create payment order');
  }
};

/**
 * Open Razorpay checkout modal
 */
export const openRazorpayCheckout = async (
  orderData: PaymentOrder,
  config: RazorpayConfig,
  userEmail?: string,
  userPhone?: string
): Promise<any> => {
  const options = {
    description: 'Payment for The Learning Corner Library',
    image: 'https://your-logo-url.com/logo.png', // Replace with actual logo URL
    currency: orderData.currency,
    key: orderData.razorpay_key_id,
    amount: orderData.amount * 100, // Amount in paise
    name: config.business_name,
    order_id: orderData.order_id,
    prefill: {
      email: userEmail || '',
      contact: userPhone || ''
    },
    theme: { 
      color: config.theme_color || '#4D2C91'
    }
  };

  return new Promise((resolve, reject) => {
    RazorpayCheckout.open(options)
      .then((data: any) => {
        resolve(data);
      })
      .catch((error: any) => {
        console.error('Razorpay checkout error:', error);
        reject(error);
      });
  });
};

/**
 * Verify payment with backend
 */
export const verifyPayment = async (
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string,
  paymentType: 'contribution' | 'subscription',
  memberId?: string,
  planId?: string
): Promise<any> => {
  try {
    const response = await api.post('/api/payment/verify', {
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature,
      payment_type: paymentType,
      member_id: memberId,
      plan_id: planId
    });
    return response.data;
  } catch (error: any) {
    console.error('Payment verification failed:', error);
    throw new Error(error.response?.data?.detail || 'Payment verification failed');
  }
};

/**
 * Download payment receipt as PDF
 */
export const downloadReceipt = async (paymentId: string): Promise<string> => {
  try {
    console.log('Downloading receipt for payment:', paymentId);
    
    if (Platform.OS === 'web') {
      // For web, return the API URL directly
      const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || '';
      const receiptUrl = `${backendUrl}/api/payment/receipt/${paymentId}`;
      console.log('Receipt URL:', receiptUrl);
      return receiptUrl;
    }
    
    // For mobile - download and save locally
    const response = await api.get(`/api/payment/receipt/${paymentId}`, {
      responseType: 'blob'
    });

    const filename = `TLC_Receipt_${paymentId}.pdf`;
    const fileUri = `${FileSystem.documentDirectory}${filename}`;

    // Convert blob to base64
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onloadend = async () => {
        try {
          const base64data = (reader.result as string).split(',')[1];
          await FileSystem.writeAsStringAsync(fileUri, base64data, {
            encoding: FileSystem.EncodingType.Base64
          });
          resolve(fileUri);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(response.data);
    });
  } catch (error: any) {
    console.error('Failed to download receipt:', error);
    throw new Error('Failed to download receipt');
  }
};

/**
 * Share payment receipt
 */
export const shareReceipt = async (paymentId: string): Promise<void> => {
  try {
    console.log('=== SHARE RECEIPT INITIATED ===');
    console.log('Payment ID:', paymentId);
    
    const fileUri = await downloadReceipt(paymentId);
    console.log('File URI:', fileUri);
    
    if (Platform.OS === 'web') {
      // For web, open in new tab and trigger download
      console.log('Opening receipt in new window...');
      const link = document.createElement('a');
      link.href = fileUri;
      link.target = '_blank'; // Open in new tab
      link.download = `TLC_Receipt_${paymentId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      console.log('✅ Receipt download triggered');
      
      // Show success alert on web
      if (typeof window !== 'undefined') {
        window.alert('Receipt is being downloaded. Please check your downloads folder.');
      }
    } else {
      // For mobile, use native sharing
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share Receipt'
        });
      } else {
        Alert.alert('Success', `Receipt saved to: ${fileUri}`);
      }
    }
  } catch (error: any) {
    console.error('=== SHARE RECEIPT ERROR ===');
    console.error('Error:', error);
    Alert.alert('Error', error.message || 'Failed to share receipt');
  }
};

/**
 * Complete payment flow for contribution
 */
export const processContributionPayment = async (
  memberId: string,
  amount: number,
  userEmail?: string,
  userPhone?: string,
  notes?: string
): Promise<PaymentResult> => {
  try {
    // Step 1: Get payment configuration
    const config = await getPaymentConfig();

    // Step 2: Create order
    const orderData = await createContributionOrder(memberId, amount, notes);

    // Step 3: Open Razorpay checkout
    const razorpayResponse = await openRazorpayCheckout(
      orderData,
      config,
      userEmail,
      userPhone
    );

    // Step 4: Verify payment
    const verificationResult = await verifyPayment(
      razorpayResponse.razorpay_order_id,
      razorpayResponse.razorpay_payment_id,
      razorpayResponse.razorpay_signature,
      'contribution',
      memberId
    );

    return {
      success: true,
      payment_id: razorpayResponse.razorpay_payment_id,
      order_id: razorpayResponse.razorpay_order_id,
      signature: razorpayResponse.razorpay_signature,
      data: verificationResult
    };
  } catch (error: any) {
    console.error('Contribution payment failed:', error);
    return {
      success: false,
      error: error.message || 'Payment failed'
    };
  }
};

/**
 * Complete payment flow for subscription
 */
export const processSubscriptionPayment = async (
  planId: string,
  amount: number,
  userEmail?: string,
  userPhone?: string,
  notes?: string
): Promise<PaymentResult> => {
  try {
    // Step 1: Get payment configuration
    const config = await getPaymentConfig();

    // Step 2: Create order
    const orderData = await createSubscriptionOrder(planId, amount, notes);

    // Step 3: Open Razorpay checkout
    const razorpayResponse = await openRazorpayCheckout(
      orderData,
      config,
      userEmail,
      userPhone
    );

    // Step 4: Verify payment
    const verificationResult = await verifyPayment(
      razorpayResponse.razorpay_order_id,
      razorpayResponse.razorpay_payment_id,
      razorpayResponse.razorpay_signature,
      'subscription',
      undefined,
      planId
    );

    return {
      success: true,
      payment_id: razorpayResponse.razorpay_payment_id,
      order_id: razorpayResponse.razorpay_order_id,
      signature: razorpayResponse.razorpay_signature,
      data: verificationResult
    };
  } catch (error: any) {
    console.error('Subscription payment failed:', error);
    return {
      success: false,
      error: error.message || 'Payment failed'
    };
  }
};
