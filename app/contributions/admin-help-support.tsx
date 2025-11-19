import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../utils/api';
import { format } from 'date-fns';


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

export default function AdminHelpSupport() {
  const { token } = useAuth();
  const router = useRouter();
  const { colors } = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState<any>(null);
  
  // Reply Modal
  const [replyModalVisible, setReplyModalVisible] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);

  useEffect(() => {
    loadMessages();
    loadStats();
  }, []);

  useEffect(() => {
    filterMessages();
  }, [selectedFilter, searchQuery, messages]);

  const loadMessages = async () => {
    try {
      const response = await api.get(`/api/help-support/admin/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(response.data);
    } catch (error) {
      console.error('Failed to load messages:', error);
      Alert.alert('Error', 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.get(`/api/help-support/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const filterMessages = () => {
    let filtered = messages;

    if (selectedFilter !== 'all') {
      filtered = filtered.filter(msg => msg.status === selectedFilter);
    }

    if (searchQuery.trim()) {
      filtered = filtered.filter(msg =>
        msg.member_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        msg.message_text.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredMessages(filtered);
  };

  const openReplyModal = (message: Message) => {
    setSelectedMessage(message);
    setReplyText(message.admin_reply || '');
    setReplyModalVisible(true);
  };

  const handleReply = async () => {
    if (!replyText.trim()) {
      Alert.alert('Validation Error', 'Please enter a reply message');
      return;
    }

    setReplying(true);
    try {
      await axios.post(
        `${API_URL}/api/help-support/admin/reply/${selectedMessage?.id}`,
        { admin_reply: replyText.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      Alert.alert('Success', 'Reply sent successfully! Member will receive notification.');
      setReplyModalVisible(false);
      setReplyText('');
      loadMessages();
      loadStats();
    } catch (error: any) {
      console.error('Reply error:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to send reply');
    } finally {
      setReplying(false);
    }
  };

  const handleUpdateStatus = async (messageId: string, newStatus: string) => {
    try {
      await axios.patch(
        `${API_URL}/api/help-support/admin/status/${messageId}`,
        null,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { status: newStatus }
        }
      );
      Alert.alert('Success', `Message marked as ${newStatus}`);
      loadMessages();
      loadStats();
    } catch (error) {
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const handleDelete = async (messageId: string) => {
    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to delete this message?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/api/help-support/admin/${messageId}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              Alert.alert('Success', 'Message deleted successfully');
              loadMessages();
              loadStats();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete message');
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return '#ff9800';
      case 'Responded': return '#4caf50';
      case 'Resolved': return '#2196f3';
      default: return '#999';
    }
  };

  const getCategoryIcon = (subject: string) => {
    if (subject.includes('Payment')) return 'card';
    if (subject.includes('Educational')) return 'school';
    if (subject.includes('Welfare')) return 'heart';
    if (subject.includes('Technical')) return 'settings';
    return 'help-circle';
  };

  const renderStatsCard = () => {
    if (!stats) return null;

    return (
      <View style={[styles.statsContainer, { backgroundColor: colors.surface }]}>
        <View style={styles.statCard}>
          <Ionicons name="mail" size={24} color="#6200ee" />
          <Text style={[styles.statValue, { color: colors.text }]}>{stats.total}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="time" size={24} color="#ff9800" />
          <Text style={[styles.statValue, { color: colors.text }]}>{stats.pending}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Pending</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="checkmark-circle" size={24} color="#4caf50" />
          <Text style={[styles.statValue, { color: colors.text }]}>{stats.responded}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Responded</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="checkmark-done-circle" size={24} color="#2196f3" />
          <Text style={[styles.statValue, { color: colors.text }]}>{stats.resolved}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Resolved</Text>
        </View>
      </View>
    );
  };

  const renderMessageCard = (message: Message) => {
    const statusColor = getStatusColor(message.status);

    return (
      <View key={message.id} style={[styles.messageCard, { backgroundColor: colors.surface, borderLeftColor: statusColor }]}>
        <View style={styles.messageHeader}>
          <View style={styles.memberInfo}>
            <View style={styles.memberRow}>
              <Ionicons name="person-circle" size={20} color={colors.primary} />
              <Text style={[styles.memberName, { color: colors.text }]}>
                {message.member_name}
              </Text>
            </View>
            <Text style={[styles.memberId, { color: colors.textSecondary }]}>
              {message.member_id}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {message.status}
            </Text>
          </View>
        </View>

        <View style={styles.categoryRow}>
          <Ionicons name={getCategoryIcon(message.subject) as any} size={16} color={colors.primary} />
          <Text style={[styles.categoryText, { color: colors.primary }]}>
            {message.subject}
          </Text>
        </View>

        <Text style={[styles.messageText, { color: colors.text }]} numberOfLines={3}>
          {message.message_text}
        </Text>

        {message.file_upload && (
          <View style={[styles.attachmentRow, { backgroundColor: colors.background }]}>
            <Ionicons name="document-attach" size={16} color={colors.primary} />
            <Text style={[styles.attachmentText, { color: colors.textSecondary }]}>
              File attached
            </Text>
          </View>
        )}

        {message.admin_reply && (
          <View style={[styles.replyPreview, { backgroundColor: `${colors.primary}10` }]}>
            <Ionicons name="chatbubble-ellipses" size={16} color={colors.primary} />
            <Text style={[styles.replyPreviewText, { color: colors.text }]} numberOfLines={2}>
              {message.admin_reply}
            </Text>
          </View>
        )}

        <View style={styles.messageFooter}>
          <Text style={[styles.dateText, { color: colors.textSecondary }]}>
            {format(new Date(message.created_at), 'dd MMM yyyy, hh:mm a')}
          </Text>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#2196f320' }]}
            onPress={() => openReplyModal(message)}
          >
            <Ionicons name="chatbubble" size={16} color="#2196f3" />
            <Text style={[styles.actionButtonText, { color: '#2196f3' }]}>
              {message.admin_reply ? 'View Reply' : 'Reply'}
            </Text>
          </TouchableOpacity>

          {message.status !== 'Resolved' && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#4caf5020' }]}
              onPress={() => handleUpdateStatus(message.id, 'Resolved')}
            >
              <Ionicons name="checkmark-done" size={16} color="#4caf50" />
              <Text style={[styles.actionButtonText, { color: '#4caf50' }]}>
                Resolve
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#f4433620' }]}
            onPress={() => handleDelete(message.id)}
          >
            <Ionicons name="trash" size={16} color="#f44336" />
            <Text style={[styles.actionButtonText, { color: '#f44336' }]}>
              Delete
            </Text>
          </TouchableOpacity>
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Help & Support</Text>
        <View style={{ width: 24 }} />
      </View>

      {renderStatsCard()}

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
        <Ionicons name="search" size={20} color={colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search messages..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
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
        <ScrollView style={styles.messagesList} contentContainerStyle={styles.messagesListContent}>
          {filteredMessages.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="chatbubbles-outline" size={64} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No messages found
              </Text>
            </View>
          ) : (
            <>
              <Text style={[styles.resultCount, { color: colors.textSecondary }]}>
                {filteredMessages.length} {filteredMessages.length === 1 ? 'message' : 'messages'}
              </Text>
              {filteredMessages.map(renderMessageCard)}
            </>
          )}
        </ScrollView>
      )}

      {/* Reply Modal */}
      <Modal visible={replyModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Reply to {selectedMessage?.member_name}
              </Text>
              <TouchableOpacity onPress={() => setReplyModalVisible(false)}>
                <Ionicons name="close" size={28} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={[styles.originalMessage, { backgroundColor: colors.background }]}>
                <Text style={[styles.originalMessageLabel, { color: colors.textSecondary }]}>
                  Original Message:
                </Text>
                <Text style={[styles.originalMessageText, { color: colors.text }]}>
                  {selectedMessage?.message_text}
                </Text>
              </View>

              <Text style={[styles.label, { color: colors.text }]}>Your Reply *</Text>
              <TextInput
                style={[styles.textArea, { backgroundColor: colors.background, color: colors.text }]}
                placeholder="Type your reply here..."
                placeholderTextColor={colors.textSecondary}
                value={replyText}
                onChangeText={setReplyText}
                multiline
                numberOfLines={8}
                textAlignVertical="top"
              />

              <View style={[styles.infoBox, { backgroundColor: `${colors.primary}15` }]}>
                <Ionicons name="information-circle" size={20} color={colors.primary} />
                <Text style={[styles.infoText, { color: colors.text }]}>
                  Member will receive an email and in-app notification with your reply.
                </Text>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[styles.sendButton, { backgroundColor: colors.primary }]}
              onPress={handleReply}
              disabled={replying}
            >
              {replying ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="send" size={18} color="#fff" />
                  <Text style={styles.sendButtonText}>Send Reply</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
  },
  statCard: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  filterScroll: {
    maxHeight: 60,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
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
    marginBottom: 12,
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
    marginBottom: 12,
  },
  memberInfo: {
    flex: 1,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
  },
  memberId: {
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
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
  replyPreview: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  replyPreviewText: {
    flex: 1,
    fontSize: 14,
  },
  messageFooter: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    marginBottom: 12,
  },
  dateText: {
    fontSize: 12,
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
    gap: 4,
  },
  actionButtonText: {
    fontSize: 13,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  modalBody: {
    maxHeight: 400,
  },
  originalMessage: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  originalMessageLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  originalMessageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  textArea: {
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    minHeight: 120,
    marginBottom: 16,
  },
  infoBox: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
