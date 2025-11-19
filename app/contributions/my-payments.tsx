import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import { format } from 'date-fns';


export default function MyPayments() {
  const { token } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<any[]>([]);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      const response = await api.get(`/api/contributions/payments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPayments(response.data);
    } catch (error) {
      console.error('Failed to load payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderPayment = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.paymentCard}
      onPress={() => router.push(`/contributions/receipt?receiptNumber=${item.receipt_number}`)}
    >
      <View style={styles.paymentHeader}>
        <View style={styles.receiptInfo}>
          <Text style={styles.receiptNumber}>Receipt #{item.receipt_number}</Text>
          <Text style={styles.date}>
            {format(new Date(item.payment_date), 'MMM dd, yyyy')}
          </Text>
        </View>
        <View style={styles.amountContainer}>
          <Text style={styles.amount}>₹{item.amount}</Text>
          <View style={[styles.methodBadge, item.payment_method === 'Cash' ? styles.cashBadge : styles.onlineBadge]}>
            <Ionicons 
              name={item.payment_method === 'Cash' ? 'cash' : 'card'} 
              size={12} 
              color="#fff" 
            />
            <Text style={styles.methodText}>{item.payment_method}</Text>
          </View>
        </View>
      </View>
      <View style={styles.paymentDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="pricetag" size={16} color="#666" />
          <Text style={styles.detailText}>{item.plan} - {item.frequency}</Text>
        </View>
        {item.transaction_id && (
          <View style={styles.detailRow}>
            <Ionicons name="card" size={16} color="#666" />
            <Text style={styles.detailText}>TXN: {item.transaction_id}</Text>
          </View>
        )}
        {item.notes && (
          <View style={styles.detailRow}>
            <Ionicons name="document-text" size={16} color="#666" />
            <Text style={styles.detailText}>{item.notes}</Text>
          </View>
        )}
      </View>
      <View style={styles.viewReceiptButton}>
        <Ionicons name="document-text" size={16} color="#6200ee" />
        <Text style={styles.viewReceiptText}>Tap to view receipt</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (router.canGoBack() ? router.back() : router.push('/(tabs)'))} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Payment History</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#6200ee" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={payments}
          renderItem={renderPayment}
          keyExtractor={(item) => item.receipt_number}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No payment records found</Text>
              <Text style={styles.emptySubtext}>Your payment history will appear here</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  listContainer: {
    padding: 16,
  },
  paymentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  receiptInfo: {
    flex: 1,
  },
  receiptNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6200ee',
    marginBottom: 4,
  },
  date: {
    fontSize: 13,
    color: '#666',
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00897b',
    marginBottom: 4,
  },
  methodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  cashBadge: {
    backgroundColor: '#ff9800',
  },
  onlineBadge: {
    backgroundColor: '#1976d2',
  },
  methodText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  paymentDetails: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: '#666',
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  viewReceiptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 6,
  },
  viewReceiptText: {
    fontSize: 13,
    color: '#6200ee',
    fontWeight: '600',
  },
});