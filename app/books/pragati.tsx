import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
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

export default function PragatiPlan() {
  const { colors } = useTheme();
  const { token, user } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/pragati/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSubscription(response.data.subscription);
    } catch (error) {
      console.error('Error loading subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSubscription();
    setRefreshing(false);
  };

  const handleSubscribe = async () => {
    try {
      setSubscribing(true);
      
      // In a real app, integrate with payment gateway here
      const response = await axios.post(
        `${API_URL}/api/pragati/subscribe`,
        { user_id: user?.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert('Success', 'Prajñā Plan subscribed successfully! You can now issue 2 books every 15 days.');
      loadSubscription();
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to subscribe';
      Alert.alert('Error', message);
    } finally {
      setSubscribing(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel your Pragati subscription?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: cancelSubscription,
        },
      ]
    );
  };

  const cancelSubscription = async () => {
    try {
      await axios.post(
        `${API_URL}/api/pragati/cancel`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('Cancelled', 'Your Pragati subscription has been cancelled.');
      loadSubscription();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to cancel');
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Prajñā Plan</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        {/* Plan Info Card */}
        <View style={styles.planCard}>
          <View style={styles.planIcon}>
            <Ionicons name="star" size={48} color={colors.primary} />
          </View>
          <Text style={styles.planTitle}>Prajñā Plan</Text>
          <Text style={styles.planPrice}>₹150<Text style={styles.planPeriod}>/month</Text></Text>
        </View>

        {/* Features */}
        <View style={styles.featuresCard}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Features</Text>
          
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            <Text style={styles.featureText}>2 books every 15 days</Text>
          </View>

          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            <Text style={styles.featureText}>Access to digital magazines</Text>
          </View>

          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            <Text style={styles.featureText}>Access to e-newspapers</Text>
          </View>

          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            <Text style={styles.featureText}>14-day return period</Text>
          </View>

          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            <Text style={styles.featureText}>Keep books until subscription ends</Text>
          </View>
        </View>

        {/* Subscription Status */}
        {subscription && subscription.status === 'active' ? (
          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <Ionicons name="checkmark-circle" size={32} color="#4CAF50" />
              <Text style={styles.statusTitle}>Active Subscription</Text>
            </View>

            <View style={styles.statusDetails}>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Next Cycle:</Text>
                <Text style={styles.statusValue}>
                  {new Date(subscription.next_cycle_date).toLocaleDateString()}
                </Text>
              </View>

              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Books Available:</Text>
                <Text style={[styles.statusValue, { color: colors.primary }]}>
                  {subscription.books_remaining || 0} of 2
                </Text>
              </View>

              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Active Books:</Text>
                <Text style={styles.statusValue}>
                  {subscription.active_issues_details?.length || 0}
                </Text>
              </View>
            </View>

            {subscription.active_issues_details && subscription.active_issues_details.length > 0 && (
              <View style={styles.activeBooks}>
                <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 16 }]}>Current Issues</Text>
                {subscription.active_issues_details.map((issue: any) => (
                  <View key={issue._id} style={styles.bookItem}>
                    <Ionicons name="book" size={20} color={colors.primary} />
                    <View style={styles.bookItemInfo}>
                      <Text style={styles.bookItemTitle}>{issue.book_title}</Text>
                      <Text style={styles.bookItemMeta}>
                        Due: {new Date(issue.due_date).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.cancelButtonText}>Cancel Subscription</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.subscribeButton, { backgroundColor: colors.primary }]}
            onPress={handleSubscribe}
            disabled={subscribing}
          >
            {subscribing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="star" size={20} color="#fff" />
                <Text style={styles.subscribeButtonText}>Subscribe Now - ₹150/month</Text>
              </>
            )}
          </TouchableOpacity>
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
  },
  planCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  planIcon: {
    marginBottom: 16,
  },
  planTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  planPrice: {
    fontSize: 40,
    fontWeight: '700',
    color: '#2196F3',
  },
  planPeriod: {
    fontSize: 20,
    color: '#666',
  },
  featuresCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  featureText: {
    fontSize: 15,
    color: '#333',
  },
  statusCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  statusDetails: {
    gap: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statusLabel: {
    fontSize: 15,
    color: '#666',
  },
  statusValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  activeBooks: {
    marginTop: 8,
  },
  bookItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  bookItemInfo: {
    flex: 1,
  },
  bookItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  bookItemMeta: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  cancelButton: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#f44336',
  },
  subscribeButton: {
    marginHorizontal: 16,
    marginBottom: 32,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  subscribeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
