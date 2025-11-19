import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import { Picker } from '@react-native-picker/picker';


export default function RegisterMember() {
  const { token } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    mobile: '',
    address: '',
    plan: 'Basic',
    frequency: 'monthly',
    custom_id: '',
  });

  const handleRegister = async () => {
    console.log('=== REGISTER FORM SUBMISSION ===');
    console.log('Form data:', formData);
    
    if (!formData.full_name || !formData.email || !formData.mobile || !formData.address) {
      console.log('❌ Validation failed: Missing required fields');
      Alert.alert('Error', 'Please fill all required fields (Name, Email, Mobile, Address)');
      return;
    }

    if (!formData.email.includes('@')) {
      console.log('❌ Validation failed: Invalid email');
      Alert.alert('Error', 'Please enter a valid email');
      return;
    }

    console.log('✅ Validation passed, submitting...');
    setLoading(true);
    try {
      console.log('Calling API:', '/api/contributions/members/register');
      const response = await api.post('/api/contributions/members/register', formData);
      console.log('✅ Registration response:', response.data);
      
      // Save data before clearing
      const registeredName = formData.full_name;
      const registeredEmail = formData.email;
      const password = response.data.generated_password;
      const memberId = response.data.member_id;
      const customId = response.data.custom_id;
      
      // Clear form data
      setFormData({
        full_name: '',
        email: '',
        mobile: '',
        address: '',
        plan: 'Basic',
        frequency: 'monthly',
        custom_id: '',
      });
      
      Alert.alert(
        '✅ Member Registered Successfully!',
        `Name: ${registeredName}\nEmail: ${registeredEmail}\nMember ID: ${customId}\n\n🔑 LOGIN CREDENTIALS:\n━━━━━━━━━━━━━━━━━━━━\nEmail: ${registeredEmail}\nPassword: ${password}\n━━━━━━━━━━━━━━━━━━━━\n\n⚠️ IMPORTANT: Please share these credentials with the member immediately. They will need this to login.`,
        [
          {
            text: 'Copy Password',
            onPress: () => {
              Alert.alert('Password', `Email: ${registeredEmail}\nPassword: ${password}`);
            }
          },
          {
            text: 'Register Another',
            style: 'default',
          },
          {
            text: 'View All Members',
            onPress: () => router.push('/contributions/members')
          }
        ]
      );
    } catch (error: any) {
      console.error('Registration error:', error);
      console.error('Error details:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to register member';
      Alert.alert(
        '❌ Registration Failed', 
        errorMessage + '\n\nPlease check all fields and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

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
          <Text style={styles.headerTitle}>Register New Member</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.form}>
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
              placeholder="email@example.com"
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

            <Text style={styles.sectionTitle}>Custom Member ID</Text>
            <Text style={styles.helpText}>Format: TLCL-BALLIA-2024-Basic-001</Text>

            <Text style={styles.label}>Custom Member ID</Text>
            <TextInput
              style={styles.input}
              value={formData.custom_id}
              onChangeText={(text) => setFormData({ ...formData, custom_id: text })}
              placeholder="e.g., TLCL-BALLIA-2024-Basic-001"
              placeholderTextColor="#999"
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

            <TouchableOpacity 
              style={[styles.registerButton, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="person-add" size={20} color="#fff" />
                  <Text style={styles.registerButtonText}>Register Member</Text>
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
  registerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6200ee',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});