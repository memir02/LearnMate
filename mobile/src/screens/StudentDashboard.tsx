import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../constants/colors';

export default function StudentDashboard() {
  const { user, logout } = useAuth();

  const firstName = user?.student?.firstName ?? user?.email ?? 'Öğrenci';

  return (
    <LinearGradient colors={[Colors.gradientStart, Colors.gradientEnd]} style={styles.gradient}>
      <SafeAreaView style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Merhaba, {firstName} 👋</Text>
              <Text style={styles.role}>Öğrenci Paneli</Text>
            </View>
            <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
              <Text style={styles.logoutText}>Çıkış</Text>
            </TouchableOpacity>
          </View>

          {/* Profil kartı */}
          <View style={styles.profileCard}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarIcon}>👨‍🎓</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {user?.student?.firstName} {user?.student?.lastName}
              </Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>
              {user?.student?.grade && (
                <View style={styles.gradeBadge}>
                  <Text style={styles.gradeBadgeText}>{user.student.grade}. Sınıf</Text>
                </View>
              )}
            </View>
          </View>

          {/* Menü */}
          <Text style={styles.sectionTitle}>Menü</Text>
          <View style={styles.menuGrid}>
            <MenuItem icon="📝" label="Testlerim" color="#dbeafe" />
            <MenuItem icon="🏫" label="Sınıflarım" color="#dcfce7" />
            <MenuItem icon="✏️" label="Pratik Yap" color="#fef9c3" />
            <MenuItem icon="📊" label="İstatistikler" color="#fce7f3" />
            <MenuItem icon="📬" label="Davetlerim" color="#ede9fe" />
            <MenuItem icon="👤" label="Profilim" color="#ffedd5" />
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function MenuItem({ icon, label, color }: { icon: string; label: string; color: string }) {
  return (
    <TouchableOpacity style={[styles.menuItem, { backgroundColor: color }]} activeOpacity={0.8}>
      <Text style={styles.menuIcon}>{icon}</Text>
      <Text style={styles.menuLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 20 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 20,
  },
  greeting: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  role: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  logoutBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.white,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  logoutText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  profileCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 4,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarIcon: { fontSize: 28 },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  profileEmail: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  gradeBadge: {
    marginTop: 6,
    alignSelf: 'flex-start',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  gradeBadgeText: { fontSize: 12, fontWeight: '600', color: Colors.primary },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  menuItem: {
    width: '47%',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    gap: 8,
  },
  menuIcon: { fontSize: 28 },
  menuLabel: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  comingSoon: {
    marginTop: 24,
    marginBottom: 16,
    padding: 16,
    backgroundColor: Colors.white,
    borderRadius: 14,
    alignItems: 'center',
  },
  comingSoonText: { fontSize: 14, color: Colors.textSecondary },
});
