import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import Input from '../components/Input';
import Button from '../components/Button';
import BorrowBackMark from '../components/BorrowBackMark';
import { theme } from '../theme';
import Text from '../components/ThemedText';

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
      <View style={styles.background}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
        <View style={styles.hero}>
          <View style={styles.brandRow}>
            <View style={styles.logoContainer}>
              <BorrowBackMark size={43} />
            </View>
            <Text style={styles.appName}>BorrowBack</Text>
          </View>
          <Text style={styles.heroTitle}>Borrow what you need.{'\n'}Lend what you can.</Text>
          <Text style={styles.tagline}>
            Find items listed by members on your campus and keep track of your borrows.
          </Text>
          <View style={styles.trustRow}>
            <Ionicons name="shield-checkmark" size={15} color="#99f6e4" />
            <Text style={styles.trustText}>Borrowing and lending in one place</Text>
          </View>
        </View>

        <View style={styles.form}>
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
            variant="underline"
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
            variant="underline"
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

        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  background: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingTop: Platform.OS === 'android' ? 28 : 24,
    paddingBottom: 30,
  },
  hero: {
    justifyContent: 'center',
    paddingVertical: 12,
    marginBottom: 30,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 34,
  },
  logoContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    backgroundColor: 'rgba(255,73,62,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,112,101,0.2)',
  },
  appName: {
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: 0.2,
    color: theme.colors.text,
  },
  heroTitle: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '800',
    letterSpacing: -0.9,
    color: theme.colors.text,
    marginBottom: 10,
  },
  tagline: {
    maxWidth: 295,
    fontSize: 14,
    lineHeight: 21,
    color: theme.colors.textSecondary,
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 19,
  },
  trustText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    marginLeft: 7,
  },
  form: {
    backgroundColor: theme.colors.glass,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: theme.borderRadius.xl,
    paddingHorizontal: 20,
    paddingVertical: 22,
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
});

export default LoginScreen;
