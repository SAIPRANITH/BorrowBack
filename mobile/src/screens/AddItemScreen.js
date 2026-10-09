import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../api/api';
import { theme } from '../theme';
import { Input, Button, Card } from '../components';

const CATEGORIES = [
  'electronics', 'books', 'sports', 'kitchen', 
  'stationery', 'clothing', 'tools', 'others'
];

const AddItemScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    imageUrl: '',
    securityDeposit: '',
    lateFine: '10',
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) return 'Item name is required.';
    if (!formData.category) return 'Please select a category.';
    if (!formData.description.trim()) return 'Description is required.';
    if (!formData.securityDeposit || isNaN(formData.securityDeposit)) return 'Valid security deposit is required.';
    if (!formData.lateFine || isNaN(formData.lateFine)) return 'Valid late fine is required.';
    return null;
  };

  const handleSubmit = async () => {
    const errorMsg = validateForm();
    if (errorMsg) {
      Alert.alert('Validation Error', errorMsg);
      return;
    }

    try {
      setLoading(true);
      const payload = {
        ...formData,
        securityDeposit: Number(formData.securityDeposit),
        lateFine: Number(formData.lateFine),
      };
      
      await api.post('/items', payload);
      Alert.alert('Success', 'Your item has been listed successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error adding item:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to add item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderCategoryChips = () => (
    <View style={styles.chipContainer}>
      {CATEGORIES.map(cat => (
        <TouchableOpacity
          key={cat}
          style={[
            styles.chip,
            formData.category === cat && styles.chipSelected
          ]}
          onPress={() => handleInputChange('category', cat)}
        >
          <Text style={[
            styles.chipText,
            formData.category === cat && styles.chipTextSelected
          ]}>
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add New Item</Text>
        </View>

        <Card style={styles.formCard}>
          <Text style={styles.sectionTitle}>Basic Details</Text>
          
          <Input
            label="Item Name *"
            placeholder="e.g. Scientific Calculator"
            value={formData.name}
            onChangeText={(text) => handleInputChange('name', text)}
          />

          <Text style={styles.label}>Category *</Text>
          {renderCategoryChips()}

          <Input
            label="Description *"
            placeholder="Describe the condition, features, etc."
            value={formData.description}
            onChangeText={(text) => handleInputChange('description', text)}
            multiline
            numberOfLines={4}
            style={styles.textArea}
          />
        </Card>

        <Card style={styles.formCard}>
          <Text style={styles.sectionTitle}>Financials</Text>
          
          <View style={styles.row}>
            <View style={styles.flex1}>
              <Input
                label="Security Deposit (₹) *"
                placeholder="e.g. 500"
                value={formData.securityDeposit}
                onChangeText={(text) => handleInputChange('securityDeposit', text)}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.spacer} />
            <View style={styles.flex1}>
              <Input
                label="Late Fine (₹/day) *"
                placeholder="e.g. 10"
                value={formData.lateFine}
                onChangeText={(text) => handleInputChange('lateFine', text)}
                keyboardType="numeric"
              />
            </View>
          </View>
        </Card>

        <Card style={styles.formCard}>
          <Text style={styles.sectionTitle}>Media</Text>
          
          <Input
            label="Image URL (Optional)"
            placeholder="https://example.com/image.jpg"
            value={formData.imageUrl}
            onChangeText={(text) => handleInputChange('imageUrl', text)}
            autoCapitalize="none"
            keyboardType="url"
          />
        </Card>

        <View style={styles.footer}>
          <Button 
            title="List Item" 
            onPress={handleSubmit} 
            loading={loading}
            size="large"
            style={styles.submitButton}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    marginTop: Platform.OS === 'android' ? theme.spacing.md : 0,
  },
  backButton: {
    padding: theme.spacing.xs,
    marginRight: theme.spacing.md,
  },
  headerTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
  },
  formCard: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  label: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: theme.spacing.md,
    marginHorizontal: -4,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.full,
    margin: 4,
  },
  chipSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  chipText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.weights.medium,
  },
  chipTextSelected: {
    color: '#fff',
  },
  row: {
    flexDirection: 'row',
  },
  flex1: {
    flex: 1,
  },
  spacer: {
    width: theme.spacing.md,
  },
  footer: {
    marginTop: theme.spacing.md,
  },
  submitButton: {
    width: '100%',
  },
});

export default AddItemScreen;
