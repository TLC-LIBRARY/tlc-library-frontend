import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import { Picker } from '@react-native-picker/picker';
import { format } from 'date-fns';
import * as ImagePicker from 'expo-image-picker';


export default function EditMember() {
  const { token } = useAuth();
  const router = useRouter();
  const { memberId } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    member_id: '',
    full_name: '',
    email: '',
    mobile: '',
    address: '',
    plan: 'Basic',
    frequency: 'monthly',
    status: 'Active',
    custom_id: '',
  });

  useEffect(() => {
    if (memberId) {
      loadMember();
    }
  }, [memberId]);

  const loadMember = async () => {
    try {
      const response = await api.get(`/api/contributions/members/${memberId}`);
      const member = response.data;
      
      setFormData({
        member_id: member.member_id,
        full_name: member.full_name,
        email: member.email,
        mobile: member.mobile,
        address: member.address,
        plan: member.plan,
        frequency: member.frequency,
        status: member.status,
        custom_id: member.custom_id || '',
      });
      
      // Load profile image if exists
      if (member.profile_image) {
        setProfileImage(member.profile_image);
      }
    } catch (error) {
      console.error('Failed to load member:', error);
      Alert.alert('Error', 'Failed to load member details');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.full_name || !formData.email || !formData.mobile) {
      Alert.alert('Error', 'Please fill required fields');
      return;
    }

    setSaving(true);
    try {
      const updateData: any = { ...formData };
      if (profileImage) {
        updateData.profile_image = profileImage;
      }
      
      await api.put(`/api/contributions/members/${memberId}`, updateData);
      
      Alert.alert(
        '✅ Success',
        'Member details updated successfully!',
        [
          {
            text: 'View All Members',
            onPress: () => router.replace('/contributions/members')
          },
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
    } catch (error: any) {
      console.error('Update error:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to update member');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    console.log('=== DELETE MEMBER INITIATED ===');
    console.log('Member ID:', memberId);
    console.log('Member Name:', formData.full_name);
    
    // Use window.confirm for web compatibility
    const confirmMessage = `Are you sure you want to permanently delete ${formData.full_name}?\n\nThis will delete:\n• Member profile\n• All payment records\n• All notifications\n• User account\n\nThis action cannot be undone.`;
    
    const confirmDelete = typeof window !== 'undefined' 
      ? window.confirm(confirmMessage)
      : await new Promise<boolean>((resolve) => {
          Alert.alert(
            'Confirm Deletion',
            confirmMessage,
            [
              { text: 'Cancel', onPress: () => {
                console.log('Delete cancelled by user');
                resolve(false);
              }, style: 'cancel' },
              { text: 'Delete Permanently', onPress: () => {
                console.log('Delete confirmed by user');
                resolve(true);
              }, style: 'destructive' }
            ]
          );
        });

    if (!confirmDelete) {
      console.log('Delete operation cancelled');
      return;
    }

    console.log('Starting delete API call...');
    setDeleting(true);
    try {
      console.log(`DELETE request to: /api/contributions/members/${memberId}`);
      const response = await api.delete(`/api/contributions/members/${memberId}`);
      console.log('Delete response:', response.data);
      
      Alert.alert(
        '✅ Member Deleted Successfully', 
        `${formData.full_name} and all associated data have been permanently deleted.\n\n• Payments deleted: ${response.data.deleted_payments || 0}\n• Notifications deleted: ${response.data.deleted_notifications || 0}`,
        [{ text: 'OK', onPress: () => router.replace('/contributions/members') }]
      );
    } catch (error: any) {
      console.error('=== DELETE ERROR ===');
      console.error('Error:', error);
      console.error('Response:', error.response?.data);
      console.error('Status:', error.response?.status);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to delete member');
    } finally {
      setDeleting(false);
    }
  };

  const pickImage = async (source: 'camera' | 'gallery') => {
    try {
      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Camera permission required');
          return;
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Gallery permission required');
          return;
        }
      }

      const result = source === 'camera'
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
          });

      if (!result.canceled && result.assets[0]) {
        setProfileImage(result.assets[0].uri);
        Alert.alert('Success', 'Profile image updated! Tap Save to confirm.');
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const showImageOptions = () => {
    if (Platform.OS === 'web') {
      const choice = window.confirm('Choose an option:\n\nOK = Choose from files\nCancel = Cancel');
      if (choice) {
        pickImage('gallery');
      }
    } else {
      Alert.alert(
        'Profile Picture',
        'Choose an option',
        [
          { text: 'Take Photo', onPress: () => pickImage('camera') },
          { text: 'Choose from Gallery', onPress: () => pickImage('gallery') },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#6200ee" style={{ marginTop: 100 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Member (Admin)</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.content}>
          {/* Profile Image Section */}
          <View style={styles.imageSection}>
            <TouchableOpacity style={styles.imageContainer} onPress={showImageOptions}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.profileImage} />
              ) : (
                <View style={styles.placeholderImage}>
                  <Ionicons name="person" size={60} color="#ccc" />
                </View>
              )}
              <View style={styles.cameraIcon}>
                <Ionicons name="camera" size={20} color="#fff" />
              </View>
            </TouchableOpacity>
            <Text style={styles.imageHint}>Tap to change member profile picture</Text>
          </View>

          <View style={styles.infoCard}>
            <Ionicons name="shield-checkmark" size={20} color="#6200ee" />
            <Text style={styles.infoText}>
              Admin can edit all member details including contribution plan. Custom Member ID is auto-generated and read-only.
            </Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.sectionTitle}>Member Identification</Text>
            
            <Text style={styles.label}>Custom Member ID</Text>
            <TextInput
              style={styles.input}
              value={formData.custom_id}
              onChangeText={(text) => setFormData({ ...formData, custom_id: text })}
              placeholder="Enter custom member ID (optional)"
              placeholderTextColor="#999"
            />

            <Text style={styles.sectionTitle}>Personal Information</Text>

            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.full_name}
              onChangeText={(text) => setFormData({ ...formData, full_name: text })}
              placeholder="Enter full name"
              placeholderTextColor="#999"
            />

            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              placeholder="Enter email address"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Mobile *</Text>
            <TextInput
              style={styles.input}
              value={formData.mobile}
              onChangeText={(text) => setFormData({ ...formData, mobile: text })}
              placeholder="Enter mobile number"
              placeholderTextColor="#999"
              keyboardType="phone-pad"
            />

            <Text style={styles.label}>Address</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.address}
              onChangeText={(text) => setFormData({ ...formData, address: text })}
              placeholder="Enter full address"
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
            />

            <Text style={styles.sectionTitle}>Contribution Plan</Text>

            <Text style={styles.label}>Plan *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.plan}
                onValueChange={(value) => setFormData({ ...formData, plan: value })}
                style={styles.picker}
              >
                <Picker.Item label="Basic - ₹600" value="Basic" />
                <Picker.Item label="Standard - ₹800" value="Standard" />
                <Picker.Item label="Premium - ₹1000" value="Premium" />
              </Picker>
            </View>

            <Text style={styles.label}>Payment Frequency *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.frequency}
                onValueChange={(value) => setFormData({ ...formData, frequency: value })}
                style={styles.picker}
              >
                <Picker.Item label="Monthly" value="monthly" />
                <Picker.Item label="Quarterly" value="quarterly" />
                <Picker.Item label="Semi-Annual" value="semi_annual" />
                <Picker.Item label="Annual" value="annual" />
              </Picker>
            </View>

            <Text style={styles.label}>Status *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
                style={styles.picker}
              >
                <Picker.Item label="Active" value="Active" />
                <Picker.Item label="Inactive" value="Inactive" />
              </Picker>
            </View>

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

            {/* Delete Member Button (Admin only) */}
            <TouchableOpacity 
              style={[styles.deleteButton, deleting && styles.buttonDisabled]}
              onPress={handleDelete}
              disabled={deleting || saving}
            >
              {deleting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="trash" size={20} color="#fff" />
                  <Text style={styles.deleteButtonText}>Delete Member Permanently</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#ede7f6',
    padding: 12,
    margin: 16,
    borderRadius: 8,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#6200ee',
    lineHeight: 18,
  },
  form: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    marginTop: 8,
  },
  helpText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
    fontStyle: 'italic',
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
  readOnlyInput: {
    backgroundColor: '#f5f5f5',
    borderColor: '#e0e0e0',
  },
  readOnlyText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
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
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6200ee',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#d32f2f',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  imageSection: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  imageContainer: {
    position: 'relative',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f0f0',
  },
  placeholderImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#6200ee',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  imageHint: {
    marginTop: 12,
    fontSize: 13,
    color: '#666',
  },
});