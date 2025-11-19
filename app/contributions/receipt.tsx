import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Share, Alert, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import { format } from 'date-fns';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

export default function Receipt() {
  const { token } = useAuth();
  const router = useRouter();
  const { receiptNumber } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [receipt, setReceipt] = useState<any>(null);
  const [memberCustomId, setMemberCustomId] = useState<string>('');

  useEffect(() => {
    if (receiptNumber) {
      loadReceipt();
    }
  }, [receiptNumber]);

  const loadReceipt = async () => {
    try {
      const response = await api.get(`/api/contributions/receipts/${receiptNumber}`);
      const receiptData = response.data;
      setReceipt(receiptData);
      
      // Load member to get custom_id
      try {
        const memberResponse = await api.get(`/api/contributions/members/${receiptData.member_id}`);
        setMemberCustomId(memberResponse.data.custom_id || receiptData.member_id);
      } catch (error) {
        console.error('Failed to load member custom_id:', error);
        setMemberCustomId(receiptData.member_id);
      }
    } catch (error) {
      console.error('Failed to load receipt:', error);
      Alert.alert('Error', 'Failed to load receipt details');
    } finally {
      setLoading(false);
    }
  };

  const shareReceipt = async () => {
    if (!receipt) return;
    
    // Show confirmation before sharing
    Alert.alert(
      'Share Receipt',
      'Do you want to share this receipt?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Share',
          onPress: () => proceedWithShare(),
        },
      ]
    );
  };

  const proceedWithShare = async () => {
    if (!receipt) return;
    
    const receiptText = `
🧾 RECEIPT - TLC_LIBRARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Receipt No: ${receipt.receipt_number}
Date: ${format(new Date(receipt.payment_date), 'dd MMM yyyy')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MEMBER DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Name: ${receipt.member_name}
Member ID: ${memberCustomId}
Email: ${receipt.member_email}
Mobile: ${receipt.member_mobile}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PAYMENT DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Amount Paid: ₹${receipt.amount}
Payment Method: ${receipt.payment_method}
${receipt.transaction_id ? `Transaction ID: ${receipt.transaction_id}\n` : ''}Plan: ${receipt.plan}
Frequency: ${receipt.frequency}
Next Due: ${format(new Date(receipt.next_due_date), 'dd MMM yyyy')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ORGANIZATION DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${receipt.organization.name}
${receipt.organization.address}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Thank you for your contribution!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

    try {
      await Share.share({
        message: receiptText,
        title: `Receipt ${receipt.receipt_number}`,
      });
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Error', 'Failed to share receipt. Please try again.');
    }
  };

  const downloadPDF = async () => {
    if (!receipt) return;
    
    // Show confirmation before download
    Alert.alert(
      'Download Receipt',
      'Do you want to download this receipt as PDF?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Download',
          onPress: () => proceedWithPDFDownload(),
        },
      ]
    );
  };

  const proceedWithPDFDownload = async () => {
    if (!receipt) return;
    
    try {
      // Check if platform supports PDF generation
      if (Platform.OS === 'web') {
        // For web, open print dialog
        Alert.alert(
          'PDF Download',
          'On web, please use your browser\'s print function (Ctrl+P or Cmd+P) and select "Save as PDF"',
          [{ text: 'OK' }]
        );
        
        // Open print dialog
        if (typeof window !== 'undefined') {
          window.print();
        }
        return;
      }
      
      // Generate HTML for PDF (for mobile only)
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Helvetica', 'Arial', sans-serif;
              padding: 40px;
              color: #333;
            }
            .receipt-container {
              max-width: 800px;
              margin: 0 auto;
              border: 2px solid #6200ee;
              border-radius: 8px;
              overflow: hidden;
            }
            .receipt-header {
              background: linear-gradient(135deg, #6200ee 0%, #7c4dff 100%);
              color: white;
              padding: 30px;
              text-align: center;
            }
            .receipt-icon {
              font-size: 48px;
              margin-bottom: 10px;
            }
            .receipt-title {
              font-size: 28px;
              font-weight: bold;
              margin-bottom: 8px;
            }
            .receipt-number {
              font-size: 18px;
              opacity: 0.9;
            }
            .receipt-body {
              padding: 30px;
              background: white;
            }
            .section {
              margin-bottom: 25px;
              padding-bottom: 25px;
              border-bottom: 1px solid #e0e0e0;
            }
            .section:last-child {
              border-bottom: none;
            }
            .section-title {
              font-size: 12px;
              color: #999;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-bottom: 15px;
              font-weight: 600;
            }
            .org-name {
              font-size: 20px;
              font-weight: 600;
              margin-bottom: 8px;
              color: #333;
            }
            .org-address, .member-detail {
              font-size: 14px;
              color: #666;
              line-height: 1.6;
              margin-bottom: 4px;
            }
            .member-name {
              font-size: 20px;
              font-weight: 600;
              margin-bottom: 10px;
              color: #333;
            }
            .detail-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 12px;
              padding: 8px 0;
            }
            .detail-label {
              font-size: 14px;
              color: #666;
            }
            .detail-value {
              font-size: 14px;
              font-weight: 600;
              color: #333;
            }
            .payment-method {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 12px;
              font-size: 12px;
              font-weight: 600;
              color: white;
            }
            .method-cash {
              background-color: #ff9800;
            }
            .method-online {
              background-color: #1976d2;
            }
            .total-section {
              background: #f3e5f5;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .total-label {
              font-size: 14px;
              color: #6200ee;
              margin-bottom: 8px;
            }
            .total-amount {
              font-size: 36px;
              font-weight: bold;
              color: #6200ee;
            }
            .footer-note {
              background: #e8f5e9;
              padding: 15px;
              border-radius: 8px;
              text-align: center;
              color: #00897b;
              font-size: 14px;
              font-weight: 600;
            }
            .notes {
              background: #fff9e6;
              padding: 15px;
              border-radius: 8px;
              margin-top: 15px;
            }
            .notes-label {
              font-size: 12px;
              font-weight: 600;
              color: #666;
              margin-bottom: 8px;
            }
            .notes-text {
              font-size: 14px;
              color: #333;
              line-height: 1.6;
            }
            .receipt-footer {
              text-align: center;
              padding: 20px;
              font-size: 12px;
              color: #999;
              border-top: 1px solid #e0e0e0;
            }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="receipt-header">
              <div class="receipt-icon">🧾</div>
              <div class="receipt-title">Payment Receipt</div>
              <div class="receipt-number">${receipt.receipt_number}</div>
              <div style="margin-top: 8px; opacity: 0.9;">${format(new Date(receipt.payment_date), 'dd MMMM yyyy')}</div>
            </div>
            
            <div class="receipt-body">
              <div class="section">
                <div class="section-title">From</div>
                <div class="org-name">${receipt.organization.name}</div>
                <div class="org-address">${receipt.organization.address}</div>
              </div>
              
              <div class="section">
                <div class="section-title">To</div>
                <div class="member-name">${receipt.member_name}</div>
                <div class="member-detail">Member ID: ${memberCustomId}</div>
                <div class="member-detail">Email: ${receipt.member_email}</div>
                <div class="member-detail">Mobile: ${receipt.member_mobile}</div>
              </div>
              
              <div class="section">
                <div class="section-title">Payment Details</div>
                
                <div class="detail-row">
                  <span class="detail-label">Amount Paid</span>
                  <span class="detail-value">₹${receipt.amount}</span>
                </div>
                
                <div class="detail-row">
                  <span class="detail-label">Payment Method</span>
                  <span class="payment-method method-${receipt.payment_method.toLowerCase()}">${receipt.payment_method}</span>
                </div>
                
                ${receipt.transaction_id ? `
                <div class="detail-row">
                  <span class="detail-label">Transaction ID</span>
                  <span class="detail-value">${receipt.transaction_id}</span>
                </div>
                ` : ''}
                
                <div class="detail-row">
                  <span class="detail-label">Plan</span>
                  <span class="detail-value">${receipt.plan}</span>
                </div>
                
                <div class="detail-row">
                  <span class="detail-label">Frequency</span>
                  <span class="detail-value">${receipt.frequency}</span>
                </div>
                
                <div class="detail-row">
                  <span class="detail-label">Next Due Date</span>
                  <span class="detail-value">${format(new Date(receipt.next_due_date), 'dd MMM yyyy')}</span>
                </div>
              </div>
              
              <div class="total-section">
                <div class="total-label">Total Amount Paid</div>
                <div class="total-amount">₹${receipt.amount}</div>
              </div>
              
              <div class="footer-note">
                ✓ Payment received successfully
              </div>
              
              ${receipt.notes ? `
              <div class="notes">
                <div class="notes-label">Notes:</div>
                <div class="notes-text">${receipt.notes}</div>
              </div>
              ` : ''}
            </div>
            
            <div class="receipt-footer">
              This is an official receipt from TLC_LIBRARY<br>
              Generated on ${format(new Date(), 'dd MMMM yyyy, hh:mm a')}
            </div>
          </div>
        </body>
        </html>
      `;

      // Generate PDF for mobile
      const result = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
      });

      if (!result || !result.uri) {
        throw new Error('PDF generation failed');
      }

      // Share or save the PDF on mobile
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(result.uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Receipt ${receipt.receipt_number}`,
          UTI: 'com.adobe.pdf',
        });
        Alert.alert(
          '✅ Success',
          'PDF generated and ready to share!\n\nReceipt Number: ' + receipt.receipt_number,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          '✅ Success', 
          'PDF saved successfully!\n\nReceipt Number: ' + receipt.receipt_number,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('PDF generation error:', error);
      Alert.alert('Error', 'Failed to generate PDF. Please try again.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#6200ee" style={{ marginTop: 100 }} />
      </SafeAreaView>
    );
  }

  if (!receipt) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => (router.canGoBack() ? router.back() : router.push('/(tabs)'))} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Receipt</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>Receipt not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (router.canGoBack() ? router.back() : router.push('/(tabs)'))} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Receipt</Text>
        <TouchableOpacity onPress={shareReceipt} style={styles.shareButton}>
          <Ionicons name="share-outline" size={24} color="#6200ee" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Receipt Header */}
        <View style={styles.receiptCard}>
          <View style={styles.receiptHeader}>
            <Image 
              source={require('../../assets/library-logo.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.receiptTitle}>Payment Receipt</Text>
            <Text style={styles.receiptNumber}>{receipt.receipt_number}</Text>
            <Text style={styles.receiptDate}>
              {format(new Date(receipt.payment_date), 'dd MMMM yyyy')}
            </Text>
          </View>

          {/* Organization Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>From</Text>
            <Text style={styles.orgName}>{receipt.organization.name}</Text>
            <Text style={styles.orgAddress}>{receipt.organization.address}</Text>
          </View>

          <View style={styles.divider} />

          {/* Member Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>To</Text>
            <Text style={styles.memberName}>{receipt.member_name}</Text>
            <Text style={styles.memberDetail}>Member ID: {memberCustomId}</Text>
            <Text style={styles.memberDetail}>Email: {receipt.member_email}</Text>
            <Text style={styles.memberDetail}>Mobile: {receipt.member_mobile}</Text>
          </View>

          <View style={styles.divider} />

          {/* Payment Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Details</Text>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Amount Paid</Text>
              <Text style={styles.detailValue}>₹{receipt.amount}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Payment Method</Text>
              <View style={[styles.methodBadge, receipt.payment_method === 'Cash' ? styles.cashBadge : styles.onlineBadge]}>
                <Text style={styles.methodText}>{receipt.payment_method}</Text>
              </View>
            </View>

            {receipt.transaction_id && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Transaction ID</Text>
                <Text style={styles.detailValue}>{receipt.transaction_id}</Text>
              </View>
            )}

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Plan</Text>
              <Text style={styles.detailValue}>{receipt.plan}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Frequency</Text>
              <Text style={styles.detailValue}>{receipt.frequency}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Next Due Date</Text>
              <Text style={styles.detailValue}>
                {format(new Date(receipt.next_due_date), 'dd MMM yyyy')}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Total Amount - Highlighted */}
          <View style={styles.totalSection}>
            <Text style={styles.totalLabel}>Total Amount Paid</Text>
            <Text style={styles.totalAmount}>₹{receipt.amount}</Text>
          </View>

          {/* Footer Note */}
          <View style={styles.footerNote}>
            <Ionicons name="checkmark-circle" size={16} color="#00897b" />
            <Text style={styles.footerText}>Payment received successfully</Text>
          </View>

          {receipt.notes && (
            <View style={styles.notesSection}>
              <Text style={styles.notesLabel}>Notes:</Text>
              <Text style={styles.notesText}>{receipt.notes}</Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <TouchableOpacity style={styles.downloadButton} onPress={downloadPDF}>
          <Ionicons name="download-outline" size={20} color="#fff" />
          <Text style={styles.downloadButtonText}>Download PDF</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.shareFullButton} onPress={shareReceipt}>
          <Ionicons name="share-outline" size={20} color="#fff" />
          <Text style={styles.shareButtonText}>Share Receipt</Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          This is an official receipt from TLC_LIBRARY
        </Text>
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
  shareButton: {
    padding: 4,
  },
  content: {
    padding: 16,
  },
  receiptCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  receiptHeader: {
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 2,
    borderBottomColor: '#f0f0f0',
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 12,
  },
  receiptTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  receiptNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6200ee',
    marginTop: 8,
  },
  receiptDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    textTransform: 'uppercase',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  orgName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  orgAddress: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  memberName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  memberDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  methodBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  cashBadge: {
    backgroundColor: '#ff9800',
  },
  onlineBadge: {
    backgroundColor: '#1976d2',
  },
  methodText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  totalSection: {
    backgroundColor: '#f3e5f5',
    padding: 16,
    borderRadius: 8,
    marginTop: 12,
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 14,
    color: '#6200ee',
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#6200ee',
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    marginBottom: 12,
  },
  footerText: {
    fontSize: 14,
    color: '#00897b',
    fontWeight: '600',
  },
  notesSection: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#fff9e6',
    borderRadius: 8,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  shareFullButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6200ee',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00897b',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 12,
  },
  downloadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
  },
});