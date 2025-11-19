import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface OverdueSummary {
  member_id: string;
  has_overdue: boolean;
  overdue_count: number;
  total_overdue_amount: number;
  oldest_overdue_days: number;
  restricted_access: boolean;
}

export default function OverdueAlertBanner() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();

  const [overdueSummary, setOverdueSummary] = useState<OverdueSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'member') {
      loadOverdueSummary();
    }
  }, [user]);

  const loadOverdueSummary = async () => {
    try {
      const token = user?.token;
      const response = await axios.get(`${BACKEND_URL}/api/overdue/member/summary`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOverdueSummary(response.data);
    } catch (error) {
      console.error('Error loading overdue summary:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !overdueSummary || !overdueSummary.has_overdue) {
    return null;
  }

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  return (
    <View style={styles.container}>
      <View style={[styles.banner, { backgroundColor: '#d32f2f' }]}>
        <View style={styles.iconContainer}>
          <Ionicons name="warning" size={24} color="#fff" />
        </View>
        
        <View style={styles.content}>
          <Text style={styles.title}>
            Payment Overdue
          </Text>
          <Text style={styles.message}>
            You have {overdueSummary.overdue_count} overdue payment{overdueSummary.overdue_count > 1 ? 's' : ''} totaling{' '}
            {formatCurrency(overdueSummary.total_overdue_amount)}.
          </Text>
          <Text style={styles.subMessage}>
            Please complete payment to restore full access.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.payButton}
          onPress={() => router.push('/member-connect/overdue-summary')}
        >
          <Text style={styles.payButtonText}>Pay Now</Text>
          <Ionicons name="arrow-forward" size={16} color="#d32f2f" />
        </TouchableOpacity>
      </View>

      {overdueSummary.restricted_access && (
        <View style={[styles.restrictionNotice, { backgroundColor: '#fff3cd' }]}>
          <Ionicons name="lock-closed" size={16} color="#856404" />
          <Text style={styles.restrictionText}>
            Some features are restricted until payment is cleared
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4
      },
      android: {
        elevation: 4
      }
    })
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  content: {
    flex: 1
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4
  },
  message: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 2
  },
  subMessage: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)'
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 4
  },
  payButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#d32f2f'
  },
  restrictionNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
    marginTop: 1
  },
  restrictionText: {
    fontSize: 13,
    color: '#856404',
    flex: 1
  }
});
