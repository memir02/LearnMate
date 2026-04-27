import { useCallback, useRef, useState } from 'react';
import {
  StyleSheet, Text, View, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl, Modal, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { StudentClassroomsStackParamList } from '../../navigation/StudentClassroomsStackNavigator';
import { classroomApi, invitationApi } from '../../lib/api';
import { Colors } from '../../constants/colors';

type Props = { navigation: NativeStackNavigationProp<StudentClassroomsStackParamList, 'ClassroomsList'> };

interface Classroom {
  id: string;
  name: string;
  description?: string;
  subject?: string;
  grade?: string;
  invitationCode: string;
  teacher: { teacher?: { firstName: string; lastName: string } };
  _count?: { members: number };
}

export default function StudentClassroomsScreen({ navigation }: Props) {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const isFetchingRef = useRef(false);

  const fetchClassrooms = useCallback(async (refresh = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    try {
      const res = await classroomApi.getAll();
      setClassrooms(res.data.data || []);
    } catch {
      Alert.alert('Hata', 'Sınıflar yüklenemedi.');
    } finally {
      isFetchingRef.current = false;
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchClassrooms(); }, [fetchClassrooms]));

  const handleJoin = async () => {
    if (!joinCode.trim()) { Alert.alert('Uyarı', 'Davet kodu girin.'); return; }
    setIsJoining(true);
    try {
      await invitationApi.joinByCode(joinCode.trim().toUpperCase());
      setJoinCode('');
      setShowJoinModal(false);
      Alert.alert('Başarılı', 'Katılım isteği gönderildi. Öğretmen onayladıktan sonra sınıfa ekleneceksiniz.');
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Katılım başarısız.';
      Alert.alert('Hata', msg);
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeave = (id: string, name: string) => {
    Alert.alert('Sınıftan Ayrıl', `"${name}" sınıfından ayrılmak istediğinize emin misiniz?`, [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Ayrıl', style: 'destructive',
        onPress: async () => {
          try {
            await classroomApi.leave(id);
            setClassrooms((prev) => prev.filter((c) => c.id !== id));
          } catch {
            Alert.alert('Hata', 'Sınıftan ayrılırken hata oluştu.');
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Sınıflarım</Text>
          {classrooms.length > 0 && (
            <Text style={styles.headerSub}>{classrooms.length} sınıf</Text>
          )}
        </View>
        <TouchableOpacity style={styles.joinBtn} onPress={() => setShowJoinModal(true)}>
          <Text style={styles.joinBtnText}>+ Katıl</Text>
        </TouchableOpacity>
      </View>

      {classrooms.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🏫</Text>
          <Text style={styles.emptyTitle}>Henüz bir sınıfa üye değilsin</Text>
          <Text style={styles.emptySub}>Davet kodu ile sınıfa katılabilirsin</Text>
          <TouchableOpacity style={styles.joinBtnLarge} onPress={() => setShowJoinModal(true)}>
            <Text style={styles.joinBtnLargeText}>+ Sınıfa Katıl</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={classrooms}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          removeClippedSubviews={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={() => fetchClassrooms(true)} colors={[Colors.primary]} />
          }
          renderItem={({ item }) => {
            const teacherName = item.teacher?.teacher
              ? `${item.teacher.teacher.firstName} ${item.teacher.teacher.lastName}`
              : 'Öğretmen';
            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() => navigation.navigate('ClassroomDetail', { classroomId: item.id, classroomName: item.name })}
                activeOpacity={0.8}
              >
                <View style={styles.cardLeft}>
                  <View style={styles.classIcon}>
                    <Text style={styles.classIconText}>🏫</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardName}>{item.name}</Text>
                    <Text style={styles.cardTeacher}>👨‍🏫 {teacherName}</Text>
                    <View style={styles.cardMeta}>
                      {item.subject && <Text style={styles.metaTag}>📚 {item.subject}</Text>}
                      {item.grade && <Text style={styles.metaTag}>🎓 {item.grade}. Sınıf</Text>}
                      {item._count && <Text style={styles.metaTag}>👥 {item._count.members} üye</Text>}
                    </View>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.leaveBtn}
                  onPress={() => handleLeave(item.id, item.name)}
                >
                  <Text style={styles.leaveBtnText}>Ayrıl</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Katılma Modalı */}
      <Modal visible={showJoinModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Sınıfa Katıl</Text>
            <Text style={styles.modalSub}>
              Öğretmeninden aldığın davet kodunu gir
            </Text>
            <TextInput
              style={styles.codeInput}
              value={joinCode}
              onChangeText={(t) => setJoinCode(t.toUpperCase())}
              placeholder="Örn: ABC123"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="characters"
              maxLength={10}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => { setShowJoinModal(false); setJoinCode(''); }}
              >
                <Text style={styles.modalCancelText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirm, isJoining && { opacity: 0.6 }]}
                onPress={handleJoin}
                disabled={isJoining}
              >
                {isJoining
                  ? <ActivityIndicator color={Colors.white} />
                  : <Text style={styles.modalConfirmText}>Katıl</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  headerSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  joinBtn: { backgroundColor: Colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  joinBtnText: { color: Colors.white, fontWeight: '700', fontSize: 13 },
  list: { padding: 16, gap: 12, paddingBottom: 100 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 40 },
  emptyIcon: { fontSize: 52 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  emptySub: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center' },
  joinBtnLarge: {
    marginTop: 8, backgroundColor: Colors.primary,
    paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12,
  },
  joinBtnLargeText: { color: Colors.white, fontWeight: '800', fontSize: 14 },
  card: {
    backgroundColor: Colors.white, borderRadius: 16, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  cardLeft: { flex: 1, flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  classIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  classIconText: { fontSize: 22 },
  cardName: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary, marginBottom: 2 },
  cardTeacher: { fontSize: 12, color: Colors.textSecondary, marginBottom: 4 },
  cardMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  metaTag: { fontSize: 11, color: Colors.textSecondary, fontWeight: '500' },
  leaveBtn: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
    borderWidth: 1.5, borderColor: '#fecaca', backgroundColor: '#fef2f2',
  },
  leaveBtnText: { fontSize: 12, color: Colors.error, fontWeight: '700' },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, gap: 16,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  modalSub: { fontSize: 14, color: Colors.textSecondary, marginTop: -8 },
  codeInput: {
    borderWidth: 2, borderColor: Colors.border, borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 22, fontWeight: '800', color: Colors.textPrimary,
    textAlign: 'center', letterSpacing: 4,
    backgroundColor: Colors.background,
  },
  modalActions: { flexDirection: 'row', gap: 10, paddingBottom: 8 },
  modalCancel: {
    flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center',
    borderWidth: 1.5, borderColor: Colors.border,
  },
  modalCancelText: { fontSize: 15, fontWeight: '700', color: Colors.textSecondary },
  modalConfirm: {
    flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center',
    backgroundColor: Colors.primary,
  },
  modalConfirmText: { fontSize: 15, fontWeight: '800', color: Colors.white },
});
