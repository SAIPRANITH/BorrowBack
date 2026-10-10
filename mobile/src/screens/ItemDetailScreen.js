import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  TouchableOpacity,
  Platform,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme';
import { Button, Badge, LoadingScreen, Card } from '../components';

const formatDateOnly = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseDateOnly = (value) => {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return date.getFullYear() === Number(match[1])
    && date.getMonth() === Number(match[2]) - 1
    && date.getDate() === Number(match[3])
    ? date
    : null;
};

const getCategoryColor = (category) => {
  const colors = {
    electronics: '#557c91',
    books: '#557c45',
    sports: '#c58d32',
    kitchen: '#397755',
    stationery: '#87704f',
    clothing: '#aa665b',
    tools: '#64748b',
    others: '#397755',
  };
  return colors[category?.toLowerCase()] || colors.others;
};

const ItemDetailScreen = () => {
  const { params } = useRoute();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { itemId } = params;

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [borrowLoading, setBorrowLoading] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [dueDate, setDueDate] = useState('');
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);

  const fetchItem = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/items/${itemId}`);
      setItem(response.data.item);
    } catch (err) {
      console.error('Error fetching item details:', err);
      setError('Failed to load item details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItem();
  }, [itemId]);

  const handleBorrowRequest = async () => {
    const selectedDueDate = parseDateOnly(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (!selectedDueDate || selectedDueDate < today) {
      Alert.alert('Validation Error', 'Please choose a valid due date today or later.');
      return;
    }
    try {
      setBorrowLoading(true);
      await api.post('/borrows', { item: itemId, itemId, dueDate });
      Alert.alert('Success', 'Borrow request sent to the owner!');
      navigation.goBack();
    } catch (err) {
      console.error('Borrow request error:', err);
      Alert.alert('Error', err.response?.data?.message || 'Failed to submit borrow request.');
    } finally {
      setBorrowLoading(false);
    }
  };

  const handleDueDateChange = (event, selectedDate) => {
    if (Platform.OS !== 'ios') setShowDueDatePicker(false);
    if (event.type === 'set' && selectedDate) {
      setDueDate(formatDateOnly(selectedDate));
    }
  };

  const handleToggleAvailability = async () => {
    try {
      setToggleLoading(true);
      await api.put(`/items/${itemId}/toggle`);
      fetchItem(); // Refresh item to get updated status
      Alert.alert('Success', 'Item availability updated.');
    } catch (err) {
      console.error('Toggle error:', err);
      Alert.alert('Error', 'Failed to update availability.');
    } finally {
      setToggleLoading(false);
    }
  };

  if (loading) {
    return <LoadingScreen message="Loading item details..." />;
  }

  if (error || !item) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error || 'Item not found'}</Text>
        <Button title="Retry" onPress={fetchItem} style={styles.retryButton} />
      </View>
    );
  }

  const isOwner = user && item.owner && user._id === item.owner._id;
  const isAvailable = item.status === 'available';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={[styles.imagePlaceholder, { backgroundColor: getCategoryColor(item.category) }]}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <Ionicons name="cube-outline" size={80} color="#fff" />
        )}
      </View>

      <View style={styles.detailsContainer}>
        <View style={styles.headerRow}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Badge 
            label={item.status.toUpperCase()} 
            color={isAvailable ? theme.colors.success : (item.status === 'lent' ? theme.colors.accent : theme.colors.error)} 
          />
        </View>

        <View style={styles.categoryBadgeContainer}>
          <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(item.category) + '20' }]}>
            <Text style={[styles.categoryText, { color: getCategoryColor(item.category) }]}>
              {item.category?.toUpperCase()}
            </Text>
          </View>
        </View>

        {item.averageRating > 0 && (
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={18} color={theme.colors.accent} />
            <Text style={styles.ratingText}>{item.averageRating.toFixed(1)} / 5.0</Text>
          </View>
        )}

        <Text style={styles.description}>{item.description}</Text>

        <Card style={styles.financialCard}>
          <View style={styles.financialRow}>
            <View style={styles.financialItem}>
              <Text style={styles.financialLabel}>Security Deposit</Text>
              <Text style={styles.financialValue}>₹{item.depositAmount}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.financialItem}>
              <Text style={styles.financialLabel}>Late Fine</Text>
              <Text style={styles.financialValue}>₹{item.finePerDay}/day</Text>
            </View>
          </View>
        </Card>

        {item.owner && (
          <Card style={styles.ownerCard}>
            <Text style={styles.ownerTitle}>Owner Information</Text>
            <View style={styles.ownerRow}>
              <View style={styles.ownerAvatar}>
                <Text style={styles.ownerInitial}>{item.owner.name?.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.ownerInfo}>
                <Text style={styles.ownerName}>{item.owner.name}</Text>
                <Text style={styles.ownerEmail}>{item.owner.email}</Text>
              </View>
              {item.owner.averageRating > 0 && (
                <View style={styles.ownerRating}>
                  <Ionicons name="star" size={14} color={theme.colors.accent} />
                  <Text style={styles.ownerRatingText}>{item.owner.averageRating.toFixed(1)}</Text>
                </View>
              )}
            </View>
          </Card>
        )}

        <View style={styles.actionContainer}>
          {isOwner ? (
            <View style={styles.ownerActions}>
              <View style={styles.ownerBanner}>
                <Ionicons name="information-circle-outline" size={20} color={theme.colors.primary} />
                <Text style={styles.ownerBannerText}>This is your item.</Text>
              </View>
              {item.status !== 'lent' && (
                <Button 
                  title={isAvailable ? "Mark as Unavailable" : "Mark as Available"}
                  onPress={handleToggleAvailability}
                  variant={isAvailable ? "outline" : "primary"}
                  loading={toggleLoading}
                  style={styles.toggleButton}
                />
              )}
            </View>
          ) : isAvailable ? (
            <View style={styles.borrowSection}>
              <Text style={styles.borrowTitle}>Borrow Request</Text>
              <Text style={styles.inputLabel}>Required until (Due Date)</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="calendar-outline" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
                {Platform.OS === 'web' ? (
                  <TextInput
                    style={styles.dateInput}
                    value={dueDate}
                    onChangeText={setDueDate}
                    {...{
                      type: 'date',
                      min: formatDateOnly(new Date()),
                    }}
                  />
                ) : (
                  <TouchableOpacity
                    style={styles.datePickerTrigger}
                    onPress={() => setShowDueDatePicker(true)}
                    accessibilityRole="button"
                    accessibilityLabel={dueDate ? `Due date ${dueDate}` : 'Choose a due date'}
                  >
                    <Text style={dueDate ? styles.dateValue : styles.datePlaceholder}>
                      {dueDate || 'Choose a due date'}
                    </Text>
                    <Ionicons name="chevron-down" size={18} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>
              {showDueDatePicker && Platform.OS !== 'web' && (
                <View style={styles.datePickerContainer}>
                  <DateTimePicker
                    value={parseDateOnly(dueDate) || new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    minimumDate={new Date(new Date().setHours(0, 0, 0, 0))}
                    onChange={handleDueDateChange}
                  />
                  {Platform.OS === 'ios' && (
                    <Button
                      title="Done"
                      variant="outline"
                      onPress={() => setShowDueDatePicker(false)}
                    />
                  )}
                </View>
              )}
              <Button 
                title="Request to Borrow"
                onPress={handleBorrowRequest}
                loading={borrowLoading}
                style={styles.borrowButton}
              />
            </View>
          ) : (
            <View style={styles.unavailableBanner}>
              <Ionicons name="close-circle-outline" size={24} color={theme.colors.error} />
              <Text style={styles.unavailableText}>
                This item is currently {item.status}.
              </Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    paddingBottom: theme.spacing.xl,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.typography.sizes.md,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  retryButton: {
    minWidth: 120,
  },
  imagePlaceholder: {
    width: '100%',
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  detailsContainer: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    marginTop: -20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.xs,
  },
  itemName: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  categoryBadgeContainer: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
  },
  categoryBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
  },
  categoryText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  ratingText: {
    marginLeft: 4,
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.weights.medium,
  },
  description: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textSecondary,
    lineHeight: 24,
    marginBottom: theme.spacing.xl,
  },
  financialCard: {
    marginBottom: theme.spacing.xl,
    padding: 0,
  },
  financialRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  financialItem: {
    flex: 1,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: '60%',
    backgroundColor: theme.colors.border,
  },
  financialLabel: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  financialValue: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
  },
  ownerCard: {
    marginBottom: theme.spacing.xl,
  },
  ownerTitle: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
    textTransform: 'uppercase',
  },
  ownerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ownerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  ownerInitial: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.primary,
  },
  ownerInfo: {
    flex: 1,
  },
  ownerName: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text,
  },
  ownerEmail: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  ownerRating: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.accent + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
  },
  ownerRatingText: {
    marginLeft: 4,
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.accent,
  },
  actionContainer: {
    marginTop: theme.spacing.md,
  },
  ownerActions: {
    gap: theme.spacing.md,
  },
  ownerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary + '10',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  ownerBannerText: {
    marginLeft: theme.spacing.sm,
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.medium,
  },
  toggleButton: {
    width: '100%',
  },
  borrowSection: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.card,
  },
  borrowTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  inputLabel: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.background,
  },
  inputIcon: {
    marginRight: theme.spacing.sm,
  },
  dateInput: {
    flex: 1,
    height: 48,
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text,
  },
  datePickerTrigger: {
    flex: 1,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateValue: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.md,
  },
  datePlaceholder: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.sizes.md,
  },
  datePickerContainer: {
    marginBottom: theme.spacing.md,
    alignItems: 'center',
  },
  borrowButton: {
    width: '100%',
  },
  unavailableBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.error + '10',
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
  },
  unavailableText: {
    marginLeft: theme.spacing.sm,
    color: theme.colors.error,
    fontWeight: theme.typography.weights.semibold,
    fontSize: theme.typography.sizes.md,
  },
});

export default ItemDetailScreen;
