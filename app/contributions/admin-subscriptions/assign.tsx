import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../contexts/ThemeContext';
import api from '../../../utils/api';
import { showErrorAlert } from '../../../utils/errorHandler';
import { ListSkeleton } from '../../../components/SkeletonLoader';
import ErrorBoundary from '../../../components/ErrorBoundary';

interface Plan {
  plan_id: string;
  plan_name: string;
  plan_type: string;
  billing_cycle: string;
  price: number;
}

interface Member {
  member_id: string;
  full_name: string;
  email: string;
}

function AssignSubscription() {
  const { colors } = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [durationMonths, setDurationMonths] = useState('1');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentStatus, setPaymentStatus] = useState('Paid');
  const [notes, setNotes] = useState('');
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showMethodModal, setShowMethodModal] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');

  const paymentMethods = ['Cash', 'UPI', 'Credit Card', 'Debit Card', 'Net Banking'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [plansRes, membersRes] = await Promise.all([
        api.get('/api/plans/active'),
        api.get('/api/contributions/members'),
      ]);
      setPlans(plansRes.data);
      setMembers(membersRes.data);
    } catch (error: any) {
      showErrorAlert(error, 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedMember) {
      showErrorAlert(new Error('Please select a member'), 'Required Field');
      return;
    }
    if (!selectedPlan) {
      showErrorAlert(new Error('Please select a plan'), 'Required Field');
      return;
    }
    if (!durationMonths || parseInt(durationMonths) <= 0) {
      showErrorAlert(new Error('Please enter valid duration'), 'Invalid Input');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/api/subscriptions/admin/assign', {
        member_id: selectedMember.member_id,
        plan_id: selectedPlan.plan_id,
        duration_months: parseInt(durationMonths),
        payment_method: paymentMethod,
        payment_status: paymentStatus,
        notes: notes.trim() || null,
      });

      showErrorAlert(
        new Error(`Subscription assigned to ${selectedMember.full_name} successfully!`),
        'Success'
      );
      router.push('/contributions/admin-subscriptions/all');
    } catch (error: any) {
      showErrorAlert(error, 'Failed to assign subscription');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredMembers = members.filter(
    (m) =>
      m.full_name.toLowerCase().includes(memberSearch.toLowerCase()) ||
      m.email.toLowerCase().includes(memberSearch.toLowerCase())
  );

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
    backButton: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    backButtonText: {
      fontSize: 16,
      color: '#fff',
      marginLeft: 4,
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
      flex: 1,
      padding: 16,
    },
    formSection: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    inputGroup: {
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 8,
    },
    selectButton: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
    },
    selectButtonText: {
      fontSize: 14,
      color: colors.text,
    },
    selectButtonPlaceholder: {
      color: colors.textSecondary,
    },
    input: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 14,
      color: colors.text,
    },
    assignButton: {
      backgroundColor: colors.primary,
      paddingVertical: 16,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 8,
    },
    assignButtonDisabled: {
      backgroundColor: colors.border,
    },
    assignButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
      maxHeight: '70%',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 16,
    },
    searchInput: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 10,
      fontSize: 14,
      color: colors.text,
      marginBottom: 12,
    },
    optionItem: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    optionItemSelected: {
      backgroundColor: colors.primary + '20',
    },
    optionText: {
      fontSize: 16,
      color: colors.text,
      fontWeight: '500',
    },
    optionSubtext: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
    },
    selectedCard: {
      backgroundColor: colors.primary + '10',
      borderColor: colors.primary,
      padding: 12,
      borderRadius: 8,
      marginTop: 8,
    },
    selectedText: {
      fontSize: 14,
      color: colors.text,
      fontWeight: '500',
    },
    selectedSubtext: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Assign Subscription</Text>
        </View>
        <ListSkeleton count={3} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Assign Subscription</Text>
        <Text style={styles.headerSubtitle}>Manually assign a plan to a member</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Member Selection</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Select Member *</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowMemberModal(true)}
            >
              <Text
                style={[
                  styles.selectButtonText,
                  !selectedMember && styles.selectButtonPlaceholder,
                ]}
              >
                {selectedMember ? selectedMember.full_name : 'Choose a member'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            {selectedMember && (
              <View style={styles.selectedCard}>
                <Text style={styles.selectedText}>{selectedMember.full_name}</Text>
                <Text style={styles.selectedSubtext}>{selectedMember.email}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Plan Details</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Select Plan *</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowPlanModal(true)}
            >
              <Text
                style={[
                  styles.selectButtonText,
                  !selectedPlan && styles.selectButtonPlaceholder,
                ]}
              >
                {selectedPlan ? selectedPlan.plan_name : 'Choose a plan'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            {selectedPlan && (
              <View style={styles.selectedCard}>
                <Text style={styles.selectedText}>{selectedPlan.plan_name}</Text>
                <Text style={styles.selectedSubtext}>
                  {selectedPlan.plan_type} • {selectedPlan.billing_cycle} • ₹{selectedPlan.price}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Duration (Months) *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter duration in months"
              placeholderTextColor={colors.textSecondary}
              value={durationMonths}
              onChangeText={setDurationMonths}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Payment Details</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Payment Method</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowMethodModal(true)}
            >
              <Text style={styles.selectButtonText}>{paymentMethod}</Text>
              <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Payment Status</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() =>
                setPaymentStatus((prev) => (prev === 'Paid' ? 'Pending' : 'Paid'))
              }
            >
              <Text style={styles.selectButtonText}>{paymentStatus}</Text>
              <Ionicons name="checkmark" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notes (Optional)</Text>
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
              placeholder="Add any additional notes"
              placeholderTextColor={colors.textSecondary}
              value={notes}
              onChangeText={setNotes}
              multiline
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.assignButton, submitting && styles.assignButtonDisabled]}
          onPress={handleAssign}
          disabled={submitting}
        >
          <Text style={styles.assignButtonText}>
            {submitting ? 'Assigning...' : 'Assign Subscription'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Member Modal */}
      <Modal
        visible={showMemberModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMemberModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMemberModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Member</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or email"
              placeholderTextColor={colors.textSecondary}
              value={memberSearch}
              onChangeText={setMemberSearch}
            />
            <ScrollView>
              {filteredMembers.map((member) => (
                <TouchableOpacity
                  key={member.member_id}
                  style={[
                    styles.optionItem,
                    selectedMember?.member_id === member.member_id &&
                      styles.optionItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedMember(member);
                    setShowMemberModal(false);
                    setMemberSearch('');
                  }}
                >
                  <Text style={styles.optionText}>{member.full_name}</Text>
                  <Text style={styles.optionSubtext}>{member.email}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Plan Modal */}
      <Modal
        visible={showPlanModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPlanModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPlanModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Plan</Text>
            <ScrollView>
              {plans.map((plan) => (
                <TouchableOpacity
                  key={plan.plan_id}
                  style={[
                    styles.optionItem,
                    selectedPlan?.plan_id === plan.plan_id && styles.optionItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedPlan(plan);
                    setShowPlanModal(false);
                  }}
                >
                  <Text style={styles.optionText}>{plan.plan_name}</Text>
                  <Text style={styles.optionSubtext}>
                    {plan.plan_type} • {plan.billing_cycle} • ₹{plan.price}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Payment Method Modal */}
      <Modal
        visible={showMethodModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMethodModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMethodModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Payment Method</Text>
            {paymentMethods.map((method) => (
              <TouchableOpacity
                key={method}
                style={[
                  styles.optionItem,
                  paymentMethod === method && styles.optionItemSelected,
                ]}
                onPress={() => {
                  setPaymentMethod(method);
                  setShowMethodModal(false);
                }}
              >
                <Text style={styles.optionText}>{method}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

export default function AssignSubscriptionWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <AssignSubscription />
    </ErrorBoundary>
  );
}
