import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Platform, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import { format } from 'date-fns';


interface Message {
  id: string;
  name: string;
  email: string;
  message: string;
  created_at: string;
  read: boolean;
  type: string;
  book_title?: string;
  author?: string;
}

export default function AdminMessages() {
  const { token } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      const response = await api.get(`/api/contact/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(response.data);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (messageId: string) => {
    try {
      await axios.patch(
        `${API_URL}/api/contact/messages/${messageId}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update local state
      setMessages(messages.map(msg => 
        msg.id === messageId ? { ...msg, read: true } : msg
      ));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleDelete = async (messageId: string) => {
    const confirmDelete = Platform.OS === 'web' 
      ? window.confirm('Are you sure you want to delete this message?')
      : true; // On mobile, we'd use Alert.alert

    if (!confirmDelete) return;

    try {
      await axios.delete(
        `${API_URL}/api/contact/messages/${messageId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setMessages(messages.filter(msg => msg.id !== messageId));
      
      if (Platform.OS === 'web') {
        alert('Message deleted successfully');
      }
    } catch (error) {
      console.error('Failed to delete message:', error);
      if (Platform.OS === 'web') {
        alert('Failed to delete message');
      }
    }
  };

  const handleCopyEmail = (email: string, message: Message) => {
    // Copy email to clipboard
    if (Platform.OS === 'web') {
      navigator.clipboard.writeText(email).then(() => {
        alert(`Email copied: ${email}\n\nYou can now paste it in your Hostinger webmail.\n\nSuggested Subject: ${message.type === 'book_request' ? `Re: Book Request - ${message.book_title}` : 'Re: Your Message'}`);
      }).catch(() => {
        alert(`Email: ${email}\n\nPlease copy this email and use it in your Hostinger webmail.`);
      });
    }
  };

  const handleEmailReply = (email: string, message: Message) => {
    console.log(`Preparing reply to: ${email} for message from ${message.name}`);
    
    // For web, show options since webmail users can't use mailto
    if (Platform.OS === 'web') {
      const options = `Reply to: ${email}\n\nChoose an option:\n\n1. Copy Email (for Hostinger webmail)\n2. Open in desktop email client\n\nNote: If you use web-based email (Hostinger, Gmail web, etc.), choose option 1.`;
      
      const useCopy = window.confirm(options + '\n\nClick OK to Copy Email, Cancel to open email client');
      
      if (useCopy) {
        // Copy email option
        handleCopyEmail(email, message);
        return;
      }
    }
    
    // Create context-aware subject line for email client
    let subject = '';
    let body = '';
    
    if (message.type === 'book_request' && message.book_title) {
      subject = `Re: Book Request - ${message.book_title}`;
      body = `Dear ${message.name},\n\nThank you for your book request.\n\n`;
      if (message.book_title) {
        body += `Book: ${message.book_title}\n`;
      }
      if (message.author) {
        body += `Author: ${message.author}\n`;
      }
      body += `\nWe have received your request and will update you soon.\n\nBest regards,\nTLC_LIBRARY`;
    } else {
      subject = `Re: Your Message - TLC_LIBRARY`;
      body = `Dear ${message.name},\n\nThank you for contacting us.\n\n`;
      body += `Regarding your message: "${message.message.substring(0, 50)}..."\n\n`;
      body += `Best regards,\nTLC_LIBRARY`;
    }
    
    // Open email client
    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(body);
    
    const mailtoUrl = `mailto:${email}?subject=${encodedSubject}&body=${encodedBody}`;
    console.log('Opening mailto URL:', mailtoUrl);
    
    if (Platform.OS === 'web') {
      window.location.href = mailtoUrl;
    } else {
      Linking.openURL(mailtoUrl).catch((err) => {
        console.error('Failed to open email:', err);
        Alert.alert('Error', `Could not open email app.\n\nPlease send email manually to:\n${email}`);
      });
    }
  };

  const toggleExpand = (messageId: string) => {
    if (expandedId === messageId) {
      setExpandedId(null);
    } else {
      setExpandedId(messageId);
      // Mark as read when expanded
      const msg = messages.find(m => m.id === messageId);
      if (msg && !msg.read) {
        handleMarkAsRead(messageId);
      }
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isExpanded = expandedId === item.id;
    const isBookRequest = item.type === 'book_request';
    
    return (
      <TouchableOpacity 
        style={[styles.messageCard, !item.read && styles.unreadCard]}
        onPress={() => toggleExpand(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.messageHeader}>
          <View style={styles.messageInfo}>
            <View style={styles.nameRow}>
              {isBookRequest && <Ionicons name="book" size={18} color="#ff9800" style={{ marginRight: 6 }} />}
              <Text style={styles.name}>{item.name}</Text>
              {!item.read && <View style={styles.unreadBadge} />}
            </View>
            <TouchableOpacity onPress={() => handleEmailReply(item.email, item)} style={styles.emailRow}>
              <Ionicons name="mail" size={14} color="#1976d2" style={{ marginRight: 4 }} />
              <Text style={styles.email}>{item.email}</Text>
            </TouchableOpacity>
            {isBookRequest && item.book_title && (
              <Text style={styles.bookTitle}>📖 {item.book_title}</Text>
            )}
            <Text style={styles.date}>
              {format(new Date(item.created_at), 'MMM dd, yyyy - hh:mm a')}
            </Text>
          </View>
          <Ionicons 
            name={isExpanded ? 'chevron-up' : 'chevron-down'} 
            size={24} 
            color="#6200ee" 
          />
        </View>

        {isExpanded && (
          <View style={styles.expandedContent}>
            <View style={styles.messageDivider} />
            {isBookRequest ? (
              <>
                <Text style={styles.messageLabel}>Book Request Details:</Text>
                <Text style={styles.detailRow}>📚 Title: {item.book_title}</Text>
                {item.author && <Text style={styles.detailRow}>✍️ Author: {item.author}</Text>}
                {item.message && item.message.includes('Additional') && (
                  <>
                    <Text style={styles.messageLabel}>Additional Notes:</Text>
                    <Text style={styles.messageText}>{item.message}</Text>
                  </>
                )}
              </>
            ) : (
              <>
                <Text style={styles.messageLabel}>Message:</Text>
                <Text style={styles.messageText}>{item.message}</Text>
              </>
            )}
            
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={styles.replyButton}
                onPress={() => handleEmailReply(item.email, item)}
              >
                <Ionicons name="mail-outline" size={18} color="#fff" />
                <Text style={styles.replyButtonText}>Reply</Text>
              </TouchableOpacity>
              
              {!item.read && (
                <TouchableOpacity 
                  style={styles.markReadButton}
                  onPress={() => handleMarkAsRead(item.id)}
                >
                  <Ionicons name="checkmark-circle-outline" size={18} color="#00897b" />
                  <Text style={styles.markReadButtonText}>Mark Read</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={() => handleDelete(item.id)}
              >
                <Ionicons name="trash-outline" size={18} color="#d32f2f" />
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const unreadCount = messages.filter(m => !m.read).length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.canGoBack() ? router.back() : router.push('/(tabs)')} 
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Contact Messages</Text>
          {unreadCount > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6200ee" />
          <Text style={styles.loadingText}>Loading messages...</Text>
        </View>
      ) : messages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="mail-open-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No messages yet</Text>
          <Text style={styles.emptySubtext}>
            Contact form messages will appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 4,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerBadge: {
    backgroundColor: '#ff5252',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  headerBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#bbb',
    marginTop: 8,
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
  },
  messageCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#6200ee',
    backgroundColor: '#f3e5f5',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  messageInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  unreadBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6200ee',
  },
  email: {
    fontSize: 14,
    color: '#1976d2',
    marginBottom: 4,
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  bookTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ff9800',
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: '#999',
  },
  expandedContent: {
    marginTop: 12,
  },
  messageDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginBottom: 12,
  },
  messageLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  messageText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    marginBottom: 16,
  },
  detailRow: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6200ee',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  replyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  markReadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  markReadButtonText: {
    color: '#00897b',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  deleteButtonText: {
    color: '#d32f2f',
    fontSize: 14,
    fontWeight: '600',
  },
});
