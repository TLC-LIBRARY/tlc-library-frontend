import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function MyIssues() {
  const { colors } = useTheme();
  const { token, user } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [issues, setIssues] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

  useEffect(() => {
    loadIssues();
  }, [activeTab]);

  const loadIssues = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (activeTab === 'active') {
        params.status = 'issued';
      }

      const response = await axios.get(`${API_URL}/api/users/${user?.id}/issues`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      setIssues(response.data.issues || []);
    } catch (error) {
      console.error('Error loading issues:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadIssues();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'issued':
        return '#2196F3';
      case 'returned':
        return '#4CAF50';
      case 'overdue':
        return '#f44336';
      default:
        return '#999';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'issued':
        return 'book';
      case 'returned':
        return 'checkmark-circle';
      case 'overdue':
        return 'alert-circle';
      default:
        return 'book-outline';
    }
  };

  const renderIssue = (issue: any) => {
    const isOverdue = issue.status === 'overdue' || (issue.status === 'issued' && new Date(issue.due_date) < new Date());
    const daysRemaining = Math.ceil((new Date(issue.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

    return (
      <View key={issue._id} style={styles.issueCard}>
        <View style={styles.issueHeader}>
          <View style={styles.issueIcon}>
            <Ionicons name={getStatusIcon(issue.status)} size={32} color={getStatusColor(issue.status)} />
          </View>
          <View style={styles.issueInfo}>
            <Text style={[styles.issueTitle, { color: colors.text }]} numberOfLines={2}>
              {issue.book_title}
            </Text>
            <Text style={styles.issueAuthors} numberOfLines={1}>
              {issue.book_authors?.join(', ') || 'Unknown'}
            </Text>
          </View>
        </View>

        <View style={styles.issueMeta}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Issued:</Text>
            <Text style={styles.metaValue}>{new Date(issue.issue_date).toLocaleDateString()}</Text>
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Due Date:</Text>
            <Text style={[styles.metaValue, isOverdue && { color: '#f44336' }]}>
              {new Date(issue.due_date).toLocaleDateString()}
            </Text>
          </View>

          {issue.status === 'issued' && (
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Days Remaining:</Text>
              <Text style={[styles.metaValue, { color: daysRemaining < 3 ? '#f44336' : '#4CAF50' }]}>
                {daysRemaining > 0 ? `${daysRemaining} days` : 'Overdue'}
              </Text>
            </View>
          )}

          {issue.status === 'returned' && issue.returned_date && (
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Returned:</Text>
              <Text style={styles.metaValue}>{new Date(issue.returned_date).toLocaleDateString()}</Text>
            </View>
          )}

          {issue.fine_amount > 0 && (
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Fine:</Text>
              <Text style={[styles.metaValue, { color: '#f44336' }]}>₹{issue.fine_amount.toFixed(2)}</Text>
            </View>
          )}
        </View>

        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(issue.status) }]}>
          <Text style={styles.statusText}>{issue.status.toUpperCase()}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Issues</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'active' && { borderBottomColor: colors.primary }]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabText, activeTab === 'active' && { color: colors.primary }]}>Active</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && { borderBottomColor: colors.primary }]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && { color: colors.primary }]}>History</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading issues...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        >
          {issues.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="book-outline" size={64} color="#ccc" />
              <Text style={[styles.emptyText, { color: colors.text }]}>
                {activeTab === 'active' ? 'No active issues' : 'No history found'}
              </Text>
            </View>
          ) : (
            issues.map(renderIssue)
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
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#999',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  issueCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  issueHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  issueIcon: {
    marginRight: 12,
  },
  issueInfo: {
    flex: 1,
  },
  issueTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  issueAuthors: {
    fontSize: 13,
    color: '#666',
  },
  issueMeta: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
    gap: 8,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaLabel: {
    fontSize: 14,
    color: '#666',
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
  },
});
