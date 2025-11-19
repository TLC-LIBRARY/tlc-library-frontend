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
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
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
  member_id: string;
  member_name: string;
  member_email: string;
  request_data: any;
  admin_reply?: string;
  admin_remarks?: string;
  escalated?: boolean;
}

interface Statistics {
  total_requests: number;
  pending: number;
  approved: number;
  rejected: number;
  resolved: number;
  withdrawn: number;
  by_type: any;
  by_priority: any;
  escalated_complaints: number;
}

export default function AdminRequestsDashboard() {
  const { colors } = useTheme();
  const router = useRouter();
  
  const [requests, setRequests] = useState<Request[]>([]);
  const [stats, setStats] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filters
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [escalatedOnly, setEscalatedOnly] = useState(false);
  
  // Action Modal States
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [resolveModalVisible, setResolveModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [actionType, setActionType] = useState<'Approved' | 'Rejected'>('Approved');
  const [adminRemarks, setAdminRemarks] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
    statsContainer: {
      padding: 16,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    statsRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 8,
    },
    statCard: {
      flex: 1,
      backgroundColor: colors.background,
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    statValue: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    escalatedCard: {
      backgroundColor: '#d32f2f15',
      borderColor: '#d32f2f',
    },
    escalatedValue: {
      color: '#d32f2f',
    },
    filtersContainer: {
      padding: 16,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    filterLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    filterChips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 12,
    },
    filterChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
    },
    filterChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    filterChipText: {
      fontSize: 12,
      color: colors.text,
    },
    filterChipTextActive: {
      color: '#fff',
      fontWeight: '600',
    },
    escalatedToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
    },
    escalatedToggleText: {
      fontSize: 14,
      color: colors.text,
      marginLeft: 8,
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
    requestInfo: {
      flex: 1,
    },
    requestTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    ticketNumber: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    memberInfo: {
      fontSize: 12,
      color: colors.text,
    },
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#fff',
    },
    priorityBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
      alignSelf: 'flex-start',
      marginBottom: 8,
    },
    priorityText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#fff',
      marginLeft: 4,
    },
    escalatedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#d32f2f',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      alignSelf: 'flex-start',
      marginTop: 4,
    },
    escalatedText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#fff',
      marginLeft: 4,
    },
    requestDetails: {
      backgroundColor: colors.background,
      padding: 12,
      borderRadius: 8,
      marginBottom: 12,
    },
    detailText: {
      fontSize: 14,
      color: colors.text,
      marginBottom: 4,
    },
    actionButtons: {
      flexDirection: 'row',
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
    approveButton: {
      backgroundColor: '#4caf5015',
      borderColor: '#4caf50',
    },
    rejectButton: {
      backgroundColor: '#d32f2f15',
      borderColor: '#d32f2f',
    },
    resolveButton: {
      backgroundColor: '#2196f315',
      borderColor: '#2196f3',
    },
    buttonText: {
      fontSize: 14,
      fontWeight: '600',
      marginLeft: 6,
    },
    approveButtonText: {
      color: '#4caf50',
    },
    rejectButtonText: {
      color: '#d32f2f',
    },
    resolveButtonText: {
      color: '#2196f3',
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
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 24,
      maxHeight: '80%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
    },
    closeButton: {
      padding: 4,
    },
    modalSection: {
      marginBottom: 16,
    },
    modalLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    modalInput: {
      backgroundColor: colors.background,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
      minHeight: 100,
      textAlignVertical: 'top',
    },
    charCount: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'right',
      marginTop: 4,
    },
    charCountError: {
      color: '#d32f2f',
    },
    actionTypeButtons: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 16,
    },
    actionTypeButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      borderWidth: 2,
      alignItems: 'center',
      borderColor: colors.border,
    },
    actionTypeButtonActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '15',
    },
    actionTypeText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    actionTypeTextActive: {
      color: colors.primary,
    },
    submitButton: {
      backgroundColor: colors.primary,
      paddingVertical: 14,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 16,
    },
    submitButtonDisabled: {
      opacity: 0.5,
    },
    submitButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
  });

  useEffect(() => {
    fetchData();
  }, [filterType, filterStatus, filterPriority, escalatedOnly]);

  const fetchData = async () => {
    try {
      // Fetch requests with filters
      let requestUrl = '/api/requests/admin/all-requests?';
      if (filterType !== 'all') requestUrl += `request_type=${filterType}&`;
      if (filterStatus !== 'all') requestUrl += `status=${filterStatus}&`;
      if (filterPriority !== 'all') requestUrl += `priority=${filterPriority}&`;
      if (escalatedOnly) requestUrl += 'escalated_only=true&';

      const [requestsResponse, statsResponse] = await Promise.all([
        api.get(requestUrl),
        api.get('/api/requests/admin/stats'),
      ]);

      setRequests(requestsResponse.data);
      setStats(statsResponse.data);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load requests. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const openActionModal = (request: Request, type: 'Approved' | 'Rejected') => {
    if (request.status !== 'Pending') {
      Alert.alert('Error', 'Only pending requests can be approved or rejected');
      return;
    }
    setSelectedRequest(request);
    setActionType(type);
    setAdminRemarks('');
    setActionModalVisible(true);
  };

  const openResolveModal = (request: Request) => {
    if (request.status !== 'Approved' && request.status !== 'Pending') {
      Alert.alert('Error', 'Only approved or pending requests can be resolved');
      return;
    }
    setSelectedRequest(request);
    setResolutionNotes('');
    setResolveModalVisible(true);
  };

  const handleApproveReject = async () => {
    if (!selectedRequest) return;

    if (adminRemarks.trim().length < 10) {
      Alert.alert('Validation Error', 'Admin remarks must be at least 10 characters long');
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/api/requests/admin/approve/${selectedRequest.id}`, {
        status: actionType,
        admin_remarks: adminRemarks.trim(),
      });

      Alert.alert(
        'Success',
        `Request ${actionType.toLowerCase()} successfully. Member has been notified.`
      );

      setActionModalVisible(false);
      setAdminRemarks('');
      fetchData();
    } catch (error: any) {
      console.error('Error updating request:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to update request';
      Alert.alert('Error', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolve = async () => {
    if (!selectedRequest) return;

    if (resolutionNotes.trim().length < 10) {
      Alert.alert('Validation Error', 'Resolution notes must be at least 10 characters long');
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/api/requests/admin/resolve/${selectedRequest.id}`, {
        resolution_notes: resolutionNotes.trim(),
      });

      Alert.alert(
        'Success',
        'Request marked as resolved. Member has been notified.'
      );

      setResolveModalVisible(false);
      setResolutionNotes('');
      fetchData();
    } catch (error: any) {
      console.error('Error resolving request:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to resolve request';
      Alert.alert('Error', errorMessage);
    } finally {
      setSubmitting(false);
    }
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

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderRequest = (request: Request) => (
    <View key={request.id} style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <View style={styles.requestInfo}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Ionicons
              name={getRequestIcon(request.request_type)}
              size={18}
              color={colors.primary}
              style={{ marginRight: 6 }}
            />
            <Text style={styles.requestTitle}>{getRequestTitle(request)}</Text>
          </View>
          <Text style={styles.ticketNumber}>Ticket #{request.ticket_number}</Text>
          <Text style={styles.memberInfo}>
            👤 {request.member_name} ({request.member_email})
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) }]}>
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
          <Text style={styles.escalatedText}>Escalated (>48hrs)</Text>
        </View>
      )}

      <View style={styles.requestDetails}>
        <Text style={styles.detailText}>📅 Submitted: {formatDate(request.submitted_at)}</Text>
        {request.updated_at && (
          <Text style={styles.detailText}>🔄 Updated: {formatDate(request.updated_at)}</Text>
        )}
      </View>

      {request.status === 'Pending' && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton]}
            onPress={() => openActionModal(request, 'Approved')}
          >
            <Ionicons name="checkmark-circle" size={16} color="#4caf50" />
            <Text style={[styles.buttonText, styles.approveButtonText]}>Approve</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => openActionModal(request, 'Rejected')}
          >
            <Ionicons name="close-circle" size={16} color="#d32f2f" />
            <Text style={[styles.buttonText, styles.rejectButtonText]}>Reject</Text>
          </TouchableOpacity>
        </View>
      )}

      {(request.status === 'Approved' || request.status === 'Pending') && (
        <TouchableOpacity
          style={[styles.actionButton, styles.resolveButton, { marginTop: 8 }]}
          onPress={() => openResolveModal(request)}
        >
          <Ionicons name="checkmark-done" size={16} color="#2196f3" />
          <Text style={[styles.buttonText, styles.resolveButtonText]}>Mark as Resolved</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.emptyText, { marginTop: 16 }]}>Loading requests...</Text>
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
        <Text style={styles.headerTitle}>Member Requests</Text>
        <Text style={styles.headerSubtitle}>Manage all member requests</Text>
      </View>

      {stats && (
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.total_requests}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#ff980015' }]}>
              <Text style={[styles.statValue, { color: '#ff9800' }]}>{stats.pending}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#4caf5015' }]}>
              <Text style={[styles.statValue, { color: '#4caf50' }]}>{stats.approved}</Text>
              <Text style={styles.statLabel}>Approved</Text>
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: '#2196f3' }]}>{stats.resolved}</Text>
              <Text style={styles.statLabel}>Resolved</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: '#d32f2f' }]}>{stats.rejected}</Text>
              <Text style={styles.statLabel}>Rejected</Text>
            </View>
            <View style={[styles.statCard, styles.escalatedCard]}>
              <Text style={[styles.statValue, styles.escalatedValue]}>
                {stats.escalated_complaints}
              </Text>
              <Text style={styles.statLabel}>Escalated</Text>
            </View>
          </View>
        </View>
      )}

      <ScrollView style={styles.filtersContainer} horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View>
            <Text style={styles.filterLabel}>Type:</Text>
            <View style={styles.filterChips}>
              {['all', 'book_request', 'complaint', 'feedback', 'suggestion', 'adhyeta_box'].map(
                (type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.filterChip,
                      filterType === type && styles.filterChipActive,
                    ]}
                    onPress={() => setFilterType(type)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        filterType === type && styles.filterChipTextActive,
                      ]}
                    >
                      {type === 'all' ? 'All' : type.replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </View>
          </View>

          <View>
            <Text style={styles.filterLabel}>Status:</Text>
            <View style={styles.filterChips}>
              {['all', 'Pending', 'Approved', 'Rejected', 'Resolved'].map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.filterChip,
                    filterStatus === status && styles.filterChipActive,
                  ]}
                  onPress={() => setFilterStatus(status)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      filterStatus === status && styles.filterChipTextActive,
                    ]}
                  >
                    {status}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View>
            <Text style={styles.filterLabel}>Priority:</Text>
            <View style={styles.filterChips}>
              {['all', 'Low', 'Medium', 'High'].map((priority) => (
                <TouchableOpacity
                  key={priority}
                  style={[
                    styles.filterChip,
                    filterPriority === priority && styles.filterChipActive,
                  ]}
                  onPress={() => setFilterPriority(priority)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      filterPriority === priority && styles.filterChipTextActive,
                    ]}
                  >
                    {priority}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={styles.escalatedToggle}
            onPress={() => setEscalatedOnly(!escalatedOnly)}
          >
            <Ionicons
              name={escalatedOnly ? 'checkbox' : 'square-outline'}
              size={20}
              color={colors.primary}
            />
            <Text style={styles.escalatedToggleText}>Escalated Only</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {requests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-open-outline" size={64} color={colors.textSecondary} />
            <Text style={styles.emptyText}>No requests found</Text>
            <Text style={styles.emptySubtext}>
              Adjust your filters or wait for members to submit requests
            </Text>
          </View>
        ) : (
          requests.map(renderRequest)
        )}
      </ScrollView>

      {/* Approve/Reject Modal */}
      <Modal
        visible={actionModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setActionModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={() => setActionModalVisible(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {actionType === 'Approved' ? 'Approve' : 'Reject'} Request
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setActionModalVisible(false)}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {selectedRequest && (
              <View style={styles.modalSection}>
                <Text style={styles.detailText}>
                  📋 {getRequestTitle(selectedRequest)}
                </Text>
                <Text style={styles.ticketNumber}>Ticket #{selectedRequest.ticket_number}</Text>
              </View>
            )}

            <View style={styles.actionTypeButtons}>
              <TouchableOpacity
                style={[
                  styles.actionTypeButton,
                  actionType === 'Approved' && styles.actionTypeButtonActive,
                ]}
                onPress={() => setActionType('Approved')}
              >
                <Text
                  style={[
                    styles.actionTypeText,
                    actionType === 'Approved' && styles.actionTypeTextActive,
                  ]}
                >
                  Approve
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.actionTypeButton,
                  actionType === 'Rejected' && styles.actionTypeButtonActive,
                ]}
                onPress={() => setActionType('Rejected')}
              >
                <Text
                  style={[
                    styles.actionTypeText,
                    actionType === 'Rejected' && styles.actionTypeTextActive,
                  ]}
                >
                  Reject
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>
                Admin Remarks (Required, min 10 characters)
              </Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Provide detailed remarks for your decision..."
                placeholderTextColor={colors.textSecondary}
                value={adminRemarks}
                onChangeText={setAdminRemarks}
                multiline
                numberOfLines={4}
              />
              <Text
                style={[
                  styles.charCount,
                  adminRemarks.length < 10 && adminRemarks.length > 0 && styles.charCountError,
                ]}
              >
                {adminRemarks.length}/10 characters
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.submitButton,
                (submitting || adminRemarks.length < 10) && styles.submitButtonDisabled,
              ]}
              onPress={handleApproveReject}
              disabled={submitting || adminRemarks.length < 10}
            >
              <Text style={styles.submitButtonText}>
                {submitting
                  ? 'Submitting...'
                  : `${actionType === 'Approved' ? 'Approve' : 'Reject'} Request`}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Resolve Modal */}
      <Modal
        visible={resolveModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setResolveModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={() => setResolveModalVisible(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Mark as Resolved</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setResolveModalVisible(false)}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {selectedRequest && (
              <View style={styles.modalSection}>
                <Text style={styles.detailText}>
                  📋 {getRequestTitle(selectedRequest)}
                </Text>
                <Text style={styles.ticketNumber}>Ticket #{selectedRequest.ticket_number}</Text>
              </View>
            )}

            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>
                Resolution Notes (Required, min 10 characters)
              </Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Describe how this request was resolved..."
                placeholderTextColor={colors.textSecondary}
                value={resolutionNotes}
                onChangeText={setResolutionNotes}
                multiline
                numberOfLines={4}
              />
              <Text
                style={[
                  styles.charCount,
                  resolutionNotes.length < 10 && resolutionNotes.length > 0 && styles.charCountError,
                ]}
              >
                {resolutionNotes.length}/10 characters
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.submitButton,
                (submitting || resolutionNotes.length < 10) && styles.submitButtonDisabled,
              ]}
              onPress={handleResolve}
              disabled={submitting || resolutionNotes.length < 10}
            >
              <Text style={styles.submitButtonText}>
                {submitting ? 'Submitting...' : 'Mark as Resolved'}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
