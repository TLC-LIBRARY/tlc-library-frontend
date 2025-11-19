import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../utils/api';
import { showErrorAlert } from '../../utils/errorHandler';
import { ListSkeleton } from '../../components/SkeletonLoader';
import { EmptyState } from '../../components/EmptyState';

interface Plan {
  id: string;
  plan_id: string;
  plan_name: string;
  plan_type: string;
  billing_cycle: string;
  price: number;
  original_price?: number;
  discount_percentage?: number;
  duration_months: number;
  features: string[];
  description: string;
  is_active: boolean;
  current_subscribers: number;
  max_subscribers?: number;
}

export default function SubscriptionPlans() {
  const { colors } = useTheme();
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);

  useEffect(() => {
    fetchPlans();
    checkActiveSubscription();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/plans/active');
      setPlans(response.data);
    } catch (error: any) {
      showErrorAlert(error, 'Failed to Load Plans');
    } finally {
      setLoading(false);
    }
  };

  const checkActiveSubscription = async () => {
    try {
      const response = await api.get('/api/subscriptions/my-subscription');
      setHasActiveSubscription(!!response.data);
    } catch (error) {
      setHasActiveSubscription(false);
    }
  };

  const handleSelectPlan = (plan: Plan) => {
    if (hasActiveSubscription) {
      Alert.alert(
        'Active Subscription',
        'You already have an active subscription. Please cancel it before subscribing to a new plan.',
        [{ text: 'OK' }]
      );
      return;
    }

    router.push({
      pathname: '/api/subscriptions/subscribe',
      params: { plan_id: plan.plan_id }
    });
  };

  const getBillingCycleBadgeColor = (cycle: string) => {
    const colors: any = {
      Monthly: '#10b981',
      Quarterly: '#3b82f6',
      'Half-Yearly': '#f59e0b',
      Yearly: '#ef4444',
    };
    return colors[cycle] || '#6b7280';
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: 16,
      paddingVertical: 20,
      backgroundColor: colors.primary,
    },
    backButton: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    backButtonText: {
      fontSize: 16,
      color: '#fff',
      marginLeft: 4,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: '#fff',
      marginBottom: 4,
    },
    headerSubtitle: {
      fontSize: 14,
      color: '#fff',
      opacity: 0.9,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    planCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    planCardPopular: {
      borderColor: colors.primary,
      borderWidth: 2,
    },
    popularBadge: {
      position: 'absolute',
      top: -10,
      right: 16,
      backgroundColor: colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
    },
    popularBadgeText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '600',
    },
    planHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    planName: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
    },
    billingCycleBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    billingCycleText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '600',
    },
    planDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 16,
    },
    priceContainer: {
      marginBottom: 16,
    },
    priceRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
    },
    currency: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
    },
    price: {
      fontSize: 32,
      fontWeight: '700',
      color: colors.text,
    },
    originalPrice: {
      fontSize: 16,
      color: colors.textSecondary,
      textDecorationLine: 'line-through',
      marginLeft: 8,
    },
    discountBadge: {
      backgroundColor: '#10b981',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
      marginLeft: 8,
    },
    discountText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '600',
    },
    featuresContainer: {
      marginBottom: 16,
    },
    featuresTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    featureText: {
      fontSize: 14,
      color: colors.textSecondary,
      marginLeft: 8,
    },
    subscribeButton: {
      backgroundColor: colors.primary,
      paddingVertical: 14,
      borderRadius: 8,
      alignItems: 'center',
    },
    subscribeButtonDisabled: {
      backgroundColor: colors.border,
    },
    subscribeButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    capacityText: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 8,
      textAlign: 'center',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32,
    },
    emptyText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 12,
    },
    warningBanner: {
      backgroundColor: '#fef3c7',
      padding: 12,
      borderRadius: 8,
      marginBottom: 16,
      flexDirection: 'row',
      alignItems: 'center',
    },
    warningText: {
      fontSize: 14,
      color: '#92400e',
      marginLeft: 8,
      flex: 1,
    },
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Subscription Plans</Text>
        </View>
        <View style={styles.content}>
          <ListSkeleton count={3} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Subscription Plans</Text>
        <Text style={styles.headerSubtitle}>Choose the plan that works for you</Text>
      </View>

      <ScrollView style={styles.content}>
        {hasActiveSubscription && (
          <View style={styles.warningBanner}>
            <Ionicons name="information-circle" size={24} color="#92400e" />
            <Text style={styles.warningText}>
              You already have an active subscription. Cancel it first to subscribe to a new plan.
            </Text>
          </View>
        )}

        {plans.length === 0 ? (
          <EmptyState
            icon="document-text-outline"
            title="No Plans Available"
            message="There are no subscription plans available at the moment. Please check back later or contact support."
            actionLabel="Refresh"
            onAction={fetchPlans}
          />
        ) : (
          plans.map((plan, index) => {
            const isPopular = plan.plan_type === 'Standard';
            const isFull = plan.max_subscribers && plan.current_subscribers >= plan.max_subscribers;

            return (
              <View
                key={plan.plan_id}
                style={[styles.planCard, isPopular && styles.planCardPopular]}
              >
                {isPopular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularBadgeText}>POPULAR</Text>
                  </View>
                )}

                <View style={styles.planHeader}>
                  <Text style={styles.planName}>{plan.plan_name}</Text>
                  <View
                    style={[
                      styles.billingCycleBadge,
                      { backgroundColor: getBillingCycleBadgeColor(plan.billing_cycle) },
                    ]}
                  >
                    <Text style={styles.billingCycleText}>{plan.billing_cycle}</Text>
                  </View>
                </View>

                <Text style={styles.planDescription}>{plan.description}</Text>

                <View style={styles.priceContainer}>
                  <View style={styles.priceRow}>
                    <Text style={styles.currency}>₹</Text>
                    <Text style={styles.price}>{plan.price}</Text>
                    {plan.original_price && (
                      <>
                        <Text style={styles.originalPrice}>₹{plan.original_price}</Text>
                        {plan.discount_percentage && (
                          <View style={styles.discountBadge}>
                            <Text style={styles.discountText}>
                              {plan.discount_percentage.toFixed(0)}% OFF
                            </Text>
                          </View>
                        )}
                      </>
                    )}
                  </View>
                </View>

                <View style={styles.featuresContainer}>
                  <Text style={styles.featuresTitle}>Features:</Text>
                  {plan.features.map((feature, idx) => (
                    <View key={idx} style={styles.featureItem}>
                      <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  style={[
                    styles.subscribeButton,
                    (hasActiveSubscription || isFull) && styles.subscribeButtonDisabled,
                  ]}
                  onPress={() => handleSelectPlan(plan)}
                  disabled={hasActiveSubscription || isFull}
                >
                  <Text style={styles.subscribeButtonText}>
                    {isFull ? 'Plan Full' : hasActiveSubscription ? 'Already Subscribed' : 'Subscribe Now'}
                  </Text>
                </TouchableOpacity>

                {plan.max_subscribers && (
                  <Text style={styles.capacityText}>
                    {plan.current_subscribers} / {plan.max_subscribers} subscribers
                  </Text>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
