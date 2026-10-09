import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme';
import Input from '../components/Input';
import Button from '../components/Button';
import Card from '../components/Card';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { user, logout, updateUser } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }

    try {
      setLoading(true);
      await updateUser({ name, phone });
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout },
      ]
    );
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Ionicons key={i} name="star" size={16} color={theme.colors.accent} />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<Ionicons key={i} name="star-half" size={16} color={theme.colors.accent} />);
      } else {
        stars.push(<Ionicons key={i} name="star-outline" size={16} color={theme.colors.border} />);
      }
    }
    return stars;
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{getInitials(user?.name)}</Text>
          </View>
          <Text style={styles.nameText}>{user?.name}</Text>
          <Text style={styles.emailText}>{user?.email}</Text>
          
          <View style={styles.ratingContainer}>
            <View style={styles.starsRow}>
              {renderStars(user?.averageRating || 0)}
            </View>
            <Text style={styles.ratingText}>
              {user?.averageRating?.toFixed(1) || '0.0'} ({user?.totalRatings || 0} reviews)
            </Text>
          </View>
          <Text style={styles.memberSince}>
            Member since {new Date(user?.createdAt).getFullYear()}
          </Text>
        </View>

        {/* Edit Profile Section */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            <TouchableOpacity onPress={() => {
              if (isEditing) {
                setName(user?.name || '');
                setPhone(user?.phone || '');
              }
              setIsEditing(!isEditing);
            }}>
              <Text style={styles.editButtonText}>{isEditing ? 'Cancel' : 'Edit'}</Text>
            </TouchableOpacity>
          </View>

          {isEditing ? (
            <View style={styles.editForm}>
              <Input
                label="Full Name"
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
              />
              <Input
                label="Phone Number"
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter your phone number"
                keyboardType="phone-pad"
              />
              <Button 
                title="Save Changes" 
                onPress={handleSaveProfile} 
                loading={loading}
                style={styles.saveButton}
              />
            </View>
          ) : (
            <View style={styles.infoDisplay}>
              <View style={styles.infoRow}>
                <Ionicons name="call-outline" size={20} color={theme.colors.textSecondary} style={styles.infoIcon} />
                <Text style={styles.infoText}>{user?.phone || 'No phone number added'}</Text>
              </View>
            </View>
          )}
        </Card>

        {/* Actions Section */}
        <View style={styles.actionsContainer}>
          <Text style={styles.actionsHeader}>Account</Text>
          
          <TouchableOpacity 
            style={styles.actionItem} 
            onPress={() => navigation.navigate('Fines')}
          >
            <View style={[styles.actionIconBg, { backgroundColor: `${theme.colors.primary}15` }]}>
              <Ionicons name="wallet-outline" size={22} color={theme.colors.primary} />
            </View>
            <Text style={styles.actionItemText}>My Finances</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionItem} 
            onPress={() => navigation.navigate('MoneyLoans')}
          >
            <View style={[styles.actionIconBg, { backgroundColor: `${theme.colors.success}15` }]}>
              <Ionicons name="cash-outline" size={22} color={theme.colors.success} />
            </View>
            <Text style={styles.actionItemText}>Money Loans</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionItem} 
            onPress={() => navigation.navigate('Notifications')}
          >
            <View style={[styles.actionIconBg, { backgroundColor: `${theme.colors.secondary}15` }]}>
              <Ionicons name="notifications-outline" size={22} color={theme.colors.secondary} />
            </View>
            <Text style={styles.actionItemText}>Notifications</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <Button 
          title="Log Out" 
          onPress={handleLogout} 
          style={styles.logoutButton}
          textStyle={{ color: theme.colors.error }}
        />
        
        <Text style={styles.versionText}>BorrowBack v1.0.0</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
  },
  avatarContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    ...theme.shadows.card,
  },
  avatarText: {
    fontSize: 36,
    color: theme.colors.surface,
    fontWeight: theme.typography.weights.bold,
  },
  nameText: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    marginBottom: 4,
  },
  emailText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    ...theme.shadows.card,
  },
  starsRow: {
    flexDirection: 'row',
    marginRight: theme.spacing.sm,
  },
  ratingText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.weights.medium,
  },
  memberSince: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
  },
  sectionCard: {
    marginBottom: theme.spacing.xl,
    padding: theme.spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
  },
  editButtonText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.secondary,
    fontWeight: theme.typography.weights.semibold,
  },
  editForm: {
    marginTop: theme.spacing.sm,
  },
  saveButton: {
    marginTop: theme.spacing.md,
  },
  infoDisplay: {
    marginTop: theme.spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  infoIcon: {
    marginRight: theme.spacing.sm,
  },
  infoText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text,
  },
  actionsContainer: {
    marginBottom: theme.spacing.xl,
  },
  actionsHeader: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
    marginLeft: theme.spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.card,
  },
  actionIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  actionItemText: {
    flex: 1,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.text,
  },
  logoutButton: {
    backgroundColor: `${theme.colors.error}10`,
    borderWidth: 1,
    borderColor: `${theme.colors.error}30`,
    marginBottom: theme.spacing.xl,
  },
  versionText: {
    textAlign: 'center',
    color: theme.colors.border,
    fontSize: theme.typography.sizes.xs,
  },
});
