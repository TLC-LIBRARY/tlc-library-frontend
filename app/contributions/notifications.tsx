import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../utils/api';
import { format } from 'date-fns';


interface Notification {
  notification_id: string;
  title: string;
  message: string;
  notification_type: string;
  created_at: string;
  read_by: string[];
}

type FilterType = 'all' | 'unread';

export default function Notifications() {
  const { token, user } = useAuth();
  const { colors, isDarkMode } = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const response = await api.get('/api/notifications/');
      setNotifications(response.data);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  const handleNotificationPress = (notification: Notification) => {
    setSelectedNotification(notification);
    setModalVisible(true);
    // Mark as read if unread
    if (isUnread(notification)) {
      markAsRead(notification.notification_id);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await api.post(`/api/notifications/${notificationId}/read/`, {});
      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          n.notification_id === notificationId 
            ? { ...n, read_by: [...n.read_by, user?.email || ''] }
            : n
        )
      );
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const getIconName = (type: string) => {
    switch (type) {
      case 'success': return 'checkmark-circle';
      case 'warning': return 'warning';
      case 'alert': return 'alert-circle';
      default: return 'information-circle';
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'success': return colors.success;
      case 'warning': return '#ff9800';
      case 'alert': return colors.error;
      default: return colors.primary;
    }
  };

  const isUnread = (notification: Notification) => {
    return !notification.read_by?.includes(user?.email || '');
  };

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => isUnread(n))
    : notifications;

  const unreadCount = notifications.filter(n => isUnread(n)).length;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    backButton: {
      padding: 4,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },
    filterContainer: {
      flexDirection: 'row',
      gap: 8,
    },
    filterButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: isDarkMode ? colors.border : '#f0f0f0',
      gap: 6,
    },
    filterButtonActive: {
      backgroundColor: colors.primary,
    },
    filterButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    filterButtonTextActive: {
      color: '#fff',
    },
    filterBadge: {
      backgroundColor: isDarkMode ? colors.surface : '#fff',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
      minWidth: 20,
      alignItems: 'center',
    },
    filterBadgeText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.text,
    },
    content: {
      padding: 16,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 100,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.textSecondary,
      marginTop: 16,
    },
    emptySubtext: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 8,
    },
    notificationCard: {
      backgroundColor: colors.surface,
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
      backgroundColor: isDarkMode ? colors.border : '#f3f0ff',
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
    },
    notificationHeader: {
      flexDirection: 'row',
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    notificationContent: {
      flex: 1,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    notificationTitle: {
      flex: 1,
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    unreadTitle: {
      fontWeight: '700',
      color: colors.text,
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.primary,
      marginLeft: 8,
    },
    notificationMessage: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: 8,
    },
    notificationTime: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
    },
    modalContainer: {
      width: '100%',
      maxWidth: 500,
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 24,
      maxHeight: '80%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 16,
    },
    modalIconContainer: {
      width: 60,
      height: 60,
      borderRadius: 30,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalCloseButton: {
      padding: 4,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 16,
    },
    modalDivider: {
      height: 1,
      backgroundColor: colors.border,
      marginBottom: 16,
    },
    modalMessage: {
      fontSize: 16,
      color: colors.text,
      lineHeight: 24,
      marginBottom: 24,
    },
    modalFooter: {
      marginBottom: 24,
      gap: 8,
    },
    modalTimeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    modalTime: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    modalButton: {
      backgroundColor: colors.primary,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
    },
    modalButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <TouchableOpacity onPress={onRefresh}>
            <Ionicons name="refresh" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
        
        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === 'all' && styles.filterButtonActive
            ]}
            onPress={() => setFilter('all')}
          >
            <Text style={[
              styles.filterButtonText,
              filter === 'all' && styles.filterButtonTextActive
            ]}>
              All
            </Text>
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{notifications.length}</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterButton,
              filter === 'unread' && styles.filterButtonActive
            ]}
            onPress={() => setFilter('unread')}
          >
            <Text style={[
              styles.filterButtonText,
              filter === 'unread' && styles.filterButtonTextActive
            ]}>
              Unread
            </Text>
            {unreadCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {filteredNotifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons 
              name={filter === 'unread' ? "checkmark-done-circle-outline" : "notifications-off-outline"} 
              size={64} 
              color={colors.textSecondary} 
            />
            <Text style={styles.emptyText}>
              {filter === 'unread' ? 'All caught up!' : 'No notifications yet'}
            </Text>
            <Text style={styles.emptySubtext}>
              {filter === 'unread' 
                ? "You've read all your notifications" 
                : "You'll see updates and messages here"}
            </Text>
          </View>
        ) : (
          filteredNotifications.map((notification) => {
            const unread = isUnread(notification);
            return (
              <TouchableOpacity
                key={notification.notification_id}
                style={[
                  styles.notificationCard,
                  unread && styles.unreadCard
                ]}
                onPress={() => handleNotificationPress(notification)}
                activeOpacity={0.7}
              >
                <View style={styles.notificationHeader}>
                  <View style={[
                    styles.iconContainer, 
                    { backgroundColor: `${getIconColor(notification.notification_type)}20` }
                  ]}>
                    <Ionicons 
                      name={getIconName(notification.notification_type) as any} 
                      size={24} 
                      color={getIconColor(notification.notification_type)} 
                    />
                  </View>
                  <View style={styles.notificationContent}>
                    <View style={styles.titleRow}>
                      <Text style={[styles.notificationTitle, unread && styles.unreadTitle]}>
                        {notification.title}
                      </Text>
                      {unread && <View style={styles.unreadDot} />}
                    </View>
                    <Text style={styles.notificationMessage}>{notification.message}</Text>
                    <Text style={styles.notificationTime}>
                      {format(new Date(notification.created_at), 'dd MMM yyyy, hh:mm a')}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Notification Detail Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={styles.modalContainer}
          >
            <View style={styles.modalContent}>
              {selectedNotification && (
                <>
                  <View style={styles.modalHeader}>
                    <View style={[
                      styles.modalIconContainer,
                      { backgroundColor: `${getIconColor(selectedNotification.notification_type)}20` }
                    ]}>
                      <Ionicons
                        name={getIconName(selectedNotification.notification_type) as any}
                        size={32}
                        color={getIconColor(selectedNotification.notification_type)}
                      />
                    </View>
                    <TouchableOpacity
                      onPress={() => setModalVisible(false)}
                      style={styles.modalCloseButton}
                    >
                      <Ionicons name="close" size={24} color={colors.text} />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.modalTitle}>{selectedNotification.title}</Text>
                  
                  <View style={styles.modalDivider} />
                  
                  <Text style={styles.modalMessage}>{selectedNotification.message}</Text>
                  
                  <View style={styles.modalFooter}>
                    <View style={styles.modalTimeContainer}>
                      <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                      <Text style={styles.modalTime}>
                        {format(new Date(selectedNotification.created_at), 'EEEE, dd MMMM yyyy')}
                      </Text>
                    </View>
                    <View style={styles.modalTimeContainer}>
                      <Ionicons name="time" size={16} color={colors.textSecondary} />
                      <Text style={styles.modalTime}>
                        {format(new Date(selectedNotification.created_at), 'hh:mm a')}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.modalButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.modalButtonText}>Close</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}