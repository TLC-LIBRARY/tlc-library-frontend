import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import { Picker } from '@react-native-picker/picker';


export default function CreateNotification() {
  const { token } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    notification_type: 'info',
    target_type: 'all', // 'all' or 'specific'
    target_members: [] as string[],
  });

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      const response = await api.get(`/api/contributions/members`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMembers(response.data);
    } catch (error) {
      console.error('Failed to load members:', error);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.message) {
      if (Platform.OS === 'web') {
        alert('Please fill in all required fields');
      }
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: formData.title,
        message: formData.message,
        notification_type: formData.notification_type,
        target_members: formData.target_type === 'all' ? [] : formData.target_members,
      };

      await api.post(`/api/notifications/`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const successMsg = formData.target_type === 'all' 
        ? 'Notification sent to all members!'
        : `Notification sent to ${formData.target_members.length} member(s)!`;

      if (Platform.OS === 'web') {
        alert(`✅ Success!\n\n${successMsg}`);
      }

      // Clear form
      setFormData({
        title: '',
        message: '',
        notification_type: 'info',
        target_type: 'all',
        target_members: [],
      });

      // Navigate back
      router.back();
    } catch (error: any) {
      console.error('Failed to send notification:', error);
      if (Platform.OS === 'web') {
        alert('Error: Failed to send notification. ' + (error.response?.data?.detail || ''));
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleMember = (memberId: string) => {
    if (formData.target_members.includes(memberId)) {
      setFormData({
        ...formData,
        target_members: formData.target_members.filter(id => id !== memberId)
      });
    } else {
      setFormData({
        ...formData,
        target_members: [...formData.target_members, memberId]
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Notification</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.form}>
          {/* Title */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notification Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 📚 New Books Added"
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
              placeholderTextColor="#999"
            />
          </View>

          {/* Message */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Message *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter your message..."
              value={formData.message}
              onChangeText={(text) => setFormData({ ...formData, message: text })}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholderTextColor="#999"
            />
          </View>

          {/* Notification Type */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notification Type</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.notification_type}
                onValueChange={(value) => setFormData({ ...formData, notification_type: value })}
                style={styles.picker}
              >
                <Picker.Item label="ℹ️ Info (Blue)" value="info" />
                <Picker.Item label="✅ Success (Green)" value="success" />
                <Picker.Item label="⚠️ Warning (Orange)" value="warning" />
                <Picker.Item label="🚨 Alert (Red)" value="alert" />
              </Picker>
            </View>
          </View>

          {/* Target Audience */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Send To</Text>
            <View style={styles.radioGroup}>
              <TouchableOpacity 
                style={styles.radioOption}
                onPress={() => setFormData({ ...formData, target_type: 'all', target_members: [] })}
              >
                <View style={[styles.radio, formData.target_type === 'all' && styles.radioSelected]}>
                  {formData.target_type === 'all' && <View style={styles.radioDot} />}
                </View>
                <Text style={styles.radioText}>All Members</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.radioOption}
                onPress={() => setFormData({ ...formData, target_type: 'specific' })}
              >
                <View style={[styles.radio, formData.target_type === 'specific' && styles.radioSelected]}>
                  {formData.target_type === 'specific' && <View style={styles.radioDot} />}
                </View>
                <Text style={styles.radioText}>Specific Members</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Member Selection */}
          {formData.target_type === 'specific' && (
            <View style={styles.memberSelection}>
              <Text style={styles.label}>Select Members ({formData.target_members.length} selected)</Text>
              {loadingMembers ? (
                <ActivityIndicator color="#6200ee" />
              ) : (
                <View style={styles.memberList}>
                  {members.map((member) => (
                    <TouchableOpacity
                      key={member.member_id}
                      style={styles.memberItem}
                      onPress={() => toggleMember(member.member_id)}
                    >
                      <View style={[
                        styles.checkbox,
                        formData.target_members.includes(member.member_id) && styles.checkboxSelected
                      ]}>
                        {formData.target_members.includes(member.member_id) && (
                          <Ionicons name="checkmark" size={16} color="#fff" />
                        )}
                      </View>
                      <View style={styles.memberInfo}>
                        <Text style={styles.memberName}>{member.full_name}</Text>
                        <Text style={styles.memberId}>{member.member_id}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity 
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="send" size={20} color="#fff" />
                <Text style={styles.submitButtonText}>Send Notification</Text>
              </>
            )}
          </TouchableOpacity>
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
  form: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
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
    height: 100,
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
  radioGroup: {
    flexDirection: 'row',
    gap: 20,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: '#6200ee',
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#6200ee',
  },
  radioText: {
    fontSize: 16,
    color: '#333',
  },
  memberSelection: {
    marginTop: 10,
  },
  memberList: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
    maxHeight: 300,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxSelected: {
    backgroundColor: '#6200ee',
    borderColor: '#6200ee',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  memberId: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6200ee',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 20,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
