import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  Switch,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../utils/api';
import { Picker } from '@react-native-picker/picker';

interface PlanFeature {
  feature_name: string;
  feature_value: string;
  included: boolean;
}

interface Plan {
  plan_id: string;
  plan_name: string;
  plan_type: string;
  billing_cycle: string;
  duration_months: number;
  price: number;
  original_price?: number;
  discount_percentage?: number;
  features: PlanFeature[];
  description: string;
  access_hours: string;
  max_books_per_month?: number;
  priority_support: boolean;
  digital_library_access: boolean;
  is_active: boolean;
  max_subscribers?: number;
  current_subscribers: number;
  tags: string[];
  benefits: string[];
  restrictions: string[];
}

const PLAN_TYPES = ['Basic', 'Standard', 'Premium'];
const BILLING_CYCLES = ['Monthly', 'Quarterly', 'Half-Yearly', 'Yearly'];

export default function AdminPlansManagement() {
  const { colors } = useTheme();
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    plan_name: '',
    plan_type: 'Basic',
    billing_cycle: 'Monthly',
    price: '',
    original_price: '',
    description: '',
    access_hours: '9 AM - 9 PM',
    max_books_per_month: '10',
    priority_support: false,
    digital_library_access: false,
    is_active: true,
    max_subscribers: '100',
    sort_order: '1',
    features: [
      { feature_name: 'Access Hours', feature_value: '9 AM - 9 PM', included: true },
      { feature_name: 'Books Per Month', feature_value: '10 books', included: true },
      { feature_name: 'Reading Space', feature_value: 'Dedicated seating', included: true },
    ],
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/plans/admin/all');
      setPlans(response.data.plans || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
      Alert.alert('Error', 'Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      plan_name: '',
      plan_type: 'Basic',
      billing_cycle: 'Monthly',
      price: '',
      original_price: '',
      description: '',
      access_hours: '9 AM - 9 PM',
      max_books_per_month: '10',
      priority_support: false,
      digital_library_access: false,
      is_active: true,
      max_subscribers: '100',
      sort_order: '1',
      features: [
        { feature_name: 'Access Hours', feature_value: '9 AM - 9 PM', included: true },
        { feature_name: 'Books Per Month', feature_value: '10 books', included: true },
        { feature_name: 'Reading Space', feature_value: 'Dedicated seating', included: true },
      ],
    });
    setEditingPlan(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({
      plan_name: plan.plan_name,
      plan_type: plan.plan_type,
      billing_cycle: plan.billing_cycle,
      price: plan.price.toString(),
      original_price: plan.original_price?.toString() || '',
      description: plan.description,
      access_hours: plan.access_hours,
      max_books_per_month: plan.max_books_per_month?.toString() || '10',
      priority_support: plan.priority_support,
      digital_library_access: plan.digital_library_access,
      is_active: plan.is_active,
      max_subscribers: plan.max_subscribers?.toString() || '100',
      sort_order: '1',
      features: plan.features.length > 0 ? plan.features : [
        { feature_name: 'Access Hours', feature_value: '9 AM - 9 PM', included: true },
        { feature_name: 'Books Per Month', feature_value: '10 books', included: true },
        { feature_name: 'Reading Space', feature_value: 'Dedicated seating', included: true },
      ],
    });
    setShowModal(true);
  };

  const addFeature = () => {
    setFormData({
      ...formData,
      features: [
        ...formData.features,
        { feature_name: '', feature_value: '', included: true },
      ],
    });
  };

  const removeFeature = (index: number) => {
    if (formData.features.length <= 3) {
      Alert.alert('Error', 'Minimum 3 features required');
      return;
    }
    const newFeatures = formData.features.filter((_, i) => i !== index);
    setFormData({ ...formData, features: newFeatures });
  };

  const updateFeature = (index: number, field: keyof PlanFeature, value: any) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = { ...newFeatures[index], [field]: value };
    setFormData({ ...formData, features: newFeatures });
  };

  const handleSubmit = async () => {
    console.log('=== PLAN SUBMIT INITIATED ===');
    console.log('Form data:', formData);
    
    // Validation
    if (!formData.plan_name.trim()) {
      const msg = 'Plan name is required';
      console.log('Validation error:', msg);
      typeof window !== 'undefined' ? window.alert(msg) : Alert.alert('Error', msg);
      return;
    }

    if (!formData.description.trim() || formData.description.trim().length < 10) {
      const msg = 'Description must be at least 10 characters';
      console.log('Validation error:', msg);
      typeof window !== 'undefined' ? window.alert(msg) : Alert.alert('Error', msg);
      return;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      const msg = 'Price must be greater than 0';
      console.log('Validation error:', msg);
      typeof window !== 'undefined' ? window.alert(msg) : Alert.alert('Error', msg);
      return;
    }

    if (formData.features.length < 3) {
      const msg = 'At least 3 features are required';
      console.log('Validation error:', msg);
      typeof window !== 'undefined' ? window.alert(msg) : Alert.alert('Error', msg);
      return;
    }

    // Check if all features have names and values
    const invalidFeature = formData.features.find(
      (f) => !f.feature_name.trim() || !f.feature_value.trim()
    );
    if (invalidFeature) {
      const msg = 'All features must have name and value';
      console.log('Validation error:', msg);
      typeof window !== 'undefined' ? window.alert(msg) : Alert.alert('Error', msg);
      return;
    }

    console.log('✅ Validation passed');
    const confirmMsg = editingPlan
      ? `Are you sure you want to update "${formData.plan_name}"?`
      : `Are you sure you want to create plan "${formData.plan_name}"?`;
    
    // Use window.confirm for web, Alert for mobile
    if (typeof window !== 'undefined') {
      if (window.confirm(confirmMsg)) {
        console.log('User confirmed, submitting plan...');
        submitPlan();
      } else {
        console.log('User cancelled');
      }
    } else {
      Alert.alert('Confirm', confirmMsg, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: () => submitPlan() },
      ]);
    }
  };

  const submitPlan = async () => {
    console.log('=== SUBMIT PLAN FUNCTION CALLED ===');
    setSubmitting(true);
    try {
      const payload = {
        plan_name: formData.plan_name.trim(),
        plan_type: formData.plan_type,
        billing_cycle: formData.billing_cycle,
        price: parseFloat(formData.price),
        original_price: formData.original_price ? parseFloat(formData.original_price) : undefined,
        description: formData.description.trim(),
        features: formData.features,
        access_hours: formData.access_hours,
        max_books_per_month: formData.max_books_per_month
          ? parseInt(formData.max_books_per_month)
          : undefined,
        priority_support: formData.priority_support,
        digital_library_access: formData.digital_library_access,
        is_active: formData.is_active,
        max_subscribers: formData.max_subscribers ? parseInt(formData.max_subscribers) : undefined,
        sort_order: parseInt(formData.sort_order),
        tags: [],
        benefits: [],
        restrictions: [],
      };

      console.log('Payload:', payload);
      console.log('Editing plan:', editingPlan);

      if (editingPlan) {
        await api.put(`/api/plans/update/${editingPlan.plan_id}`, payload);
        Alert.alert('Success', 'Plan updated successfully');
      } else {
        await api.post('/api/plans/create', payload);
        Alert.alert('Success', 'Plan created successfully');
      }

      setShowModal(false);
      resetForm();
      fetchPlans();
    } catch (error: any) {
      console.error('Error saving plan:', error);
      Alert.alert(
        'Error',
        error.response?.data?.detail || 'Failed to save plan. Please check all fields.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (plan: Plan) => {
    const message = `Are you sure you want to ${plan.is_active ? 'deactivate' : 'activate'} "${plan.plan_name}"?`;
    
    if (Platform.OS === 'web') {
      if (window.confirm(message)) {
        try {
          await api.post(`/api/plans/${plan.plan_id}/toggle-status`);
          window.alert(`Plan ${plan.is_active ? 'deactivated' : 'activated'} successfully`);
          fetchPlans();
        } catch (error: any) {
          window.alert(error.response?.data?.detail || 'Failed to toggle plan status');
        }
      }
    } else {
      Alert.alert(
        'Confirm',
        message,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Confirm',
            onPress: async () => {
              try {
                await api.post(`/api/plans/${plan.plan_id}/toggle-status`);
                Alert.alert(
                  'Success',
                  `Plan ${plan.is_active ? 'deactivated' : 'activated'} successfully`
                );
                fetchPlans();
              } catch (error: any) {
                Alert.alert('Error', error.response?.data?.detail || 'Failed to toggle plan status');
              }
            },
          },
        ]
      );
    }
  };

  const handleDelete = (plan: Plan) => {
    const message = `Are you sure you want to delete "${plan.plan_name}"? This action cannot be undone.`;
    
    if (Platform.OS === 'web') {
      if (window.confirm(message)) {
        try {
          api.delete(`/api/plans/${plan.plan_id}`);
          window.alert('Plan deleted successfully');
          fetchPlans();
        } catch (error: any) {
          window.alert(error.response?.data?.detail || 'Failed to delete plan');
        }
      }
    } else {
      Alert.alert(
        'Delete Plan',
        message,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await api.delete(`/api/plans/${plan.plan_id}`);
                Alert.alert('Success', 'Plan deleted successfully');
                fetchPlans();
              } catch (error: any) {
                Alert.alert('Error', error.response?.data?.detail || 'Failed to delete plan');
              }
            },
          },
        ]
      );
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Plans & Pricing</Text>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading plans...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Plans & Pricing</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={openCreateModal}>
          <Ionicons name="add-circle" size={20} color={colors.primary} />
          <Text style={[styles.addButtonText, { color: colors.primary }]}>New Plan</Text>
        </TouchableOpacity>
      </View>

      {/* Plans List */}
      <ScrollView style={styles.content}>
        {plans.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="pricetags-outline" size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No plans created yet
            </Text>
            <TouchableOpacity style={[styles.createButton, { backgroundColor: colors.primary }]} onPress={openCreateModal}>
              <Text style={styles.createButtonText}>Create First Plan</Text>
            </TouchableOpacity>
          </View>
        ) : (
          plans.map((plan) => (
            <View
              key={plan.plan_id}
              style={[styles.planCard, { backgroundColor: colors.surface }]}
            >
              <View style={styles.planHeader}>
                <View style={styles.planInfo}>
                  <Text style={[styles.planName, { color: colors.text }]}>{plan.plan_name}</Text>
                  <Text style={[styles.planType, { color: colors.textSecondary }]}>
                    {plan.plan_type} • {plan.billing_cycle}
                  </Text>
                </View>
                <View style={styles.planActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => openEditModal(plan)}
                  >
                    <Ionicons name="create-outline" size={20} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton} onPress={() => handleDelete(plan)}>
                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.planDetails}>
                <View style={styles.priceRow}>
                  <Text style={[styles.price, { color: colors.text }]}>₹{plan.price}</Text>
                  {plan.original_price && plan.original_price > plan.price && (
                    <Text style={[styles.originalPrice, { color: colors.textSecondary }]}>
                      ₹{plan.original_price}
                    </Text>
                  )}
                  {plan.discount_percentage && plan.discount_percentage > 0 && (
                    <View style={styles.discountBadge}>
                      <Text style={styles.discountText}>{plan.discount_percentage}% OFF</Text>
                    </View>
                  )}
                </View>

                <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>
                  {plan.description}
                </Text>

                <View style={styles.features}>
                  {plan.features.slice(0, 3).map((feature, index) => (
                    <View key={index} style={styles.featureItem}>
                      <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                      <Text style={[styles.featureText, { color: colors.text }]}>
                        {feature.feature_name}: {feature.feature_value}
                      </Text>
                    </View>
                  ))}
                </View>

                <View style={styles.planFooter}>
                  <View style={styles.statusContainer}>
                    <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>Active:</Text>
                    <Switch
                      value={plan.is_active}
                      onValueChange={() => handleToggleStatus(plan)}
                      trackColor={{ false: '#ccc', true: colors.primary }}
                      thumbColor="#fff"
                    />
                  </View>
                  <Text style={[styles.subscribers, { color: colors.textSecondary }]}>
                    {plan.current_subscribers} subscribers
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Create/Edit Modal */}
      <Modal visible={showModal} animationType="slide" onRequestClose={() => setShowModal(false)}>
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: colors.primary }]}>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{editingPlan ? 'Edit Plan' : 'Create Plan'}</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Plan Name */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Plan Name *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                value={formData.plan_name}
                onChangeText={(text) => setFormData({ ...formData, plan_name: text })}
                placeholder="e.g., Basic Plan"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            {/* Plan Type */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Plan Type *</Text>
              <View style={[styles.pickerContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Picker
                  selectedValue={formData.plan_type}
                  onValueChange={(value) => setFormData({ ...formData, plan_type: value })}
                  style={{ color: colors.text }}
                >
                  {PLAN_TYPES.map((type) => (
                    <Picker.Item key={type} label={type} value={type} />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Billing Cycle */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Billing Cycle *</Text>
              <View style={[styles.pickerContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Picker
                  selectedValue={formData.billing_cycle}
                  onValueChange={(value) => setFormData({ ...formData, billing_cycle: value })}
                  style={{ color: colors.text }}
                >
                  {BILLING_CYCLES.map((cycle) => (
                    <Picker.Item key={cycle} label={cycle} value={cycle} />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Price */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={[styles.label, { color: colors.text }]}>Price (₹) *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                  value={formData.price}
                  onChangeText={(text) => setFormData({ ...formData, price: text })}
                  placeholder="1200"
                  keyboardType="numeric"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={[styles.label, { color: colors.text }]}>Original Price (₹)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                  value={formData.original_price}
                  onChangeText={(text) => setFormData({ ...formData, original_price: text })}
                  placeholder="1500"
                  keyboardType="numeric"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            </View>

            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Description * (min 10 chars)</Text>
              <TextInput
                style={[styles.textArea, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                placeholder="Describe the plan benefits and features"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            {/* Access Hours */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Access Hours</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                value={formData.access_hours}
                onChangeText={(text) => setFormData({ ...formData, access_hours: text })}
                placeholder="9 AM - 9 PM"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            {/* Max Books Per Month */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Max Books Per Month</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                value={formData.max_books_per_month}
                onChangeText={(text) => setFormData({ ...formData, max_books_per_month: text })}
                placeholder="10"
                keyboardType="numeric"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            {/* Features */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={[styles.label, { color: colors.text }]}>Features * (min 3)</Text>
                <TouchableOpacity onPress={addFeature} style={styles.addFeatureButton}>
                  <Ionicons name="add-circle" size={20} color={colors.primary} />
                  <Text style={[styles.addFeatureText, { color: colors.primary }]}>Add Feature</Text>
                </TouchableOpacity>
              </View>

              {formData.features.map((feature, index) => (
                <View key={index} style={styles.featureInputRow}>
                  <View style={{ flex: 1 }}>
                    <TextInput
                      style={[styles.featureInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                      value={feature.feature_name}
                      onChangeText={(text) => updateFeature(index, 'feature_name', text)}
                      placeholder="Feature name"
                      placeholderTextColor={colors.textSecondary}
                    />
                    <TextInput
                      style={[styles.featureInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border, marginTop: 8 }]}
                      value={feature.feature_value}
                      onChangeText={(text) => updateFeature(index, 'feature_value', text)}
                      placeholder="Feature value"
                      placeholderTextColor={colors.textSecondary}
                    />
                  </View>
                  {formData.features.length > 3 && (
                    <TouchableOpacity onPress={() => removeFeature(index)} style={styles.removeButton}>
                      <Ionicons name="trash-outline" size={20} color="#ef4444" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>

            {/* Switches */}
            <View style={styles.switchGroup}>
              <View style={styles.switchRow}>
                <Text style={[styles.switchLabel, { color: colors.text }]}>Priority Support</Text>
                <Switch
                  value={formData.priority_support}
                  onValueChange={(value) => setFormData({ ...formData, priority_support: value })}
                  trackColor={{ false: '#ccc', true: colors.primary }}
                />
              </View>

              <View style={styles.switchRow}>
                <Text style={[styles.switchLabel, { color: colors.text }]}>Digital Library Access</Text>
                <Switch
                  value={formData.digital_library_access}
                  onValueChange={(value) =>
                    setFormData({ ...formData, digital_library_access: value })
                  }
                  trackColor={{ false: '#ccc', true: colors.primary }}
                />
              </View>

              <View style={styles.switchRow}>
                <Text style={[styles.switchLabel, { color: colors.text }]}>Active</Text>
                <Switch
                  value={formData.is_active}
                  onValueChange={(value) => setFormData({ ...formData, is_active: value })}
                  trackColor={{ false: '#ccc', true: colors.primary }}
                />
              </View>
            </View>

            {/* Max Subscribers */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Max Subscribers</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                value={formData.max_subscribers}
                onChangeText={(text) => setFormData({ ...formData, max_subscribers: text })}
                placeholder="100"
                keyboardType="numeric"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.primary }, submitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {editingPlan ? 'Update Plan' : 'Create Plan'}
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  addButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButtonText: {
    fontWeight: '600',
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    marginBottom: 24,
  },
  createButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  planCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  planType: {
    fontSize: 14,
  },
  planActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 8,
  },
  planDetails: {
    gap: 12,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  price: {
    fontSize: 24,
    fontWeight: '700',
  },
  originalPrice: {
    fontSize: 16,
    textDecorationLine: 'line-through',
  },
  discountBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  discountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  features: {
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 14,
    flex: 1,
  },
  planFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusLabel: {
    fontSize: 14,
  },
  subscribers: {
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addFeatureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addFeatureText: {
    fontSize: 14,
    fontWeight: '600',
  },
  featureInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  featureInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
  },
  removeButton: {
    padding: 8,
  },
  switchGroup: {
    marginBottom: 20,
    gap: 16,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: 16,
  },
  submitButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
