import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../utils/api';

interface FAQ {
  id: string;
  category: string;
  question: string;
  answer: string;
  status: string;
}

export default function FAQScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const { colors } = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [filteredFaqs, setFilteredFaqs] = useState<FAQ[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Record<string, number>>({});

  const categoryIcons: Record<string, string> = {
    'Membership': 'person-circle',
    'Educational Support': 'school',
    'Welfare Contribution': 'heart',
    'Technical': 'settings',
    'General Policy': 'document-text',
    'General': 'information-circle',
  };

  const categoryColors: Record<string, string> = {
    'Membership': '#6200ee',
    'Educational Support': '#00897b',
    'Welfare Contribution': '#ff9800',
    'Technical': '#2196f3',
    'General Policy': '#9c27b0',
    'General': '#757575',
  };

  useEffect(() => {
    loadFAQs();
    loadCategories();
  }, []);

  useEffect(() => {
    filterFAQs();
  }, [searchQuery, selectedCategory, faqs]);

  const loadFAQs = async () => {
    try {
      const response = await api.get('/api/faqs/');
      setFaqs(response.data);
    } catch (error) {
      console.error('Failed to load FAQs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await api.get('/api/faqs/categories');
      setCategories(response.data.categories);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const filterFAQs = () => {
    let filtered = faqs;

    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(faq => faq.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(faq =>
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredFaqs(filtered);
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const renderCategoryTab = (category: string, count: number) => {
    const isSelected = selectedCategory === category;
    const color = categoryColors[category] || colors.primary;

    return (
      <TouchableOpacity
        key={category}
        style={[
          styles.categoryTab,
          { borderColor: color },
          isSelected && { backgroundColor: `${color}20`, borderWidth: 2 }
        ]}
        onPress={() => setSelectedCategory(category)}
        activeOpacity={0.7}
      >
        <Ionicons
          name={categoryIcons[category] as any || 'help-circle'}
          size={18}
          color={isSelected ? color : colors.textSecondary}
        />
        <Text style={[
          styles.categoryTabText,
          { color: isSelected ? color : colors.textSecondary }
        ]}>
          {category}
        </Text>
        {count > 0 && (
          <View style={[styles.countBadge, { backgroundColor: color }]}>
            <Text style={styles.countText}>{count}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderFAQ = (faq: FAQ) => {
    const isExpanded = expandedId === faq.id;
    const color = categoryColors[faq.category] || colors.primary;

    return (
      <TouchableOpacity
        key={faq.id}
        style={[
          styles.faqCard,
          { backgroundColor: colors.surface, borderLeftColor: color }
        ]}
        onPress={() => toggleExpand(faq.id)}
        activeOpacity={0.8}
      >
        <View style={styles.faqHeader}>
          <View style={styles.faqQuestion}>
            <Ionicons
              name={isExpanded ? 'remove-circle' : 'add-circle'}
              size={24}
              color={color}
              style={{ marginRight: 12 }}
            />
            <Text style={[styles.questionText, { color: colors.text, flex: 1 }]}>
              {faq.question}
            </Text>
          </View>
        </View>

        {isExpanded && (
          <View style={styles.faqAnswer}>
            <View style={[styles.categoryBadge, { backgroundColor: `${color}20` }]}>
              <Ionicons
                name={categoryIcons[faq.category] as any}
                size={14}
                color={color}
              />
              <Text style={[styles.categoryBadgeText, { color }]}>
                {faq.category}
              </Text>
            </View>
            <Text style={[styles.answerText, { color: colors.text }]}>
              {faq.answer}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>FAQs</Text>
        <View style={{ width: 24 }} />
      </View>

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
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Category Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContainer}
      >
        <TouchableOpacity
          style={[
            styles.categoryTab,
            { borderColor: colors.primary },
            selectedCategory === 'All' && { backgroundColor: `${colors.primary}20`, borderWidth: 2 }
          ]}
          onPress={() => setSelectedCategory('All')}
        >
          <Ionicons
            name="apps"
            size={18}
            color={selectedCategory === 'All' ? colors.primary : colors.textSecondary}
          />
          <Text style={[
            styles.categoryTabText,
            { color: selectedCategory === 'All' ? colors.primary : colors.textSecondary }
          ]}>
            All
          </Text>
        </TouchableOpacity>

        {Object.entries(categories).map(([category, count]) =>
          renderCategoryTab(category, count)
        )}
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
                {searchQuery ? 'No FAQs match your search' : 'No FAQs found in this category'}
              </Text>
              <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                Try refining your search or selecting a different category
              </Text>
            </View>
          ) : (
            <>
              <Text style={[styles.resultCount, { color: colors.textSecondary }]}>
                {filteredFaqs.length} {filteredFaqs.length === 1 ? 'FAQ' : 'FAQs'} found
              </Text>
              {filteredFaqs.map(renderFAQ)}
            </>
          )}

          {/* Still Need Help Section */}
          <View style={[styles.helpSection, { backgroundColor: colors.surface }]}>
            <Ionicons name="chatbubble-ellipses" size={32} color={colors.primary} />
            <Text style={[styles.helpTitle, { color: colors.text }]}>
              Still Need Help?
            </Text>
            <Text style={[styles.helpSubtitle, { color: colors.textSecondary }]}>
              Can't find what you're looking for? Contact our support team
            </Text>
            <TouchableOpacity
              style={[styles.helpButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/member-connect/help-support')}
            >
              <Ionicons name="send" size={18} color="#fff" />
              <Text style={styles.helpButtonText}>Contact Support</Text>
            </TouchableOpacity>
          </View>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  categoryScroll: {
    maxHeight: 60,
  },
  categoryContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
    marginRight: 8,
  },
  categoryTabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  countBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
    paddingHorizontal: 6,
  },
  countText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
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
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  faqQuestion: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  faqAnswer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 12,
    gap: 6,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  answerText: {
    fontSize: 15,
    lineHeight: 24,
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
  helpSection: {
    marginTop: 24,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  helpTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
  },
  helpSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  helpButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
