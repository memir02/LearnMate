import { useCallback, useRef, useState } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, FlatList,
  ActivityIndicator, Alert, RefreshControl, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { homeworkApi } from '../../lib/api';
import { Colors } from '../../constants/colors';
import CreateHomeworkScreen from './CreateHomeworkScreen';

export type HomeworkStackParamList = {
  HomeworkList: undefined;
  CreateHomework: undefined;
};

const Stack = createNativeStackNavigator<HomeworkStackParamList>();

// ── Stack wrapper (tab'a direkt bağlanıyor) ───────────
export default function HomeworkStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeworkList" component={HomeworkListScreen} />
      <Stack.Screen name="CreateHomework" component={CreateHomeworkScreen} />
    </Stack.Navigator>
  );
}

// ── Liste ekranı ───────────────────────────────────────
interface Homework {
  id: string;
  title: string;
  description?: string;
  fileUrl: string;
  fileType: 'PDF' | 'IMAGE';
  dueDate?: string;
  classroom: { id: string; name: string };
  createdAt: string;
}

function HomeworkListScreen({
  navigation,
}: {
  navigation: NativeStackNavigationProp<HomeworkStackParamList, 'HomeworkList'>;
}) {
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isFetchingRef = useRef(false);

  const fetchHomeworks = useCallback(async (refresh = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    try {
      const res = await homeworkApi.getMyHomeworks();
      setHomeworks(res.data.data || []);
    } catch {
      Alert.alert('Hata', 'Ödevler yüklenemedi.');
    } finally {
      isFetchingRef.current = false;
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchHomeworks(); }, [fetchHomeworks]));

  const handleOpen = (hw: Homework) => {
    Linking.openURL(hw.fileUrl).catch(() =>
      Alert.alert('Hata', 'Dosya açılamadı.')
    );
  };

  const handleDelete = (id: string, title: string) => {
    Alert.alert('Ödevi Sil', `"${title}" ödevini silmek istediğinize emin misiniz?`, [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil', style: 'destructive',
        onPress: async () => {
          try {
            await homeworkApi.delete(id);
            setHomeworks((prev) => prev.filter((h) => h.id !== id));
          } catch {
            Alert.alert('Hata', 'Ödev silinemedi.');
          }
        },
      },
    ]);
  };

  const formatDate = (iso?: string) => {
    if (!iso) return null;
    return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  if (isLoading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Ödevlerim</Text>
          {homeworks.length > 0 && (
            <Text style={styles.headerSub}>{homeworks.length} ödev</Text>
          )}
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('CreateHomework')}>
          <Text style={styles.addBtnText}>+ Yeni</Text>
        </TouchableOpacity>
      </View>

      {homeworks.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📄</Text>
          <Text style={styles.emptyTitle}>Henüz ödev yok</Text>
          <Text style={styles.emptySubtitle}>PDF veya fotoğraf yükleyerek ödev oluştur</Text>
        </View>
      ) : (
        <FlatList
          data={homeworks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          removeClippedSubviews={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => fetchHomeworks(true)}
              colors={[Colors.primary]}
            />
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                {/* Dosya tipi ikonu */}
                <View style={[styles.fileIcon, item.fileType === 'PDF' ? styles.pdfIcon : styles.imgIcon]}>
                  <Text style={styles.fileIconText}>{item.fileType === 'PDF' ? '📕' : '🖼️'}</Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaTag}>🏫 {item.classroom.name}</Text>
                    <View style={[styles.typeBadge, item.fileType === 'PDF' ? styles.pdfBadge : styles.imgBadge]}>
                      <Text style={[styles.typeText, item.fileType === 'PDF' ? styles.pdfText : styles.imgText]}>
                        {item.fileType}
                      </Text>
                    </View>
                  </View>
                  {item.description ? (
                    <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
                  ) : null}
                  {item.dueDate ? (
                    <Text style={styles.dueDate}>⏰ Son teslim: {formatDate(item.dueDate)}</Text>
                  ) : null}
                </View>
              </View>

              {/* Aksiyonlar */}
              <View style={styles.actions}>
                <TouchableOpacity style={styles.openBtn} onPress={() => handleOpen(item)}>
                  <Text style={styles.openBtnText}>
                    {item.fileType === 'PDF' ? '📖 PDF Aç' : '🖼️ Görseli Aç'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(item.id, item.title)}
                >
                  <Text style={styles.deleteBtnText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
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
  addBtn: { backgroundColor: Colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  addBtnText: { color: Colors.white, fontWeight: '700', fontSize: 13 },
  list: { padding: 16, gap: 12, paddingBottom: 100 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 40 },
  emptyIcon: { fontSize: 52 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  emptySubtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
  card: {
    backgroundColor: Colors.white, borderRadius: 16, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 3, gap: 12,
  },
  cardTop: { flexDirection: 'row', gap: 12 },
  fileIcon: {
    width: 48, height: 48, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  pdfIcon: { backgroundColor: '#fee2e2' },
  imgIcon: { backgroundColor: Colors.primaryLight },
  fileIconText: { fontSize: 24 },
  cardTitle: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary, marginBottom: 4 },
  metaRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 4 },
  metaTag: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  pdfBadge: { backgroundColor: '#fee2e2' },
  imgBadge: { backgroundColor: Colors.primaryLight },
  typeText: { fontSize: 10, fontWeight: '800' },
  pdfText: { color: '#dc2626' },
  imgText: { color: Colors.primary },
  cardDesc: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  dueDate: { fontSize: 12, color: '#f97316', fontWeight: '600', marginTop: 4 },
  actions: { flexDirection: 'row', gap: 8 },
  openBtn: {
    flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center',
    backgroundColor: Colors.primaryLight, borderWidth: 1.5, borderColor: Colors.primary,
  },
  openBtnText: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  deleteBtn: {
    padding: 8, borderRadius: 10, borderWidth: 1.5,
    borderColor: '#fecaca', backgroundColor: '#fef2f2',
  },
  deleteBtnText: { fontSize: 16 },
});
