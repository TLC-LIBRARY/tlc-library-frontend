import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Image, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useOverdueCheck } from '../../hooks/useOverdueCheck';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import api from '../../utils/api';

const PURPOSES = [
  { id: 1, label: 'Academic Assistance', value: 'Academic Assistance', icon: 'school' },
  { id: 2, label: 'Study Material & Resources', value: 'Study Material & Resources', icon: 'book' },
  { id: 3, label: 'Competitive Exam Preparation', value: 'Competitive Exam Preparation', icon: 'trophy' },
  { id: 4, label: 'Research & Project Work', value: 'Research & Project Work', icon: 'flask' },
  { id: 5, label: 'Digital & Technological Access', value: 'Digital & Technological Access', icon: 'laptop' },
  { id: 6, label: 'Special Welfare / Emergency Aid', value: 'Special Welfare / Emergency Aid', icon: 'medical' },
  { id: 7, label: 'Skill Enhancement & Vocational Training', value: 'Skill Enhancement & Vocational Training', icon: 'build' },
  { id: 8, label: 'Merit-Based Incentive', value: 'Merit-Based Incentive', icon: 'star' },
  { id: 9, label: 'Social & Community Development Education', value: 'Social & Community Development Education', icon: 'people' },
];

interface DocumentFile {
  uri: string;
  name: string;
  type: 'image' | 'pdf';
  base64?: string;
}

