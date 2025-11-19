import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths } from 'date-fns';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

interface ReportStats {
  totalMembers: number;
  activeMembers: number;
  inactiveMembers: number;
  totalPayments: number;
  totalAmount: number;
  cashPayments: number;
  onlinePayments: number;
  cashAmount: number;
  onlineAmount: number;
  pendingDues: number;
}

export default function ReportsEnhanced() {
  const { token } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [stats, setStats] = useState<ReportStats>({
    totalMembers: 0,
    activeMembers: 0,
    inactiveMembers: 0,
    totalPayments: 0,
    totalAmount: 0,
    cashPayments: 0,
    onlinePayments: 0,
    cashAmount: 0,
    onlineAmount: 0,
    pendingDues: 0,
  });
  const [dateFilter, setDateFilter] = useState<'all' | 'thisMonth' | 'lastMonth' | 'thisYear'>('all');

  useEffect(() => {
    loadData();
  }, [dateFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [membersRes, paymentsRes] = await Promise.all([
        api.get('/api/contributions/members'),
        api.get('/api/contributions/payments')
      ]);

      let filteredPayments = paymentsRes.data;

      // Apply date filter
      if (dateFilter !== 'all') {
        const now = new Date();
        let startDate, endDate;

        if (dateFilter === 'thisMonth') {
          startDate = startOfMonth(now);
          endDate = endOfMonth(now);
        } else if (dateFilter === 'lastMonth') {
          const lastMonth = subMonths(now, 1);
          startDate = startOfMonth(lastMonth);
          endDate = endOfMonth(lastMonth);
        } else if (dateFilter === 'thisYear') {
          startDate = startOfYear(now);
          endDate = endOfYear(now);
        }

        filteredPayments = paymentsRes.data.filter((p: any) => {
          const paymentDate = new Date(p.payment_date);
          return paymentDate >= startDate! && paymentDate <= endDate!;
        });
      }

      setMembers(membersRes.data);
      setPayments(filteredPayments);

      // Calculate statistics
      const activeMembers = membersRes.data.filter((m: any) => m.status === 'Active');
      const inactiveMembers = membersRes.data.filter((m: any) => m.status === 'Inactive');
      const cashPayments = filteredPayments.filter((p: any) => p.payment_method === 'Cash');
      const onlinePayments = filteredPayments.filter((p: any) => p.payment_method === 'Online');
      
      const totalAmount = filteredPayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
      const cashAmount = cashPayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
      const onlineAmount = onlinePayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

      // Calculate pending dues (members with next_due_date in the past)
      const now = new Date();
      const overdueMembers = activeMembers.filter((m: any) => {
        if (!m.next_due_date) return false;
        return new Date(m.next_due_date) < now;
      });

      setStats({
        totalMembers: membersRes.data.length,
        activeMembers: activeMembers.length,
        inactiveMembers: inactiveMembers.length,
        totalPayments: filteredPayments.length,
        totalAmount,
        cashPayments: cashPayments.length,
        onlinePayments: onlinePayments.length,
        cashAmount,
        onlineAmount,
        pendingDues: overdueMembers.length,
      });
    } catch (error) {
      console.error('Failed to load data:', error);
      Alert.alert('Error', 'Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const getFilterLabel = () => {
    switch (dateFilter) {
      case 'thisMonth': return 'This Month';
      case 'lastMonth': return 'Last Month';
      case 'thisYear': return 'This Year';
      default: return 'All Time';
    }
  };

  const exportToPDF = async () => {
    Alert.alert(
      'Export to PDF',
      'Generate a professional PDF report with all data and analytics?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Generate PDF', onPress: () => generatePDF() },
      ]
    );
  };

  const generatePDF = async () => {
    setExportingPDF(true);
    try {
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Arial', sans-serif; padding: 40px; }
    
    .header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid #6200ee;
    }
    
    .logo { width: 100px; height: 100px; margin: 0 auto 20px; }
    
    .title { 
      font-size: 32px; 
      font-weight: bold; 
      color: #6200ee;
      margin-bottom: 10px;
    }
    
    .subtitle {
      font-size: 18px;
      color: #666;
      margin-bottom: 5px;
    }
    
    .date-range {
      font-size: 14px;
      color: #999;
      margin-top: 10px;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-bottom: 40px;
    }
    
    .stat-card {
      background: linear-gradient(135deg, #6200ee 0%, #bb86fc 100%);
      color: white;
      padding: 20px;
      border-radius: 12px;
      text-align: center;
    }
    
    .stat-card.green { background: linear-gradient(135deg, #00897b 0%, #4db6ac 100%); }
    .stat-card.orange { background: linear-gradient(135deg, #f57c00 0%, #ffb74d 100%); }
    .stat-card.blue { background: linear-gradient(135deg, #1976d2 0%, #64b5f6 100%); }
    .stat-card.red { background: linear-gradient(135deg, #d32f2f 0%, #ef5350 100%); }
    
    .stat-value {
      font-size: 36px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    
    .stat-label {
      font-size: 14px;
      opacity: 0.9;
    }
    
    .section {
      margin-bottom: 40px;
    }
    
    .section-title {
      font-size: 24px;
      font-weight: bold;
      color: #333;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #e0e0e0;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #e0e0e0;
    }
    
    th {
      background-color: #f5f5f5;
      font-weight: bold;
      color: #333;
    }
    
    tr:hover {
      background-color: #f9f9f9;
    }
    
    .footer {
      margin-top: 60px;
      padding-top: 20px;
      border-top: 2px solid #e0e0e0;
      text-align: center;
      color: #999;
      font-size: 12px;
    }
    
    .highlight { color: #6200ee; font-weight: bold; }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">TLC_LIBRARY</div>
    <div class="subtitle">Comprehensive Report</div>
    <div class="date-range">Period: ${getFilterLabel()}</div>
    <div class="date-range">Generated: ${format(new Date(), 'dd MMMM yyyy, hh:mm a')}</div>
  </div>
  
  <div class="stats-grid">
    <div class="stat-card blue">
      <div class="stat-value">${stats.totalMembers}</div>
      <div class="stat-label">Total Members</div>
    </div>
    <div class="stat-card green">
      <div class="stat-value">${stats.activeMembers}</div>
      <div class="stat-label">Active Members</div>
    </div>
    <div class="stat-card orange">
      <div class="stat-value">${stats.inactiveMembers}</div>
      <div class="stat-label">Inactive Members</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${stats.totalPayments}</div>
      <div class="stat-label">Total Payments</div>
    </div>
    <div class="stat-card green">
      <div class="stat-value">₹${stats.totalAmount}</div>
      <div class="stat-label">Total Amount</div>
    </div>
    <div class="stat-card red">
      <div class="stat-value">${stats.pendingDues}</div>
      <div class="stat-label">Pending Dues</div>
    </div>
  </div>
  
  <div class="section">
    <div class="section-title">Payment Breakdown</div>
    <table>
      <tr>
        <th>Payment Method</th>
        <th>Count</th>
        <th>Total Amount</th>
        <th>Percentage</th>
      </tr>
      <tr>
        <td>Cash</td>
        <td>${stats.cashPayments}</td>
        <td class="highlight">₹${stats.cashAmount}</td>
        <td>${stats.totalAmount > 0 ? ((stats.cashAmount / stats.totalAmount) * 100).toFixed(1) : 0}%</td>
      </tr>
      <tr>
        <td>Online</td>
        <td>${stats.onlinePayments}</td>
        <td class="highlight">₹${stats.onlineAmount}</td>
        <td>${stats.totalAmount > 0 ? ((stats.onlineAmount / stats.totalAmount) * 100).toFixed(1) : 0}%</td>
      </tr>
    </table>
  </div>
  
  <div class="section">
    <div class="section-title">Recent Payments</div>
    <table>
      <tr>
        <th>Date</th>
        <th>Member</th>
        <th>Amount</th>
        <th>Method</th>
        <th>Receipt</th>
      </tr>
      ${payments.slice(0, 20).map(p => `
        <tr>
          <td>${format(new Date(p.payment_date), 'dd MMM yyyy')}</td>
          <td>${p.member_name}</td>
          <td class="highlight">₹${p.amount}</td>
          <td>${p.payment_method}</td>
          <td>${p.receipt_number}</td>
        </tr>
      `).join('')}
    </table>
  </div>
  
  <div class="footer">
    <p>This is an official report generated by TLC_LIBRARY Management System</p>
    <p>Generated on ${format(new Date(), 'dd MMMM yyyy')} at ${format(new Date(), 'hh:mm a')}</p>
    <p>© ${new Date().getFullYear()} TLC_LIBRARY. All rights reserved.</p>
  </div>
</body>
</html>
      `;

      const { uri } = await Print.printToFileAsync({ html: htmlContent });

      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            dialogTitle: `TLC_LIBRARY_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`,
            UTI: 'com.adobe.pdf',
          });
          Alert.alert('✅ Success', 'PDF report generated successfully!');
        }
      } else {
        Alert.alert('✅ Success', 'PDF saved successfully!');
      }
    } catch (error) {
      console.error('PDF export error:', error);
      Alert.alert('Error', 'Failed to generate PDF report');
    } finally {
      setExportingPDF(false);
    }
  };

  const exportToExcel = async () => {
    Alert.alert(
      'Export to CSV',
      'Generate a CSV file with all payment data for Excel?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Generate CSV', onPress: () => generateCSV() },
      ]
    );
  };

  const generateCSV = async () => {
    setExportingExcel(true);
    try {
      // Generate CSV content
      const csvHeader = 'Date,Member Name,Member ID,Amount,Payment Method,Receipt Number,Transaction ID\n';
      const csvRows = payments.map(p => 
        `${format(new Date(p.payment_date), 'yyyy-MM-dd')},${p.member_name},${p.member_id},${p.amount},${p.payment_method},${p.receipt_number},${p.transaction_id || 'N/A'}`
      ).join('\n');
      
      const csvContent = csvHeader + csvRows;
      
      // Save to file
      const fileName = `TLC_LIBRARY_Payments_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      const fileUri = FileSystem.documentDirectory + fileName;
      
      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Share the file
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'text/csv',
            dialogTitle: fileName,
            UTI: 'public.comma-separated-values-text',
          });
          Alert.alert('✅ Success', 'CSV file generated successfully!');
        }
      } else {
        Alert.alert('✅ Success', 'CSV saved successfully!');
      }
    } catch (error) {
      console.error('CSV export error:', error);
      Alert.alert('Error', 'Failed to generate CSV file');
    } finally {
      setExportingExcel(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Generate Reports</Text>
          <View style={{ width: 24 }} />
        </View>
        <ActivityIndicator size="large" color="#6200ee" style={{ marginTop: 100 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Generate Reports</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Date Filter */}
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Report Period:</Text>
          <View style={styles.filterButtons}>
            <TouchableOpacity
              style={[styles.filterButton, dateFilter === 'all' && styles.filterButtonActive]}
              onPress={() => setDateFilter('all')}
            >
              <Text style={[styles.filterButtonText, dateFilter === 'all' && styles.filterButtonTextActive]}>
                All Time
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, dateFilter === 'thisMonth' && styles.filterButtonActive]}
              onPress={() => setDateFilter('thisMonth')}
            >
              <Text style={[styles.filterButtonText, dateFilter === 'thisMonth' && styles.filterButtonTextActive]}>
                This Month
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, dateFilter === 'lastMonth' && styles.filterButtonActive]}
              onPress={() => setDateFilter('lastMonth')}
            >
              <Text style={[styles.filterButtonText, dateFilter === 'lastMonth' && styles.filterButtonTextActive]}>
                Last Month
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, dateFilter === 'thisYear' && styles.filterButtonActive]}
              onPress={() => setDateFilter('thisYear')}
            >
              <Text style={[styles.filterButtonText, dateFilter === 'thisYear' && styles.filterButtonTextActive]}>
                This Year
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Statistics Cards */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: '#e3f2fd' }]}>
            <Ionicons name="people" size={32} color="#1976d2" />
            <Text style={styles.statValue}>{stats.totalMembers}</Text>
            <Text style={styles.statLabel}>Total Members</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#e8f5e9' }]}>
            <Ionicons name="checkmark-circle" size={32} color="#388e3c" />
            <Text style={styles.statValue}>{stats.activeMembers}</Text>
            <Text style={styles.statLabel}>Active Members</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#fff3e0' }]}>
            <Ionicons name="close-circle" size={32} color="#f57c00" />
            <Text style={styles.statValue}>{stats.inactiveMembers}</Text>
            <Text style={styles.statLabel}>Inactive</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#f3e5f5' }]}>
            <Ionicons name="cash" size={32} color="#6200ee" />
            <Text style={styles.statValue}>{stats.totalPayments}</Text>
            <Text style={styles.statLabel}>Total Payments</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#e8f5e9' }]}>
            <Ionicons name="wallet" size={32} color="#00897b" />
            <Text style={styles.statValue}>₹{stats.totalAmount}</Text>
            <Text style={styles.statLabel}>Total Amount</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#ffebee' }]}>
            <Ionicons name="alert-circle" size={32} color="#d32f2f" />
            <Text style={styles.statValue}>{stats.pendingDues}</Text>
            <Text style={styles.statLabel}>Pending Dues</Text>
          </View>
        </View>

        {/* Payment Breakdown */}
        <View style={styles.breakdownCard}>
          <Text style={styles.breakdownTitle}>Payment Method Breakdown</Text>
          <View style={styles.breakdownRow}>
            <View style={styles.breakdownItem}>
              <Ionicons name="cash" size={24} color="#f57c00" />
              <Text style={styles.breakdownLabel}>Cash</Text>
              <Text style={styles.breakdownValue}>{stats.cashPayments} payments</Text>
              <Text style={styles.breakdownAmount}>₹{stats.cashAmount}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.breakdownItem}>
              <Ionicons name="card" size={24} color="#1976d2" />
              <Text style={styles.breakdownLabel}>Online</Text>
              <Text style={styles.breakdownValue}>{stats.onlinePayments} payments</Text>
              <Text style={styles.breakdownAmount}>₹{stats.onlineAmount}</Text>
            </View>
          </View>
        </View>

        {/* Export Options */}
        <View style={styles.exportSection}>
          <Text style={styles.exportTitle}>Export Options</Text>
          
          <TouchableOpacity
            style={[styles.exportButton, styles.pdfButton]}
            onPress={exportToPDF}
            disabled={exportingPDF}
          >
            {exportingPDF ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="document-text" size={24} color="#fff" />
                <View style={styles.exportButtonText}>
                  <Text style={styles.exportButtonTitle}>Export as PDF</Text>
                  <Text style={styles.exportButtonSubtitle}>Professional report with analytics</Text>
                </View>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.exportButton, styles.excelButton]}
            onPress={exportToExcel}
            disabled={exportingExcel}
          >
            {exportingExcel ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="grid" size={24} color="#fff" />
                <View style={styles.exportButtonText}>
                  <Text style={styles.exportButtonTitle}>Export as CSV</Text>
                  <Text style={styles.exportButtonSubtitle}>Compatible with Excel & Google Sheets</Text>
                </View>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Recent Payments Preview */}
        <View style={styles.previewSection}>
          <Text style={styles.previewTitle}>Recent Payments ({payments.length} total)</Text>
          {payments.slice(0, 5).map((payment, index) => (
            <View key={index} style={styles.paymentItem}>
              <View style={styles.paymentLeft}>
                <Text style={styles.paymentMember}>{payment.member_name}</Text>
                <Text style={styles.paymentDate}>
                  {format(new Date(payment.payment_date), 'dd MMM yyyy')}
                </Text>
              </View>
              <View style={styles.paymentRight}>
                <Text style={styles.paymentAmount}>₹{payment.amount}</Text>
                <View style={[styles.paymentBadge, payment.payment_method === 'Cash' ? styles.cashBadge : styles.onlineBadge]}>
                  <Text style={styles.paymentBadgeText}>{payment.payment_method}</Text>
                </View>
              </View>
            </View>
          ))}
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
  content: {
    flex: 1,
  },
  filterSection: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  filterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterButtonActive: {
    backgroundColor: '#6200ee',
    borderColor: '#6200ee',
  },
  filterButtonText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    gap: 8,
  },
  statCard: {
    width: '31%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  breakdownCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breakdownItem: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: 80,
    backgroundColor: '#e0e0e0',
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    marginBottom: 4,
  },
  breakdownValue: {
    fontSize: 13,
    color: '#999',
    marginBottom: 4,
  },
  breakdownAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  exportSection: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
  },
  exportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  pdfButton: {
    backgroundColor: '#d32f2f',
  },
  excelButton: {
    backgroundColor: '#00897b',
  },
  exportButtonText: {
    flex: 1,
  },
  exportButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  exportButtonSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  previewSection: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  paymentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  paymentLeft: {
    flex: 1,
  },
  paymentMember: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  paymentDate: {
    fontSize: 13,
    color: '#999',
  },
  paymentRight: {
    alignItems: 'flex-end',
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00897b',
    marginBottom: 4,
  },
  paymentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  cashBadge: {
    backgroundColor: '#fff3e0',
  },
  onlineBadge: {
    backgroundColor: '#e3f2fd',
  },
  paymentBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
  },
});
