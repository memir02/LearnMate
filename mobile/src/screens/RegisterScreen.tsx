import { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/AppNavigator';
import { Colors } from '../constants/colors';
import { useAuth } from '../context/AuthContext';

type RegisterScreenProps = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Register'>;
};

type Role = 'STUDENT' | 'TEACHER';

const GRADES = ['1', '2', '3', '4', '5', '6', '7', '8'];

type FormErrors = {
  firstName?: string;
  lastName?: string;
  email?: string;
  grade?: string;
  password?: string;
  confirmPassword?: string;
};

export default function RegisterScreen({ navigation }: RegisterScreenProps) {
  const { register } = useAuth();
  const [role, setRole] = useState<Role>('STUDENT');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [grade, setGrade] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const validate = () => {
    const newErrors: FormErrors = {};
    if (!firstName || firstName.length < 2)
      newErrors.firstName = 'Ad en az 2 karakter olmalıdır';
    if (!lastName || lastName.length < 2)
      newErrors.lastName = 'Soyad en az 2 karakter olmalıdır';
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      newErrors.email = 'Geçerli bir email adresi giriniz';
    if (role === 'STUDENT' && !grade)
      newErrors.grade = 'Sınıf seçimi gereklidir';
    if (!password || password.length < 6)
      newErrors.password = 'Şifre en az 6 karakter olmalıdır';
    if (password !== confirmPassword)
      newErrors.confirmPassword = 'Şifreler eşleşmiyor';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const clearError = (field: keyof FormErrors) =>
    setErrors((e) => ({ ...e, [field]: undefined }));

  const handleRegister = async () => {
    if (!validate()) return;
    setIsLoading(true);
    try {
      await register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
        role,
        ...(role === 'STUDENT' && grade ? { grade } : {}),
      });
      // Navigation AuthContext'teki user state değişince otomatik olur
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        'Sunucuya bağlanılamadı. IP adresini kontrol edin.';
      Alert.alert('Kayıt Başarısız', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={[Colors.gradientStart, Colors.gradientEnd]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Back Button */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backButtonText}>← Geri</Text>
            </TouchableOpacity>

            {/* Card */}
            <View style={styles.card}>
              {/* Header */}
              <View style={styles.cardHeader}>
                <Text style={styles.logoText}>LearnMate</Text>
                <Text style={styles.cardSubtitle}>Yeni hesap oluşturun</Text>
              </View>

              {/* Role Selection */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Hesap Türü</Text>
                <View style={styles.roleRow}>
                  <TouchableOpacity
                    style={[
                      styles.roleButton,
                      role === 'STUDENT' && styles.roleButtonActive,
                    ]}
                    onPress={() => setRole('STUDENT')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.roleIcon}>👨‍🎓</Text>
                    <Text
                      style={[
                        styles.roleText,
                        role === 'STUDENT' && styles.roleTextActive,
                      ]}
                    >
                      Öğrenci
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.roleButton,
                      role === 'TEACHER' && styles.roleButtonActive,
                    ]}
                    onPress={() => setRole('TEACHER')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.roleIcon}>👨‍🏫</Text>
                    <Text
                      style={[
                        styles.roleText,
                        role === 'TEACHER' && styles.roleTextActive,
                      ]}
                    >
                      Öğretmen
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Name Row */}
              <View style={styles.nameRow}>
                <View style={[styles.fieldGroup, styles.nameField]}>
                  <Text style={styles.label}>Ad</Text>
                  <TextInput
                    style={[styles.input, errors.firstName ? styles.inputError : null]}
                    placeholder="Ahmet"
                    placeholderTextColor={Colors.textMuted}
                    autoCapitalize="words"
                    value={firstName}
                    onChangeText={(t) => { setFirstName(t); clearError('firstName'); }}
                  />
                  {errors.firstName ? (
                    <Text style={styles.errorText}>{errors.firstName}</Text>
                  ) : null}
                </View>

                <View style={[styles.fieldGroup, styles.nameField]}>
                  <Text style={styles.label}>Soyad</Text>
                  <TextInput
                    style={[styles.input, errors.lastName ? styles.inputError : null]}
                    placeholder="Yılmaz"
                    placeholderTextColor={Colors.textMuted}
                    autoCapitalize="words"
                    value={lastName}
                    onChangeText={(t) => { setLastName(t); clearError('lastName'); }}
                  />
                  {errors.lastName ? (
                    <Text style={styles.errorText}>{errors.lastName}</Text>
                  ) : null}
                </View>
              </View>

              {/* Email */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={[styles.input, errors.email ? styles.inputError : null]}
                  placeholder="ornek@email.com"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={(t) => { setEmail(t); clearError('email'); }}
                />
                {errors.email ? (
                  <Text style={styles.errorText}>{errors.email}</Text>
                ) : null}
              </View>

              {/* Grade (Sadece öğrenci için) */}
              {role === 'STUDENT' && (
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Sınıf</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.gradeRow}
                  >
                    {GRADES.map((g) => (
                      <TouchableOpacity
                        key={g}
                        style={[
                          styles.gradeChip,
                          grade === g && styles.gradeChipActive,
                        ]}
                        onPress={() => { setGrade(g); clearError('grade'); }}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.gradeChipText,
                            grade === g && styles.gradeChipTextActive,
                          ]}
                        >
                          {g}. Sınıf
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  {errors.grade ? (
                    <Text style={styles.errorText}>{errors.grade}</Text>
                  ) : null}
                </View>
              )}

              {/* Password */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Şifre</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[
                      styles.input,
                      styles.passwordInput,
                      errors.password ? styles.inputError : null,
                    ]}
                    placeholder="••••••••"
                    placeholderTextColor={Colors.textMuted}
                    secureTextEntry={!isPasswordVisible}
                    value={password}
                    onChangeText={(t) => { setPassword(t); clearError('password'); }}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                  >
                    <Text style={styles.eyeIcon}>{isPasswordVisible ? '🙈' : '👁️'}</Text>
                  </TouchableOpacity>
                </View>
                {errors.password ? (
                  <Text style={styles.errorText}>{errors.password}</Text>
                ) : null}
              </View>

              {/* Confirm Password */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Şifre Tekrar</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[
                      styles.input,
                      styles.passwordInput,
                      errors.confirmPassword ? styles.inputError : null,
                    ]}
                    placeholder="••••••••"
                    placeholderTextColor={Colors.textMuted}
                    secureTextEntry={!isConfirmVisible}
                    value={confirmPassword}
                    onChangeText={(t) => { setConfirmPassword(t); clearError('confirmPassword'); }}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setIsConfirmVisible(!isConfirmVisible)}
                  >
                    <Text style={styles.eyeIcon}>{isConfirmVisible ? '🙈' : '👁️'}</Text>
                  </TouchableOpacity>
                </View>
                {errors.confirmPassword ? (
                  <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                ) : null}
              </View>

              {/* Register Button */}
              <TouchableOpacity
                style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]}
                onPress={handleRegister}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                {isLoading ? (
                  <ActivityIndicator color={Colors.white} size="small" />
                ) : (
                  <Text style={styles.primaryButtonText}>Kayıt Ol</Text>
                )}
              </TouchableOpacity>

              {/* Login Link */}
              <View style={styles.linkRow}>
                <Text style={styles.linkText}>Zaten hesabınız var mı? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.linkAction}>Giriş Yap</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safeArea: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  backButton: {
    marginTop: 8,
    marginBottom: 16,
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  backButtonText: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoText: {
    fontSize: 30,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    color: Colors.textPrimary,
    backgroundColor: Colors.background,
  },
  inputError: {
    borderColor: Colors.error,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
  },
  nameField: {
    flex: 1,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 12,
  },
  roleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  roleButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  roleIcon: {
    fontSize: 18,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  roleTextActive: {
    color: Colors.primary,
  },
  gradeRow: {
    gap: 8,
    paddingVertical: 2,
  },
  gradeChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  gradeChipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  gradeChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  gradeChipTextActive: {
    color: Colors.primary,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 52,
  },
  eyeButton: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  eyeIcon: {
    fontSize: 18,
  },
  errorText: {
    marginTop: 6,
    fontSize: 12,
    color: Colors.error,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  linkText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  linkAction: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '700',
  },
});
