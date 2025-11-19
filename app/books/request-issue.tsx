import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function RequestIssue() {
  const { colors } = useTheme();
  const { token, user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();

  const bookId = params.bookId as string;
  const bookTitle = params.title as string;

  const [loading, setLoading] = useState(false);
  const [pragatiSub, setPragatiSub] = useState<any>(null);
  const [checkingPragati, setCheckingPragati] = useState(true);

  useEffect(() => {
    checkPragatiSubscription();
  }, []);

  const checkPragatiSubscription = async () => {
    try {
      setCheckingPragati(true);
      const response = await axios.get(`${API_URL}/api/pragati/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPragatiSub(response.data.subscription);
    } catch (error) {
      console.log('No Pragati subscription');
    } finally {
      setCheckingPragati(false);
    }
  };

  const handleRequest = async (plan: string) => {
    try {
      setLoading(true);

      const requestData: any = {
        user_id: user?.id,
        plan: plan,
      };

      const response = await axios.post(
        `${API_URL}/api/books/${bookId}/request-issue`,
        requestData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert(
        'Success',
        `Book issued successfully!\n\nDue Date: ${new Date(response.data.due_date).toLocaleDateString()}`,
        [
          {
            text: 'View My Issues',
            onPress: () => router.push('/books/my-issues'),
          },
          { text: 'OK' },
        ]
      );

      router.back();
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to issue book';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  if (checkingPragati) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Request Issue</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.bookInfoCard}>
          <Ionicons name="book" size={48} color={colors.primary} />
          <Text style={[styles.bookTitleText, { color: colors.text }]}>{bookTitle}</Text>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Select Issue Plan</Text>

        {/* Prajñā Plan Option */}
        {pragatiSub && pragatiSub.status === 'active' ? (
          <TouchableOpacity
            style={[styles.planCard, { borderColor: colors.primary }]}
            onPress={() => handleRequest('pragati')}
            disabled={loading}
          >
            <View style={styles.planHeader}>
              <Ionicons name="star" size={24} color={colors.primary} />
              <Text style={[styles.planTitle, { color: colors.text }]}>Prajñā Plan</Text>
            </View>
            <Text style={styles.planDescription}>
              Use your Pragati subscription • {pragatiSub.books_remaining || 0} books remaining this cycle
            </Text>
            <View style={styles.planBadge}>
              <Text style={styles.planBadgeText}>Included in subscription</Text>
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.noPragatiCard}>
            <Ionicons name="information-circle" size={24} color="#666" />
            <Text style={styles.noPragatiText}>
              Subscribe to Prajñā Plan (₹150/month) to get 2 books every 15 days
            </Text>
            <TouchableOpacity
              style={[styles.subscribeButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/books/pragati')}
            >
              <Text style={styles.subscribeButtonText}>Subscribe Now</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Ad-hoc Request */}
        <TouchableOpacity
          style={styles.planCard}
          onPress={() => handleRequest('ad-hoc')}
          disabled={loading}
        >
          <View style={styles.planHeader}>
            <Ionicons name="book-outline" size={24} color="#666" />
            <Text style={[styles.planTitle, { color: colors.text }]}>One-time Issue</Text>
          </View>
          <Text style={styles.planDescription}>
            Request this book without subscription • 14 days return period
          </Text>
        </TouchableOpacity>

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.text }]}>Processing request...</Text>
          </View>
        )}
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
  content: {
    flex: 1,
    padding: 16,
  },
  bookInfoCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  bookTitleText: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  planCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#f0f0f0',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  planTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  planDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  planBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  planBadgeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  noPragatiCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  noPragatiText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  subscribeButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  subscribeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
  },
});
