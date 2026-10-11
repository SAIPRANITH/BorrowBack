import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, Image, Linking } from 'react-native';
import Text from '../components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme';
import * as ImagePicker from 'expo-image-picker';
import appConfig from '../../app.json';
import Input from '../components/Input';
import Button from '../components/Button';
import Card from '../components/Card';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { user, logout, updateUser } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [profilePhoto, setProfilePhoto] = useState(user?.profilePhoto || '');
  const [photoFile, setPhotoFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };
  const memberYear = user?.createdAt ? new Date(user.createdAt).getFullYear() : null;

  const handleChoosePhoto = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission required', 'Allow photo library access to select a profile photo.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });
      if (result.canceled) return;

      const asset = result.assets[0];
      if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
        Alert.alert('Image too large', 'Choose an image smaller than 5 MB.');
        return;
      }
      setPhotoFile({
        uri: asset.uri,
        name: asset.fileName || `profile-${Date.now()}.jpg`,
        type: asset.mimeType || 'image/jpeg',
      });
      setProfilePhoto(asset.uri);
    } catch (error) {
      console.error('Failed to select a profile photo:', error);
      Alert.alert('Unable to select photo', 'Please try again.');
    }
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }

    try {
      setLoading(true);
      const profileData = new FormData();
      profileData.append('name', name.trim());
      profileData.append('phone', phone);
      if (photoFile) profileData.append('image', photoFile);
      const updatedUser = await updateUser(profileData);
      setProfilePhoto(updatedUser?.profilePhoto || profilePhoto);
      setPhotoFile(null);
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const openSupportLink = async (url) => {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Unable to open link', 'Please try again or use the contact details shown.');
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
          <View style={styles.memberStamp}>
            <Ionicons name="people-outline" size={13} color={theme.colors.secondary} />
            <Text style={styles.memberStampText}>BORROWBACK MEMBER</Text>
          </View>
          <View style={styles.avatarContainer}>
            {profilePhoto ? (
              <Image source={{ uri: profilePhoto }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{getInitials(user?.name)}</Text>
            )}
            {isEditing && (
              <TouchableOpacity
                style={styles.avatarEditButton}
                onPress={handleChoosePhoto}
                accessibilityRole="button"
                accessibilityLabel="Choose a profile photo"
              >
                <Ionicons name="camera-outline" size={17} color={theme.colors.text} />
              </TouchableOpacity>
            )}
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
          {memberYear ? <Text style={styles.memberSince}>Member since {memberYear}</Text> : null}
        </View>

        {/* Edit Profile Section */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            <TouchableOpacity onPress={() => {
              if (isEditing) {
                setName(user?.name || '');
                setPhone(user?.phone || '');
                setProfilePhoto(user?.profilePhoto || '');
                setPhotoFile(null);
              } else {
                setProfilePhoto(user?.profilePhoto || '');
                setPhotoFile(null);
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
              <TouchableOpacity
                style={styles.choosePhotoButton}
                onPress={handleChoosePhoto}
                accessibilityRole="button"
              >
                <Ionicons name="image-outline" size={18} color={theme.colors.secondary} />
                <Text style={styles.choosePhotoText}>
                  {photoFile ? 'Choose a different photo' : 'Upload profile photo'}
                </Text>
              </TouchableOpacity>
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

        <Card style={styles.helpCard}>
          <Text style={styles.sectionTitle}>Help &amp; support</Text>
          <Text style={styles.helpDescription}>
            Questions about your account, a return, or a payment? Get in touch.
          </Text>
          <TouchableOpacity
            style={styles.supportRow}
            onPress={() => openSupportLink('tel:8498970129')}
            accessibilityRole="link"
          >
            <Ionicons name="call-outline" size={19} color={theme.colors.secondary} />
            <Text style={styles.supportText}>8498970129</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.supportRow}
            onPress={() => openSupportLink('mailto:saipranithreddyvaka@gmail.com')}
            accessibilityRole="link"
          >
            <Ionicons name="mail-outline" size={19} color={theme.colors.secondary} />
            <Text style={styles.supportEmail}>saipranithreddyvaka@gmail.com</Text>
          </TouchableOpacity>
        </Card>

        {/* Actions Section */}
        <View style={styles.actionsContainer}>
          <Text style={styles.actionsHeader}>Shortcuts</Text>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => navigation.navigate('MyItemsList')}
          >
            <View style={[styles.actionIconBg, { backgroundColor: `${theme.colors.secondary}15` }]}>
              <Ionicons name="cube-outline" size={22} color={theme.colors.secondary} />
            </View>
            <Text style={styles.actionItemText}>My Items</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => navigation.navigate('Borrows')}
          >
            <View style={[styles.actionIconBg, { backgroundColor: `${theme.colors.accent}15` }]}>
              <Ionicons name="hand-left-outline" size={22} color={theme.colors.accent} />
            </View>
            <Text style={styles.actionItemText}>Borrow Activity</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionItem} 
            onPress={() => navigation.navigate('Home', { screen: 'Fines' })}
          >
            <View style={[styles.actionIconBg, { backgroundColor: `${theme.colors.primary}15` }]}>
              <Ionicons name="wallet-outline" size={22} color={theme.colors.primary} />
            </View>
            <Text style={styles.actionItemText}>Finances</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionItem} 
            onPress={() => navigation.navigate('Loans', { screen: 'MoneyLoans' })}
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
        
        <Text style={styles.versionText}>BorrowBack v{appConfig.expo.version}</Text>
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
    backgroundColor: theme.colors.surfaceRaised,
    marginBottom: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    borderBottomWidth: 3,
    borderBottomColor: theme.colors.accent,
  },
  memberStamp: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: `${theme.colors.accent}99`,
    borderRadius: 4,
    marginBottom: theme.spacing.md,
  },
  memberStampText: {
    color: theme.colors.accent,
    fontSize: 9,
    fontWeight: theme.typography.weights.bold,
    letterSpacing: 1,
  },
  avatarContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: theme.colors.surface,
    borderWidth: 3,
    borderColor: theme.colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    ...theme.shadows.card,
  },
  avatarText: {
    fontSize: 36,
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.bold,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 48,
  },
  avatarEditButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.background,
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
    backgroundColor: theme.colors.surfaceRaised,
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
    color: theme.colors.text,
    fontWeight: theme.typography.weights.medium,
  },
  memberSince: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text,
    marginTop: theme.spacing.sm,
  },
  sectionCard: {
    marginBottom: theme.spacing.xl,
    padding: theme.spacing.md,
  },
  helpCard: {
    marginBottom: theme.spacing.xl,
    padding: theme.spacing.md,
  },
  helpDescription: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.sm,
    lineHeight: 20,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  supportRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  supportText: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.md,
  },
  supportEmail: {
    flexShrink: 1,
    color: theme.colors.text,
    fontSize: theme.typography.sizes.sm,
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
  choosePhotoButton: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
  },
  choosePhotoText: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
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
    color: theme.colors.inkMuted,
    fontSize: theme.typography.sizes.xs,
  },
});
