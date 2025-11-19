import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

const CATEGORIES = [
  { label: 'General Query', value: 'General Query', icon: 'help-circle', color: '#757575' },
  { label: 'Contribution/Payment Issue', value: 'Contribution/Payment Issue', icon: 'card', color: '#ff9800' },
  { label: 'Educational Support', value: 'Educational Support', icon: 'school', color: '#00897b' },
  { label: 'Welfare Assistance', value: 'Welfare Assistance', icon: 'heart', color: '#e91e63' },
  { label: 'Technical Help', value: 'Technical Help', icon: 'settings', color: '#2196f3' },
];

export default function HelpSupportForm() {
  const { token, user } = useAuth();
  const router = useRouter();
  const { colors } = useTheme();
  
  const [category, setCategory] = useState('General Query');
  const [message, setMessage] = useState('');
  const [attachment, setAttachment] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        setUploading(true);
        
        // Upload to Cloudinary
        try {
          const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
          
          // For now, store base64 directly. In production, upload to Cloudinary
          setAttachment(base64Image);
          
          Alert.alert('Success', 'File attached successfully');
        } catch (error) {
          console.error('Upload error:', error);
          Alert.alert('Error', 'Failed to attach file');
        } finally {
          setUploading(false);
        }
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to select file');
    }
  };

  const handleSubmit = async () => {
    if (!message.trim()) {
      Alert.alert('Validation Error', 'Please enter your message');
      return;
    }

    if (message.trim().length < 10) {
      Alert.alert('Validation Error', 'Message must be at least 10 characters');
      return;
    }

    setSubmitting(true);

    try {
      await axios.post(
        `${API_URL}/api/help-support/submit`,
        {
          subject: category,
          message_text: message.trim(),
          file_upload: attachment,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert(
        'Message Sent!',
        'Your message has been successfully sent to the Admin. You will be notified once a response is received.',
        [
          {
            text: 'View My Messages',
            onPress: () => router.replace('/member-connect/my-messages'),
          },
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );

      // Reset form
      setCategory('General Query');
      setMessage('');
      setAttachment(null);
    } catch (error: any) {
      console.error('Submit error:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to send message');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCategory = CATEGORIES.find(c => c.value === category);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Help & Support</Text>
        <TouchableOpacity onPress={() => router.push('/member-connect/my-messages')}>
          <Ionicons name="chatbubbles" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Info Card */}
        <View style={[styles.infoCard, { backgroundColor: `${colors.primary}15` }]}>
          <Ionicons name="information-circle" size={24} color={colors.primary} />
          <View style={styles.infoTextContainer}>
            <Text style={[styles.infoTitle, { color: colors.text }]}>
              Still Need Help?
            </Text>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Can't find your answer in FAQs? Submit your query and our support team will get back to you within 24-48 hours.
            </Text>
          </View>
        </View>

        {/* FAQ Link */}
        <TouchableOpacity
          style={[styles.faqLink, { backgroundColor: colors.surface }]}
          onPress={() => router.push('/member-connect/faqs')}
        >
          <Ionicons name="help-circle" size={20} color={colors.primary} />
          <Text style={[styles.faqLinkText, { color: colors.primary }]}>
            Browse FAQs first
          </Text>
          <Ionicons name="chevron-forward" size={20} color={colors.primary} />
        </TouchableOpacity>

        {/* Form */}
        <View style={[styles.formCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.formTitle, { color: colors.text }]}>Submit Your Query</Text>

          {/* Category Selection */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>
              Category <Text style={{ color: '#d32f2f' }}>*</Text>
            </Text>
            <View style={[styles.pickerContainer, { backgroundColor: colors.background }]}>
              <Ionicons
                name={selectedCategory?.icon as any}
                size={20}
                color={selectedCategory?.color}
                style={{ marginRight: 8 }}
              />
              <Picker
                selectedValue={category}
                onValueChange={setCategory}
                style={[styles.picker, { color: colors.text }]}
              >
                {CATEGORIES.map((cat) => (
                  <Picker.Item key={cat.value} label={cat.label} value={cat.value} />
                ))}
              </Picker>
            </View>
          </View>

          {/* Message */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>
              Your Message <Text style={{ color: '#d32f2f' }}>*</Text>
            </Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: colors.background, color: colors.text }]}
              placeholder="Describe your query in detail..."
              placeholderTextColor={colors.textSecondary}
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
            />
            <Text style={[styles.charCount, { color: colors.textSecondary }]}>
              {message.length} characters (minimum 10)
            </Text>
          </View>

          {/* File Attachment */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>
              Attachment (Optional)
            </Text>
            <Text style={[styles.helpText, { color: colors.textSecondary }]}>
              Attach screenshots or documents to help us understand your issue better
            </Text>

            {attachment ? (
              <View style={[styles.attachmentPreview, { backgroundColor: colors.background }]}>
                <Ionicons name="document-attach" size={24} color={colors.primary} />
                <Text style={[styles.attachmentText, { color: colors.text }]}>
                  File attached
                </Text>
                <TouchableOpacity onPress={() => setAttachment(null)}>
                  <Ionicons name="close-circle" size={24} color="#d32f2f" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.attachButton, { borderColor: colors.border }]}
                onPress={pickImage}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator color={colors.primary} />
                ) : (
                  <>
                    <Ionicons name="cloud-upload" size={24} color={colors.primary} />
                    <Text style={[styles.attachButtonText, { color: colors.primary }]}>
                      Choose File
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: colors.primary },
              (submitting || uploading) && styles.buttonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={submitting || uploading}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="send" size={20} color="#fff" />
                <Text style={styles.submitButtonText}>Submit Query</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Contact Info */}
        <View style={[styles.contactCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.contactTitle, { color: colors.text }]}>
            Need Urgent Help?
          </Text>
          <Text style={[styles.contactText, { color: colors.textSecondary }]}>
            For urgent matters, you can also reach us at:
          </Text>
          <View style={styles.contactItem}>
            <Ionicons name="mail" size={18} color={colors.primary} />
            <Text style={[styles.contactValue, { color: colors.text }]}>
              info@thelearningcornerlibrary.com
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  infoCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  faqLink: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  faqLinkText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  formCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  picker: {
    flex: 1,
    height: 50,
  },
  textArea: {
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    minHeight: 120,
  },
  charCount: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'right',
  },
  helpText: {
    fontSize: 13,
    marginBottom: 8,
  },
  attachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    gap: 8,
  },
  attachButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  attachmentPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  attachmentText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    gap: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  contactCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  contactText: {
    fontSize: 14,
    marginBottom: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  contactValue: {
    fontSize: 14,
    fontWeight: '600',
  },
});
