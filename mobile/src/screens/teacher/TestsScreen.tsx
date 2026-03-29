import { useCallback, useEffect, useRef, useState } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, FlatList,
  ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { TestsStackParamList } from '../../navigation/TestsStackNavigator';
import { testApi } from '../../lib/api';
import { Colors } from '../../constants/colors';

type Props = {
  navigation: NativeStackNavigationProp<TestsStackParamList, 'TestsList'>;
};

interface Test {
  id: string;
  title: string;
  description?: string;
  subject?: string;
  grade?: string;
  isPublished: boolean;
  durationMinutes?: number;
  totalPoints: number;
  testQuestions: { id: string }[];
  studentTests: { id: string }[];
  classroom?: { id: string; name: string };
  createdAt: string;
}

export default function TestsScreen({ navigation }: Props) {
  const [tests, setTests] = useState<Test[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isFetchingRef = useRef(false);

  const fetchTests = useCallback(async (refresh = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    try {
      const res = await testApi.getMyTests({ limit: 50 });
      setTests(res.data.data?.tests || []);
    } catch {
      Alert.alert('Hata', 'Testler yüklenemedi.');
    } finally {
      isFetchingRef.current = false;
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchTests(); }, [fetchTests]));

  const handleDelete = (id: string, title: string) => {
    Alert.alert('Testi Sil', `"${title}" testini silmek istediğinize emin misiniz?`, [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil', style: 'destructive',
        onPress: async () => {
          try {
            await testApi.delete(id);
            setTests((prev) => prev.filter((t) => t.id !== id));
          } catch {
            Alert.alert('Hata', 'Test silinemedi.');
          }
        },
      },
    ]);
  };

  const handleTogglePublish = async (id: string, current: boolean) => {
    try {
      await testApi.publish(id, !current);
      setTests((prev) =>
        prev.map((t) => (t.id === id ? { ...t, isPublished: !current } : t))
      );
    } catch {
      Alert.alert('Hata', 'Güncelleme yapılamadı.');
    }
  };

  if (isLoading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Testlerim</Text>
          {tests.length > 0 && (
            <Text style={styles.headerSub}>{tests.length} test</Text>
          )}
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('CreateTest')}>
          <Text style={styles.addBtnText}>+ Yeni</Text>
        </TouchableOpacity>
      </View>

      {tests.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📝</Text>
          <Text style={styles.emptyTitle}>Henüz test yok</Text>
          <Text style={styles.emptySubtitle}>İlk testi oluşturmak için "+ Yeni" butonuna bas</Text>
        </View>
      ) : (
        <FlatList
          data={tests}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          removeClippedSubviews={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={() => fetchTests(true)} colors={[Colors.primary]} />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('TestDetail', { testId: item.id, testTitle: item.title })}
              activeOpacity={0.8}
            >
              {/* Başlık satırı */}
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleRow}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                  <View style={[styles.statusBadge, item.isPublished ? styles.publishedBadge : styles.draftBadge]}>
                    <Text style={[styles.statusText, item.isPublished ? styles.publishedText : styles.draftText]}>
                      {item.isPublished ? '✅ Yayında' : '📝 Taslak'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Meta bilgiler */}
              <View style={styles.metaRow}>
                <Text style={styles.metaItem}>❓ {item.testQuestions.length} soru</Text>
                <Text style={styles.metaItem}>⭐ {item.totalPoints} puan</Text>
                {item.durationMinutes ? <Text style={styles.metaItem}>⏱ {item.durationMinutes} dk</Text> : null}
                {item.classroom ? <Text style={styles.metaItem}>🏫 {item.classroom.name}</Text> : null}
                {item.subject ? <Text style={styles.metaItem}>📚 {item.subject}</Text> : null}
              </View>

              {item.studentTests.length > 0 && (
                <Text style={styles.studentInfo}>
                  👥 {item.studentTests.length} öğrenci atandı
                </Text>
              )}

              {/* Aksiyonlar */}
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.publishBtn, item.isPublished ? styles.publishBtnActive : null]}
                  onPress={() => handleTogglePublish(item.id, item.isPublished)}
                >
                  <Text style={[styles.publishBtnText, item.isPublished ? styles.publishBtnTextActive : null]}>
                    {item.isPublished ? '📥 Yayından Kaldır' : '🚀 Yayınla'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id, item.title)}>
                  <Text style={styles.deleteBtnText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
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
    backgroundColor: Colors.white, borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 3, gap: 10,
  },
  cardHeader: { gap: 6 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary, flex: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  publishedBadge: { backgroundColor: '#dcfce7' },
  draftBadge: { backgroundColor: Colors.background },
  statusText: { fontSize: 11, fontWeight: '700' },
  publishedText: { color: '#16a34a' },
  draftText: { color: Colors.textSecondary },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metaItem: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
  studentInfo: { fontSize: 12, color: Colors.primary, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  publishBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center',
    borderWidth: 1.5, borderColor: Colors.border,
  },
  publishBtnActive: { borderColor: '#f97316', backgroundColor: '#fff7ed' },
  publishBtnText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  publishBtnTextActive: { color: '#f97316' },
  deleteBtn: {
    padding: 8, borderRadius: 10, borderWidth: 1.5,
    borderColor: '#fecaca', backgroundColor: '#fef2f2',
  },
  deleteBtnText: { fontSize: 16 },
});
