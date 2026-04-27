import { useCallback, useState } from 'react';
import {
  StyleSheet, Text, View, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { StudentClassroomsStackParamList } from '../../navigation/StudentClassroomsStackNavigator';
import { classroomApi, homeworkApi } from '../../lib/api';
import { Colors } from '../../constants/colors';

type Props = {
  navigation: NativeStackNavigationProp<StudentClassroomsStackParamList, 'ClassroomDetail'>;
  route: RouteProp<StudentClassroomsStackParamList, 'ClassroomDetail'>;
};

interface Homework {
  id: string;
  title: string;
  description?: string;
  fileUrl: string;
  fileType: 'PDF' | 'IMAGE';
  dueDate?: string;
  teacher?: { teacher?: { firstName: string; lastName: string } };
  classroom?: { name: string };
}

interface Classroom {
  id: string;
  name: string;
  description?: string;
  subject?: string;
  grade?: string;
  invitationCode: string;
  teacher: { teacher?: { firstName: string; lastName: string } };
  _count?: { members: number; tests: number };
}

export default function StudentClassroomDetailScreen({ navigation, route }: Props) {
  const { classroomId, classroomName } = route.params;
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'homework'>('homework');
  const [openingId, setOpeningId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [classRes, hwRes] = await Promise.all([
        classroomApi.getById(classroomId),
        homeworkApi.getByClassroom(classroomId),
      ]);
      setClassroom(classRes.data.data);
      setHomeworks(hwRes.data.data || []);
    } catch {
      Alert.alert('Hata', 'Sınıf bilgileri yüklenemedi.');
    } finally {
      setIsLoading(false);
    }
  }, [classroomId]);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const handleOpenFile = async (hw: Homework) => {
    setOpeningId(hw.id);
    try {
      const ext = hw.fileType === 'PDF' ? 'pdf' : 'jpg';
      const localUri = FileSystem.cacheDirectory + `homework_${hw.id}.${ext}`;
      const info = await FileSystem.getInfoAsync(localUri);
      if (!info.exists) {
        await FileSystem.downloadAsync(hw.fileUrl, localUri);
      }
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(localUri, {
          mimeType: hw.fileType === 'PDF' ? 'application/pdf' : 'image/jpeg',
          dialogTitle: hw.title,
        });
      } else {
        await Linking.openURL(hw.fileUrl);
      }
    } catch {
      Alert.alert('Hata', 'Dosya açılamadı, lütfen tekrar deneyin.');
    } finally {
      setOpeningId(null);
    }
  };

  if (isLoading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }

  const teacherName = classroom?.teacher?.teacher
    ? `${classroom.teacher.teacher.firstName} ${classroom.teacher.teacher.lastName}`
    : 'Öğretmen';

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Geri</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{classroomName}</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Classroom özet kartı */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryIcon}>🏫</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.summaryName}>{classroom?.name}</Text>
            <Text style={styles.summaryTeacher}>👨‍🏫 {teacherName}</Text>
          </View>
        </View>
        <View style={styles.summaryMeta}>
          {classroom?.subject && <View style={styles.badge}><Text style={styles.badgeText}>📚 {classroom.subject}</Text></View>}
          {classroom?.grade && <View style={styles.badge}><Text style={styles.badgeText}>🎓 {classroom.grade}. Sınıf</Text></View>}
          {classroom?._count?.members !== undefined && (
            <View style={styles.badge}><Text style={styles.badgeText}>👥 {classroom._count.members} üye</Text></View>
          )}
        </View>
      </View>

      {/* Tab */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'homework' && styles.tabActive]}
          onPress={() => setActiveTab('homework')}
        >
          <Text style={[styles.tabText, activeTab === 'homework' && styles.tabTextActive]}>
            📋 Ödevler ({homeworks.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'info' && styles.tabActive]}
          onPress={() => setActiveTab('info')}
        >
          <Text style={[styles.tabText, activeTab === 'info' && styles.tabTextActive]}>
            ℹ️ Bilgiler
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'homework' ? (
        homeworks.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>Henüz ödev yok</Text>
            <Text style={styles.emptySub}>Öğretmenin henüz ödev vermedi</Text>
          </View>
        ) : (
          <FlatList
            data={homeworks}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            removeClippedSubviews={false}
            renderItem={({ item }) => {
              const isOpening = openingId === item.id;
              const hasDue = !!item.dueDate;
              const dueDate = hasDue ? new Date(item.dueDate!) : null;
              const isOverdue = dueDate ? dueDate < new Date() : false;
              return (
                <View style={styles.hwCard}>
                  <View style={styles.hwCardTop}>
                    <View style={[styles.hwIconBg, item.fileType === 'PDF' ? styles.pdfBg : styles.imgBg]}>
                      <Text style={styles.hwIcon}>{item.fileType === 'PDF' ? '📄' : '🖼️'}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.hwTitle}>{item.title}</Text>
                      {item.description && <Text style={styles.hwDesc}>{item.description}</Text>}
                      {dueDate && (
                        <Text style={[styles.hwDue, isOverdue && styles.hwDueOverdue]}>
                          {isOverdue ? '⚠️' : '📅'} Son teslim: {dueDate.toLocaleDateString('tr-TR')}
                        </Text>
                      )}
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[styles.openBtn, isOpening && { opacity: 0.6 }]}
                    onPress={() => handleOpenFile(item)}
                    disabled={isOpening}
                  >
                    {isOpening
                      ? <ActivityIndicator size="small" color={Colors.primary} />
                      : <Text style={styles.openBtnText}>{item.fileType === 'PDF' ? '📄 Dosyayı Aç' : '🖼️ Görseli Aç'}</Text>
                    }
                  </TouchableOpacity>
                </View>
              );
            }}
          />
        )
      ) : (
        <View style={styles.infoSection}>
          {classroom?.description && (
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Açıklama</Text>
              <Text style={styles.infoValue}>{classroom.description}</Text>
            </View>
          )}
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Öğretmen</Text>
            <Text style={styles.infoValue}>{teacherName}</Text>
          </View>
          {classroom?.subject && (
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Ders</Text>
              <Text style={styles.infoValue}>{classroom.subject}</Text>
            </View>
          )}
          {classroom?.grade && (
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Sınıf Seviyesi</Text>
              <Text style={styles.infoValue}>{classroom.grade}. Sınıf</Text>
            </View>
          )}
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Üye Sayısı</Text>
            <Text style={styles.infoValue}>{classroom?._count?.members ?? 0} öğrenci</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { padding: 4 },
  backBtnText: { fontSize: 14, fontWeight: '600', color: Colors.primary },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center', marginHorizontal: 8 },
  summaryCard: {
    backgroundColor: Colors.white, margin: 16, borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
    gap: 10,
  },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  summaryIcon: { fontSize: 32 },
  summaryName: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  summaryTeacher: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  summaryMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  badge: { backgroundColor: Colors.primaryLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 12, color: Colors.primary, fontWeight: '600' },
  tabs: {
    flexDirection: 'row', marginHorizontal: 16,
    backgroundColor: Colors.white, borderRadius: 12,
    padding: 4, marginBottom: 12,
    borderWidth: 1, borderColor: Colors.border,
  },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  tabTextActive: { color: Colors.white },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  emptySub: { fontSize: 13, color: Colors.textSecondary },
  list: { paddingHorizontal: 16, gap: 12, paddingBottom: 100 },
  hwCard: {
    backgroundColor: Colors.white, borderRadius: 16, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    gap: 12,
  },
  hwCardTop: { flexDirection: 'row', gap: 12 },
  hwIconBg: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  pdfBg: { backgroundColor: '#fee2e2' },
  imgBg: { backgroundColor: '#dbeafe' },
  hwIcon: { fontSize: 22 },
  hwTitle: { fontSize: 14, fontWeight: '800', color: Colors.textPrimary },
  hwDesc: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  hwDue: { fontSize: 11, color: Colors.textSecondary, marginTop: 4, fontWeight: '600' },
  hwDueOverdue: { color: Colors.error },
  openBtn: {
    borderWidth: 1.5, borderColor: Colors.primary, borderRadius: 10,
    paddingVertical: 10, alignItems: 'center', backgroundColor: Colors.primaryLight,
  },
  openBtnText: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  infoSection: { padding: 16, gap: 10 },
  infoCard: {
    backgroundColor: Colors.white, borderRadius: 14, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  infoLabel: { fontSize: 11, fontWeight: '700', color: Colors.textMuted, marginBottom: 4, textTransform: 'uppercase' },
  infoValue: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
});
