import React, { useState, useEffect } from 'react';
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
import { useOverdueCheck } from '../../hooks/useOverdueCheck';
import api from '../../utils/api';

const BOX_TYPES = ['Adhyeta Box', 'Custom Box'];
const LANGUAGES = ['English', 'Hindi', 'Other'];
const CATEGORIES = ['Academic', 'Competitive', 'Fiction', 'Non-Fiction'];
const GENRES = [
  'Literature',
  'History',
  'Science',
  'Exam Prep',
  'Biographies',
  'Self-Development',
];

interface BookItem {
  book_title: string;
  author: string;
  language: string;
  category: string;
  publishing_house: string;
}

export default function BookBoxRequestForm() {
  const { token } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const { isAccessRestricted } = useOverdueCheck();

  const [boxType, setBoxType] = useState('Adhyeta Box');
  const [books, setBooks] = useState<BookItem[]>([
    { book_title: '', author: '', language: 'English', category: 'Academic', publishing_house: '' },
  ]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadSavedAddress();
  }, []);

  const loadSavedAddress = async () => {
    try {
      const response = await api.get('/api/member-connect/member/delivery-address');
      if (response.data.delivery_address) {
        setDeliveryAddress(response.data.delivery_address);
      }
    } catch (error) {
      console.error('Failed to load address:', error);
    }
  };

  const addBook = () => {
    setBooks([...books, { book_title: '', author: '', language: 'English', category: 'Academic', publishing_house: '' }]);
  };

  const removeBook = (index: number) => {
    if (books.length > 1) {
      setBooks(books.filter((_, i) => i !== index));
    }
  };

  const updateBook = (index: number, field: keyof BookItem, value: string) => {
    const newBooks = [...books];
    newBooks[index][field] = value;
    setBooks(newBooks);
  };

  const toggleGenre = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter((g) => g !== genre));
    } else {
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

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

    if (!boxType || books.length === 0 || !deliveryAddress.trim()) {
      if (Platform.OS === 'web') {
        alert('Please fill in all required fields including delivery address');
      } else {
        Alert.alert('Error', 'Please fill in all required fields including delivery address');
      }
      return;
    }

    const hasEmptyBooks = books.some((book) => !book.book_title.trim() || !book.author.trim());
    if (hasEmptyBooks) {
      if (Platform.OS === 'web') {
        alert('Please fill in all book details (title and author are required)');
      } else {
        Alert.alert('Error', 'Please fill in all book details (title and author are required)');
      }
      return;
    }

    setSubmitting(true);
    try {
      // Use the new enhanced API endpoint
      const response = await api.post('/api/requests/adhyeta-box-request', {
        box_type: boxType,
        preferred_genres: selectedGenres,
        delivery_address: deliveryAddress.trim(),
        additional_notes: additionalNotes.trim() || null,
        number_of_books: books.length,
      });

      const data = response.data;

      Alert.alert(
        'Success!',
        `${boxType} request submitted successfully!\n\nTicket Number: ${data.ticket_number}\n\nYou will receive a confirmation email.`,
        [
          {
            text: 'View My Requests',
            onPress: () => router.push('/member-connect/my-requests'),
          },
          { text: 'OK', onPress: () => router.back() },
        ]
      );

      // Reset form
      setBoxType('Adhyeta Box');
      setBooks([
        { book_title: '', author: '', language: 'English', category: 'Academic', publishing_house: '' },
      ]);
      setSelectedGenres([]);
      setAdditionalNotes('');
    } catch (error: any) {
      console.error('Failed to submit request:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to submit request';
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
      height: 100,
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
    bookCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    bookHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    bookTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    removeButton: {
      padding: 4,
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.primary,
      borderStyle: 'dashed',
      marginBottom: 16,
    },
    addButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
      marginLeft: 8,
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
    genreChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: colors.border,
      borderWidth: 1,
      borderColor: colors.border,
    },
    genreChipSelected: {
      backgroundColor: colors.success + '20',
      borderColor: colors.success,
    },
    genreChipText: {
      fontSize: 13,
      color: colors.text,
    },
    genreChipTextSelected: {
      color: colors.success,
      fontWeight: '600',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Box Request</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            📦 Request curated book boxes from TLC_LIBRARY. Fill in your preferences and we'll prepare your custom selection!
          </Text>
        </View>

        <Text style={styles.label}>Select Box Type <Text style={styles.required}>*</Text></Text>
        <View style={styles.pickerRow}>
          {BOX_TYPES.map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.pickerOption,
                boxType === type && styles.pickerOptionSelected,
              ]}
              onPress={() => setBoxType(type)}
            >
              <Text
                style={[
                  styles.pickerOptionText,
                  boxType === type && styles.pickerOptionTextSelected,
                ]}
              >
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Books <Text style={styles.required}>*</Text></Text>
        {books.map((book, index) => (
          <View key={index} style={styles.bookCard}>
            <View style={styles.bookHeader}>
              <Text style={styles.bookTitle}>Book {index + 1}</Text>
              {books.length > 1 && (
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeBook(index)}
                >
                  <Ionicons name="close-circle" size={24} color={colors.error} />
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              value={book.book_title}
              onChangeText={(value) => updateBook(index, 'book_title', value)}
              placeholder="Enter book title"
              placeholderTextColor={colors.textSecondary}
            />

            <Text style={styles.label}>Author *</Text>
            <TextInput
              style={styles.input}
              value={book.author}
              onChangeText={(value) => updateBook(index, 'author', value)}
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
                    book.language === lang && styles.pickerOptionSelected,
                  ]}
                  onPress={() => updateBook(index, 'language', lang)}
                >
                  <Text
                    style={[
                      styles.pickerOptionText,
                      book.language === lang && styles.pickerOptionTextSelected,
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
                    book.category === cat && styles.pickerOptionSelected,
                  ]}
                  onPress={() => updateBook(index, 'category', cat)}
                >
                  <Text
                    style={[
                      styles.pickerOptionText,
                      book.category === cat && styles.pickerOptionTextSelected,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Publishing House (if known)</Text>
            <TextInput
              style={styles.input}
              value={book.publishing_house}
              onChangeText={(value) => updateBook(index, 'publishing_house', value)}
              placeholder="Enter publishing house"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        ))}

        <TouchableOpacity style={styles.addButton} onPress={addBook}>
          <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
          <Text style={styles.addButtonText}>Add Another Book</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Preferred Reading Genres</Text>
        <View style={styles.pickerRow}>
          {GENRES.map((genre) => (
            <TouchableOpacity
              key={genre}
              style={[
                styles.genreChip,
                selectedGenres.includes(genre) && styles.genreChipSelected,
              ]}
              onPress={() => toggleGenre(genre)}
            >
              <Text
                style={[
                  styles.genreChipText,
                  selectedGenres.includes(genre) && styles.genreChipTextSelected,
                ]}
              >
                {genre}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Delivery Address <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={deliveryAddress}
          onChangeText={setDeliveryAddress}
          placeholder="Full Name, House/Street, Area, District, State, Pincode, Contact Number"
          placeholderTextColor={colors.textSecondary}
          multiline
        />

        <Text style={styles.label}>Additional Message / Preference Notes</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={additionalNotes}
          onChangeText={setAdditionalNotes}
          placeholder="Any special preferences or notes"
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
