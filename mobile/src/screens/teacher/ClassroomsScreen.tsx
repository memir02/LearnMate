import { useEffect, useState } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, FlatList,
  ActivityIndicator, Alert, Modal, TextInput, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ClassroomsStackParamList } from '../../navigation/ClassroomsStackNavigator';
import { classroomApi } from '../../lib/api';
import { Colors } from '../../constants/colors';

type Props = {
  navigation: NativeStackNavigationProp<ClassroomsStackParamList, 'ClassroomsList'>;
};

interface Classroom {
  id: string;
  name: string;
  description?: string;
  subject?: string;
  grade?: string;
  code: string;
  _count: { members: number; invitations: number };
}

const GRADES = ['1', '2', '3', '4', '5', '6', '7', '8'];

export default function ClassroomsScreen({ navigation }: Props) {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');

  const fetchClassrooms = async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    try {
      const res = await classroomApi.getAll();
      setClassrooms(res.data.data);
    } catch {
      Alert.alert('Hata', 'Sınıflar yüklenemedi.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => { fetchClassrooms(); }, []);

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Uyarı', 'Sınıf adı zorunludur.');
      return;
    }
    setIsCreating(true);
    try {
      await classroomApi.create({
        name: name.trim(),
        description: description.trim() || undefined,
        subject: subject.trim() || undefined,
        grade: selectedGrade || undefined,
      });
      setModalVisible(false);
      setName(''); setDescription(''); setSubject(''); setSelectedGrade('');
      fetchClassrooms();
    } catch (e: any) {
      Alert.alert('Hata', e.response?.data?.message || 'Sınıf oluşturulamadı.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = (id: string, classroomName: string) => {
    Alert.alert(
      'Sınıfı Sil',
      `"${classroomName}" sınıfını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil', style: 'destructive',
          onPress: async () => {
            try {
              await classroomApi.delete(id);
              fetchClassrooms();
            } catch {
              Alert.alert('Hata', 'Sınıf silinemedi.');
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Sınıflarım</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Text style={styles.addBtnText}>+ Yeni</Text>
        </TouchableOpacity>
      </View>

      {classrooms.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🏫</Text>
          <Text style={styles.emptyTitle}>Henüz sınıfın yok</Text>
          <Text style={styles.emptySubtitle}>İlk sınıfını oluşturmak için "+ Yeni" butonuna bas</Text>
        </View>
      ) : (
        <FlatList
          data={classrooms}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={() => fetchClassrooms(true)} colors={[Colors.primary]} />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('ClassroomDetail', { classroomId: item.id, classroomName: item.name })}
            >
              <View style={styles.cardTop}>
                <View style={styles.cardIcon}>
                  <Text style={styles.cardIconText}>🏫</Text>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardName}>{item.name}</Text>
                  {item.subject ? <Text style={styles.cardSubject}>{item.subject}</Text> : null}
                </View>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(item.id, item.name)}
                >
                  <Text style={styles.deleteBtnText}>🗑️</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.cardBottom}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>👥 {item._count.members} üye</Text>
                </View>
                {item.grade ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>📚 {item.grade}. Sınıf</Text>
                  </View>
                ) : null}
                {item._count.invitations > 0 ? (
                  <View style={[styles.badge, styles.badgePending]}>
                    <Text style={[styles.badgeText, styles.badgePendingText]}>
                      ⏳ {item._count.invitations} bekleyen
                    </Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.codeRow}>
                <Text style={styles.codeLabel}>Kod: </Text>
                <Text style={styles.code}>{item.code}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Yeni Sınıf Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Yeni Sınıf Oluştur</Text>

            <Text style={styles.label}>Sınıf Adı *</Text>
            <TextInput
              style={styles.input}
              placeholder="Örn: 5A Matematik"
              placeholderTextColor={Colors.textMuted}
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.label}>Branş</Text>
            <TextInput
              style={styles.input}
              placeholder="Örn: Matematik"
              placeholderTextColor={Colors.textMuted}
              value={subject}
              onChangeText={setSubject}
            />

            <Text style={styles.label}>Sınıf Seviyesi</Text>
            <View style={styles.gradeRow}>
              {GRADES.map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[styles.gradeChip, selectedGrade === g && styles.gradeChipActive]}
                  onPress={() => setSelectedGrade(selectedGrade === g ? '' : g)}
                >
                  <Text style={[styles.gradeChipText, selectedGrade === g && styles.gradeChipTextActive]}>
                    {g}.
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Açıklama</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              placeholder="Opsiyonel açıklama..."
              placeholderTextColor={Colors.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => { setModalVisible(false); setName(''); setDescription(''); setSubject(''); setSelectedGrade(''); }}
              >
                <Text style={styles.cancelBtnText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.createBtn, isCreating && styles.createBtnDisabled]}
                onPress={handleCreate}
                disabled={isCreating}
              >
                {isCreating
                  ? <ActivityIndicator color={Colors.white} size="small" />
                  : <Text style={styles.createBtnText}>Oluştur</Text>}
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
    paddingHorizontal: 20, paddingVertical: 16,
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  addBtn: {
    backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 10,
  },
  addBtnText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
  list: { padding: 16, gap: 12 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 40 },
  emptyIcon: { fontSize: 52 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  emptySubtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
  card: {
    backgroundColor: Colors.white, borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  cardIcon: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  cardIconText: { fontSize: 20 },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  cardSubject: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  deleteBtn: { padding: 4 },
  deleteBtnText: { fontSize: 18 },
  cardBottom: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  badge: {
    backgroundColor: Colors.background, paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
  badgePending: { backgroundColor: '#fef9c3' },
  badgePendingText: { color: '#92400e' },
  codeRow: { flexDirection: 'row', alignItems: 'center' },
  codeLabel: { fontSize: 12, color: Colors.textSecondary },
  code: { fontSize: 13, fontWeight: '700', color: Colors.primary, letterSpacing: 1 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: '#00000055', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 28, paddingBottom: 40,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary, marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary, marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
    color: Colors.textPrimary, backgroundColor: Colors.background,
  },
  inputMultiline: { height: 80, textAlignVertical: 'top' },
  gradeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  gradeChip: {
    width: 44, height: 36, borderRadius: 10, borderWidth: 1.5,
    borderColor: Colors.border, backgroundColor: Colors.background,
    alignItems: 'center', justifyContent: 'center',
  },
  gradeChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  gradeChipText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  gradeChipTextActive: { color: Colors.primary },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 24 },
  cancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5,
    borderColor: Colors.border, alignItems: 'center',
  },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: Colors.textSecondary },
  createBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    backgroundColor: Colors.primary, alignItems: 'center',
  },
  createBtnDisabled: { opacity: 0.6 },
  createBtnText: { fontSize: 15, fontWeight: '700', color: Colors.white },
});
