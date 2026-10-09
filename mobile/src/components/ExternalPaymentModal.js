import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';

const ExternalPaymentModal = ({ visible, title, amount, reference, onClose, onConfirm }) => {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) setError('');
  }, [visible]);

  const confirmPayment = async () => {
    setProcessing(true);
    setError('');
    try {
      const saved = await onConfirm();
      if (!saved) {
        setError('The payment record could not be saved. Please try again.');
        return;
      }
      onClose();
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'The payment record could not be saved. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!processing) onClose();
      }}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.dialog} accessibilityRole="alert">
          <View style={styles.header}>
            <View style={styles.icon}>
              <Ionicons name="shield-checkmark-outline" size={22} color={theme.colors.noticeRed} />
            </View>
            <View style={styles.titleBlock}>
              <Text style={styles.title}>{title || 'Record External Payment'}</Text>
              {reference ? <Text style={styles.reference}>Reference #{reference}</Text> : null}
            </View>
            <TouchableOpacity
              onPress={onClose}
              disabled={processing}
              accessibilityRole="button"
              accessibilityLabel="Close payment details"
              style={styles.closeButton}
            >
              <Ionicons name="close" size={21} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.amountPanel}>
            <Text style={styles.amountLabel}>Amount to record</Text>
            <Text style={styles.amount}>₹{Number(amount || 0).toLocaleString('en-IN')}</Text>
          </View>

          <View style={styles.notice}>
            <Text style={styles.noticeTitle}>Record it, don’t pay it here.</Text>
            <Text style={styles.noticeBody}>
              BorrowBack does not process online payments. No money will be transferred or charged here. Continue only after paying the other person outside the app.
            </Text>
          </View>

          {error ? <Text style={styles.error} accessibilityRole="alert">{error}</Text> : null}

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              disabled={processing}
              accessibilityRole="button"
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={confirmPayment}
              disabled={processing}
              accessibilityRole="button"
              accessibilityState={{ disabled: processing, busy: processing }}
            >
              {processing
                ? <ActivityIndicator size="small" color={theme.colors.surface} />
                : <Ionicons name="checkmark-circle-outline" size={18} color={theme.colors.surface} />}
              <Text style={styles.confirmText}>{processing ? 'Saving...' : 'I already paid — mark as paid'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
    backgroundColor: 'rgba(4, 8, 6, 0.78)',
  },
  dialog: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.card,
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.lg },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#b84f3f14',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  titleBlock: { flex: 1 },
  title: { color: theme.colors.text, fontSize: theme.typography.sizes.lg, fontWeight: theme.typography.weights.bold },
  reference: { color: theme.colors.textSecondary, fontSize: theme.typography.sizes.xs, marginTop: 3 },
  closeButton: { padding: theme.spacing.xs, marginLeft: theme.spacing.xs },
  amountPanel: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  amountLabel: { color: theme.colors.textSecondary, fontSize: theme.typography.sizes.xs, fontWeight: theme.typography.weights.bold, textTransform: 'uppercase', letterSpacing: 1 },
  amount: { color: theme.colors.text, fontSize: 34, fontWeight: theme.typography.weights.bold, marginTop: theme.spacing.xs },
  notice: {
    backgroundColor: '#362d1d',
    borderColor: '#65502e',
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  noticeTitle: { color: theme.colors.accent, fontSize: theme.typography.sizes.sm, fontWeight: theme.typography.weights.bold },
  noticeBody: { color: theme.colors.text, fontSize: theme.typography.sizes.xs, lineHeight: 18, marginTop: theme.spacing.xs },
  error: {
    color: theme.colors.error,
    backgroundColor: '#b84f3f12',
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.sm,
    marginTop: theme.spacing.md,
    fontSize: theme.typography.sizes.sm,
  },
  actions: { flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.lg },
  cancelButton: {
    minHeight: 48,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: { color: theme.colors.text, fontSize: theme.typography.sizes.sm, fontWeight: theme.typography.weights.semibold },
  confirmButton: {
    minHeight: 48,
    flex: 1,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: { color: theme.colors.surface, fontSize: theme.typography.sizes.sm, fontWeight: theme.typography.weights.bold, textAlign: 'center' },
});

export default ExternalPaymentModal;
