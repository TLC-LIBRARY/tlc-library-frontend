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
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../utils/api';
import * as ImagePicker from 'expo-image-picker';

export default function SuggestionsForm() {
  const { token } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [attachment, setAttachment] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      uploadImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string) => {
    setUploading(true);
    try {
      // Convert to base64 for Cloudinary upload
      const response = await fetch(uri);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        
        // Upload to Cloudinary via backend
        const uploadResponse = await api.post('/api/admin/upload', {
          image: base64data,
          folder: 'suggestions',
        });
        
        setAttachment(uploadResponse.data.url);
      };
    } catch (error) {
      console.error('Upload failed:', error);
      if (Platform.OS === 'web') {
        alert('Failed to upload image');
      } else {
        Alert.alert('Error', 'Failed to upload image');
      }
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !message.trim()) {
      if (Platform.OS === 'web') {
        alert('Please fill in title and message');
      } else {
        Alert.alert('Error', 'Please fill in title and message');
      }
      return;
    }

    if (message.trim().length < 10) {
      Alert.alert('Error', 'Please provide more details (at least 10 characters)');
      return;
    }

    setSubmitting(true);
    try {
      // Use the new enhanced API endpoint
      const response = await api.post('/api/requests/suggestion', {
        title: title.trim(),
        message: message.trim(),
        is_anonymous: isAnonymous,
        attachment_url: attachment || null,
      });

      const data = response.data;

      Alert.alert(
        'Success!',
        `Your suggestion has been submitted successfully!\n\nTicket Number: ${data.ticket_number}\n\nThank you for your valuable input!`,
        [
          {
            text: 'View My Requests',
            onPress: () => router.push('/member-connect/my-requests'),
          },
          { text: 'OK', onPress: () => router.back() },
        ]
      );

      // Reset form
      setTitle('');
      setMessage('');
      setIsAnonymous(false);
      setAttachment(null);
    } catch (error: any) {
      console.error('Failed to submit:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to submit';
      Alert.alert('Error', errorMessage);
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
      height: 150,
      textAlignVertical: 'top',
    },
    switchRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.surface,
      padding: 16,
      borderRadius: 8,
      marginTop: 16,
    },
    switchLabel: {
      fontSize: 16,
      color: colors.text,
      flex: 1,
    },
    uploadButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.primary,
      borderStyle: 'dashed',
      marginTop: 16,
    },
    uploadButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
      marginLeft: 8,
    },
    attachmentPreview: {
      marginTop: 16,
      padding: 12,
      backgroundColor: colors.surface,
      borderRadius: 8,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    attachmentText: {
      fontSize: 14,
      color: colors.text,
      flex: 1,
    },
    removeAttachment: {
      padding: 4,
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
        <Text style={styles.headerTitle}>Suggestions & Feedback</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            💡 Share your ideas and feedback with TLC_LIBRARY. We value your input and will respond to your suggestions!
          </Text>
        </View>

        <Text style={styles.label}>
          Title / Subject <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Brief summary of your suggestion"
          placeholderTextColor={colors.textSecondary}
        />

        <Text style={styles.label}>
          Message / Description <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={message}
          onChangeText={setMessage}
          placeholder="Describe your suggestion or feedback in detail"
          placeholderTextColor={colors.textSecondary}
          multiline
        />

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Submit Anonymously</Text>
          <Switch
            value={isAnonymous}
            onValueChange={setIsAnonymous}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#fff"
          />
        </View>

        <Text style={styles.label}>Attachment (Optional)</Text>
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={pickImage}
          disabled={uploading}
        >
          <Ionicons name="cloud-upload-outline" size={20} color={colors.primary} />
          <Text style={styles.uploadButtonText}>
            {uploading ? 'Uploading...' : 'Upload Image (Screenshot, Photo)'}
          </Text>
        </TouchableOpacity>

        {attachment && (
          <View style={styles.attachmentPreview}>
            <Ionicons name="image" size={20} color={colors.success} />
            <Text style={styles.attachmentText}>Image attached</Text>
            <TouchableOpacity
              style={styles.removeAttachment}
              onPress={() => setAttachment(null)}
            >
              <Ionicons name="close-circle" size={24} color={colors.error} />
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Text style={styles.submitButtonText}>
            {submitting ? 'Submitting...' : 'Submit Feedback'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
