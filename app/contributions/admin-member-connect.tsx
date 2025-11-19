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
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../utils/api';


type TabType = 'book-requests' | 'book-boxes' | 'suggestions' | 'complaints';

interface Request {
  id: string;
  member_name: string;
  member_id?: string;
  submitted_at: string;
  status: string;
  admin_reply?: string;
  [key: string]: any;
}

export default function AdminMemberConnect() {
  const { token, user } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabType>('book-requests');
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [replyModalVisible, setReplyModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Check if user is admin
  useEffect(() => {
    if (user?.role !== 'admin') {
      const message = 'This page is only accessible to administrators.';
      if (Platform.OS === 'web') {
        window.alert(message);
      } else {
        Alert.alert('Access Denied', message);
      }
      router.replace('/contributions/dashboard');
    }
  }, [user]);

  useEffect(() => {
    fetchRequests();
  }, [activeTab]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      let endpoint = '';
      switch (activeTab) {
        case 'book-requests':
          endpoint = '/api/member-connect/book-requests';
          break;
        case 'book-boxes':
          endpoint = '/api/member-connect/book-box-requests';
          break;
        case 'suggestions':
          endpoint = '/api/member-connect/suggestions';
          break;
        case 'complaints':
          endpoint = '/api/member-connect/complaints';
          break;
      }

      const response = await api.get(endpoint);

      setRequests(response.data);
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchRequests();
  };

  const openReplyModal = (request: Request) => {
    setSelectedRequest(request);
    setReplyMessage('');
    setNewStatus(request.status);
    setReplyModalVisible(true);
  };

  const handleSendReply = async () => {
    if (!replyMessage.trim()) {
      if (Platform.OS === 'web') {
        alert('Please enter a reply message');
      } else {
        Alert.alert('Error', 'Please enter a reply message');
      }
      return;
    }

    setSubmitting(true);
    try {
      let endpoint = '';
      switch (activeTab) {
        case 'book-requests':
          endpoint = `/api/member-connect/book-requests/${selectedRequest?.id}/reply`;
          break;
        case 'book-boxes':
          endpoint = `/api/member-connect/book-box-requests/${selectedRequest?.id}/reply`;
          break;
        case 'suggestions':
          endpoint = `/api/member-connect/suggestions/${selectedRequest?.id}/reply`;
          break;
        case 'complaints':
          endpoint = `/api/member-connect/complaints/${selectedRequest?.id}/reply`;
          break;
      }

      await api.post(endpoint, {
        reply_message: replyMessage,
        status: newStatus !== selectedRequest?.status ? newStatus : undefined,
      });

      if (Platform.OS === 'web') {
        alert('Reply sent successfully! Member will receive email and in-app notification.');
      } else {
        Alert.alert('Success', 'Reply sent successfully! Member will receive email and in-app notification.');
      }

      setReplyModalVisible(false);
      fetchRequests();
    } catch (error: any) {
      console.error('Failed to send reply:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to send reply';
      if (Platform.OS === 'web') {
        alert(`Error: ${errorMessage}`);
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (requestId: string) => {
    const confirmed = Platform.OS === 'web'
      ? window.confirm('Are you sure you want to delete this request? This action cannot be undone.')
      : await new Promise((resolve) => {
          Alert.alert(
            'Confirm Delete',
            'Are you sure you want to delete this request? This action cannot be undone.',
            [
              { text: 'Cancel', onPress: () => resolve(false), style: 'cancel' },
              { text: 'Delete', onPress: () => resolve(true), style: 'destructive' },
            ]
          );
        });

    if (!confirmed) return;

    try {
      let endpoint = '';
      switch (activeTab) {
        case 'book-requests':
          endpoint = `/api/member-connect/book-requests/${requestId}`;
          break;
        case 'book-boxes':
          endpoint = `/api/member-connect/book-box-requests/${requestId}`;
          break;
        case 'suggestions':
          endpoint = `/api/member-connect/suggestions/${requestId}`;
          break;
        case 'complaints':
          endpoint = `/api/member-connect/complaints/${requestId}`;
          break;
      }

      await api.delete(endpoint);

      if (Platform.OS === 'web') {
        alert('Request deleted successfully');
      } else {
        Alert.alert('Success', 'Request deleted successfully');
      }

      fetchRequests();
    } catch (error: any) {
      console.error('Failed to delete:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to delete request';
      if (Platform.OS === 'web') {
        alert(`Error: ${errorMessage}`);
      } else {
        Alert.alert('Error', errorMessage);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return '#ff9800';
      case 'in progress':
        return '#2196f3';
      case 'approved':
      case 'resolved':
      case 'delivered':
        return colors.success;
      case 'not available':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  const renderRequestCard = (request: Request) => {
    const cardColor = activeTab === 'book-requests' ? '#6200ee' : 
                      activeTab === 'book-boxes' ? '#ff9800' :
                      activeTab === 'suggestions' ? '#00897b' : '#d32f2f';
    
    return (
      <View key={request.id} style={[styles.requestCard, { borderLeftColor: cardColor, borderLeftWidth: 4 }]}>
        <View style={styles.requestHeader}>
          <View style={styles.requestInfo}>
            <View style={styles.memberNameRow}>
              <Ionicons name="person-circle" size={20} color={colors.primary} style={{ marginRight: 6 }} />
              <Text style={[styles.memberName, { color: colors.text }]}>
                {request.member_name}
              </Text>
            </View>
            {request.member_id && (
              <View style={styles.infoRow}>
                <Ionicons name="card" size={14} color={colors.textSecondary} style={{ marginRight: 4 }} />
                <Text style={[styles.memberId, { color: colors.textSecondary }]}>
                  {request.member_id}
                </Text>
              </View>
            )}
            {request.ticket_number && (
              <View style={styles.infoRow}>
                <Ionicons name="ticket" size={14} color={colors.primary} style={{ marginRight: 4 }} />
                <Text style={[styles.ticketNumber, { color: colors.primary }]}>
                  {request.ticket_number}
                </Text>
              </View>
            )}
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(request.status) }]}>
              {request.status}
            </Text>
          </View>
        </View>

        <View style={styles.requestContent}>
          {activeTab === 'book-requests' && (
            <>
              <Text style={[styles.requestTitle, { color: colors.text }]}>
                📚 {request.book_title}
              </Text>
              <Text style={[styles.requestDetail, { color: colors.textSecondary }]}>
                by {request.author_name}
              </Text>
              <Text style={[styles.requestDetail, { color: colors.textSecondary }]}>
                {request.language} • {request.category}
              </Text>
              {request.purpose && (
                <Text style={[styles.requestDescription, { color: colors.textSecondary }]}>
                  Purpose: {request.purpose}
                </Text>
              )}
            </>
          )}

          {activeTab === 'book-boxes' && (
            <>
              <Text style={[styles.requestTitle, { color: colors.text }]}>
                📦 {request.box_type}
              </Text>
              <Text style={[styles.requestDetail, { color: colors.textSecondary }]}>
                {request.books?.length || 0} books requested
              </Text>
              {request.delivery_address && (
                <Text style={[styles.requestDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                  📍 {request.delivery_address}
                </Text>
              )}
            </>
          )}

          {activeTab === 'suggestions' && (
            <>
              <Text style={[styles.requestTitle, { color: colors.text }]}>
                💡 {request.title}
              </Text>
              <Text style={[styles.requestDescription, { color: colors.textSecondary }]} numberOfLines={3}>
                {request.message}
              </Text>
              {request.is_anonymous && (
                <Text style={[styles.anonymousBadge, { color: colors.textSecondary }]}>
                  🔒 Anonymous
                </Text>
              )}
            </>
          )}

          {activeTab === 'complaints' && (
            <>
              <Text style={[styles.requestTitle, { color: colors.text }]}>
                🚨 {request.category}
              </Text>
              <Text style={[styles.requestDescription, { color: colors.textSecondary }]} numberOfLines={3}>
                {request.description}
              </Text>
              <View style={styles.priorityContainer}>
                <Text style={[styles.priorityText, { color: colors.textSecondary }]}>
                  Priority: {request.priority}
                </Text>
              </View>
            </>
          )}

          <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
            Submitted: {new Date(request.submitted_at).toLocaleDateString()} at{' '}
            {new Date(request.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>

          {request.admin_reply && (
            <View style={[styles.replyBox, { backgroundColor: colors.border }]}>
              <Text style={[styles.replyLabel, { color: colors.text }]}>Admin Reply:</Text>
              <Text style={[styles.replyText, { color: colors.textSecondary }]}>
                {request.admin_reply}
              </Text>
              {request.admin_name && (
                <Text style={[styles.replyAuthor, { color: colors.textSecondary }]}>
                  - {request.admin_name}
                </Text>
              )}
            </View>
          )}
        </View>

        <View style={styles.requestActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={() => openReplyModal(request)}
          >
            <Ionicons name="mail" size={18} color="#fff" />
            <Text style={styles.actionButtonText}>Reply</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.error }]}
            onPress={() => handleDelete(request.id)}
          >
            <Ionicons name="trash" size={18} color="#fff" />
            <Text style={styles.actionButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      padding: 4,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },
    headerRight: {
      width: 32,
    },
    tabContainer: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      paddingHorizontal: 12,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    tab: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 20,
      marginHorizontal: 4,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    activeTab: {
      borderColor: colors.primary,
    },
    tabText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    activeTabText: {
      color: colors.primary,
    },
    content: {
      padding: 16,
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 48,
    },
    emptyText: {
      fontSize: 16,
      color: colors.textSecondary,
      marginTop: 16,
    },
    requestCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
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
    memberNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    memberName: {
      fontSize: 16,
      fontWeight: '700',
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    memberId: {
      fontSize: 13,
    },
    ticketNumber: {
      fontSize: 13,
      fontWeight: '600',
    },
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '600',
    },
    requestContent: {
      marginBottom: 12,
    },
    requestTitle: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 8,
    },
    requestDetail: {
      fontSize: 14,
      marginBottom: 4,
    },
    requestDescription: {
      fontSize: 14,
      marginTop: 8,
      lineHeight: 20,
    },
    timestamp: {
      fontSize: 12,
      marginTop: 8,
    },
    anonymousBadge: {
      fontSize: 13,
      marginTop: 8,
    },
    priorityContainer: {
      marginTop: 8,
    },
    priorityText: {
      fontSize: 13,
      fontWeight: '600',
    },
    replyBox: {
      marginTop: 12,
      padding: 12,
      borderRadius: 8,
    },
    replyLabel: {
      fontSize: 13,
      fontWeight: '600',
      marginBottom: 6,
    },
    replyText: {
      fontSize: 14,
      lineHeight: 20,
    },
    replyAuthor: {
      fontSize: 12,
      marginTop: 6,
      fontStyle: 'italic',
    },
    requestActions: {
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
      gap: 6,
    },
    actionButtonText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      width: '90%',
      maxWidth: 500,
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 24,
      maxHeight: '80%',
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
      marginTop: 16,
    },
    textArea: {
      backgroundColor: colors.background,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
      height: 120,
      textAlignVertical: 'top',
    },
    statusPicker: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 8,
    },
    statusOption: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.border,
      borderWidth: 1,
      borderColor: colors.border,
    },
    statusOptionSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    statusOptionText: {
      fontSize: 14,
      color: colors.text,
    },
    statusOptionTextSelected: {
      color: '#fff',
      fontWeight: '600',
    },
    modalActions: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 24,
    },
    modalButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
    },
    cancelButton: {
      backgroundColor: colors.border,
    },
    sendButton: {
      backgroundColor: colors.primary,
    },
    modalButtonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    cancelButtonText: {
      color: colors.text,
    },
    sendButtonText: {
      color: '#fff',
    },
  });

  const TABS = [
    { id: 'book-requests' as TabType, label: 'Books', icon: 'book', color: '#6200ee' },
    { id: 'book-boxes' as TabType, label: 'Boxes', icon: 'cube', color: '#ff9800' },
    { id: 'suggestions' as TabType, label: 'Feedback', icon: 'bulb', color: '#00897b' },
    { id: 'complaints' as TabType, label: 'Issues', icon: 'warning', color: '#d32f2f' },
  ];

  const STATUS_OPTIONS = {
    'book-requests': ['Pending', 'In Progress', 'Approved', 'Purchased', 'Not Available'],
    'book-boxes': ['Received', 'In Review', 'Approved', 'Ready', 'Dispatched', 'Delivered'],
    'suggestions': ['Pending', 'Reviewed', 'Resolved'],
    'complaints': ['Pending', 'In Progress', 'Resolved'],
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/contributions/dashboard')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Member Connect - Admin</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabContainer}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              activeTab === tab.id && [styles.activeTab, { backgroundColor: tab.color + '15' }]
            ]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Ionicons 
              name={tab.icon as any} 
              size={18} 
              color={activeTab === tab.id ? tab.color : colors.textSecondary} 
            />
            <Text style={[
              styles.tabText, 
              activeTab === tab.id && [styles.activeTabText, { color: tab.color }]
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
      >
        {loading && requests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="hourglass-outline" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyText}>Loading...</Text>
          </View>
        ) : requests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-open-outline" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyText}>No requests yet</Text>
          </View>
        ) : (
          requests.map(renderRequestCard)
        )}
      </ScrollView>

      {/* Reply Modal */}
      <Modal
        visible={replyModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setReplyModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setReplyModalVisible(false)}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <ScrollView style={styles.modalContent}>
              <Text style={styles.modalTitle}>Send Reply</Text>

              <Text style={styles.label}>Reply Message *</Text>
              <TextInput
                style={styles.textArea}
                value={replyMessage}
                onChangeText={setReplyMessage}
                placeholder="Type your reply to the member..."
                placeholderTextColor={colors.textSecondary}
                multiline
              />

              <Text style={styles.label}>Update Status</Text>
              <View style={styles.statusPicker}>
                {STATUS_OPTIONS[activeTab].map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.statusOption,
                      newStatus === status && styles.statusOptionSelected,
                    ]}
                    onPress={() => setNewStatus(status)}
                  >
                    <Text
                      style={[
                        styles.statusOptionText,
                        newStatus === status && styles.statusOptionTextSelected,
                      ]}
                    >
                      {status}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setReplyModalVisible(false)}
                >
                  <Text style={[styles.modalButtonText, styles.cancelButtonText]}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.sendButton]}
                  onPress={handleSendReply}
                  disabled={submitting}
                >
                  <Text style={[styles.modalButtonText, styles.sendButtonText]}>
                    {submitting ? 'Sending...' : 'Send Reply'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}
