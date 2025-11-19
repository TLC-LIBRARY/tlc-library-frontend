import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Picker } from '@react-native-picker/picker';
import api from '../../utils/api';


interface FAQ {
  id: string;
  category: string;
  question: string;
  answer: string;
  status: string;
  created_by: string | null;
  updated_by: string | null;
}

const CATEGORIES = ['Membership', 'Educational Support', 'Welfare Contribution', 'Technical', 'General Policy', 'General'];

export default function AdminFAQManagement() {
  const { token } = useAuth();
  const router = useRouter();
  const { colors } = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [filteredFaqs, setFilteredFaqs] = useState<FAQ[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState<any>(null);
  
  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [formData, setFormData] = useState({
    category: 'Membership',
    question: '',
    answer: '',
    status: 'Active',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadFAQs();
    loadStats();
  }, []);

  useEffect(() => {
    filterFAQs();
  }, [selectedFilter, searchQuery, faqs]);

  const loadFAQs = async () => {
    try {
      const response = await api.get('/api/faqs/admin/all');
      setFaqs(response.data);
    } catch (error) {
      console.error('Failed to load FAQs:', error);
      Alert.alert('Error', 'Failed to load FAQs');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.get('/api/faqs/admin/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const filterFAQs = () => {
    let filtered = faqs;

    if (selectedFilter !== 'all') {
      filtered = filtered.filter(faq => faq.status === selectedFilter);
    }

    if (searchQuery.trim()) {
      filtered = filtered.filter(faq =>
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredFaqs(filtered);
  };

  const openAddModal = () => {
    setEditingFaq(null);
    setFormData({
      category: 'Membership',
      question: '',
      answer: '',
      status: 'Active',
    });
    setModalVisible(true);
  };

  const openEditModal = (faq: FAQ) => {
    setEditingFaq(faq);
    setFormData({
      category: faq.category,
      question: faq.question,
      answer: faq.answer,
      status: faq.status,
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.question.trim() || !formData.answer.trim()) {
      Alert.alert('Validation Error', 'Question and answer are required');
      return;
    }

    setSaving(true);
    try {
      if (editingFaq) {
        // Update existing FAQ
        await api.put(
          `/api/faqs/admin/${editingFaq.id}`,
          formData
        );
        Alert.alert('✅ Success', 'FAQ updated successfully');
      } else {
        // Add new FAQ
        await api.post(
          '/api/faqs/admin/add',
          formData
        );
        Alert.alert('✅ Success', 'FAQ added successfully');
      }
      
      setModalVisible(false);
      loadFAQs();
      loadStats();
    } catch (error: any) {
      console.error('Save error:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to save FAQ');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (faqId: string) => {
    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to delete this FAQ? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/api/faqs/admin/${faqId}`);
              Alert.alert('✅ Success', 'FAQ deleted successfully');
              loadFAQs();
              loadStats();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete FAQ');
            }
          }
        }
      ]
    );
  };

  const handleToggleStatus = async (faqId: string) => {
    try {
      const response = await api.patch(
        `/api/faqs/admin/status/${faqId}`,
        {}
      );
      Alert.alert('✅ Success', response.data.message);
      loadFAQs();
      loadStats();
    } catch (error) {
      Alert.alert('Error', 'Failed to update FAQ status');
    }
  };

  const renderStatsCard = () => {
    if (!stats) return null;

    return (
      <View style={[styles.statsContainer, { backgroundColor: colors.surface }]}>
        <View style={styles.statCard}>
          <Ionicons name="list" size={24} color="#6200ee" />
          <Text style={[styles.statValue, { color: colors.text }]}>{stats.total}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="checkmark-circle" size={24} color="#4caf50" />
          <Text style={[styles.statValue, { color: colors.text }]}>{stats.active}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Active</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="close-circle" size={24} color="#f44336" />
          <Text style={[styles.statValue, { color: colors.text }]}>{stats.inactive}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Inactive</Text>
        </View>
      </View>
    );
  };

  const renderFAQCard = (faq: FAQ) => {
    const statusColor = faq.status === 'Active' ? '#4caf50' : '#999';

    return (
      <View key={faq.id} style={[styles.faqCard, { backgroundColor: colors.surface }]}>
        <View style={styles.faqCardHeader}>
          <View style={[styles.categoryBadge, { backgroundColor: '#6200ee20' }]}>
            <Text style={[styles.categoryBadgeText, { color: '#6200ee' }]}>
              {faq.category}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {faq.status}
            </Text>
          </View>
        </View>

        <Text style={[styles.faqQuestion, { color: colors.text }]}>
          {faq.question}
        </Text>
        <Text style={[styles.faqAnswer, { color: colors.textSecondary }]} numberOfLines={2}>
          {faq.answer}
        </Text>

        <View style={styles.faqActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#2196f320' }]}
            onPress={() => openEditModal(faq)}
          >
            <Ionicons name="create" size={18} color="#2196f3" />
            <Text style={[styles.actionButtonText, { color: '#2196f3' }]}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: `${statusColor}20` }]}
            onPress={() => handleToggleStatus(faq.id)}
          >
            <Ionicons 
              name={faq.status === 'Active' ? 'eye-off' : 'eye'} 
              size={18} 
              color={statusColor} 
            />
            <Text style={[styles.actionButtonText, { color: statusColor }]}>
              {faq.status === 'Active' ? 'Deactivate' : 'Activate'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#f4433620' }]}
            onPress={() => handleDelete(faq.id)}
          >
            <Ionicons name="trash" size={18} color="#f44336" />
            <Text style={[styles.actionButtonText, { color: '#f44336' }]}>Delete</Text>
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Manage FAQs</Text>
        <TouchableOpacity onPress={openAddModal}>
          <Ionicons name="add-circle" size={28} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      {renderStatsCard()}

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
        <Ionicons name="search" size={20} color={colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search FAQs..."
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
        {['all', 'Active', 'Inactive'].map((filter) => (
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

      {/* FAQs List */}
      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView style={styles.faqsList} contentContainerStyle={styles.faqsListContent}>
          {filteredFaqs.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="help-circle-outline" size={64} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No FAQs found
              </Text>
            </View>
          ) : (
            <>
              <Text style={[styles.resultCount, { color: colors.textSecondary }]}>
                {filteredFaqs.length} {filteredFaqs.length === 1 ? 'FAQ' : 'FAQs'}
              </Text>
              {filteredFaqs.map(renderFAQCard)}
            </>
          )}
        </ScrollView>
      )}

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingFaq ? 'Edit FAQ' : 'Add New FAQ'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={[styles.label, { color: colors.text }]}>Category</Text>
              <View style={[styles.pickerContainer, { backgroundColor: colors.background }]}>
                <Picker
                  selectedValue={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                  style={[styles.picker, { color: colors.text }]}
                >
                  {CATEGORIES.map((cat) => (
                    <Picker.Item key={cat} label={cat} value={cat} />
                  ))}
                </Picker>
              </View>

              <Text style={[styles.label, { color: colors.text }]}>Question *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                placeholder="Enter FAQ question..."
                placeholderTextColor={colors.textSecondary}
                value={formData.question}
                onChangeText={(text) => setFormData({ ...formData, question: text })}
                multiline
              />

              <Text style={[styles.label, { color: colors.text }]}>Answer *</Text>
              <TextInput
                style={[styles.textArea, { backgroundColor: colors.background, color: colors.text }]}
                placeholder="Enter FAQ answer..."
                placeholderTextColor={colors.textSecondary}
                value={formData.answer}
                onChangeText={(text) => setFormData({ ...formData, answer: text })}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />

              <Text style={[styles.label, { color: colors.text }]}>Status</Text>
              <View style={[styles.pickerContainer, { backgroundColor: colors.background }]}>
                <Picker
                  selectedValue={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                  style={[styles.picker, { color: colors.text }]}
                >
                  <Picker.Item label="Active" value="Active" />
                  <Picker.Item label="Inactive" value="Inactive" />
                </Picker>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: colors.primary }]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>
                  {editingFaq ? 'Update FAQ' : 'Add FAQ'}
                </Text>
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
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
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
  faqsList: {
    flex: 1,
  },
  faqsListContent: {
    padding: 16,
  },
  resultCount: {
    fontSize: 13,
    marginBottom: 12,
  },
  faqCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  faqCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '700',
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
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  faqAnswer: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  faqActions: {
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
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalBody: {
    maxHeight: 400,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  pickerContainer: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  input: {
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    minHeight: 50,
  },
  textArea: {
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    minHeight: 120,
  },
  saveButton: {
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