export default function EducationalSupportApplication() {
  const { token } = useAuth();
  const router = useRouter();
  const { colors } = useTheme();
  const { isAccessRestricted, loading: overdueLoading } = useOverdueCheck();
  
  const [purpose, setPurpose] = useState('Academic Assistance');
  const [amount, setAmount] = useState('');
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [declarationAccepted, setDeclarationAccepted] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<DocumentFile | null>(null);

  // Check for overdue restrictions
  useEffect(() => {
    if (!overdueLoading && isAccessRestricted()) {
      Alert.alert(
        'Access Restricted',
        'You have overdue payments. Please clear your dues to apply for educational support.',
        [
          {
            text: 'View Overdues',
            onPress: () => router.push('/member-connect/overdue-summary')
          },
          {
            text: 'Go Back',
            onPress: () => router.back(),
            style: 'cancel'
          }
        ]
      );
    }
  }, [overdueLoading, isAccessRestricted]);

  const convertToBase64 = async (uri: string): Promise<string> => {
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
      console.error('Failed to convert to base64:', error);
      throw error;
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.7,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        const fileSizeInMB = (asset.fileSize || 0) / (1024 * 1024);
        if (fileSizeInMB > 5) {
          Alert.alert('File Too Large', 'Please select an image smaller than 5MB');
          return;
        }

        setUploading(true);
        const base64 = await convertToBase64(asset.uri);
        
        const newDoc: DocumentFile = {
          uri: asset.uri,
          name: `Image_${documents.length + 1}.jpg`,
          type: 'image',
          base64: base64
        };
        
        setDocuments([...documents, newDoc]);
        setUploading(false);
        Alert.alert('Success', `Image attached successfully (${fileSizeInMB.toFixed(2)}MB)`);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
      setUploading(false);
    }
  };

  const pickPDF = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        const fileSizeInMB = (asset.size || 0) / (1024 * 1024);
        if (fileSizeInMB > 5) {
          Alert.alert('File Too Large', 'Please select a PDF smaller than 5MB');
          return;
        }

        setUploading(true);
        const base64 = await convertToBase64(asset.uri);
        
        const newDoc: DocumentFile = {
          uri: asset.uri,
          name: asset.name,
          type: 'pdf',
          base64: base64
        };
        
        setDocuments([...documents, newDoc]);
        setUploading(false);
        Alert.alert('Success', `PDF attached successfully (${fileSizeInMB.toFixed(2)}MB)`);
      }
    } catch (error) {
      console.error('PDF picker error:', error);
      Alert.alert('Error', 'Failed to select PDF. Please try again.');
      setUploading(false);
    }
  };

  const showDocumentOptions = () => {
    Alert.alert(
      'Upload Document',
      'Choose document type to upload',
      [
        {
          text: 'Image (JPG/PNG)',
          onPress: pickImage
        },
        {
          text: 'PDF Document',
          onPress: pickPDF
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };

  const removeDocument = (index: number) => {
    setDocuments(documents.filter((_, i) => i !== index));
  };

  const previewDoc = (doc: DocumentFile) => {
    if (doc.type === 'image') {
      setPreviewDocument(doc);
      setPreviewVisible(true);
    } else {
      Alert.alert('PDF Document', `${doc.name}\n\nPDF preview not available in app. Document will be submitted.`);
    }
  };

  const handleSubmit = async () => {
    console.log('Submit button clicked');
    
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

    // Validation
    if (!amount || parseFloat(amount) < 5000 || parseFloat(amount) > 100000) {
      Alert.alert('Validation Error', 'Amount must be between ₹5,000 and ₹1,00,000');
      return;
    }

    if (documents.length === 0) {
      Alert.alert('Validation Error', 'Please upload at least one supporting document');
      return;
    }

    if (!declarationAccepted) {
      Alert.alert('Validation Error', 'Please accept the declaration to proceed');
      return;
    }

    // Show confirmation dialog before submitting
    Alert.alert(
      'Confirm Submission',
      `Are you sure you want to submit this application?\n\nPurpose: ${purpose}\nAmount: ₹${parseFloat(amount).toLocaleString()}\nDocuments: ${documents.length}`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Submit',
          onPress: async () => {
            setSubmitting(true);
            try {
              const base64Docs = documents.map(doc => doc.base64 || '');
              
              console.log('Submitting application...');
              const response = await api.post('/api/educational-support/apply', {
                purpose,
                requested_amount: parseFloat(amount),
                supporting_docs: base64Docs,
                declaration_accepted: declarationAccepted,
              });

              console.log('Application submitted successfully:', response.data);

              // Show enhanced success confirmation
              Alert.alert(
                '✅ Application Submitted Successfully!',
                'Your Educational Support Application has been submitted successfully. You will be notified once reviewed by the admin.',
                [
                  {
                    text: 'View My Applications',
                    onPress: () => router.replace('/member-connect/educational-support-applications'),
                  },
                  {
                    text: 'OK',
                    onPress: () => router.back(),
                    style: 'cancel',
                  },
                ],
                { cancelable: false }
              );
            } catch (error: any) {
              console.error('Submit error:', error);
              console.error('Error response:', error.response?.data);
              Alert.alert('Error', error.response?.data?.detail || 'Failed to submit application. Please try again.');
            } finally {
              setSubmitting(false);
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Educational Support</Text>
        <TouchableOpacity onPress={() => router.push('/member-connect/educational-support-applications')}>
          <Ionicons name="list" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Info Card */}
        <View style={[styles.infoCard, { backgroundColor: `${colors.primary}15` }]}>
          <Ionicons name="information-circle" size={24} color={colors.primary} />
          <View style={styles.infoTextContainer}>
            <Text style={[styles.infoTitle, { color: colors.text }]}>
              Educational Support Advance Policy
            </Text>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Interest-free financial support (₹5,000-₹1,00,000) for educational or skill development. Service fee: ₹550 at disbursement.
            </Text>
          </View>
        </View>

        {/* Eligibility */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Eligibility</Text>
          <View style={styles.checkItem}>
            <Ionicons name="checkmark-circle" size={20} color="#4caf50" />
            <Text style={[styles.checkText, { color: colors.text }]}>
              Registered member in good standing
            </Text>
          </View>
          <View style={styles.checkItem}>
            <Ionicons name="checkmark-circle" size={20} color="#4caf50" />
            <Text style={[styles.checkText, { color: colors.text }]}>
              No pending contributions
            </Text>
          </View>
          <View style={styles.checkItem}>
            <Ionicons name="checkmark-circle" size={20} color="#4caf50" />
            <Text style={[styles.checkText, { color: colors.text }]}>
              No existing active advance
            </Text>
          </View>
        </View>

        {/* Application Form */}
        <View style={[styles.formCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.formTitle, { color: colors.text }]}>Application Form</Text>

          {/* Purpose Section */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>
              Purpose of Educational Support <Text style={{ color: '#d32f2f' }}>*</Text>
            </Text>
            <Text style={[styles.helpText, { color: colors.textSecondary, marginBottom: 12 }]}>
              Select the purpose(s) for which educational support is being requested.
            </Text>
            <View style={[styles.pickerContainer, { backgroundColor: colors.background }]}>
              <Ionicons
                name={PURPOSES.find(p => p.value === purpose)?.icon as any}
                size={20}
                color={colors.primary}
                style={{ marginRight: 8 }}
              />
              <Picker
                selectedValue={purpose}
                onValueChange={setPurpose}
                style={[styles.picker, { color: colors.text }]}
              >
                {PURPOSES.map((p) => (
                  <Picker.Item key={p.id} label={p.label} value={p.value} />
                ))}
              </Picker>
            </View>
          </View>

          {/* Amount */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>
              Requested Amount <Text style={{ color: '#d32f2f' }}>*</Text>
            </Text>
            <View style={[styles.amountInput, { backgroundColor: colors.background }]}>
              <Text style={[styles.currencySymbol, { color: colors.text }]}>₹</Text>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="5000 - 100000"
                placeholderTextColor={colors.textSecondary}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
              />
            </View>
            <Text style={[styles.helpText, { color: colors.textSecondary }]}>
              Amount must be between ₹5,000 and ₹1,00,000
            </Text>
          </View>

          {/* Supporting Documents */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>
              Supporting Documents <Text style={{ color: '#d32f2f' }}>*</Text>
            </Text>
            <Text style={[styles.helpText, { color: colors.textSecondary }]}>
              Upload images (JPG/PNG) or PDF documents. Max 5MB per file.
            </Text>

            {documents.map((doc, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.documentItem, { backgroundColor: colors.background }]}
                onPress={() => previewDoc(doc)}
              >
                <Ionicons 
                  name={doc.type === 'pdf' ? 'document-text' : 'image'} 
                  size={20} 
                  color={colors.primary} 
                />
                <Text style={[styles.documentText, { color: colors.text }]} numberOfLines={1}>
                  {doc.name}
                </Text>
                <TouchableOpacity onPress={() => removeDocument(index)}>
                  <Ionicons name="close-circle" size={24} color="#d32f2f" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[styles.uploadButton, { borderColor: colors.border }]}
              onPress={showDocumentOptions}
              disabled={uploading || documents.length >= 5}
            >
              {uploading ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <>
                  <Ionicons name="cloud-upload" size={24} color={colors.primary} />
                  <Text style={[styles.uploadButtonText, { color: colors.primary }]}>
                    Upload Document ({documents.length}/5)
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Declaration */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>
              Purpose Declaration
            </Text>
            <View style={[styles.declarationBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.declarationFullText, { color: colors.text }]}>
                I hereby declare that the educational support requested will be utilized solely for the purpose(s) mentioned above. I understand that any misuse of the funds or resources may result in cancellation of support and/or recovery of the assistance provided. I also agree to provide proof of utilization if required by the organization.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.declarationRow}
              onPress={() => setDeclarationAccepted(!declarationAccepted)}
            >
              <Ionicons
                name={declarationAccepted ? 'checkbox' : 'square-outline'}
                size={24}
                color={declarationAccepted ? colors.primary : colors.textSecondary}
              />
              <Text style={[styles.declarationCheckboxText, { color: colors.text }]}>
                I Agree and Accept the Declaration <Text style={{ color: '#d32f2f' }}>*</Text>
              </Text>
            </TouchableOpacity>
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
                <Ionicons name="paper-plane" size={20} color="#fff" />
                <Text style={styles.submitButtonText}>Submit Application</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Key Points */}
        <View style={[styles.keyPoints, { backgroundColor: colors.surface }]}>
          <Text style={[styles.keyPointsTitle, { color: colors.text }]}>Important Information</Text>
          <Text style={[styles.keyPoint, { color: colors.textSecondary }]}>
            • Advances are interest-free
          </Text>
          <Text style={[styles.keyPoint, { color: colors.textSecondary }]}>
            • One-time service fee: ₹550
          </Text>
          <Text style={[styles.keyPoint, { color: colors.textSecondary }]}>
            • Repayment in fixed monthly installments
          </Text>
          <Text style={[styles.keyPoint, { color: colors.textSecondary }]}>
            • Only one active advance allowed
          </Text>
        </View>
      </ScrollView>

      {/* Image Preview Modal */}
      <Modal visible={previewVisible} transparent animationType="fade">
        <View style={styles.previewOverlay}>
          <View style={styles.previewContainer}>
            <TouchableOpacity 
              style={styles.closePreview}
              onPress={() => setPreviewVisible(false)}
            >
              <Ionicons name="close" size={32} color="#fff" />
            </TouchableOpacity>
            {previewDocument && (
              <Image
                source={{ uri: previewDocument.uri }}
                style={styles.previewImage}
                resizeMode="contain"
              />
            )}
          </View>
        </View>
      </Modal>
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
  section: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  checkText: {
    fontSize: 14,
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
  amountInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 12,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
  },
  helpText: {
    fontSize: 13,
    marginTop: 4,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
  },
  documentText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    gap: 8,
  },
  uploadButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  declarationBox: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  declarationFullText: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'justify',
  },
  declarationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  declarationCheckboxText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
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
  keyPoints: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  keyPointsTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  keyPoint: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 4,
  },
  previewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewContainer: {
    width: '90%',
    height: '80%',
    position: 'relative',
  },
  closePreview: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
});