import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface Download {
  _id: string;
  content_type: string;
  content_id: string;
  downloaded_at: string;
  title?: string;
  author?: string;
}

export default function DownloadsScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [downloads, setDownloads] = useState<Download[]>([]);

  useEffect(() => {
    loadDownloads();
  }, []);

  const loadDownloads = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/content/downloads`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDownloads(response.data.downloads || []);
    } catch (error) {
      console.log('Error loading downloads:', error);
      Alert.alert('Error', 'Failed to load downloads');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenContent = (download: Download) => {
    if (download.content_type === 'book') {
      router.push({
        pathname: '/(tabs)/book-reader',
        params: { bookId: download.content_id, title: download.title || 'Book' }
      });
    }
  };

  const renderDownload = ({ item }: { item: Download }) => (
    <TouchableOpacity 
      style={styles.downloadCard}
      onPress={() => handleOpenContent(item)}
    >
      <View style={styles.downloadIcon}>
        <Ionicons 
          name={item.content_type === 'book' ? 'book' : item.content_type === 'magazine' ? 'newspaper' : 'document'} 
          size={32} 
          color="#6200ee" 
        />
      </View>
      <View style={styles.downloadInfo}>
        <Text style={styles.downloadTitle}>{item.title || 'Untitled'}</Text>
        {item.author && (
          <Text style={styles.downloadAuthor}>{item.author}</Text>
        )}
        <View style={styles.downloadMeta}>
          <Ionicons name="download-outline" size={14} color="#999" />
          <Text style={styles.downloadDate}>
            Downloaded {new Date(item.downloaded_at).toLocaleDateString()}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Downloaded Content</Text>
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
        <Text style={styles.headerTitle}>Downloaded Content</Text>
        <View style={{ width: 24 }} />
      </View>

      {downloads.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cloud-download-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No downloads yet</Text>
          <Text style={styles.emptySubtext}>Downloaded content for offline reading will appear here</Text>
        </View>
      ) : (
        <FlatList
          data={downloads}
          renderItem={renderDownload}
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
  downloadCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  downloadIcon: {
    width: 60,
    height: 60,
    backgroundColor: '#f0e6ff',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  downloadInfo: {
    flex: 1,
  },
  downloadTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  downloadAuthor: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  downloadMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  downloadDate: {
    fontSize: 12,
    color: '#999',
  },
});
