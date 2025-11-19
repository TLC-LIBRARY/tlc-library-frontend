import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../utils/api';

type RequestStatus = 'Pending' | 'Approved' | 'Rejected' | 'Resolved' | 'Withdrawn';
type RequestType = 'book_request' | 'adhyeta_box' | 'suggestion' | 'complaint' | 'feedback';

interface Request {
  id: string;
  request_type: RequestType;
  ticket_number: string;
  status: RequestStatus;
  priority?: string;
  submitted_at: string;
  updated_at?: string;
  request_data: any;
  admin_reply?: string;
  admin_remarks?: string;
  escalated?: boolean;
}

export default function MyRequests() {
  const { colors } = useTheme();
  const router = useRouter();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>('all');

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
    filterContainer: {
      flexDirection: 'row',
      paddingHorizontal: 12,
      paddingVertical: 16,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    filterChip: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 25,
      marginRight: 10,
      backgroundColor: colors.background,
      borderWidth: 2,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    filterChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 5,
      transform: [{ scale: 1.05 }],
    },
    filterChipText: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    filterChipTextActive: {
      color: '#fff',
      fontWeight: '700',
      fontSize: 14,
    },
    content: {
      padding: 16,
    },
    requestCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    requestHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    requestType: {
      flex: 1,
    },
    requestTypeText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    ticketNumber: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#fff',
    },
    requestDetails: {
      marginBottom: 12,
    },
    detailText: {
      fontSize: 14,
      color: colors.text,
      marginBottom: 4,
    },
    detailLabel: {
      fontWeight: '600',
      color: colors.textSecondary,
    },
    priorityBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
      marginBottom: 8,
    },
    priorityText: {
      fontSize: 12,
      fontWeight: '600',
      marginLeft: 4,
      color: '#fff',
    },
    adminSection: {
      backgroundColor: colors.background,
      padding: 12,
      borderRadius: 8,
      marginTop: 8,
    },
    adminLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 4,
    },
    adminText: {
      fontSize: 14,
      color: colors.text,
    },
    actionButtons: {
      flexDirection: 'row',
      marginTop: 12,
      gap: 8,
    },
    actionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      borderRadius: 8,
      borderWidth: 1,
    },
    viewButton: {
      backgroundColor: colors.primary + '15',
      borderColor: colors.primary,
    },
    withdrawButton: {
      backgroundColor: '#d32f2f15',
      borderColor: '#d32f2f',
    },
    buttonText: {
      fontSize: 14,
      fontWeight: '600',
      marginLeft: 6,
    },
    viewButtonText: {
      color: colors.primary,
    },
    withdrawButtonText: {
      color: '#d32f2f',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
    },
    emptyIcon: {
      marginBottom: 16,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    emptySubtext: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      paddingHorizontal: 32,
    },
    submitButton: {
      backgroundColor: colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
      marginTop: 16,
    },
    submitButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
      textAlign: 'center',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
    },
    escalatedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#d32f2f',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      alignSelf: 'flex-start',
      marginTop: 8,
    },
    escalatedText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#fff',
      marginLeft: 4,
    },
  });

  const fetchRequests = async () => {
    try {
      const response = await api.get('/api/requests/my-requests');
      setRequests(response.data);
    } catch (error: any) {
      console.error('Error fetching requests:', error);
      Alert.alert('Error', 'Failed to load your requests. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRequests();
  };

  const handleWithdraw = async (requestId: string, ticketNumber: string) => {
    Alert.alert(
      'Withdraw Request',
      `Are you sure you want to withdraw request ${ticketNumber}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Withdraw',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.post(`/api/requests/withdraw/${requestId}`, {
                reason: 'Member initiated withdrawal',
              });
              Alert.alert('Success', 'Request withdrawn successfully');
              fetchRequests();
            } catch (error: any) {
              const message = error.response?.data?.detail || 'Failed to withdraw request';
              Alert.alert('Error', message);
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: RequestStatus): string => {
    switch (status) {
      case 'Pending':
        return '#ff9800';
      case 'Approved':
        return '#4caf50';
      case 'Rejected':
        return '#d32f2f';
      case 'Resolved':
        return '#2196f3';
      case 'Withdrawn':
        return '#757575';
      default:
        return '#757575';
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'High':
        return '#d32f2f';
      case 'Medium':
        return '#ff9800';
      case 'Low':
        return '#4caf50';
      default:
        return '#757575';
    }
  };

  const getRequestTitle = (request: Request): string => {
    switch (request.request_type) {
      case 'book_request':
        return request.request_data.book_title || 'Book Request';
      case 'adhyeta_box':
        return request.request_data.box_type || 'Adhyeta Box Request';
      case 'suggestion':
        return request.request_data.title || 'Suggestion';
      case 'complaint':
        return `Complaint - ${request.request_data.category || 'General'}`;
      case 'feedback':
        return request.request_data.title || 'Feedback';
      default:
        return 'Request';
    }
  };

  const getRequestIcon = (type: RequestType): any => {
    switch (type) {
      case 'book_request':
        return 'book';
      case 'adhyeta_box':
        return 'cube';
      case 'suggestion':
        return 'bulb';
      case 'complaint':
        return 'warning';
      case 'feedback':
        return 'star';
      default:
        return 'document';
    }
  };

  const getStatusIcon = (status: RequestStatus): any => {
    switch (status) {
      case 'Pending':
        return 'time-outline';
      case 'Approved':
        return 'checkmark-circle';
      case 'Rejected':
        return 'close-circle';
      case 'Resolved':
        return 'checkmark-done-circle';
      case 'Withdrawn':
        return 'ban';
      default:
        return 'help-circle';
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const filteredRequests = requests.filter((req) => {
    if (filter === 'all') return true;
    return req.status === filter;
  });

  const renderRequest = (request: Request) => (
    <View key={request.id} style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <View style={styles.requestType}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Ionicons
              name={getRequestIcon(request.request_type)}
              size={18}
              color={colors.primary}
              style={{ marginRight: 6 }}
            />
            <Text style={styles.requestTypeText}>{getRequestTitle(request)}</Text>
          </View>
          <Text style={styles.ticketNumber}>Ticket #{request.ticket_number}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) }]}>
          <Ionicons name={getStatusIcon(request.status)} size={14} color="#fff" style={{ marginRight: 4 }} />
          <Text style={styles.statusText}>{request.status}</Text>
        </View>
      </View>

      {request.priority && (
        <View
          style={[styles.priorityBadge, { backgroundColor: getPriorityColor(request.priority) }]}
        >
          <Ionicons name="flag" size={12} color="#fff" />
          <Text style={styles.priorityText}>{request.priority} Priority</Text>
        </View>
      )}

      {request.escalated && (
        <View style={styles.escalatedBadge}>
          <Ionicons name="alert" size={12} color="#fff" />
          <Text style={styles.escalatedText}>Escalated</Text>
        </View>
      )}

      <View style={styles.requestDetails}>
        <Text style={styles.detailText}>
          <Text style={styles.detailLabel}>Submitted: </Text>
          {formatDate(request.submitted_at)}
        </Text>
        {request.updated_at && (
          <Text style={styles.detailText}>
            <Text style={styles.detailLabel}>Updated: </Text>
            {formatDate(request.updated_at)}
          </Text>
        )}
      </View>

      {(request.admin_reply || request.admin_remarks) && (
        <View style={styles.adminSection}>
          <Text style={styles.adminLabel}>Admin Response:</Text>
          <Text style={styles.adminText}>
            {request.admin_remarks || request.admin_reply || 'No response yet'}
          </Text>
        </View>
      )}

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.viewButton]}
          onPress={() => router.push(`/member-connect/request-details?requestId=${request.id}`)}
        >
          <Ionicons name="eye" size={16} color={colors.primary} />
          <Text style={[styles.buttonText, styles.viewButtonText]}>View Details</Text>
        </TouchableOpacity>

        {request.status === 'Pending' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.withdrawButton]}
            onPress={() => handleWithdraw(request.id, request.ticket_number)}
          >
            <Ionicons name="close-circle" size={16} color="#d32f2f" />
            <Text style={[styles.buttonText, styles.withdrawButtonText]}>Withdraw</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.emptyText, { marginTop: 16 }]}>Loading your requests...</Text>
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
        <Text style={styles.headerTitle}>My Requests</Text>
        <Text style={styles.headerSubtitle}>Track your submissions</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
        {['all', 'Pending', 'Approved', 'Rejected', 'Resolved'].map((filterOption) => (
          <TouchableOpacity
            key={filterOption}
            style={[
              styles.filterChip,
              filter === filterOption && styles.filterChipActive,
            ]}
            onPress={() => setFilter(filterOption)}
          >
            <Text
              style={[
                styles.filterChipText,
                filter === filterOption && styles.filterChipTextActive,
              ]}
            >
              {filterOption === 'all' ? 'All' : filterOption}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {filteredRequests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color={colors.textSecondary} />
            <Text style={styles.emptyText}>No requests found</Text>
            <Text style={styles.emptySubtext}>
              {filter === 'all'
                ? "You haven't submitted any requests yet"
                : `You don't have any ${filter.toLowerCase()} requests`}
            </Text>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={() => router.push('/member-connect')}
            >
              <Text style={styles.submitButtonText}>Submit a Request</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredRequests.map(renderRequest)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
