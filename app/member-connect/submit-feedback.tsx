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
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../utils/api';

export default function SubmitFeedbackForm() {
  const { colors } = useTheme();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState(0);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: 16,
      paddingVertical: 20,
      backgroundColor: '#ff9800',
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
    ratingContainer: {
      marginBottom: 24,
    },
    ratingStars: {
      flexDirection: 'row',
      gap: 8,
    },
    starButton: {
      padding: 4,
    },
    anonymousContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.surface,
      padding: 16,
      borderRadius: 8,
      marginBottom: 24,
    },
    anonymousLabel: {
      fontSize: 16,
      color: colors.text,
      flex: 1,
    },
    anonymousSubtext: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    submitButton: {
      backgroundColor: '#ff9800',
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
    if (!title.trim() || !message.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (message.trim().length < 10) {
      Alert.alert('Error', 'Please provide more details (at least 10 characters)');
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post('/api/requests/feedback', {
        title: title.trim(),
        message: message.trim(),
        rating: rating > 0 ? rating : null,
        is_anonymous: isAnonymous,
      });

      const data = response.data;

      Alert.alert(
        'Thank You!',
        `Your feedback has been submitted successfully!\n\nTicket Number: ${data.ticket_number}\n\nWe appreciate your input!`,
        [
          {
            text: 'View My Requests',
            onPress: () => router.push('/member-connect/my-requests'),
          },
          { text: 'OK', onPress: () => router.back() },
        ]
      );

      setTitle('');
      setMessage('');
      setRating(0);
      setIsAnonymous(false);
    } catch (error: any) {
      console.error('Failed to submit feedback:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to submit feedback';
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
        <Text style={styles.headerTitle}>Submit Feedback</Text>
        <Text style={styles.headerSubtitle}>Your feedback helps us improve</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.label}>
            Title <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Brief title for your feedback"
            placeholderTextColor={colors.textSecondary}
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.label}>
            Your Feedback <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Share your experience, suggestions, or thoughts..."
            placeholderTextColor={colors.textSecondary}
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={6}
          />

          <View style={styles.ratingContainer}>
            <Text style={styles.label}>Rate Your Experience (Optional)</Text>
            <View style={styles.ratingStars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  style={styles.starButton}
                  onPress={() => setRating(star)}
                >
                  <Ionicons
                    name={rating >= star ? 'star' : 'star-outline'}
                    size={32}
                    color="#ff9800"
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.anonymousContainer}>
            <View style={{ flex: 1 }}>
              <Text style={styles.anonymousLabel}>Submit Anonymously</Text>
              <Text style={styles.anonymousSubtext}>
                Your identity won't be shared with anyone
              </Text>
            </View>
            <Switch
              value={isAnonymous}
              onValueChange={setIsAnonymous}
              trackColor={{ false: colors.border, true: '#ff9800' }}
              thumbColor="#fff"
            />
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              (submitting || !title.trim() || !message.trim()) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={submitting || !title.trim() || !message.trim()}
          >
            <Text style={styles.submitButtonText}>
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
