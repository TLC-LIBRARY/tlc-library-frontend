import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface Bookmark {
  _id: string;
  content_type: string;
  content_id: string;
  page_number: number;
  created_at: string;
  title?: string;
}

export default function BookmarksScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

  useEffect(() => {
    loadBookmarks();
  }, []);

  const loadBookmarks = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/content/bookmarks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookmarks(response.data.bookmarks || []);
    } catch (error) {
      console.log('Error loading bookmarks:', error);
      Alert.alert('Error', 'Failed to load bookmarks');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBookmark = async (bookmarkId: string) => {
    Alert.alert(
      'Delete Bookmark',
      'Are you sure you want to remove this bookmark?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${API_URL}/api/content/bookmarks/${bookmarkId}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              setBookmarks(prev => prev.filter(b => b._id !== bookmarkId));
              Alert.alert('Success', 'Bookmark removed');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete bookmark');
            }
          }
        }
      ]
    );
  };

  const handleOpenBookmark = (bookmark: Bookmark) => {
    if (bookmark.content_type === 'book') {
      router.push({
        pathname: '/(tabs)/book-reader',
        params: { bookId: bookmark.content_id, title: bookmark.title || 'Book' }
      });
    }
  };

  const renderBookmark = ({ item }: { item: Bookmark }) => (
    <TouchableOpacity 
      style={styles.bookmarkCard}
      onPress={() => handleOpenBookmark(item)}
    >
      <View style={styles.bookmarkHeader}>
        <Ionicons 
          name={item.content_type === 'book' ? 'book' : item.content_type === 'magazine' ? 'newspaper' : 'document'} 
          size={24} 
          color="#6200ee" 
        />
        <View style={styles.bookmarkInfo}>
          <Text style={styles.bookmarkTitle}>{item.title || 'Untitled'}</Text>
          <Text style={styles.bookmarkSubtitle}>
            {item.content_type.charAt(0).toUpperCase() + item.content_type.slice(1)} • Page {item.page_number}
          </Text>
          <Text style={styles.bookmarkDate}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
      </View>
      <TouchableOpacity 
        style={styles.deleteButton}
        onPress={() => handleDeleteBookmark(item._id)}
      >
        <Ionicons name="trash-outline" size={20} color="#f44336" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Bookmarks</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6200ee" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Bookmarks</Text>
        <View style={{ width: 24 }} />
      </View>

      {bookmarks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="bookmark-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No bookmarks yet</Text>
          <Text style={styles.emptySubtext}>Bookmarks will appear here when you save them</Text>
        </View>
      ) : (
        <FlatList
          data={bookmarks}
          renderItem={renderBookmark}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
  },
  bookmarkCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bookmarkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  bookmarkInfo: {
    flex: 1,
  },
  bookmarkTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  bookmarkSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  bookmarkDate: {
    fontSize: 12,
    color: '#999',
  },
  deleteButton: {
    padding: 8,
  },
});
