import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useOverdueCheck } from '../../hooks/useOverdueCheck';
import api from '../../utils/api';

const LANGUAGES = ['English', 'Hindi', 'Other'];
const CATEGORIES = ['Academic', 'Fiction', 'Non-Fiction', 'Competitive', 'Reference', 'Journal'];

export default function BookRequestForm() {
  const { token } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const { isAccessRestricted } = useOverdueCheck();

  const [bookTitle, setBookTitle] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [language, setLanguage] = useState('English');
  const [category, setCategory] = useState('Academic');
  const [publishingHouse, setPublishingHouse] = useState('');
  const [purpose, setPurpose] = useState('');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    // Check for overdue restrictions
    if (isAccessRestricted()) {
      Alert.alert(
        'Access Restricted',
        'Access restricted due to pending payment. Please clear your dues to continue.',
        [
          {
            text: 'View Overdues',
            onPress: () => router.push('/member-connect/overdue-summary')
          },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
      return;
    }

    if (!bookTitle.trim()) {
      Alert.alert('Error', 'Please enter a book title');
      return;
    }

    setSubmitting(true);
    try {
      // Use the new enhanced API endpoint
      const response = await api.post('/api/requests/book-request', {
        book_title: bookTitle.trim(),
        author_name: authorName.trim() || null,
        language: language || 'English',
        category: category || null,
        publishing_house: publishingHouse.trim() || null,
        purpose: purpose.trim() || null,
        remarks: remarks.trim() || null,
      });

      const data = response.data;
      
      // Show success with book existence warning if applicable
      if (data.book_exists) {
        Alert.alert(
          'Request Submitted',
          `Your book request has been submitted (Ticket #${data.ticket_number}).\n\nNote: This book already exists in our library catalogue.`,
          [
            {
              text: 'View My Requests',
              onPress: () => router.push('/member-connect/my-requests')
            },
            { text: 'OK' }
          ]
        );
      } else {
        Alert.alert(
          'Success!',
          `Book request submitted successfully!\n\nTicket Number: ${data.ticket_number}`,
          [
            {
              text: 'View My Requests',
              onPress: () => router.push('/member-connect/my-requests')
            },
            { text: 'OK', onPress: () => router.back() }
          ]
        );
      }

      // Reset form
      setBookTitle('');
      setAuthorName('');
      setLanguage('English');
      setCategory('Academic');
      setPublishingHouse('');
      setPurpose('');
      setRemarks('');
      
    } catch (error: any) {
      console.error('Failed to submit request:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to submit request';
      if (Platform.OS === 'web') {
        alert(`Error: ${errorMessage}`);
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      padding: 4,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },
    headerRight: {
      width: 32,
    },
    content: {
      padding: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
      marginTop: 16,
    },
    required: {
      color: colors.error,
    },
    input: {
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
    },
    textArea: {
      height: 100,
      textAlignVertical: 'top',
    },
    pickerContainer: {
      backgroundColor: colors.surface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    pickerRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    pickerOption: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.border,
      borderWidth: 1,
      borderColor: colors.border,
    },
    pickerOptionSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    pickerOptionText: {
      fontSize: 14,
      color: colors.text,
    },
    pickerOptionTextSelected: {
      color: '#fff',
      fontWeight: '600',
    },
    submitButton: {
      backgroundColor: colors.primary,
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 24,
      marginBottom: 32,
    },
    submitButtonDisabled: {
      opacity: 0.5,
    },
    submitButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#fff',
    },
    infoBox: {
      backgroundColor: colors.border,
      padding: 12,
      borderRadius: 8,
      marginBottom: 16,
    },
    infoText: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Request</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            📚 Request books not currently available in TLC_LIBRARY. We'll review your request and notify you once available.
          </Text>
        </View>

        <Text style={styles.label}>
          Book Title <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={styles.input}
          value={bookTitle}
          onChangeText={setBookTitle}
          placeholder="Enter book title"
          placeholderTextColor={colors.textSecondary}
        />

        <Text style={styles.label}>
          Author Name <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={styles.input}
          value={authorName}
          onChangeText={setAuthorName}
          placeholder="Enter author name"
          placeholderTextColor={colors.textSecondary}
        />

        <Text style={styles.label}>Language</Text>
        <View style={styles.pickerRow}>
          {LANGUAGES.map((lang) => (
            <TouchableOpacity
              key={lang}
              style={[
                styles.pickerOption,
                language === lang && styles.pickerOptionSelected,
              ]}
              onPress={() => setLanguage(lang)}
            >
              <Text
                style={[
                  styles.pickerOptionText,
                  language === lang && styles.pickerOptionTextSelected,
                ]}
              >
                {lang}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Category</Text>
        <View style={styles.pickerRow}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.pickerOption,
                category === cat && styles.pickerOptionSelected,
              ]}
              onPress={() => setCategory(cat)}
            >
              <Text
                style={[
                  styles.pickerOptionText,
                  category === cat && styles.pickerOptionTextSelected,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Publishing House / Edition (if known)</Text>
        <TextInput
          style={styles.input}
          value={publishingHouse}
          onChangeText={setPublishingHouse}
          placeholder="Enter publishing house or edition"
          placeholderTextColor={colors.textSecondary}
        />

        <Text style={styles.label}>
          Purpose of Request <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={purpose}
          onChangeText={setPurpose}
          placeholder="Why do you need this book?"
          placeholderTextColor={colors.textSecondary}
          multiline
        />

        <Text style={styles.label}>Optional Note / Remarks</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={remarks}
          onChangeText={setRemarks}
          placeholder="Any additional information"
          placeholderTextColor={colors.textSecondary}
          multiline
        />

        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Text style={styles.submitButtonText}>
            {submitting ? 'Submitting...' : 'Submit Request'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
