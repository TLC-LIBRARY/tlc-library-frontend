import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import { format } from 'date-fns';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';


export default function Reports() {
  const { token } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState([]);
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [membersRes, paymentsRes] = await Promise.all([
        api.get('/api/contributions/members'),
        api.get('/api/contributions/payments')
      ]);
      setMembers(membersRes.data);
      setPayments(paymentsRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const generateMemberReport = async () => {
    setLoading(true);
    try {
      const reportText = `
📊 MEMBER REPORT - TLC_LIBRARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Generated: ${format(new Date(), 'dd MMM yyyy, hh:mm a')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total Members: ${members.length}
Active Members: ${members.filter((m: any) => m.status === 'Active').length}
Inactive Members: ${members.filter((m: any) => m.status === 'Inactive').length}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MEMBER DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${members.map((m: any, i) => `
${i + 1}. ${m.full_name}
   Member ID: ${m.member_id}
   Email: ${m.email}
   Mobile: ${m.mobile}
   Plan: ${m.plan} (${m.frequency})
   Status: ${m.status}
   Total Paid: ₹${m.total_paid}
   Join Date: ${format(new Date(m.joined_date), 'dd MMM yyyy')}
`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
End of Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

      await Sharing.shareAsync(
        'data:text/plain;base64,' + btoa(reportText),
        {
          mimeType: 'text/plain',
          dialogTitle: 'Share Member Report',
          UTI: 'public.text'
        }
      );
    } catch (error) {
      console.error('Report generation failed:', error);
      Alert.alert('Error', 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const generatePaymentReport = async () => {
    setLoading(true);
    try {
      const totalAmount = payments.reduce((sum: number, p: any) => sum + p.amount, 0);
      const cashPayments = payments.filter((p: any) => p.payment_method === 'Cash');
      const onlinePayments = payments.filter((p: any) => p.payment_method === 'Online');

      const reportText = `
💰 PAYMENT REPORT - TLC_LIBRARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Generated: ${format(new Date(), 'dd MMM yyyy, hh:mm a')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total Payments: ${payments.length}
Total Amount: ₹${totalAmount}

Cash Payments: ${cashPayments.length} (₹${cashPayments.reduce((s: number, p: any) => s + p.amount, 0)})
Online Payments: ${onlinePayments.length} (₹${onlinePayments.reduce((s: number, p: any) => s + p.amount, 0)})

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PAYMENT DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${payments.map((p: any, i) => `
${i + 1}. Receipt: ${p.receipt_number}
   Member: ${p.member_name} (${p.member_id})
   Amount: ₹${p.amount}
   Method: ${p.payment_method}
   Date: ${format(new Date(p.payment_date), 'dd MMM yyyy')}
   ${p.transaction_id ? `Transaction ID: ${p.transaction_id}` : ''}
`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
End of Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

      await Sharing.shareAsync(
        'data:text/plain;base64,' + btoa(reportText),
        {
          mimeType: 'text/plain',
          dialogTitle: 'Share Payment Report',
          UTI: 'public.text'
        }
      );
    } catch (error) {
      console.error('Report generation failed:', error);
      Alert.alert('Error', 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reports</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.infoText}>
          Generate detailed reports for members and payments. Reports can be shared or saved.
        </Text>

        <View style={styles.reportCard}>
          <View style={[styles.iconContainer, { backgroundColor: '#e3f2fd' }]}>
            <Ionicons name="people" size={32} color="#1976d2" />
          </View>
          <View style={styles.reportInfo}>
            <Text style={styles.reportTitle}>Member Report</Text>
            <Text style={styles.reportDescription}>
              Complete list of all members with their details, plans, and status
            </Text>
            <TouchableOpacity 
              style={styles.generateButton}
              onPress={generateMemberReport}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="document-text" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Generate & Share</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.reportCard}>
          <View style={[styles.iconContainer, { backgroundColor: '#e8f5e9' }]}>
            <Ionicons name="cash" size={32} color="#388e3c" />
          </View>
          <View style={styles.reportInfo}>
            <Text style={styles.reportTitle}>Payment Report</Text>
            <Text style={styles.reportDescription}>
              All payment transactions with receipt numbers and amounts
            </Text>
            <TouchableOpacity 
              style={[styles.generateButton, { backgroundColor: '#388e3c' }]}
              onPress={generatePaymentReport}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="document-text" size={20} color="#fff" />
                  <Text style={styles.buttonText}>Generate & Share</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    lineHeight: 20,
  },
  reportCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  reportInfo: {
    gap: 8,
  },
  reportTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  reportDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1976d2',
    padding: 14,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});