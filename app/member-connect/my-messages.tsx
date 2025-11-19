import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import axios from 'axios';
import { format } from 'date-fns';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface Message {
  id: string;
  member_id: string;
  member_name: string;
  email: string;
  subject: string;
  message_text: string;
  file_upload: string | null;
  status: string;
  admin_reply: string | null;
  reply_date: string | null;
  created_at: string;
}

export default function MyMessages() {
  const { token } = useAuth();
  const router = useRouter();
  const { colors } = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      const response = await api.get(`/api/help-support/my-messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(response.data);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadMessages();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return '#ff9800';
      case 'Responded': return '#4caf50';
      case 'Resolved': return '#2196f3';
      default: return colors.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending': return 'time';
      case 'Responded': return 'checkmark-circle';
      case 'Resolved': return 'checkmark-done-circle';
      default: return 'help-circle';
    }
  };

  const getCategoryIcon = (subject: string) => {
    if (subject.includes('Payment')) return 'card';
    if (subject.includes('Educational')) return 'school';
    if (subject.includes('Welfare')) return 'heart';
    if (subject.includes('Technical')) return 'settings';
    return 'help-circle';
  };

  const filteredMessages = messages.filter(msg => {
    if (selectedFilter === 'all') return true;
    return msg.status === selectedFilter;
  });

  const renderMessage = (message: Message) => {
    const statusColor = getStatusColor(message.status);

    return (
      <View
        key={message.id}
        style={[styles.messageCard, { backgroundColor: colors.surface, borderLeftColor: statusColor }]}
      >
        {/* Header */}
        <View style={styles.messageHeader}>
          <View style={styles.categoryRow}>
            <Ionicons name={getCategoryIcon(message.subject) as any} size={18} color={colors.primary} />
            <Text style={[styles.categoryText, { color: colors.text }]}>
              {message.subject}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
            <Ionicons name={getStatusIcon(message.status) as any} size={14} color={statusColor} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {message.status}
            </Text>
          </View>
        </View>

        {/* Message Content */}
        <Text style={[styles.messageText, { color: colors.text }]} numberOfLines={3}>
          {message.message_text}
        </Text>

        {/* File Attachment */}
        {message.file_upload && (
          <View style={[styles.attachmentRow, { backgroundColor: colors.background }]}>
            <Ionicons name="document-attach" size={16} color={colors.primary} />
            <Text style={[styles.attachmentText, { color: colors.textSecondary }]}>
              File attached
            </Text>
          </View>
        )}

        {/* Admin Reply */}
        {message.admin_reply && (
          <View style={[styles.replyContainer, { backgroundColor: `${colors.primary}10` }]}>
            <View style={styles.replyHeader}>
              <Ionicons name="person-circle" size={18} color={colors.primary} />
              <Text style={[styles.replyLabel, { color: colors.primary }]}>
                Admin Reply:
              </Text>
            </View>
            <Text style={[styles.replyText, { color: colors.text }]}>
              {message.admin_reply}
            </Text>
            {message.reply_date && (
              <Text style={[styles.replyDate, { color: colors.textSecondary }]}>
                {format(new Date(message.reply_date), 'dd MMM yyyy, hh:mm a')}
              </Text>
            )}
          </View>
        )}

        {/* Footer */}
        <View style={styles.messageFooter}>
          <View style={styles.dateRow}>
            <Ionicons name="calendar" size={14} color={colors.textSecondary} />
            <Text style={[styles.dateText, { color: colors.textSecondary }]}>
              {format(new Date(message.created_at), 'dd MMM yyyy')}
            </Text>
          </View>
          <Text style={[styles.ticketId, { color: colors.textSecondary }]}>
            ID: {message.id.slice(-8)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>My Messages</Text>
        <TouchableOpacity onPress={() => router.push('/member-connect/help-support')}>
          <Ionicons name="add-circle" size={28} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContainer}
      >
        {['all', 'Pending', 'Responded', 'Resolved'].map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterTab,
              { borderColor: colors.border },
              selectedFilter === filter && { backgroundColor: colors.primary, borderColor: colors.primary }
            ]}
            onPress={() => setSelectedFilter(filter)}
          >
            <Text
              style={[
                styles.filterText,
                { color: selectedFilter === filter ? '#fff' : colors.textSecondary }
              ]}
            >
              {filter === 'all' ? 'All' : filter}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Messages List */}
      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView
          style={styles.messagesList}
          contentContainerStyle={styles.messagesListContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
        >
          {filteredMessages.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="chatbubbles-outline" size={64} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No messages found
              </Text>
              <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                {selectedFilter === 'all'
                  ? "You haven't submitted any queries yet"
                  : `No ${selectedFilter.toLowerCase()} messages`}
              </Text>
              <TouchableOpacity
                style={[styles.emptyButton, { backgroundColor: colors.primary }]}
                onPress={() => router.push('/member-connect/help-support')}
              >
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.emptyButtonText}>Submit New Query</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={[styles.resultCount, { color: colors.textSecondary }]}>
                {filteredMessages.length} {filteredMessages.length === 1 ? 'message' : 'messages'}
              </Text>
              {filteredMessages.map(renderMessage)}
            </>
          )}
        </ScrollView>
      )}
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  filterScroll: {
    maxHeight: 60,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  messagesList: {
    flex: 1,
  },
  messagesListContent: {
    padding: 16,
  },
  resultCount: {
    fontSize: 13,
    marginBottom: 12,
  },
  messageCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  attachmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
    gap: 6,
  },
  attachmentText: {
    fontSize: 13,
  },
  replyContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  replyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  replyLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  replyText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 6,
  },
  replyDate: {
    fontSize: 12,
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 12,
  },
  ticketId: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
