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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

const CATEGORIES = ['Library', 'App', 'Payment', 'Facility', 'Other'];
const PRIORITIES = ['Low', 'Medium', 'High'];

export default function ComplaintsForm() {
  const { token } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();

  const [category, setCategory] = useState('Library');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
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
      const response = await fetch(uri);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        
        const uploadResponse = await axios.post(
          `${API_URL}/api/admin/upload`,
          { image: base64data, folder: 'complaints' },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
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
    if (!description.trim()) {
      if (Platform.OS === 'web') {
        alert('Please describe the issue');
      } else {
        Alert.alert('Error', 'Please describe the issue');
      }
      return;
    }

    setSubmitting(true);
    try {
      const response = await axios.post(
        `${API_URL}/api/member-connect/complaints`,
        {
          category,
          description,
          priority,
          attachment_url: attachment,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const ticketNumber = response.data.ticket_number;

      if (Platform.OS === 'web') {
        alert(`Complaint registered! Your ticket number is ${ticketNumber}. You will receive an email acknowledgment.`);
      } else {
        Alert.alert(
          'Success',
          `Complaint registered! Your ticket number is ${ticketNumber}. You will receive an email acknowledgment.`
        );
      }

      router.back();
    } catch (error: any) {
      console.error('Failed to submit:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to submit';
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
      height: 150,
      textAlignVertical: 'top',
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
    priorityLow: {
      backgroundColor: colors.success + '20',
      borderColor: colors.success,
    },
    priorityMedium: {
      backgroundColor: '#ff9800' + '20',
      borderColor: '#ff9800',
    },
    priorityHigh: {
      backgroundColor: colors.error + '20',
      borderColor: colors.error,
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

  const getPriorityStyle = (p: string) => {
    if (p === 'Low') return styles.priorityLow;
    if (p === 'High') return styles.priorityHigh;
    return styles.priorityMedium;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Complaints / Issues</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            🚨 Report any issues with TLC_LIBRARY services. You'll receive a unique ticket number and email acknowledgment.
          </Text>
        </View>

        <Text style={styles.label}>Category <Text style={styles.required}>*</Text></Text>
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

        <Text style={styles.label}>
          Description / Details <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Describe the issue in detail"
          placeholderTextColor={colors.textSecondary}
          multiline
        />

        <Text style={styles.label}>Priority</Text>
        <View style={styles.pickerRow}>
          {PRIORITIES.map((p) => (
            <TouchableOpacity
              key={p}
              style={[
                styles.pickerOption,
                priority === p && getPriorityStyle(p),
              ]}
              onPress={() => setPriority(p)}
            >
              <Text
                style={[
                  styles.pickerOptionText,
                  priority === p && styles.pickerOptionTextSelected,
                ]}
              >
                {p}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Attachment (Optional)</Text>
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={pickImage}
          disabled={uploading}
        >
          <Ionicons name="camera-outline" size={20} color={colors.primary} />
          <Text style={styles.uploadButtonText}>
            {uploading ? 'Uploading...' : 'Upload Proof / Screenshot'}
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
            {submitting ? 'Submitting...' : 'Submit Complaint'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
