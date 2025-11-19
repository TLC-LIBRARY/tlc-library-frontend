import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '../../utils/api';


interface FAQ {
  question: string;
  answer: string;
}

const FAQs: FAQ[] = [
  {
    question: 'How do I make a contribution payment?',
    answer: 'As a member, you can view your payment details in "My Payment History" section. Contact the admin for payment methods. Admin will record your payment and you will receive a digital receipt.',
  },
  {
    question: 'What are the different contribution plans?',
    answer: `We offer three flexible contribution plans:

• Basic Contribution – ₹600/month
• Standard Contribution – ₹800/month  
• Premium Contribution – ₹1000/month

Each plan offers different benefits including book borrowing limits, borrowing periods, and exclusive access to various library resources.`,
  },
  {
    question: 'How can I change my contribution plan?',
    answer: 'Go to Profile → Edit Profile to update your contribution plan and payment frequency. Contact admin if you need assistance.',
  },
  {
    question: 'Where can I view my payment history?',
    answer: 'Navigate to Profile → My Payment History to see all your past payments, receipts, and due dates.',
  },
  {
    question: 'How do I download my receipt?',
    answer: 'In "My Payment History", tap on any payment to view the receipt. Use the Download PDF or Share button to save or send the receipt.',
  },
  {
    question: 'What payment methods are accepted?',
    answer: 'We accept both Cash and Online payments. The admin records all payments and generates receipts automatically.',
  },
  {
    question: 'Who can register as a member?',
    answer: 'Anyone can register as a member by tapping "Sign Up" on the welcome screen. Fill in your details and start contributing!',
  },
  {
    question: 'How do I contact admin?',
    answer: 'Use the contact form below or email us at info@thelearningcornerlibrary.com',
  },
  {
    question: 'What happens if I miss a payment?',
    answer: 'Your account will show overdue status. You can continue making payments anytime. Contact admin for any payment adjustments.',
  },
  {
    question: 'Can I change my email or phone number?',
    answer: 'Yes! Go to Profile → Edit Profile to update your contact details.',
  },
];

