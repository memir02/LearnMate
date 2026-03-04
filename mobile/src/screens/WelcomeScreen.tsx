import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Colors } from '../constants/colors';

type WelcomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Welcome'>;
};

export default function WelcomeScreen({ navigation }: WelcomeScreenProps) {
  return (
    <LinearGradient
      colors={[Colors.gradientStart, Colors.gradientEnd]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoIcon}>📚</Text>
            </View>
          </View>

          <Text style={styles.title}>LearnMate</Text>
          <Text style={styles.subtitle}>
            Öğrenme yolculuğunuzda yanınızdayız
          </Text>
        </View>

        {/* Features */}
        <View style={styles.featuresSection}>
          <FeatureItem icon="🎯" text="Kişiselleştirilmiş testler ve sorular" />
          <FeatureItem icon="📊" text="Detaylı ilerleme takibi ve istatistikler" />
          <FeatureItem icon="🏫" text="Sınıf yönetimi ve ödev takibi" />
          <FeatureItem icon="✏️" text="Pratik yaparak kendini geliştir" />
        </View>

        {/* Buttons */}
        <View style={styles.buttonsSection}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>Giriş Yap</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Register')}
            activeOpacity={0.85}
          >
            <Text style={styles.secondaryButtonText}>Hesap Oluştur</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footerText}>
          Eğitimin geleceğine hoş geldiniz
        </Text>
      </SafeAreaView>
    </LinearGradient>
  );
}

function FeatureItem({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.featureItem}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'space-between',
    paddingBottom: 16,
  },
  heroSection: {
    alignItems: 'center',
    paddingTop: 40,
  },
  logoContainer: {
    marginBottom: 20,
  },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  logoIcon: {
    fontSize: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  featuresSection: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 24,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  featureIcon: {
    fontSize: 22,
    width: 32,
    textAlign: 'center',
  },
  featureText: {
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  buttonsSection: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  secondaryButton: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  secondaryButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  footerText: {
    textAlign: 'center',
    fontSize: 13,
    color: Colors.textMuted,
    paddingBottom: 4,
  },
});
