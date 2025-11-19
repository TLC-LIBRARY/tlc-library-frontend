import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../contexts/ThemeContext';
import api from '../../../utils/api';
import { showErrorAlert } from '../../../utils/errorHandler';
import { ListSkeleton } from '../../../components/SkeletonLoader';
import { EmptyState } from '../../../components/EmptyState';
import ErrorBoundary from '../../../components/ErrorBoundary';

interface Subscription {
  id: string;
  subscription_id: string;
  member_name: string;
  member_email: string;
  plan_name: string;
  plan_type: string;
  billing_cycle: string;
  status: string;
  subscription_start_date: string;
  subscription_end_date: string;
  days_remaining?: number;
  price_paid: number;
  auto_renew: boolean;
}

function AllSubscriptions() {
  const { colors } = useTheme();
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [filteredSubscriptions, setFilteredSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);
  const [showActionsModal, setShowActionsModal] = useState(false);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  useEffect(() => {
    filterSubscriptions();
  }, [subscriptions, searchQuery, statusFilter]);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/subscriptions/admin/all');
      setSubscriptions(response.data);
    } catch (error: any) {
      showErrorAlert(error, 'Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSubscriptions();
    setRefreshing(false);
  };

  const filterSubscriptions = () => {
    let filtered = subscriptions;

    if (statusFilter !== 'all') {
      filtered = filtered.filter((sub) => sub.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (sub) =>
          sub.member_name.toLowerCase().includes(query) ||
          sub.member_email.toLowerCase().includes(query) ||
          sub.plan_name.toLowerCase().includes(query)
      );
    }

    setFilteredSubscriptions(filtered);
  };

  const getStatusColor = (status: string) => {
    const statusColors: any = {
      Active: '#10b981',
      Paused: '#f59e0b',
      Cancelled: '#ef4444',
      Expired: '#6b7280',
    };
    return statusColors[status] || '#6b7280';
  };

  const handleAction = (subscription: Subscription) => {
    setSelectedSub(subscription);
    setShowActionsModal(true);
  };

  const handleExtend = () => {
    setShowActionsModal(false);
    router.push({
      pathname: '/contributions/admin-subscriptions/actions/extend',
      params: { subscription_id: selectedSub?.subscription_id }
    });
  };

  const handlePause = () => {
    setShowActionsModal(false);
    router.push({
      pathname: '/contributions/admin-subscriptions/actions/pause',
      params: { subscription_id: selectedSub?.subscription_id }
    });
  };

  const handleResume = () => {
    setShowActionsModal(false);
    router.push({
      pathname: '/contributions/admin-subscriptions/actions/resume',
      params: { subscription_id: selectedSub?.subscription_id }
    });
  };

  const handleTerminate = () => {
    setShowActionsModal(false);
    router.push({
      pathname: '/contributions/admin-subscriptions/actions/terminate',
      params: { subscription_id: selectedSub?.subscription_id }
    });
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
    headerActions: {
      flexDirection: 'row',
      marginTop: 12,
      gap: 8,
    },
    headerButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      gap: 4,
    },
    headerButtonText: {
      color: '#fff',
      fontSize: 13,
      fontWeight: '600',
    },
    searchBar: {
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      padding: 12,
    },
    searchInput: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      color: colors.text,
    },
    filterContainer: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    filterChip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      marginRight: 8,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    filterChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    filterChipText: {
      fontSize: 13,
      color: colors.text,
    },
    filterChipTextActive: {
      color: '#fff',
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
    statsRow: {
      flexDirection: 'row',
      marginBottom: 16,
      gap: 8,
    },
    statCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    statValue: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 2,
    },
    statLabel: {
      fontSize: 11,
      color: colors.textSecondary,
    },
    subscriptionCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    memberName: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      flex: 1,
    },
    statusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    statusText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '600',
    },
    planInfo: {
      fontSize: 13,
      color: colors.textSecondary,
      marginBottom: 8,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 4,
    },
    detailLabel: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    detailValue: {
      fontSize: 13,
      fontWeight: '500',
      color: colors.text,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary + '10',
      borderColor: colors.primary,
      borderWidth: 1,
      paddingVertical: 8,
      borderRadius: 8,
      marginTop: 12,
      gap: 4,
    },
    actionButtonText: {
      color: colors.primary,
      fontSize: 13,
      fontWeight: '600',
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
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
      maxHeight: '60%',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 8,
    },
    modalSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 16,
    },
    modalAction: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: 12,
    },
    modalActionText: {
      fontSize: 16,
      color: colors.text,
      fontWeight: '500',
    },
    modalActionDanger: {
      color: '#ef4444',
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
          <Text style={styles.headerTitle}>All Subscriptions</Text>
        </View>
        <ListSkeleton count={5} />
      </SafeAreaView>
    );
  }

  const activeCount = subscriptions.filter((s) => s.status === 'Active').length;
  const pausedCount = subscriptions.filter((s) => s.status === 'Paused').length;
  const expiredCount = subscriptions.filter((s) => s.status === 'Expired').length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Subscriptions</Text>
        <Text style={styles.headerSubtitle}>{subscriptions.length} total subscriptions</Text>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.push('/contributions/admin-subscriptions/assign')}
          >
            <Ionicons name="add-circle-outline" size={18} color="#fff" />
            <Text style={styles.headerButtonText}>Assign</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.push('/contributions/admin-subscriptions/statistics')}
          >
            <Ionicons name="stats-chart-outline" size={18} color="#fff" />
            <Text style={styles.headerButtonText}>Statistics</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by member name, email, or plan..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView horizontal style={styles.filterContainer} showsHorizontalScrollIndicator={false}>
        {['all', 'Active', 'Paused', 'Expired', 'Cancelled'].map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[styles.filterChip, statusFilter === filter && styles.filterChipActive]}
            onPress={() => setStatusFilter(filter)}
          >
            <Text
              style={[
                styles.filterChipText,
                statusFilter === filter && styles.filterChipTextActive,
              ]}
            >
              {filter === 'all' ? 'All' : filter}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#10b981' }]}>{activeCount}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#f59e0b' }]}>{pausedCount}</Text>
            <Text style={styles.statLabel}>Paused</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#6b7280' }]}>{expiredCount}</Text>
            <Text style={styles.statLabel}>Expired</Text>
          </View>
        </View>

        {filteredSubscriptions.length === 0 ? (
          <EmptyState
            icon="document-outline"
            title={searchQuery || statusFilter !== 'all' ? 'No Matches Found' : 'No Subscriptions Yet'}
            message={
              searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Subscriptions will appear here once members subscribe to plans'
            }
          />
        ) : (
          filteredSubscriptions.map((sub) => (
            <View key={sub.id} style={styles.subscriptionCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.memberName}>{sub.member_name}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(sub.status) }]}>
                  <Text style={styles.statusText}>{sub.status}</Text>
                </View>
              </View>

              <Text style={styles.planInfo}>
                {sub.plan_name} • {sub.plan_type} • {sub.billing_cycle}
              </Text>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Member Email</Text>
                <Text style={styles.detailValue}>{sub.member_email}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Start Date</Text>
                <Text style={styles.detailValue}>
                  {new Date(sub.subscription_start_date).toLocaleDateString()}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>End Date</Text>
                <Text style={styles.detailValue}>
                  {new Date(sub.subscription_end_date).toLocaleDateString()}
                </Text>
              </View>

              {sub.status === 'Active' && sub.days_remaining !== undefined && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Days Remaining</Text>
                  <Text style={[styles.detailValue, { color: '#10b981' }]}>
                    {sub.days_remaining} days
                  </Text>
                </View>
              )}

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Amount</Text>
                <Text style={styles.detailValue}>₹{sub.price_paid}</Text>
              </View>

              <TouchableOpacity style={styles.actionButton} onPress={() => handleAction(sub)}>
                <Ionicons name="settings-outline" size={16} color={colors.primary} />
                <Text style={styles.actionButtonText}>Manage</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      <Modal
        visible={showActionsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowActionsModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowActionsModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Manage Subscription</Text>
            <Text style={styles.modalSubtitle}>
              {selectedSub?.member_name} - {selectedSub?.plan_name}
            </Text>

            <TouchableOpacity style={styles.modalAction} onPress={handleExtend}>
              <Ionicons name="time-outline" size={24} color={colors.primary} />
              <Text style={styles.modalActionText}>Extend Subscription</Text>
            </TouchableOpacity>

            {selectedSub?.status === 'Active' && (
              <TouchableOpacity style={styles.modalAction} onPress={handlePause}>
                <Ionicons name="pause-circle-outline" size={24} color="#f59e0b" />
                <Text style={styles.modalActionText}>Pause Subscription</Text>
              </TouchableOpacity>
            )}

            {selectedSub?.status === 'Paused' && (
              <TouchableOpacity style={styles.modalAction} onPress={handleResume}>
                <Ionicons name="play-circle-outline" size={24} color="#10b981" />
                <Text style={styles.modalActionText}>Resume Subscription</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.modalAction} onPress={handleTerminate}>
              <Ionicons name="close-circle-outline" size={24} color="#ef4444" />
              <Text style={[styles.modalActionText, styles.modalActionDanger]}>
                Terminate Subscription
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

export default function AllSubscriptionsWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <AllSubscriptions />
    </ErrorBoundary>
  );
}
