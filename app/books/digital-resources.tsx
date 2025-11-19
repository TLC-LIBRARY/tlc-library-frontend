import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function DigitalResources() {
  const { colors } = useTheme();
  const { token } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [resources, setResources] = useState<any[]>([]);
  const [hasPragati, setHasPragati] = useState(false);

  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/digital-resources`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setResources(response.data.resources || []);
      setHasPragati(true);
    } catch (error: any) {
      if (error.response?.status === 403) {
        setHasPragati(false);
      }
      console.error('Error loading resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadResources();
    setRefreshing(false);
  };

  const openResource = async (resourceId: string) => {
    try {
      const response = await axios.get(`${API_URL}/api/digital-resources/${resourceId}/access`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.access_url) {
        await Linking.openURL(response.data.access_url);
      }
    } catch (error) {
      console.error('Error accessing resource:', error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!hasPragati) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Digital Resources</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.noPragatiContainer}>
          <Ionicons name="lock-closed" size={64} color="#ccc" />
          <Text style={[styles.noPragatiTitle, { color: colors.text }]}>Prajñā Plan Required</Text>
          <Text style={styles.noPragatiText}>
            Subscribe to Prajñā Plan (₹150/month) to access digital magazines and newspapers
          </Text>
          <TouchableOpacity
            style={[styles.subscribeButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/books/pragati')}
          >
            <Text style={styles.subscribeButtonText}>Subscribe to Pragati</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Digital Resources</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        {resources.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color="#ccc" />
            <Text style={[styles.emptyText, { color: colors.text }]}>No resources available</Text>
          </View>
        ) : (
          resources.map((resource) => (
            <TouchableOpacity
              key={resource._id}
              style={styles.resourceCard}
              onPress={() => openResource(resource._id)}
            >
              <View style={styles.resourceIcon}>
                <Ionicons
                  name={resource.type === 'magazine' ? 'book' : 'newspaper'}
                  size={32}
                  color={colors.primary}
                />
              </View>
              <View style={styles.resourceInfo}>
                <Text style={[styles.resourceTitle, { color: colors.text }]}>{resource.title}</Text>
                <Text style={styles.resourceMeta}>
                  {resource.type === 'magazine' ? 'Magazine' : 'Newspaper'} • {resource.provider || 'TLC Library'}
                </Text>
                {resource.tags && resource.tags.length > 0 && (
                  <View style={styles.tags}>
                    {resource.tags.slice(0, 3).map((tag: string, idx: number) => (
                      <View key={idx} style={styles.tag}>
                        <Text style={styles.tagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  content: { flex: 1, padding: 16 },
  resourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resourceIcon: { marginRight: 16 },
  resourceInfo: { flex: 1 },
  resourceTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  resourceMeta: { fontSize: 13, color: '#666', marginBottom: 8 },
  tags: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  tag: { backgroundColor: '#e3f2fd', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  tagText: { fontSize: 11, color: '#2196F3' },
  noPragatiContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  noPragatiTitle: { fontSize: 20, fontWeight: '700', marginTop: 16, marginBottom: 8 },
  noPragatiText: { fontSize: 15, color: '#666', textAlign: 'center', marginBottom: 24 },
  subscribeButton: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  subscribeButtonText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { alignItems: 'center', paddingVertical: 64 },
  emptyText: { marginTop: 16, fontSize: 16 },
});
