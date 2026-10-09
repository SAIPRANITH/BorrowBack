import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import Input from '../components/Input';
import Button from '../components/Button';
import { theme } from '../theme';

const LoginScreen = ({ navigation }) => {
  const { login, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async () => {
    if (submitting) return;

    const normalizedEmail = email.trim().toLowerCase();
    setValidationError('');
    if (!normalizedEmail || !password) {
      setValidationError('Enter your email address and password to continue.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setValidationError('Enter a valid email address.');
      return;
    }

    setSubmitting(true);
    try {
      await login(normalizedEmail, password);
    } catch {
      // The authentication context provides the server error to this screen.
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.orbTop} />
          <View style={styles.orbBottom} />
          <View style={styles.brandRow}>
            <View style={styles.logoContainer}>
              <Ionicons name="repeat" size={27} color="#ffffff" />
            </View>
            <Text style={styles.appName}>BorrowBack</Text>
          </View>
          <Text style={styles.heroTitle}>Good things{'\n'}are better shared.</Text>
          <Text style={styles.tagline}>
            Borrow what you need. Lend what you can. All on campus.
          </Text>
          <View style={styles.trustRow}>
            <Ionicons name="shield-checkmark" size={15} color="#99f6e4" />
            <Text style={styles.trustText}>Your campus community, connected</Text>
          </View>
        </View>

        <View style={styles.formCard}>
          <View style={styles.sheetHeader}>
            <Text style={styles.welcomeText}>Welcome back</Text>
            <Text style={styles.subtitleText}>Sign in to pick up where you left off.</Text>
          </View>

          <Input
            label="Email address"
            placeholder="you@campus.edu"
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              setValidationError('');
              clearError();
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            importantForAutofill="yes"
            returnKeyType="next"
            accessibilityLabel="Email address"
            icon="mail-outline"
          />

          <Input
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={(value) => {
              setPassword(value);
              setValidationError('');
              clearError();
            }}
            secureTextEntry
            autoComplete="current-password"
            textContentType="password"
            importantForAutofill="yes"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={handleLogin}
            accessibilityLabel="Password"
            icon="lock-closed-outline"
          />

          {(validationError || error) ? (
            <View style={styles.errorContainer} accessibilityRole="alert">
              <Ionicons name="alert-circle-outline" size={18} color={theme.colors.error} />
              <Text style={styles.errorText}>{validationError || error}</Text>
            </View>
          ) : null}

          <Button
            title="Sign in"
            onPress={handleLogin}
            loading={submitting}
            disabled={submitting}
            style={styles.loginButton}
            textStyle={styles.loginButtonText}
          />

          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>New to BorrowBack?</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Register')}
              accessibilityRole="button"
              accessibilityLabel="Create a BorrowBack account"
              hitSlop={8}
            >
              <Text style={styles.registerLink}>Create account</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <Ionicons name="people-outline" size={16} color={theme.colors.textSecondary} />
          <Text style={styles.footerText}>Made for sharing, built for campus.</Text>
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
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 36 : 24,
    paddingBottom: 24,
  },
  hero: {
    minHeight: 270,
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: 28,
    paddingHorizontal: 25,
    paddingVertical: 26,
    marginBottom: 18,
    backgroundColor: theme.colors.primary,
    borderWidth: 1,
    borderColor: `${theme.colors.text}24`,
  },
  orbTop: {
    position: 'absolute',
    top: -90,
    right: -50,
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 250, 240, 0.12)',
  },
  orbBottom: {
    position: 'absolute',
    bottom: -135,
    left: -85,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
  },
  logoContainer: {
    width: 43,
    height: 43,
    borderRadius: 15,
    backgroundColor: theme.colors.noticeRed,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  appName: {
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: 0.2,
    color: theme.colors.surface,
  },
  heroTitle: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '800',
    letterSpacing: -0.7,
    color: theme.colors.surface,
    marginBottom: 10,
  },
  tagline: {
    maxWidth: 295,
    fontSize: 14,
    lineHeight: 21,
    color: theme.colors.surface,
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 19,
  },
  trustText: {
    fontSize: 12,
    color: theme.colors.surface,
    fontWeight: '600',
    marginLeft: 7,
  },
  formCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderBottomWidth: 3,
    borderBottomColor: theme.colors.paperShade,
    paddingHorizontal: 21,
    paddingTop: 23,
    paddingBottom: 20,
    ...theme.shadows.card,
  },
  sheetHeader: {
    marginBottom: 19,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 5,
  },
  subtitleText: {
    fontSize: 13,
    lineHeight: 19,
    color: theme.colors.textSecondary,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3c242a',
    borderWidth: 1,
    borderColor: '#6f3942',
    padding: 11,
    borderRadius: 12,
    marginBottom: 14,
  },
  errorText: {
    color: theme.colors.error,
    marginLeft: 8,
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  loginButton: {
    minHeight: 52,
    backgroundColor: theme.colors.secondary,
    borderRadius: 14,
    marginTop: 3,
  },
  loginButtonText: {
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 19,
  },
  registerText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    marginRight: 5,
  },
  registerLink: {
    color: theme.colors.secondary,
    fontSize: 13,
    fontWeight: '800',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 18,
  },
  footerText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginLeft: 7,
  },
});

export default LoginScreen;
