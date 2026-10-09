import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView, 
  TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import Input from '../components/Input';
import Button from '../components/Button';
import { theme } from '../theme';

const RegisterScreen = ({ navigation }) => {
  const { register, loading, error, clearError } = useAuth();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleRegister = async () => {
    if (submitting) return;
    setValidationError('');

    if (!name.trim() || !email.trim() || !phone.trim() || !password || !confirmPassword) {
      setValidationError('All fields are required.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setValidationError('Enter a valid email address.');
      return;
    }
    
    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters long.');
      return;
    }
    
    if (password !== confirmPassword) {
      setValidationError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await register(name.trim(), email.trim().toLowerCase(), password, phone.trim());
    } catch (err) {
      console.error('Registration failed:', err);
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
        bounces={false}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <View style={styles.logoContainer}>
            <Ionicons name="person-add-outline" size={40} color="#0d9488" />
          </View>
          <Text style={styles.appName}>Join BorrowBack</Text>
          <Text style={styles.tagline}>Create your account to get started</Text>
        </View>

        {/* Bottom Sheet Section */}
        <View style={styles.bottomSheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.welcomeText}>Create Account</Text>
          </View>

          <View style={styles.formContainer}>
            <Input
              placeholder="Full Name"
              value={name}
              onChangeText={(value) => {
                setName(value);
                setValidationError('');
                clearError();
              }}
              autoCapitalize="words"
              icon={<Ionicons name="person-outline" size={20} color="#64748b" />}
            />
            
            <View style={styles.spacer} />

            <Input
              placeholder="Email Address"
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
              icon={<Ionicons name="mail-outline" size={20} color="#64748b" />}
            />
            
            <View style={styles.spacer} />

            <Input
              placeholder="Phone Number"
              value={phone}
              onChangeText={(value) => {
                setPhone(value);
                setValidationError('');
                clearError();
              }}
              keyboardType="phone-pad"
              icon={<Ionicons name="call-outline" size={20} color="#64748b" />}
            />
            
            <View style={styles.spacer} />

            <Input
              placeholder="Password"
              value={password}
              onChangeText={(value) => {
                setPassword(value);
                setValidationError('');
                clearError();
              }}
              secureTextEntry
              icon={<Ionicons name="lock-closed-outline" size={20} color="#64748b" />}
            />
            
            <View style={styles.spacer} />

            <Input
              placeholder="Confirm Password"
              value={confirmPassword}
              onChangeText={(value) => {
                setConfirmPassword(value);
                setValidationError('');
                clearError();
              }}
              secureTextEntry
              icon={<Ionicons name="lock-closed-outline" size={20} color="#64748b" />}
            />

            {(error || validationError) ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={16} color="#e11d48" />
                <Text style={styles.errorText}>
                  {validationError || error || 'Something went wrong. Please try again.'}
                </Text>
              </View>
            ) : <View style={styles.emptyErrorSpace} />}

            <Button
              title="Register"
              onPress={handleRegister}
              loading={loading || submitting}
              disabled={submitting}
              style={styles.registerBtn}
            />

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLink}>Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e3a5f',
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    minHeight: 250,
    paddingVertical: 32,
    backgroundColor: '#1e3a5f',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  logoContainer: {
    width: 70,
    height: 70,
    backgroundColor: '#ffffff',
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 15,
    color: '#94a3b8',
    textAlign: 'center',
  },
  bottomSheet: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
    minHeight: 480,
  },
  sheetHeader: {
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 8,
  },
  formContainer: {
    flex: 1,
  },
  spacer: {
    height: 16,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffe4e6',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    color: '#e11d48',
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
  },
  emptyErrorSpace: {
    height: 24,
  },
  registerBtn: {
    marginTop: 8,
    marginBottom: 24,
    backgroundColor: '#0d9488',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: 16,
  },
  loginText: {
    color: '#64748b',
    fontSize: 15,
  },
  loginLink: {
    color: '#0d9488',
    fontSize: 15,
    fontWeight: 'bold',
  },
});

export default RegisterScreen;