export default function HelpSupport() {
  const router = useRouter();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  
  // Book Request states
  const [bookName, setBookName] = useState('');
  const [bookEmail, setBookEmail] = useState('');
  const [bookTitle, setBookTitle] = useState('');
  const [bookAuthor, setBookAuthor] = useState('');
  const [bookNotes, setBookNotes] = useState('');

  const toggleFAQ = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const handleEmailPress = () => {
    const emailUrl = 'mailto:info@thelearningcornerlibrary.com';
    Linking.openURL(emailUrl).catch(() => {
      if (Platform.OS === 'web') {
        alert('Please send an email to: info@thelearningcornerlibrary.com');
      } else {
        Alert.alert('Error', 'Could not open email app');
      }
    });
  };

  const handlePhonePress = () => {
    const phoneUrl = 'tel:+917355916635';
    Linking.openURL(phoneUrl).catch(() => {
      if (Platform.OS === 'web') {
        alert('Please call: +91 7355916635');
      } else {
        Alert.alert('Error', 'Could not open phone app');
      }
    });
  };

  const handleSubmit = async () => {
    if (!name || !email || !message) {
      if (Platform.OS === 'web') {
        alert('Please fill in all fields');
      } else {
        Alert.alert('Error', 'Please fill in all fields');
      }
      return;
    }

    if (!email.includes('@')) {
      if (Platform.OS === 'web') {
        alert('Please enter a valid email address');
      } else {
        Alert.alert('Error', 'Please enter a valid email address');
      }
      return;
    }

    try {
      console.log('Sending contact form message...');
      const response = await api.post(`/api/contact`, {
        name,
        email,
        message
      });

      console.log('Message sent successfully:', response.data);

      // Clear form
      setName('');
      setEmail('');
      setMessage('');

      // Show success message
      if (Platform.OS === 'web') {
        alert('Message Sent!\n\nThank you for contacting us. We will respond within 24 hours.');
      } else {
        Alert.alert(
          'Message Sent!',
          'Thank you for contacting us. We will respond within 24 hours.',
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      console.error('Failed to send message:', error);
      console.error('Error response:', error.response?.data);
      
      if (Platform.OS === 'web') {
        alert('Error: Failed to send message. Please email us directly at info@thelearningcornerlibrary.com');
      } else {
        Alert.alert(
          'Error',
          'Failed to send message. Please email us directly at info@thelearningcornerlibrary.com'
        );
      }
    }
  };

  const handleBookRequest = async () => {
    if (!bookName || !bookEmail || !bookTitle) {
      if (Platform.OS === 'web') {
        alert('Please fill in required fields (Name, Email, Book Title)');
      } else {
        Alert.alert('Error', 'Please fill in required fields (Name, Email, Book Title)');
      }
      return;
    }

    if (!bookEmail.includes('@')) {
      if (Platform.OS === 'web') {
        alert('Please enter a valid email address');
      } else {
        Alert.alert('Error', 'Please enter a valid email address');
      }
      return;
    }

    try {
      console.log('Sending book request...');
      const response = await api.post(`/api/contact/book-request`, {
        name: bookName,
        email: bookEmail,
        book_title: bookTitle,
        author: bookAuthor,
        additional_notes: bookNotes
      });

      console.log('Book request sent successfully:', response.data);

      // Clear form
      setBookName('');
      setBookEmail('');
      setBookTitle('');
      setBookAuthor('');
      setBookNotes('');

      // Show success message
      if (Platform.OS === 'web') {
        alert('Book Request Submitted!\n\nThank you for your request. We will review it and get back to you soon!');
      } else {
        Alert.alert(
          'Book Request Submitted!',
          'Thank you for your request. We will review it and get back to you soon!',
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      console.error('Failed to submit book request:', error);
      console.error('Error response:', error.response?.data);
      
      if (Platform.OS === 'web') {
        alert('Error: Failed to submit request. Please email us directly at info@thelearningcornerlibrary.com');
      } else {
        Alert.alert(
          'Error',
          'Failed to submit request. Please email us directly at info@thelearningcornerlibrary.com'
        );
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quick Help Section */}
        <View style={styles.quickHelpSection}>
          <Text style={styles.sectionTitle}>Quick Help</Text>
          
          <TouchableOpacity style={styles.quickHelpCard} onPress={handleEmailPress}>
            <View style={[styles.iconContainer, { backgroundColor: '#e3f2fd' }]}>
              <Ionicons name="mail" size={24} color="#1976d2" />
            </View>
            <View style={styles.quickHelpContent}>
              <Text style={styles.quickHelpTitle}>Email Us</Text>
              <Text style={styles.quickHelpSubtitle}>info@thelearningcornerlibrary.com</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickHelpCard} onPress={handlePhonePress}>
            <View style={[styles.iconContainer, { backgroundColor: '#e8f5e9' }]}>
              <Ionicons name="call" size={24} color="#388e3c" />
            </View>
            <View style={styles.quickHelpContent}>
              <Text style={styles.quickHelpTitle}>Call Support</Text>
              <Text style={styles.quickHelpSubtitle}>+91 7355916635</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickHelpCard}>
            <View style={[styles.iconContainer, { backgroundColor: '#fff3e0' }]}>
              <Ionicons name="location" size={24} color="#f57c00" />
            </View>
            <View style={styles.quickHelpContent}>
              <Text style={styles.quickHelpTitle}>Visit Us</Text>
              <Text style={styles.quickHelpSubtitle}>Ballia, Uttar Pradesh</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        {/* FAQs Section */}
        <View style={styles.faqSection}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          
          {FAQs.map((faq, index) => (
            <TouchableOpacity
              key={index}
              style={styles.faqCard}
              onPress={() => toggleFAQ(index)}
              activeOpacity={0.7}
            >
              <View style={styles.faqHeader}>
                <Text style={styles.faqQuestion}>{faq.question}</Text>
                <Ionicons
                  name={expandedIndex === index ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#6200ee"
                />
              </View>
              {expandedIndex === index && (
                <Text style={styles.faqAnswer}>{faq.answer}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Contact Form */}
        <View style={styles.contactSection}>
          <Text style={styles.sectionTitle}>Still Need Help?</Text>
          <Text style={styles.contactSubtitle}>Send us a message and we'll get back to you</Text>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Your Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your name"
                value={name}
                onChangeText={setName}
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="your@email.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Your Message</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="How can we help you?"
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                placeholderTextColor="#999"
              />
            </View>

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.submitButtonText}>Send Message</Text>
              <Ionicons name="send" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Organization Info */}
        <View style={styles.orgSection}>
          <Text style={styles.orgTitle}>TLC_LIBRARY</Text>
          <Text style={styles.orgAddress}>
            41-A, Sobai Bandh (Vishunpura),{'\n'}
            Post- Karnai, District- Ballia,{'\n'}
            State- Uttar Pradesh, Pincode- 277304
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  quickHelpSection: {
    marginBottom: 24,
  },
  quickHelpCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  quickHelpContent: {
    flex: 1,
  },
  quickHelpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  quickHelpSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  faqSection: {
    marginBottom: 24,
  },
  faqCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  faqQuestion: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    marginRight: 12,
    lineHeight: 22,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  contactSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  memberConnectSection: {
    backgroundColor: '#f3f0ff',
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 2,
    borderColor: '#6200ee',
  },
  contactSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6200ee',
    borderRadius: 8,
    padding: 14,
    gap: 8,
    marginTop: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  orgSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  orgTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6200ee',
    marginBottom: 8,
    textAlign: 'center',
  },
  orgAddress: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});
