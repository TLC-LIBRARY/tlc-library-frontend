import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import { Picker } from '@react-native-picker/picker';


export default function RecordPayment() {
  const { token } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [members, setMembers] = useState<any[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [formData, setFormData] = useState({
    member_id: '',
    amount: '',
    payment_method: 'Cash',
    transaction_id: '',
    notes: '',
  });

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      const response = await api.get('/api/contributions/members');
      setMembers(response.data);
    } catch (error) {
      console.error('Failed to load members:', error);
      Alert.alert('Error', 'Failed to load members list');
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleRecordPayment = async () => {
    if (!formData.member_id || !formData.amount) {
      Alert.alert('Error', 'Please select member and enter amount');
      return;
    }

    if (formData.payment_method === 'Online' && !formData.transaction_id) {
      Alert.alert('Error', 'Transaction ID required for online payments');
      return;
    }

    // Show confirmation modal
    setShowConfirmation(true);
  };

  const confirmRecordPayment = async () => {
    setShowConfirmation(false);
    setLoading(true);
    try {
      const paymentData = {
        ...formData,
        amount: parseFloat(formData.amount),
        payment_date: new Date().toISOString(),
        transaction_id: formData.transaction_id || null,
        notes: formData.notes || null,
      };

      const response = await api.post(
        '/api/contributions/payments/record',
        paymentData
      );

      // Clear form
      setFormData({
        member_id: '',
        amount: '',
        payment_method: 'Cash',
        transaction_id: '',
        notes: '',
      });

      // Show success message with receipt number
      const successMessage = `✅ Payment Recorded Successfully!\n\nReceipt Number: ${response.data.receipt_number}\n\nDetails:\n• Amount: ₹${response.data.amount}\n• Member: ${response.data.member_name}\n• Payment Method: ${response.data.payment_method}\n\nThe payment has been saved and receipt has been generated.\n📧 Notification sent to member!`;
      
      if (Platform.OS === 'web') {
        const action = window.confirm(successMessage + '\n\nClick OK to view receipt, Cancel to record another payment');
        if (action) {
          router.push(`/contributions/receipt?receipt_number=${response.data.receipt_number}`);
        }
      } else {
        Alert.alert(
          '✅ Payment Recorded Successfully!',
          `Receipt Number: ${response.data.receipt_number}\n\nAmount: ₹${response.data.amount}\nMember: ${response.data.member_name}\nPayment Method: ${response.data.payment_method}\n\nThe payment has been saved and receipt has been generated.\n📧 Notification sent to member!`,
          [
            { 
              text: 'View Receipt', 
              onPress: () => router.push(`/contributions/receipt?receipt_number=${response.data.receipt_number}`)
            },
            { 
              text: 'Record Another', 
              style: 'cancel'
            }
          ]
        );
      }
    } catch (error: any) {
      console.error('Payment recording error:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  const selectedMember = members.find(m => m.member_id === formData.member_id);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => (router.canGoBack() ? router.back() : router.push('/(tabs)'))} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Record Payment</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.content}>
          {loadingMembers ? (
            <ActivityIndicator size="large" color="#6200ee" style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.form}>
              <Text style={styles.label}>Select Member *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.member_id}
                  onValueChange={(value) => setFormData({ ...formData, member_id: value })}
                  style={styles.picker}
                >
                  <Picker.Item label="-- Select Member --" value="" />
                  {members.map(member => (
                    <Picker.Item 
                      key={member.member_id} 
                      label={`${member.full_name} (${member.custom_id || member.member_id})`} 
                      value={member.member_id} 
                    />
                  ))}
                </Picker>
              </View>

              {selectedMember && (
                <View style={styles.memberInfo}>
                  <Text style={styles.memberInfoText}>Plan: {selectedMember.plan}</Text>
                  <Text style={styles.memberInfoText}>Frequency: {selectedMember.frequency}</Text>
                  <Text style={styles.memberInfoText}>Total Paid: ₹{selectedMember.total_paid}</Text>
                </View>
              )}

              <Text style={styles.label}>Amount *</Text>
              <TextInput
                style={styles.input}
                value={formData.amount}
                onChangeText={(text) => setFormData({ ...formData, amount: text })}
                placeholder="Enter amount"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />

              <Text style={styles.label}>Payment Method *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.payment_method}
                  onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
                  style={styles.picker}
                >
                  <Picker.Item label="Cash" value="Cash" />
                  <Picker.Item label="Online" value="Online" />
                </Picker>
              </View>

              {formData.payment_method === 'Online' && (
                <>
                  <Text style={styles.label}>Transaction ID *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.transaction_id}
                    onChangeText={(text) => setFormData({ ...formData, transaction_id: text })}
                    placeholder="Enter transaction ID"
                    placeholderTextColor="#999"
                  />
                </>
              )}

              <Text style={styles.label}>Notes (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.notes}
                onChangeText={(text) => setFormData({ ...formData, notes: text })}
                placeholder="Enter any notes"
                placeholderTextColor="#999"
                multiline
                numberOfLines={3}
              />

              <TouchableOpacity 
                style={[styles.submitButton, loading && styles.buttonDisabled]}
                onPress={handleRecordPayment}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="cash" size={20} color="#fff" />
                    <Text style={styles.submitButtonText}>Record Payment</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="alert-circle" size={50} color="#6200ee" />
              <Text style={styles.modalTitle}>Confirm Payment</Text>
            </View>
            
            <View style={styles.confirmationDetails}>
              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>Member:</Text>
                <Text style={styles.confirmValue}>
                  {members.find(m => m.member_id === formData.member_id)?.full_name || 'N/A'}
                </Text>
              </View>
              
              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>Plan:</Text>
                <Text style={styles.confirmValue}>
                  {members.find(m => m.member_id === formData.member_id)?.plan || 'N/A'}
                </Text>
              </View>

              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>Amount:</Text>
                <Text style={[styles.confirmValue, styles.amountText]}>₹{formData.amount}</Text>
              </View>

              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>Payment Method:</Text>
                <Text style={styles.confirmValue}>{formData.payment_method}</Text>
              </View>

              {formData.transaction_id && (
                <View style={styles.confirmRow}>
                  <Text style={styles.confirmLabel}>Transaction ID:</Text>
                  <Text style={styles.confirmValue}>{formData.transaction_id}</Text>
                </View>
              )}
            </View>

            <Text style={styles.warningText}>
              ⚠️ This action will record the payment and generate a receipt. Please verify all details before confirming.
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowConfirmation(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.confirmButton}
                onPress={confirmRecordPayment}
              >
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
  content: {
    flex: 1,
  },
  form: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  memberInfo: {
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  memberInfoText: {
    fontSize: 14,
    color: '#1976d2',
    marginBottom: 4,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00897b',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  modal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    marginTop: 12,
  },
  confirmationDetails: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  confirmRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  confirmLabel: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
  },
  confirmValue: {
    fontSize: 15,
    color: '#333',
    fontWeight: '600',
  },
  amountText: {
    color: '#00897b',
    fontSize: 18,
  },
  warningText: {
    fontSize: 13,
    color: '#f57c00',
    backgroundColor: '#fff3e0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#6200ee',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});