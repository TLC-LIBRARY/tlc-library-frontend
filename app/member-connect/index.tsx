import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import OverdueAlertBanner from '../../components/OverdueAlertBanner';
import { useTheme } from '../../contexts/ThemeContext';

const MEMBER_CONNECT_OPTIONS = [
  {
    id: 'my-requests',
    title: 'My Requests',
    description: 'Track all your submitted requests',
    icon: 'list',
    color: '#6200ee',
    route: '/member-connect/my-requests',
  },
  {
    id: 'educational-support',
    title: 'Educational Support',
    description: 'Apply for educational advance and track repayments',
    icon: 'school',
    color: '#2196f3',
    route: '/member-connect/educational-support',
  },
  {
    id: 'welfare-contribution',
    title: 'Welfare Contribution',
    description: 'Make voluntary welfare contributions',
    icon: 'heart',
    color: '#9c27b0',
    route: '/member-connect/welfare-contribution',
  },
  {
    id: 'overdue-summary',
    title: 'My Overdue Payments',
    description: 'View and resolve overdue payments',
    icon: 'time',
    color: '#ff9800',
    route: '/member-connect/overdue-summary',
  },
  {
    id: 'book-request',
    title: 'Book Request Corner',
    description: 'Request books not available in TLC_LIBRARY',
    icon: 'book',
    color: '#6200ee',
    route: '/member-connect/book-request',
  },
  {
    id: 'book-box',
    title: 'Book Boxes Request',
    description: 'Request Adhyeta Box or Custom Book Boxes',
    icon: 'cube',
    color: '#ff6f00',
    route: '/member-connect/book-box-request',
  },
  {
    id: 'suggestions',
    title: 'Suggestions & Feedback',
    description: 'Share your ideas and feedback with us',
    icon: 'bulb',
    color: '#00897b',
    route: '/member-connect/suggestions',
  },
  {
    id: 'complaints',
    title: 'Complaints / Issues',
    description: 'Report any issues or concerns',
    icon: 'warning',
    color: '#d32f2f',
    route: '/member-connect/submit-complaint',
  },
  {
    id: 'feedback',
    title: 'Feedback',
    description: 'Share your feedback and rate our services',
    icon: 'star',
    color: '#ff9800',
    route: '/member-connect/submit-feedback',
  },
  {
    id: 'help-support',
    title: 'Help & Support',
    description: 'Get help or view FAQs',
    icon: 'help-circle',
    color: '#4caf50',
    route: '/member-connect/help-support',
  },
];

export default function MemberConnectHome() {
  const { colors } = useTheme();
  const router = useRouter();

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
    content: {
      padding: 16,
    },
    optionCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconContainer: {
      width: 50,
      height: 50,
      borderRadius: 25,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    optionContent: {
      flex: 1,
    },
    optionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    optionDescription: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    chevron: {
      marginLeft: 8,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Member Connect</Text>
        <Text style={styles.headerSubtitle}>Your Voice. Our Action.</Text>
      </View>

      {/* Overdue Alert Banner */}
      <OverdueAlertBanner />

      <ScrollView contentContainerStyle={styles.content}>
        {MEMBER_CONNECT_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={styles.optionCard}
            onPress={() => router.push(option.route as any)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: option.color + '20' }]}>
              <Ionicons name={option.icon as any} size={24} color={option.color} />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>{option.title}</Text>
              <Text style={styles.optionDescription}>{option.description}</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={24}
              color={colors.textSecondary}
              style={styles.chevron}
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
