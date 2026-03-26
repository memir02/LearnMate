import { useEffect, useState } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, FlatList,
  ActivityIndicator, Alert, Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { ClassroomsStackParamList } from '../../navigation/ClassroomsStackNavigator';
import { classroomApi } from '../../lib/api';
import { Colors } from '../../constants/colors';

type Props = {
  navigation: NativeStackNavigationProp<ClassroomsStackParamList, 'ClassroomDetail'>;
  route: RouteProp<ClassroomsStackParamList, 'ClassroomDetail'>;
};

interface Member {
  id: string;
  studentId: string;
  joinedAt: string;
  student: {
    student: { firstName: string; lastName: string; grade?: string } | null;
    email: string;
  };
}

interface ClassroomDetail {
  id: string;
  name: string;
  description?: string;
  subject?: string;
  grade?: string;
  code: string;
  members: Member[];
  _count: { members: number; tests: number; invitations: number };
}

export default function ClassroomDetailScreen({ navigation, route }: Props) {
  const { classroomId, classroomName } = route.params;
  const [classroom, setClassroom] = useState<ClassroomDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDetail = async () => {
    try {
      const res = await classroomApi.getById(classroomId);
      setClassroom(res.data.data);
    } catch {
      Alert.alert('Hata', 'Sınıf bilgileri yüklenemedi.');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchDetail(); }, []);

  const handleShare = async () => {
    if (!classroom) return;
    await Share.share({
      message: `LearnMate'te "${classroom.name}" sınıfına katılmak için kod: ${classroom.code}`,
    });
  };

  const handleRemoveMember = (memberId: string, studentId: string, fullName: string) => {
    Alert.alert(
      'Üyeyi Çıkar',
      `"${fullName}" adlı öğrenciyi sınıftan çıkarmak istiyor musunuz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Çıkar', style: 'destructive',
          onPress: async () => {
            try {
              await classroomApi.removeMember(classroomId, studentId);
              fetchDetail();
            } catch {
              Alert.alert('Hata', 'Öğrenci çıkarılamadı.');
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!classroom) return null;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Geri</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{classroom.name}</Text>
        <View style={{ width: 60 }} />
      </View>

      <FlatList
        data={classroom.members}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.scrollContent}
        ListHeaderComponent={() => (
          <>
            {/* İstatistik kartları */}
            <View style={styles.statsRow}>
              <StatCard value={classroom._count.members} label="Üye" icon="👥" />
              <StatCard value={classroom._count.tests} label="Test" icon="📝" />
              <StatCard value={classroom._count.invitations} label="Bekleyen" icon="⏳" />
            </View>

            {/* Sınıf bilgileri */}
            <View style={styles.infoCard}>
              {classroom.subject ? (
                <InfoRow icon="📚" label="Branş" value={classroom.subject} />
              ) : null}
              {classroom.grade ? (
                <InfoRow icon="🎓" label="Seviye" value={`${classroom.grade}. Sınıf`} />
              ) : null}
              {classroom.description ? (
                <InfoRow icon="📋" label="Açıklama" value={classroom.description} />
              ) : null}

              {/* Davet kodu */}
              <View style={styles.codeSection}>
                <View style={styles.codeBox}>
                  <Text style={styles.codeLabel}>Davet Kodu</Text>
                  <Text style={styles.codeValue}>{classroom.code}</Text>
                </View>
                <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
                  <Text style={styles.shareBtnText}>Paylaş 🔗</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Üye listesi başlığı */}
            <Text style={styles.sectionTitle}>
              Öğrenciler ({classroom.members.length})
            </Text>
          </>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyMembers}>
            <Text style={styles.emptyMembersText}>Henüz üye yok</Text>
          </View>
        )}
        renderItem={({ item }) => {
          const student = item.student.student;
          const fullName = student
            ? `${student.firstName} ${student.lastName}`
            : item.student.email;
          const grade = student?.grade ? `${student.grade}. Sınıf` : null;

          return (
            <View style={styles.memberCard}>
              <View style={styles.memberAvatar}>
                <Text style={styles.memberAvatarText}>
                  {(student?.firstName?.[0] ?? '?').toUpperCase()}
                </Text>
              </View>
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{fullName}</Text>
                {grade ? <Text style={styles.memberGrade}>{grade}</Text> : null}
              </View>
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => handleRemoveMember(item.id, item.studentId, fullName)}
              >
                <Text style={styles.removeBtnText}>Çıkar</Text>
              </TouchableOpacity>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

function StatCard({ value, label, icon }: { value: number; label: string; icon: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoIcon}>{icon}</Text>
      <View>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { width: 60 },
  backText: { color: Colors.primary, fontSize: 15, fontWeight: '600' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: Colors.textPrimary, flex: 1, textAlign: 'center' },
  scrollContent: { padding: 16, gap: 12 },
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: {
    flex: 1, backgroundColor: Colors.white, borderRadius: 14, padding: 14,
    alignItems: 'center', gap: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  statIcon: { fontSize: 22 },
  statValue: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  statLabel: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
  infoCard: {
    backgroundColor: Colors.white, borderRadius: 16, padding: 18,
    gap: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  infoIcon: { fontSize: 18, marginTop: 2 },
  infoLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: '600', textTransform: 'uppercase' },
  infoValue: { fontSize: 15, color: Colors.textPrimary, fontWeight: '600', marginTop: 2 },
  codeSection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  codeBox: {},
  codeLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: '600', textTransform: 'uppercase' },
  codeValue: { fontSize: 22, fontWeight: '800', color: Colors.primary, letterSpacing: 2, marginTop: 4 },
  shareBtn: {
    backgroundColor: Colors.primaryLight, paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 12,
  },
  shareBtnText: { color: Colors.primary, fontWeight: '700', fontSize: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginTop: 4 },
  memberCard: {
    backgroundColor: Colors.white, borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  memberAvatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  memberAvatarText: { fontSize: 16, fontWeight: '800', color: Colors.primary },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  memberGrade: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  removeBtn: {
    backgroundColor: '#fef2f2', paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 10, borderWidth: 1, borderColor: '#fecaca',
  },
  removeBtnText: { fontSize: 12, fontWeight: '700', color: Colors.error },
  emptyMembers: { padding: 20, alignItems: 'center' },
  emptyMembersText: { color: Colors.textSecondary, fontSize: 14 },
});
