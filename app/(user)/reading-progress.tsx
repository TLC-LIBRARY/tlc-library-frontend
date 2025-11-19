import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface ReadingProgress {
  _id: string;
  content_type: string;
  content_id: string;
  current_page: number;
  total_pages: number;
  last_read: string;
  title?: string;
  author?: string;
}

export default function ReadingProgressScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [progressList, setProgressList] = useState<ReadingProgress[]>([]);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/content/progress`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProgressList(response.data.progress || []);
    } catch (error) {
      console.log('Error loading progress:', error);
      Alert.alert('Error', 'Failed to load reading progress');
    } finally {
      setLoading(false);
    }
  };

  const handleContinueReading = (progress: ReadingProgress) => {
    if (progress.content_type === 'book') {
      router.push({
        pathname: '/(tabs)/book-reader',
        params: { bookId: progress.content_id, title: progress.title || 'Book' }
      });
    }
  };

  const getProgressPercentage = (current: number, total: number) => {
    return Math.round((current / total) * 100);
  };

  const renderProgress = ({ item }: { item: ReadingProgress }) => {
    const percentage = getProgressPercentage(item.current_page, item.total_pages);
    
    return (
      <TouchableOpacity 
        style={styles.progressCard}
        onPress={() => handleContinueReading(item)}
      >
        <View style={styles.progressIcon}>
          <Ionicons 
            name={item.content_type === 'book' ? 'book' : item.content_type === 'magazine' ? 'newspaper' : 'document'} 
            size={32} 
            color="#6200ee" 
          />
        </View>
        <View style={styles.progressInfo}>
          <Text style={styles.progressTitle}>{item.title || 'Untitled'}</Text>
          {item.author && (
            <Text style={styles.progressAuthor}>{item.author}</Text>
          )}
          
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${percentage}%` }]} />
            </View>
            <Text style={styles.progressPercentage}>{percentage}%</Text>
          </View>
          
          <View style={styles.progressMeta}>
            <Text style={styles.progressPages}>
              Page {item.current_page} of {item.total_pages}
            </Text>
            <Text style={styles.progressDate}>
              {new Date(item.last_read).toLocaleDateString()}
            </Text>
          </View>
        </View>
        <Ionicons name="play-circle" size={28} color="#6200ee" />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Reading Progress</Text>
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
        <Text style={styles.headerTitle}>Reading Progress</Text>
        <View style={{ width: 24 }} />
      </View>

      {progressList.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="time-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No reading progress yet</Text>
          <Text style={styles.emptySubtext}>Start reading to track your progress</Text>
        </View>
      ) : (
        <>
          <View style={styles.statsCard}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{progressList.length}</Text>
              <Text style={styles.statLabel}>Books in Progress</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>
                {Math.round(progressList.reduce((acc, p) => acc + getProgressPercentage(p.current_page, p.total_pages), 0) / progressList.length)}%
              </Text>
              <Text style={styles.statLabel}>Average Progress</Text>
            </View>
          </View>
          
          <FlatList
            data={progressList}
            renderItem={renderProgress}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContent}
          />
        </>
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
  statsCard: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    padding: 20,
    margin: 16,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#6200ee',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  divider: {
    width: 1,
    backgroundColor: '#eee',
    marginHorizontal: 16,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  progressCard: {
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
  progressIcon: {
    width: 60,
    height: 60,
    backgroundColor: '#f0e6ff',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressInfo: {
    flex: 1,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  progressAuthor: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6200ee',
    borderRadius: 3,
  },
  progressPercentage: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6200ee',
    width: 35,
  },
  progressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressPages: {
    fontSize: 12,
    color: '#666',
  },
  progressDate: {
    fontSize: 12,
    color: '#999',
  },
});
