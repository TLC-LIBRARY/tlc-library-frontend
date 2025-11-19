import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { format } from 'date-fns';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function AdminPanel() {
  const { token, user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [recentMembers, setRecentMembers] = useState<any[]>([]);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [overdueMembers, setOverdueMembers] = useState<any[]>([]);

  useEffect(() => {
    // Check if user is admin
    if (user?.role !== 'admin') {
      Alert.alert('Access Denied', 'You do not have admin permissions');
      router.back();
      return;
    }
    loadDashboardData();
  }, []);

  const loadBooks = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/admin/books`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBooks(response.data.books || []);
    } catch (error) {
      console.error('Failed to load books:', error);
    } finally {
      setLoading(false);
    }
  };

  const pickPDF = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true
      });
      
      if (!result.canceled && result.assets[0]) {
        setPdfFile(result.assets[0]);
        Alert.alert('Success', 'PDF selected: ' + result.assets[0].name);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick PDF');
    }
  };

  const pickCover = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [2, 3],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        // Validate it's an image file
        if (asset.uri) {
          const uri = asset.uri.toLowerCase();
          if (!uri.endsWith('.jpg') && !uri.endsWith('.jpeg') && !uri.endsWith('.png') && !uri.endsWith('.webp')) {
            Alert.alert('Invalid File', 'Please select an image file (JPG, PNG, or WEBP). PDF files are not allowed for cover images.');
            return;
          }
        }
        
        setCoverImage(asset);
        Alert.alert('Success', 'Cover image selected');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleUpload = async () => {
    if (!title || !author || !description || !category || !pages || !pdfFile) {
      Alert.alert('Error', 'Please fill all required fields and select a PDF');
      return;
    }

    // Check file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB in bytes
    if (pdfFile.size && pdfFile.size > maxSize) {
      Alert.alert('File Too Large', 'PDF file must be less than 50MB. Please compress your PDF and try again.');
      return;
    }

    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append('title', title);
      formData.append('author', author);
      formData.append('description', description);
      formData.append('category', category);
      formData.append('pages', pages);
      formData.append('publisher', publisher || '');
      
      // Add PDF file
      formData.append('pdf_file', {
        uri: pdfFile.uri,
        type: 'application/pdf',
        name: pdfFile.name
      } as any);

      // Add cover image if selected
      if (coverImage) {
        // Detect image type from URI or use jpeg as default
        let imageType = 'image/jpeg';
        const uri = coverImage.uri.toLowerCase();
        if (uri.endsWith('.png')) {
          imageType = 'image/png';
        } else if (uri.endsWith('.jpg') || uri.endsWith('.jpeg')) {
          imageType = 'image/jpeg';
        } else if (uri.endsWith('.webp')) {
          imageType = 'image/webp';
        }
        
        formData.append('cover_image', {
          uri: coverImage.uri,
          type: imageType,
          name: coverImage.fileName || `cover.${imageType.split('/')[1]}`
        } as any);
      }

      const response = await axios.post(
        `${API_URL}/api/admin/books/upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          },
          timeout: 300000, // 5 minutes timeout for large files
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
            console.log(`Upload Progress: ${percentCompleted}%`);
          }
        }
      );

      Alert.alert('Success!', 'Book uploaded successfully', [
        {
          text: 'OK',
          onPress: () => {
            // Reset form
            setTitle('');
            setAuthor('');
            setDescription('');
            setPages('');
            setPublisher('');
            setPdfFile(null);
            setCoverImage(null);
            
            // Reload books
            loadBooks();
          }
        }
      ]);
    } catch (error: any) {
      console.error('Upload error:', error);
      let errorMessage = 'Please try again';
      
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Upload timeout. File might be too large. Try compressing the PDF.';
      } else if (error.response?.status === 413) {
        errorMessage = 'File too large for server. Maximum size is 50MB.';
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }
      
      Alert.alert('Upload Failed', errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (bookId: string) => {
    Alert.alert(
      'Delete Book',
      'Are you sure you want to delete this book?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${API_URL}/api/admin/books/${bookId}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              Alert.alert('Success', 'Book deleted');
              loadBooks();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete book');
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Admin Panel</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Upload Form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upload New Book</Text>

          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Book Title *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter book title"
                value={title}
                onChangeText={setTitle}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Author *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter author name"
                value={author}
                onChangeText={setAuthor}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter book description"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Category *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., School Textbooks"
                value={category}
                onChangeText={setCategory}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Pages *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="250"
                  value={pages}
                  onChangeText={setPages}
                  keyboardType="number-pad"
                />
              </View>

              <View style={{ width: 12 }} />

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Publisher</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Optional"
                  value={publisher}
                  onChangeText={setPublisher}
                />
              </View>
            </View>

            {/* File Pickers */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>PDF File *</Text>
              <TouchableOpacity style={styles.filePicker} onPress={pickPDF}>
                <Ionicons name="document" size={24} color="#6200ee" />
                <Text style={styles.filePickerText}>
                  {pdfFile ? pdfFile.name : 'Select PDF File'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Cover Image</Text>
              <TouchableOpacity style={styles.filePicker} onPress={pickCover}>
                <Ionicons name="image" size={24} color="#6200ee" />
                <Text style={styles.filePickerText}>
                  {coverImage ? 'Cover Selected' : 'Select Cover Image'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Upload Button */}
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={handleUpload}
              disabled={uploading}
            >
              <LinearGradient
                colors={['#6200ee', '#7c4dff']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientButton}
              >
                {uploading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="cloud-upload" size={20} color="#fff" />
                    <Text style={styles.uploadButtonText}>Upload Book</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Books List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Uploaded Books ({books.length})</Text>

          {loading ? (
            <ActivityIndicator size="large" color="#6200ee" style={{ marginTop: 20 }} />
          ) : (
            books.map((book: any) => (
              <View key={book._id} style={styles.bookCard}>
                <View style={styles.bookInfo}>
                  <Text style={styles.bookTitle}>{book.title}</Text>
                  <Text style={styles.bookAuthor}>{book.author}</Text>
                  <Text style={styles.bookCategory}>{book.category}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleDelete(book._id)}
                  style={styles.deleteButton}
                >
                  <Ionicons name="trash" size={20} color="#f44336" />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1a1a1a',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  filePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 16,
    borderWidth: 2,
    borderColor: '#6200ee',
    borderStyle: 'dashed',
    gap: 12,
  },
  filePickerText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  uploadButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  bookCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  bookInfo: {
    flex: 1,
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  bookCategory: {
    fontSize: 12,
    color: '#6200ee',
    fontWeight: '500',
  },
  deleteButton: {
    padding: 8,
  },
});
