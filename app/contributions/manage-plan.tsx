import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import { Picker } from '@react-native-picker/picker';

export default function ManagePlan() {
  const { token } = useAuth();
  const router = useRouter();
  const { memberId } = useLocalSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [member, setMember] = useState<any>(null);
  const [newPlan, setNewPlan] = useState('');
  const [newFrequency, setNewFrequency] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    loadMemberData();
  }, [memberId]);

  const loadMemberData = async () => {
    try {
      const response = await api.get(`/api/contributions/members/${memberId}`);
      const memberData = response.data;
      setMember(memberData);
      setNewPlan(memberData.plan);
      setNewFrequency(memberData.frequency);
    } catch (error) {
      console.error('Failed to load member:', error);
      Alert.alert('Error', 'Failed to load member details');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!newPlan || !newFrequency) {
      Alert.alert('Error', 'Please select both plan and frequency');
      return;
    }

    // Check if anything changed
    if (newPlan === member.plan && newFrequency === member.frequency) {
      Alert.alert('Info', 'No changes detected');
      return;
    }

    setShowConfirmation(true);
  };

  const confirmSave = async () => {
    setSaving(true);
    setShowConfirmation(false);

    try {
      await api.put(
        `/api/contributions/members/${memberId}`,
        { plan: newPlan, frequency: newFrequency }
      );

      Alert.alert(
        'Success',
        'Plan and frequency updated successfully. Member has been notified.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      console.error('Update error:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to update plan');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#6200ee" style={{ marginTop: 100 }} />
      </SafeAreaView>
    );
  }

  if (!member) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Member not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Plan & Frequency</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Member Info */}
        <View style={styles.memberCard}>
          <View style={styles.memberIcon}>
            <Ionicons name="person" size={40} color="#6200ee" />
          </View>
          <View style={styles.memberInfo}>
            <Text style={styles.memberName}>{member.full_name}</Text>
            <Text style={styles.memberEmail}>{member.email}</Text>
            <Text style={styles.memberId}>{member.custom_id || member.member_id}</Text>
          </View>
        </View>

        {/* Current Plan Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Details</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Current Plan:</Text>
            <Text style={styles.value}>{member.plan}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Current Frequency:</Text>
            <Text style={styles.value}>{member.frequency}</Text>
          </View>
        </View>

        {/* New Plan Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Update Plan</Text>
          
          <Text style={styles.inputLabel}>Select Plan</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={newPlan}
              onValueChange={setNewPlan}
              style={styles.picker}
            >
              <Picker.Item label="Basic - ₹600/month" value="Basic" />
              <Picker.Item label="Standard - ₹800/month" value="Standard" />
              <Picker.Item label="Premium - ₹1000/month" value="Premium" />
            </Picker>
          </View>

          <Text style={styles.inputLabel}>Select Frequency</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={newFrequency}
              onValueChange={setNewFrequency}
              style={styles.picker}
            >
              <Picker.Item label="Monthly" value="monthly" />
              <Picker.Item label="Quarterly" value="quarterly" />
              <Picker.Item label="Semi-Annual" value="semi_annual" />
              <Picker.Item label="Annual" value="annual" />
            </Picker>
          </View>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={20} color="#6200ee" />
          <Text style={styles.infoText}>
            Changing the plan or frequency will automatically send a notification to the member.
          </Text>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Changes</Text>
            <Text style={styles.modalText}>
              You are about to change:
              {newPlan !== member.plan && `\n• Plan: ${member.plan} → ${newPlan}`}
              {newFrequency !== member.frequency && `\n• Frequency: ${member.frequency} → ${newFrequency}`}
            </Text>
            <Text style={styles.modalSubtext}>
              The member will be notified of these changes.
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
                onPress={confirmSave}
              >
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
    padding: 16,
  },
  errorText: {
    textAlign: 'center',
    marginTop: 100,
    fontSize: 16,
    color: '#999',
  },
  memberCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  memberIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f3e5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  memberEmail: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  memberId: {
    fontSize: 12,
    color: '#999',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
    marginBottom: 8,
  },
  pickerContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  picker: {
    height: 50,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#ede7f6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#6200ee',
    lineHeight: 18,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6200ee',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 24,
  },
  saveButtonText: {
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
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  modalText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    lineHeight: 24,
  },
  modalSubtext: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 14,
    borderRadius: 8,
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
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});