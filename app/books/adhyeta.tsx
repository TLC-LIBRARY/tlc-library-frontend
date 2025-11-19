import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function AdhyetaBox() {
  const { colors } = useTheme();
  const { token, user } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [learnerLevel, setLearnerLevel] = useState('11-12');
  const [goals, setGoals] = useState('');
  const [subjects, setSubjects] = useState('');

  const handleSubscribe = async () => {
    if (!goals.trim()) {
      Alert.alert('Required', 'Please enter your learning goals');
      return;
    }

    try {
      setLoading(true);
      const goalsArray = goals.split(',').map(g => g.trim()).filter(g => g);
      const subjectsArray = subjects.split(',').map(s => s.trim()).filter(s => s);

      await axios.post(
        `${API_URL}/api/adhyeta/subscribe`,
        {
          user_id: user?.id,
          learner_level: learnerLevel,
          learning_goals: goalsArray,
          subjects: subjectsArray,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert(
        'Success!',
        'Adhyeta Box subscribed successfully! Your personalized study kit will be curated soon.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to subscribe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Adhyeta Box</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.planCard}>
          <Ionicons name="school" size={48} color={colors.primary} />
          <Text style={styles.planTitle}>Adhyeta Box</Text>
          <Text style={styles.planPrice}>₹300<Text style={styles.planPeriod}>/month</Text></Text>
          <Text style={styles.planDescription}>Personalized study kit for students</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Profile</Text>

          <Text style={styles.label}>Learner Level</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={learnerLevel}
              onValueChange={setLearnerLevel}
              style={styles.picker}
            >
              <Picker.Item label="Class 9-10" value="9-10" />
              <Picker.Item label="Class 11-12" value="11-12" />
              <Picker.Item label="Undergraduate" value="UG" />
              <Picker.Item label="Postgraduate" value="PG" />
              <Picker.Item label="Doctorate" value="Doctorate" />
            </Picker>
          </View>

          <Text style={styles.label}>Learning Goals (comma-separated) *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., NEET, JEE, Board Exams"
            value={goals}
            onChangeText={setGoals}
            multiline
            numberOfLines={3}
          />

          <Text style={styles.label}>Subjects (comma-separated)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Physics, Chemistry, Mathematics"
            value={subjects}
            onChangeText={setSubjects}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.featuresCard}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>What's Included</Text>
          
          <View style={styles.feature}>
            <Ionicons name="book" size={20} color="#4CAF50" />
            <Text style={styles.featureText}>Curated academic books</Text>
          </View>

          <View style={styles.feature}>
            <Ionicons name="document-text" size={20} color="#4CAF50" />
            <Text style={styles.featureText}>Study materials & notes</Text>
          </View>

          <View style={styles.feature}>
            <Ionicons name="school" size={20} color="#4CAF50" />
            <Text style={styles.featureText}>Exam-focused resources</Text>
          </View>

          <View style={styles.feature}>
            <Ionicons name="refresh" size={20} color="#4CAF50" />
            <Text style={styles.featureText}>Monthly curated box</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.subscribeButton, { backgroundColor: colors.primary }]}
          onPress={handleSubscribe}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.subscribeButtonText}>Subscribe - ₹300/month</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  content: { flex: 1 },
  planCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
  },
  planTitle: { fontSize: 24, fontWeight: '700', color: '#333', marginTop: 16 },
  planPrice: { fontSize: 40, fontWeight: '700', color: '#2196F3', marginTop: 8 },
  planPeriod: { fontSize: 20, color: '#666' },
  planDescription: { fontSize: 15, color: '#666', marginTop: 8 },
  formCard: { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 16, padding: 20, borderRadius: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 8, marginTop: 12 },
  pickerContainer: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, marginBottom: 12 },
  picker: { height: 50 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#333',
    textAlignVertical: 'top',
  },
  featuresCard: { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 16, padding: 20, borderRadius: 12 },
  feature: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  featureText: { fontSize: 15, color: '#333' },
  subscribeButton: {
    marginHorizontal: 16,
    marginBottom: 32,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  subscribeButtonText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
