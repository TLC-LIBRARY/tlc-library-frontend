import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';

export default function EditProfile() {
  const { token, user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [memberData, setMemberData] = useState<any>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    mobile: '',
    address: '',
    plan: 'Basic',
    frequency: 'monthly',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await api.get('/api/contributions/members/my-profile');
      const member = response.data;
      
      setMemberData(member);
      setProfileImage(member.profile_image || null);
      setFormData({
        full_name: member.full_name,
        email: member.email,
        mobile: member.mobile,
        address: member.address,
        plan: member.plan,
        frequency: member.frequency,
      });
      setLoading(false);
    } catch (error: any) {
      console.error('Failed to load profile:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to load profile data');
      setLoading(false);
    }
  };

  const convertImageToBase64 = async (uri: string): Promise<string> => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Failed to convert image to base64:', error);
      throw error;
    }
  };

  const pickImage = async (source: 'camera' | 'gallery') => {
    try {
      // Request permissions
      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Camera permission is required to take photos');
          return;
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Gallery permission is required to select photos');
          return;
        }
      }

      // Launch picker
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
        Alert.alert('Success', 'Profile image updated! Tap Save to confirm changes.');
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

  const handleSave = async () => {
    if (!formData.full_name || !formData.email || !formData.mobile || !formData.address) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    saveProfile();
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      // Only update personal info, not plan details
      const updateData: any = {
        full_name: formData.full_name,
        email: formData.email,
        mobile: formData.mobile,
        address: formData.address,
      };

      // Add profile image if changed
      if (profileImage) {
        // Check if it's already a base64 or http URL
        if (profileImage.startsWith('data:image') || profileImage.startsWith('http')) {
          updateData.profile_image = profileImage;
        } else {
          // Convert local URI to base64
          try {
            const base64Image = await convertImageToBase64(profileImage);
            updateData.profile_image = base64Image;
          } catch (conversionError) {
            console.error('Image conversion failed:', conversionError);
            Alert.alert('Warning', 'Failed to process image, continuing without image update');
          }
        }
      }
      
      const response = await api.put(
        `/api/contributions/members/${memberData._id || memberData.member_id}`,
        updateData
      );
      
      console.log('Profile update response:', response.data);
      
      // Show success alert with better feedback
      Alert.alert(
        '✅ Success', 
        'Your profile has been updated successfully!',
        [
          { 
            text: 'OK', 
            onPress: () => {
              // Navigate back to profile view
              if (router.canGoBack()) {
                router.back();
              } else {
                router.push('/contributions/my-profile');
              }
            }
          }
        ]
      );
    } catch (error: any) {
      console.error('Update error:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to update profile');
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

  if (!memberData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => (router.canGoBack() ? router.back() : router.push('/(tabs)'))} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="person-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No member profile found</Text>
        </View>
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
          <TouchableOpacity onPress={() => (router.canGoBack() ? router.back() : router.push('/(tabs)'))} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
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
            <Text style={styles.imageHint}>Tap to change profile picture</Text>
          </View>

          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={20} color="#1976d2" />
            <Text style={styles.infoText}>
              Update your personal information. To change your contribution plan, please contact the admin.
            </Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.sectionTitle}>Personal Information</Text>

            {/* Custom Member ID - Read Only */}
            {memberData.custom_id && (
              <View style={styles.readOnlyField}>
                <Text style={styles.readOnlyLabel}>Member ID</Text>
                <View style={styles.readOnlyValueContainer}>
                  <Ionicons name="card-outline" size={20} color="#6200ee" />
                  <Text style={styles.readOnlyValueText}>{memberData.custom_id}</Text>
                </View>
              </View>
            )}

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

            <Text style={styles.label}>Address *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.address}
              onChangeText={(text) => setFormData({ ...formData, address: text })}
              placeholder="Enter full address"
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
            />

            <Text style={styles.sectionTitle}>Contribution Plan (Read-Only)</Text>
            <Text style={styles.helpText}>Contact admin to change your contribution plan</Text>

            <View style={styles.readOnlyRow}>
              <Text style={styles.readOnlyKey}>Current Plan:</Text>
              <Text style={styles.readOnlyValue}>{formData.plan} - ₹{formData.plan === 'Basic' ? '600' : formData.plan === 'Standard' ? '800' : '1000'}</Text>
            </View>

            <View style={styles.readOnlyRow}>
              <Text style={styles.readOnlyKey}>Payment Frequency:</Text>
              <Text style={styles.readOnlyValue}>{formData.frequency.charAt(0).toUpperCase() + formData.frequency.slice(1).replace('_', ' ')}</Text>
            </View>

            <View style={styles.readOnlySection}>
              <Text style={styles.readOnlyLabel}>Read-Only Information</Text>
              
              <View style={styles.readOnlyRow}>
                <Text style={styles.readOnlyKey}>Member ID:</Text>
                <Text style={styles.readOnlyValue}>{memberData.member_id}</Text>
              </View>

              <View style={styles.readOnlyRow}>
                <Text style={styles.readOnlyKey}>Status:</Text>
                <Text style={[styles.readOnlyValue, { color: memberData.status === 'Active' ? '#00897b' : '#f44336' }]}>
                  {memberData.status}
                </Text>
              </View>

              <View style={styles.readOnlyRow}>
                <Text style={styles.readOnlyKey}>Total Paid:</Text>
                <Text style={styles.readOnlyValue}>₹{memberData.total_paid}</Text>
              </View>
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
    backgroundColor: '#e3f2fd',
    padding: 12,
    margin: 16,
    borderRadius: 8,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1976d2',
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  imageSection: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#fff',
    marginBottom: 16,
    borderRadius: 12,
  },
  imageContainer: {
    position: 'relative',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#6200ee',
  },
  placeholderImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#e0e0e0',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#6200ee',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  imageHint: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
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
  warningCard: {
    flexDirection: 'row',
    backgroundColor: '#fff3e0',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#f57c00',
    lineHeight: 18,
  },
  readOnlySection: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    marginTop: 24,
    marginBottom: 8,
  },
  readOnlyLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
  },
  readOnlyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  readOnlyKey: {
    fontSize: 14,
    color: '#666',
  },
  readOnlyValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  readOnlyField: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  readOnlyLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  readOnlyValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  readOnlyValueText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6200ee',
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
  buttonDisabled: {
    opacity: 0.6,
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