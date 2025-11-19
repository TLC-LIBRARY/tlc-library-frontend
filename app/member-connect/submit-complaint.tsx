import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../utils/api';

const CATEGORIES = ['Library', 'App', 'Payment', 'Facility', 'Other'];
const PRIORITIES = ['Low', 'Medium', 'High'];

export default function SubmitComplaintForm() {
  const { colors } = useTheme();
  const router = useRouter();

  const [category, setCategory] = useState('Library');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [submitting, setSubmitting] = useState(false);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: 16,
      paddingVertical: 20,
      backgroundColor: '#d32f2f',
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: '#fff',
      marginBottom: 4,
    },
    headerSubtitle: {
      fontSize: 14,
      color: '#fff',
      opacity: 0.9,
    },
    backButton: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    backButtonText: {
      fontSize: 16,
      color: '#fff',
      marginLeft: 4,
    },
    content: {
      padding: 16,
    },
    infoBox: {
      backgroundColor: '#d32f2f15',
      borderLeftWidth: 4,
      borderLeftColor: '#d32f2f',
      padding: 12,
      borderRadius: 8,
      marginBottom: 24,
    },
    infoText: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 20,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    required: {
      color: '#d32f2f',
    },
    input: {
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 16,
    },
    textArea: {
      height: 120,
      textAlignVertical: 'top',
    },
    pickerContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 16,
    },
    pickerButton: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    pickerButtonActive: {
      backgroundColor: '#d32f2f',
      borderColor: '#d32f2f',
    },
    pickerButtonText: {
      fontSize: 14,
      color: colors.text,
    },
    pickerButtonTextActive: {
      color: '#fff',
      fontWeight: '600',
    },
    priorityContainer: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 24,
    },
    priorityButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: colors.border,
      alignItems: 'center',
    },
    priorityButtonActive: {
      borderColor: '#d32f2f',
      backgroundColor: '#d32f2f15',
    },
    priorityText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    priorityTextActive: {
      color: '#d32f2f',
    },
    submitButton: {
      backgroundColor: '#d32f2f',
      paddingVertical: 14,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 24,
    },
    submitButtonDisabled: {
      opacity: 0.5,
    },
    submitButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
  });

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert('Error', 'Please describe your complaint');
      return;
    }

    if (description.trim().length < 10) {
      Alert.alert('Error', 'Please provide more details (at least 10 characters)');
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post('/api/requests/complaint', {
        category,
        description: description.trim(),
        priority,
      });

      const data = response.data;

      Alert.alert(
        'Complaint Registered',
        `Your complaint has been registered successfully!\n\nTicket Number: ${data.ticket_number}\n\nWe will review and respond within 48 hours.`,
        [
          {
            text: 'View My Requests',
            onPress: () => router.push('/member-connect/my-requests'),
          },
          { text: 'OK', onPress: () => router.back() },
        ]
      );

      setDescription('');
      setCategory('Library');
      setPriority('Medium');
    } catch (error: any) {
      console.error('Failed to submit complaint:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to submit complaint';
      Alert.alert('Error', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Submit Complaint</Text>
        <Text style={styles.headerSubtitle}>We're here to help resolve issues</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              ⚠️ We take all complaints seriously. Your issue will be reviewed and addressed within
              48 hours.
            </Text>
          </View>

          <Text style={styles.label}>
            Category <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.pickerContainer}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.pickerButton,
                  category === cat && styles.pickerButtonActive,
                ]}
                onPress={() => setCategory(cat)}
              >
                <Text
                  style={[
                    styles.pickerButtonText,
                    category === cat && styles.pickerButtonTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>
            Description <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Please describe the issue in detail..."
            placeholderTextColor={colors.textSecondary}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={6}
          />

          <Text style={styles.label}>
            Priority <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.priorityContainer}>
            {PRIORITIES.map((p) => (
              <TouchableOpacity
                key={p}
                style={[
                  styles.priorityButton,
                  priority === p && styles.priorityButtonActive,
                ]}
                onPress={() => setPriority(p)}
              >
                <Text
                  style={[
                    styles.priorityText,
                    priority === p && styles.priorityTextActive,
                  ]}
                >
                  {p}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              (submitting || !description.trim()) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={submitting || !description.trim()}
          >
            <Text style={styles.submitButtonText}>
              {submitting ? 'Submitting...' : 'Submit Complaint'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
