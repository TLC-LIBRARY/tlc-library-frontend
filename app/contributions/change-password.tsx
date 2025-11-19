import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '../../utils/api';

export default function ChangePassword() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const calculatePasswordStrength = (password: string): number => {
    let strength = 0;
    if (password.length >= 8) strength += 20;
    if (password.length >= 12) strength += 10;
    if (/[a-z]/.test(password)) strength += 20;
    if (/[A-Z]/.test(password)) strength += 20;
    if (/[0-9]/.test(password)) strength += 15;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 15;
    return Math.min(strength, 100);
  };

  const getPasswordStrengthLabel = (strength: number): string => {
    if (strength < 30) return 'Weak';
    if (strength < 60) return 'Fair';
    if (strength < 80) return 'Good';
    return 'Strong';
  };

  const getPasswordStrengthColor = (strength: number): string => {
    if (strength < 30) return '#f44336';
    if (strength < 60) return '#ff9800';
    if (strength < 80) return '#2196f3';
    return '#4caf50';
  };

  const validatePassword = (): boolean => {
    if (!formData.oldPassword) {
      Alert.alert('Error', 'Please enter your current password');
      return false;
    }

    if (!formData.newPassword) {
      Alert.alert('Error', 'Please enter a new password');
      return false;
    }

    if (formData.newPassword.length < 8) {
      Alert.alert('Error', 'New password must be at least 8 characters long');
      return false;
    }

    if (formData.newPassword === formData.oldPassword) {
      Alert.alert('Error', 'New password must be different from current password');
      return false;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      Alert.alert('Error', 'New password and confirmation do not match');
      return false;
    }

    return true;
  };

  const handleChangePassword = async () => {
    if (!validatePassword()) return;

    setLoading(true);
    try {
      await api.put('/api/auth/change-password', {
        old_password: formData.oldPassword,
        new_password: formData.newPassword,
      });

      Alert.alert(
        '✅ Success',
        'Your password has been changed successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );

      // Clear form
      setFormData({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      console.error('Password change error:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to change password';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = calculatePasswordStrength(formData.newPassword);
  const strengthLabel = getPasswordStrengthLabel(passwordStrength);
  const strengthColor = getPasswordStrengthColor(passwordStrength);

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
          <Text style={styles.headerTitle}>Change Password</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.infoCard}>
            <Ionicons name="shield-checkmark" size={24} color="#1976d2" />
            <Text style={styles.infoText}>
              Keep your account secure by using a strong password. Make sure it's at least 8 characters long.
            </Text>
          </View>

          <View style={styles.form}>
            {/* Current Password */}
            <Text style={styles.label}>Current Password *</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordInput}
                value={formData.oldPassword}
                onChangeText={(text) => setFormData({ ...formData, oldPassword: text })}
                placeholder="Enter current password"
                placeholderTextColor="#999"
                secureTextEntry={!showOldPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowOldPassword(!showOldPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showOldPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>

            {/* New Password */}
            <Text style={styles.label}>New Password *</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordInput}
                value={formData.newPassword}
                onChangeText={(text) => setFormData({ ...formData, newPassword: text })}
                placeholder="Enter new password"
                placeholderTextColor="#999"
                secureTextEntry={!showNewPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowNewPassword(!showNewPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showNewPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>

            {/* Password Strength Indicator */}
            {formData.newPassword.length > 0 && (
              <View style={styles.strengthContainer}>
                <View style={styles.strengthBar}>
                  <View
                    style={[
                      styles.strengthBarFill,
                      { width: `${passwordStrength}%`, backgroundColor: strengthColor },
                    ]}
                  />
                </View>
                <Text style={[styles.strengthLabel, { color: strengthColor }]}>
                  Password Strength: {strengthLabel}
                </Text>
              </View>
            )}

            {/* Confirm New Password */}
            <Text style={styles.label}>Confirm New Password *</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordInput}
                value={formData.confirmPassword}
                onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
                placeholder="Re-enter new password"
                placeholderTextColor="#999"
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>

            {/* Password match indicator */}
            {formData.confirmPassword.length > 0 && (
              <View style={styles.matchIndicator}>
                {formData.newPassword === formData.confirmPassword ? (
                  <View style={styles.matchSuccess}>
                    <Ionicons name="checkmark-circle" size={18} color="#4caf50" />
                    <Text style={styles.matchSuccessText}>Passwords match</Text>
                  </View>
                ) : (
                  <View style={styles.matchError}>
                    <Ionicons name="close-circle" size={18} color="#f44336" />
                    <Text style={styles.matchErrorText}>Passwords do not match</Text>
                  </View>
                )}
              </View>
            )}

            {/* Password Requirements */}
            <View style={styles.requirementsCard}>
              <Text style={styles.requirementsTitle}>Password Requirements:</Text>
              <View style={styles.requirementItem}>
                <Ionicons
                  name={formData.newPassword.length >= 8 ? 'checkmark-circle' : 'ellipse-outline'}
                  size={18}
                  color={formData.newPassword.length >= 8 ? '#4caf50' : '#999'}
                />
                <Text style={styles.requirementText}>At least 8 characters</Text>
              </View>
              <View style={styles.requirementItem}>
                <Ionicons
                  name={/[A-Z]/.test(formData.newPassword) ? 'checkmark-circle' : 'ellipse-outline'}
                  size={18}
                  color={/[A-Z]/.test(formData.newPassword) ? '#4caf50' : '#999'}
                />
                <Text style={styles.requirementText}>At least one uppercase letter</Text>
              </View>
              <View style={styles.requirementItem}>
                <Ionicons
                  name={/[0-9]/.test(formData.newPassword) ? 'checkmark-circle' : 'ellipse-outline'}
                  size={18}
                  color={/[0-9]/.test(formData.newPassword) ? '#4caf50' : '#999'}
                />
                <Text style={styles.requirementText}>At least one number</Text>
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.buttonDisabled]}
              onPress={handleChangePassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="shield-checkmark" size={20} color="#fff" />
                  <Text style={styles.submitButtonText}>Update Password</Text>
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
    padding: 16,
    margin: 16,
    borderRadius: 12,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1976d2',
    lineHeight: 20,
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
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  eyeIcon: {
    padding: 12,
  },
  strengthContainer: {
    marginTop: 12,
  },
  strengthBar: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  strengthBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  matchIndicator: {
    marginTop: 8,
  },
  matchSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  matchSuccessText: {
    fontSize: 13,
    color: '#4caf50',
    fontWeight: '500',
  },
  matchError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  matchErrorText: {
    fontSize: 13,
    color: '#f44336',
    fontWeight: '500',
  },
  requirementsCard: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  requirementText: {
    fontSize: 14,
    color: '#666',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6200ee',
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
});
