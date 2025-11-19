import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function MakePayment() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (router.canGoBack() ? router.back() : router.push('/(tabs)'))} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Make Online Payment</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="card" size={64} color="#6200ee" />
        </View>

        <Text style={styles.title}>Online Payment</Text>
        <Text style={styles.subtitle}>Coming Soon!</Text>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="checkmark-circle" size={20} color="#00897b" />
            <Text style={styles.infoText}>Secure payment gateway</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="checkmark-circle" size={20} color="#00897b" />
            <Text style={styles.infoText}>Multiple payment methods</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="checkmark-circle" size={20} color="#00897b" />
            <Text style={styles.infoText}>Instant receipt generation</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="checkmark-circle" size={20} color="#00897b" />
            <Text style={styles.infoText}>Auto-update due dates</Text>
          </View>
        </View>

        <View style={styles.noteCard}>
          <Ionicons name="information-circle" size={24} color="#1976d2" />
          <View style={styles.noteContent}>
            <Text style={styles.noteTitle}>Current Payment Methods</Text>
            <Text style={styles.noteText}>
              For now, please make payments through cash to the admin. Online payment integration will be available soon.
            </Text>
          </View>
        </View>

        <View style={styles.contactCard}>
          <Text style={styles.contactTitle}>Need Help?</Text>
          <Text style={styles.contactText}>
            Contact admin for payment assistance or to record your cash payment.
          </Text>
        </View>
      </ScrollView>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f3e5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#6200ee',
    marginBottom: 32,
  },
  infoCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  noteCard: {
    width: '100%',
    flexDirection: 'row',
    backgroundColor: '#e3f2fd',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  noteContent: {
    flex: 1,
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976d2',
    marginBottom: 4,
  },
  noteText: {
    fontSize: 13,
    color: '#1976d2',
    lineHeight: 20,
  },
  contactCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  contactText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});