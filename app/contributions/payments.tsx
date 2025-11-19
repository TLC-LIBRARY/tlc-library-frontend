import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import { format } from 'date-fns';


export default function Payments() {
  const { token, user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load payments
      const paymentsResponse = await api.get(`/api/contributions/payments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPayments(paymentsResponse.data);

      // Load members to get custom_id mapping
      if (user?.role === 'admin') {
        const membersResponse = await api.get(`/api/contributions/members`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMembers(membersResponse.data);
      }
    } catch (error) {
      console.error('Failed to load payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMemberCustomId = (member_id: string) => {
    const member = members.find(m => m.member_id === member_id);
    return member?.custom_id || member_id;
  };

  const renderPayment = ({ item }: { item: any }) => (
    <View style={styles.paymentCard}>
      <View style={styles.paymentHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.receiptNumber}>Receipt #{item.receipt_number}</Text>
          <Text style={styles.memberName}>{item.member_name}</Text>
          <Text style={styles.memberId}>{user?.role === 'admin' ? getMemberCustomId(item.member_id) : item.member_id}</Text>
        </View>
        <View style={styles.amountContainer}>
          <Text style={styles.amount}>₹{item.amount}</Text>
          <View style={[styles.methodBadge, item.payment_method === 'Cash' ? styles.cashBadge : styles.onlineBadge]}>
            <Ionicons 
              name={item.payment_method === 'Cash' ? 'cash' : 'card'} 
              size={14} 
              color="#fff" 
            />
            <Text style={styles.methodText}>{item.payment_method}</Text>
          </View>
        </View>
      </View>

      <View style={styles.paymentDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar" size={14} color="#999" />
          <Text style={styles.detailText}>
            {format(new Date(item.payment_date), 'dd MMM yyyy')}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="pricetag" size={14} color="#999" />
          <Text style={styles.detailText}>{item.plan} - {item.frequency}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.viewReceiptButton}
        onPress={() => router.push(`/contributions/receipt?receiptNumber=${item.receipt_number}`)}
      >
        <Ionicons name="document-text" size={18} color="#6200ee" />
        <Text style={styles.viewReceiptText}>View Receipt</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (router.canGoBack() ? router.back() : router.push('/(tabs)'))} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment History</Text>
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
              <Text style={styles.emptyText}>No payments found</Text>
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
    marginBottom: 12,
  },
  receiptNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6200ee',
    marginBottom: 4,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  memberId: {
    fontSize: 12,
    color: '#999',
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4caf50',
    marginBottom: 6,
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
    backgroundColor: '#2196f3',
  },
  methodText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  paymentDetails: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    color: '#666',
  },
  viewReceiptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: '#f3e5f5',
    borderRadius: 8,
    gap: 6,
  },
  viewReceiptText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6200ee',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
});