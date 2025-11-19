import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../utils/api';

type RequestStatus = 'Pending' | 'Approved' | 'Rejected' | 'Resolved' | 'Withdrawn';
type RequestType = 'book_request' | 'adhyeta_box' | 'suggestion' | 'complaint' | 'feedback';

interface RequestDetails {
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
  action_history?: Array<{
    action: string;
    timestamp: string;
    performed_by?: string;
    notes?: string;
  }>;
}

export default function RequestDetailsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { requestId } = useLocalSearchParams();
  const [request, setRequest] = useState<RequestDetails | null>(null);
  const [loading, setLoading] = useState(true);

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
    ticketNumber: {
      fontSize: 14,
      color: '#fff',
      opacity: 0.9,
    },
    content: {
      padding: 16,
    },
    section: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
    },
    row: {
      flexDirection: 'row',
      marginBottom: 12,
    },
    label: {
      fontSize: 14,
      color: colors.textSecondary,
      width: 120,
      fontWeight: '500',
    },
    value: {
      flex: 1,
      fontSize: 14,
      color: colors.text,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      alignSelf: 'flex-start',
    },
    statusText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#fff',
      marginLeft: 4,
    },
    priorityBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 10,
      alignSelf: 'flex-start',
      marginTop: 8,
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
      borderRadius: 10,
      alignSelf: 'flex-start',
      marginTop: 8,
    },
    escalatedText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#fff',
      marginLeft: 4,
    },
    detailsText: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 20,
    },
    adminSection: {
      backgroundColor: colors.primary + '10',
      borderLeftWidth: 3,
      borderLeftColor: colors.primary,
      padding: 12,
      borderRadius: 8,
    },
    adminLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
      marginBottom: 6,
    },
    adminText: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 20,
    },
    historyItem: {
      flexDirection: 'row',
      marginBottom: 12,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    historyIcon: {
      marginRight: 12,
      marginTop: 2,
    },
    historyContent: {
      flex: 1,
    },
    historyAction: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    historyTime: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    historyNotes: {
      fontSize: 13,
      color: colors.text,
      fontStyle: 'italic',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
    },
  });

  useEffect(() => {
    fetchRequestDetails();
  }, [requestId]);

  const fetchRequestDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/requests/${requestId}`);
      setRequest(response.data);
    } catch (error: any) {
      console.error('Failed to load request details:', error);
    } finally {
      setLoading(false);
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

  const getRequestTypeLabel = (type: RequestType): string => {
    switch (type) {
      case 'book_request':
        return 'Book Request';
      case 'adhyeta_box':
        return 'Adhyeta Box';
      case 'suggestion':
        return 'Suggestion';
      case 'complaint':
        return 'Complaint';
      case 'feedback':
        return 'Feedback';
      default:
        return 'Request';
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Request Details</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!request) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Request Not Found</Text>
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
        <Text style={styles.headerTitle}>Request Details</Text>
        <Text style={styles.ticketNumber}>Ticket #{request.ticket_number}</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="information-circle" size={20} color={colors.primary} /> Basic Information
          </Text>
          
          <View style={styles.row}>
            <Text style={styles.label}>Request Type:</Text>
            <Text style={styles.value}>{getRequestTypeLabel(request.request_type)}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Ticket Number:</Text>
            <Text style={styles.value}>{request.ticket_number}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Status:</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) }]}>
              <Ionicons name={getStatusIcon(request.status)} size={14} color="#fff" />
              <Text style={styles.statusText}>{request.status}</Text>
            </View>
          </View>

          {request.priority && (
            <View style={styles.row}>
              <Text style={styles.label}>Priority:</Text>
              <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(request.priority) }]}>
                <Ionicons name="flag" size={12} color="#fff" />
                <Text style={styles.priorityText}>{request.priority}</Text>
              </View>
            </View>
          )}

          {request.escalated && (
            <View style={styles.escalatedBadge}>
              <Ionicons name="warning" size={12} color="#fff" />
              <Text style={styles.escalatedText}>ESCALATED</Text>
            </View>
          )}

          <View style={styles.row}>
            <Text style={styles.label}>Submitted:</Text>
            <Text style={styles.value}>{formatDate(request.submitted_at)}</Text>
          </View>

          {request.updated_at && (
            <View style={styles.row}>
              <Text style={styles.label}>Last Updated:</Text>
              <Text style={styles.value}>{formatDate(request.updated_at)}</Text>
            </View>
          )}
        </View>

        {/* Request Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="document-text" size={20} color={colors.primary} /> Request Details
          </Text>
          <Text style={styles.detailsText}>
            {JSON.stringify(request.request_data, null, 2)}
          </Text>
        </View>

        {/* Admin Response */}
        {(request.admin_reply || request.admin_remarks) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="person" size={20} color={colors.primary} /> Admin Response
            </Text>
            
            {request.admin_reply && (
              <View style={styles.adminSection}>
                <Text style={styles.adminLabel}>Reply:</Text>
                <Text style={styles.adminText}>{request.admin_reply}</Text>
              </View>
            )}

            {request.admin_remarks && (
              <View style={[styles.adminSection, { marginTop: 12 }]}>
                <Text style={styles.adminLabel}>Remarks:</Text>
                <Text style={styles.adminText}>{request.admin_remarks}</Text>
              </View>
            )}
          </View>
        )}

        {/* Action History */}
        {request.action_history && request.action_history.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="time" size={20} color={colors.primary} /> Action History
            </Text>
            
            {request.action_history.map((action, index) => (
              <View key={index} style={styles.historyItem}>
                <Ionicons name="checkmark-circle" size={20} color={colors.primary} style={styles.historyIcon} />
                <View style={styles.historyContent}>
                  <Text style={styles.historyAction}>{action.action}</Text>
                  <Text style={styles.historyTime}>{formatDate(action.timestamp)}</Text>
                  {action.performed_by && (
                    <Text style={styles.historyTime}>By: {action.performed_by}</Text>
                  )}
                  {action.notes && (
                    <Text style={styles.historyNotes}>{action.notes}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
