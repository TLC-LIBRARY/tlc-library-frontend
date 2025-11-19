import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../utils/api';


type RequestType = 'book-requests' | 'book-boxes' | 'suggestions' | 'complaints';

interface Request {
  id: string;
  type: RequestType;
  status: string;
  submitted_at: string;
  admin_reply?: string;
  [key: string]: any;
}

export default function MyRequests() {
  const { token } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();

  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'replied'>('all');

  useEffect(() => {
    fetchAllRequests();
  }, []);

  const fetchAllRequests = async () => {
    setLoading(true);
    try {
      const endpoints = [
        { url: '/api/member-connect/book-requests', type: 'book-requests' as RequestType },
        { url: '/api/member-connect/book-box-requests', type: 'book-boxes' as RequestType },
        { url: '/api/member-connect/suggestions', type: 'suggestions' as RequestType },
        { url: '/api/member-connect/complaints', type: 'complaints' as RequestType },
      ];

      const responses = await Promise.all(
        endpoints.map((endpoint) =>
          axios
            .get(`${API_URL}${endpoint.url}`, {
              headers: { Authorization: `Bearer ${token}` },
            })
            .then((res) => res.data.map((item: any) => ({ ...item, type: endpoint.type })))
            .catch(() => [])
        )
      );

      const allRequests = responses.flat();
      allRequests.sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());
      setRequests(allRequests);
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAllRequests();
  };

  const getFilteredRequests = () => {
    switch (filter) {
      case 'pending':
        return requests.filter((r) => !r.admin_reply);
      case 'replied':
        return requests.filter((r) => r.admin_reply);
      default:
        return requests;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
      case 'received':
        return '#ff9800';
      case 'in progress':
      case 'in review':
        return '#2196f3';
      case 'approved':
      case 'resolved':
      case 'delivered':
        return colors.success;
      case 'not available':
        return colors.error;
      case 'ready':
      case 'dispatched':
        return '#00897b';
      default:
        return colors.textSecondary;
    }
  };

  const getRequestIcon = (type: RequestType) => {
    switch (type) {
      case 'book-requests':
        return 'book';
      case 'book-boxes':
        return 'cube';
      case 'suggestions':
        return 'bulb';
      case 'complaints':
        return 'warning';
    }
  };

  const getRequestTypeLabel = (type: RequestType) => {
    switch (type) {
      case 'book-requests':
        return 'Book Request';
      case 'book-boxes':
        return 'Book Box';
      case 'suggestions':
        return 'Suggestion';
      case 'complaints':
        return 'Complaint';
    }
  };

  const getRequestTitle = (request: Request) => {
    switch (request.type) {
      case 'book-requests':
        return request.book_title;
      case 'book-boxes':
        return request.box_type;
      case 'suggestions':
        return request.title;
      case 'complaints':
        return request.category;
      default:
        return 'Request';
    }
  };

  const renderRequestCard = (request: Request) => {
    return (
      <View key={request.id} style={[styles.requestCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <View style={styles.typeIconContainer}>
            <Ionicons name={getRequestIcon(request.type)} size={20} color={colors.primary} />
            <Text style={[styles.typeLabel, { color: colors.primary }]}>
              {getRequestTypeLabel(request.type)}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(request.status) }]}>
              {request.status}
            </Text>
          </View>
        </View>

        <Text style={[styles.requestTitle, { color: colors.text }]}>
          {getRequestTitle(request)}
        </Text>

        {request.ticket_number && (
          <Text style={[styles.ticketNumber, { color: colors.textSecondary }]}>
            Ticket: #{request.ticket_number}
          </Text>
        )}

        <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
          Submitted {new Date(request.submitted_at).toLocaleDateString()} at{' '}
          {new Date(request.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>

        {request.admin_reply && (
          <View style={[styles.replyBox, { backgroundColor: colors.border }]}>
            <View style={styles.replyHeader}>
              <Ionicons name="mail" size={16} color={colors.success} />
              <Text style={[styles.replyLabel, { color: colors.success }]}>Admin Reply</Text>
            </View>
            <Text style={[styles.replyText, { color: colors.textSecondary }]}>
              {request.admin_reply}
            </Text>
            {request.admin_name && (
              <Text style={[styles.replyAuthor, { color: colors.textSecondary }]}>
                - {request.admin_name}
              </Text>
            )}
            {request.replied_at && (
              <Text style={[styles.replyTimestamp, { color: colors.textSecondary }]}>
                {new Date(request.replied_at).toLocaleDateString()}
              </Text>
            )}
          </View>
        )}

        {!request.admin_reply && (
          <View style={[styles.pendingBox, { backgroundColor: '#ff9800' + '10' }]}>
            <Ionicons name="time" size={16} color="#ff9800" />
            <Text style={[styles.pendingText, { color: '#ff9800' }]}>
              Waiting for admin response
            </Text>
          </View>
        )}
      </View>
    );
  };

  const filteredRequests = getFilteredRequests();

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
    filterContainer: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.surface,
      gap: 8,
    },
    filterButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.border,
      borderWidth: 1,
      borderColor: colors.border,
    },
    filterButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    filterButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    filterButtonTextActive: {
      color: '#fff',
    },
    content: {
      padding: 16,
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 48,
    },
    emptyIcon: {
      marginBottom: 16,
    },
    emptyText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    emptySubtext: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    requestCard: {
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    typeIconContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    typeLabel: {
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
    requestTitle: {
      fontSize: 16,
      fontWeight: '700',
      marginBottom: 4,
    },
    ticketNumber: {
      fontSize: 13,
      marginBottom: 4,
    },
    timestamp: {
      fontSize: 12,
      marginBottom: 12,
    },
    replyBox: {
      padding: 12,
      borderRadius: 8,
      marginTop: 12,
    },
    replyHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 8,
    },
    replyLabel: {
      fontSize: 13,
      fontWeight: '600',
    },
    replyText: {
      fontSize: 14,
      lineHeight: 20,
      marginBottom: 8,
    },
    replyAuthor: {
      fontSize: 12,
      fontStyle: 'italic',
    },
    replyTimestamp: {
      fontSize: 11,
      marginTop: 4,
    },
    pendingBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      padding: 10,
      borderRadius: 8,
      marginTop: 8,
    },
    pendingText: {
      fontSize: 13,
      fontWeight: '600',
    },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      backgroundColor: colors.surface,
      paddingVertical: 16,
      paddingHorizontal: 16,
      marginBottom: 8,
    },
    statItem: {
      alignItems: 'center',
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
    },
  });

  const totalRequests = requests.length;
  const pendingRequests = requests.filter((r) => !r.admin_reply).length;
  const repliedRequests = requests.filter((r) => r.admin_reply).length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Requests</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{totalRequests}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#ff9800' }]}>{pendingRequests}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.success }]}>{repliedRequests}</Text>
          <Text style={styles.statLabel}>Replied</Text>
        </View>
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterButtonText, filter === 'all' && styles.filterButtonTextActive]}>
            All ({totalRequests})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'pending' && styles.filterButtonActive]}
          onPress={() => setFilter('pending')}
        >
          <Text style={[styles.filterButtonText, filter === 'pending' && styles.filterButtonTextActive]}>
            Pending ({pendingRequests})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'replied' && styles.filterButtonActive]}
          onPress={() => setFilter('replied')}
        >
          <Text style={[styles.filterButtonText, filter === 'replied' && styles.filterButtonTextActive]}>
            Replied ({repliedRequests})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
      >
        {loading && requests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="hourglass-outline" size={48} color={colors.textSecondary} style={styles.emptyIcon} />
            <Text style={styles.emptyText}>Loading your requests...</Text>
          </View>
        ) : filteredRequests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-open-outline" size={48} color={colors.textSecondary} style={styles.emptyIcon} />
            <Text style={styles.emptyText}>No requests found</Text>
            <Text style={styles.emptySubtext}>
              {filter === 'all'
                ? 'You haven\'t submitted any requests yet.\nVisit Member Connect to get started!'
                : filter === 'pending'
                ? 'No pending requests at the moment'
                : 'No replies yet from admin'}
            </Text>
          </View>
        ) : (
          filteredRequests.map(renderRequestCard)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
