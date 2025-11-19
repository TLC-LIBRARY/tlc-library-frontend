import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

export default function Welcome() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.scrollContent}>
          {/* Header with Logo */}
          <View style={styles.header}>
            <Image 
              source={require('../../assets/library-logo.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>TLC_LIBRARY</Text>
            <Text style={styles.subtitle}>Contribution Management System – Member Interaction & Library Integration</Text>
          </View>

          {/* Features Section */}
          <View style={styles.featuresContainer}>
            <Text style={styles.sectionTitle}>What You'll Get</Text>
            
            <View style={styles.featureCard}>
              <View style={styles.featureIconContainer}>
                <Ionicons name="people" size={28} color="#fff" />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Member Management</Text>
                <Text style={styles.featureDescription}>Register and manage members with multiple contribution plans</Text>
              </View>
            </View>

            <View style={styles.featureCard}>
              <View style={[styles.featureIconContainer, { backgroundColor: '#00897b' }]}>
                <Ionicons name="cash" size={28} color="#fff" />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Payment Tracking</Text>
                <Text style={styles.featureDescription}>Record cash & online payments with automatic receipt generation</Text>
              </View>
            </View>

            <View style={styles.featureCard}>
              <View style={[styles.featureIconContainer, { backgroundColor: '#1976d2' }]}>
                <Ionicons name="stats-chart" size={28} color="#fff" />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Dashboard & Reports</Text>
                <Text style={styles.featureDescription}>Track contributions, view stats & generate reports</Text>
              </View>
            </View>

            <View style={styles.featureCard}>
              <View style={[styles.featureIconContainer, { backgroundColor: '#ff9800' }]}>
                <Ionicons name="receipt" size={28} color="#fff" />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Automatic Receipts</Text>
                <Text style={styles.featureDescription}>Generate receipts for all transactions instantly</Text>
              </View>
            </View>
          </View>

          {/* Login Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.adminButton}
              onPress={() => router.push('/(auth)/admin-login')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#6200ee', '#7c4dff']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientButton}
              >
                <Ionicons name="shield-checkmark" size={24} color="#fff" />
                <Text style={styles.buttonText}>Admin Login</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.memberButton}
              onPress={() => router.push('/(auth)/login')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#00897b', '#26a69a']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientButton}
              >
                <Ionicons name="person" size={24} color="#fff" />
                <Text style={styles.buttonText}>Member Login</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.registerLink}
            onPress={() => router.push('/(auth)/register')}
          >
            <Text style={styles.registerText}>Don't have an account? <Text style={styles.signUpText}>Sign Up</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flexGrow: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  featuresContainer: {
    marginTop: 20,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#6200ee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  buttonContainer: {
    marginTop: 30,
    gap: 16,
  },
  adminButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#6200ee',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  memberButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#00897b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    gap: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  registerLink: {
    marginTop: 20,
    alignItems: 'center',
    paddingVertical: 12,
  },
  registerText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  signUpText: {
    color: '#6200ee',
    fontWeight: '700',
  },
});