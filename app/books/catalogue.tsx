import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function BookCatalogue() {
  const { colors } = useTheme();
  const { token, user } = useAuth();
  const router = useRouter();

  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Academic', 'Fiction', 'Non-Fiction', 'Reference', 'Science', 'History'];

  useEffect(() => {
    loadBooks();
  }, [selectedCategory]);

  const loadBooks = async () => {
    try {
      setLoading(true);
      const params: any = { limit: 50 };
      if (searchQuery) params.q = searchQuery;
      if (selectedCategory !== 'All') params.category = selectedCategory;

      const response = await axios.get(`${API_URL}/api/books`, { params });
      setBooks(response.data.books || []);
    } catch (error) {
      console.error('Error loading books:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBooks();
    setRefreshing(false);
  };

  const handleSearch = () => {
    loadBooks();
  };

  const requestIssue = (book: any) => {
    router.push(`/books/request-issue?bookId=${book._id}&title=${encodeURIComponent(book.title)}`);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Catalogue</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search books..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            placeholderTextColor="#999"
          />
          <TouchableOpacity onPress={handleSearch}>
            <Ionicons name="send" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Category Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContainer}
      >
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.categoryChip,
              selectedCategory === cat && { backgroundColor: colors.primary },
            ]}
            onPress={() => setSelectedCategory(cat)}
          >
            <Text
              style={[
                styles.categoryText,
                selectedCategory === cat && styles.categoryTextActive,
              ]}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Books Grid */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading books...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        >
          <View style={styles.grid}>
            {books.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="book-outline" size={64} color="#ccc" />
                <Text style={[styles.emptyText, { color: colors.text }]}>No books found</Text>
              </View>
            ) : (
              books.map((book) => (
                <View key={book._id} style={styles.bookCard}>
                  <Image
                    source={{ uri: book.cover_url || 'https://via.placeholder.com/120x180?text=No+Cover' }}
                    style={styles.bookCover}
                  />
                  <View style={styles.bookInfo}>
                    <Text style={[styles.bookTitle, { color: colors.text }]} numberOfLines={2}>
                      {book.title}
                    </Text>
                    <Text style={styles.bookAuthors} numberOfLines={1}>
                      {book.authors?.join(', ') || 'Unknown'}
                    </Text>
                    <View style={styles.bookMeta}>
                      <View style={styles.availabilityBadge}>
                        <Ionicons
                          name={book.available_copies > 0 ? 'checkmark-circle' : 'close-circle'}
                          size={16}
                          color={book.available_copies > 0 ? '#4CAF50' : '#f44336'}
                        />
                        <Text style={styles.availabilityText}>
                          {book.available_copies > 0 ? `${book.available_copies} available` : 'Not available'}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.requestButton,
                        { backgroundColor: book.available_copies > 0 ? colors.primary : '#ccc' },
                      ]}
                      onPress={() => requestIssue(book)}
                      disabled={book.available_copies <= 0}
                    >
                      <Text style={styles.requestButtonText}>Request Issue</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}
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
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
  categoryScroll: {
    backgroundColor: '#fff',
  },
  categoryContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  categoryTextActive: {
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  grid: {
    padding: 16,
  },
  bookCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bookCover: {
    width: 80,
    height: 120,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  bookInfo: {
    flex: 1,
    marginLeft: 12,
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  bookAuthors: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  bookMeta: {
    marginBottom: 8,
  },
  availabilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  availabilityText: {
    fontSize: 12,
    color: '#666',
  },
  requestButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  requestButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
  },
});
