import { useCallback, useRef, useState } from 'react';
import {
  StyleSheet, Text, View, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { StudentTestsStackParamList } from '../../navigation/StudentTestsStackNavigator';
import { studentTestApi } from '../../lib/api';
import { Colors } from '../../constants/colors';

type Props = { navigation: NativeStackNavigationProp<StudentTestsStackParamList, 'TestsList'> };

type FilterType = 'all' | 'pending' | 'completed';

interface TestItem {
  studentTestId: string;
  status: string;
  score?: number;
  percentage?: number;
  isPassed?: boolean;
  submittedAt?: string;
  test: {
    id: string;
    title: string;
    subject?: string;
    topic?: string;
    durationMinutes?: number;
    questionCount?: number;
    totalPoints?: number;
    classroom?: { name: string };
    teacher?: { firstName: string; lastName: string };
  };
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  ASSIGNED: { label: 'Bekliyor', color: Colors.primary, bg: Colors.primaryLight },
  STARTED: { label: 'Devam Ediyor', color: '#f97316', bg: '#fff7ed' },
  SUBMITTED: { label: 'Tamamlandı', color: Colors.success, bg: '#f0fdf4' },
  GRADED: { label: 'Puanlandı', color: '#7c3aed', bg: '#f5f3ff' },
};

export default function StudentTestsScreen({ navigation }: Props) {
  const [tests, setTests] = useState<TestItem[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isFetchingRef = useRef(false);

  const fetchTests = useCallback(async (refresh = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    try {
      const res = await studentTestApi.getAssigned();
      setTests(res.data?.data?.tests || []);
    } catch {
      Alert.alert('Hata', 'Testler yüklenemedi.');
    } finally {
      isFetchingRef.current = false;
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchTests(); }, [fetchTests]));

  const filtered = tests.filter((t) => {
    if (filter === 'pending') return t.status === 'ASSIGNED' || t.status === 'STARTED';
    if (filter === 'completed') return t.status === 'SUBMITTED' || t.status === 'GRADED';
    return true;
  });

  const pendingCount = tests.filter((t) => t.status === 'ASSIGNED' || t.status === 'STARTED').length;
  const completedCount = tests.filter((t) => t.status === 'SUBMITTED' || t.status === 'GRADED').length;

  const handleStart = async (item: TestItem) => {
    try {
      let studentTestId = item.studentTestId;
      if (item.status === 'ASSIGNED') {
        const res = await studentTestApi.start(item.test.id);
        studentTestId = res.data?.data?.studentTestId ?? res.data?.studentTestId ?? item.studentTestId;
      }
      navigation.navigate('TakeTest', {
        testId: item.test.id,
        studentTestId,
        title: item.test.title,
      });
    } catch {
      Alert.alert('Hata', 'Test başlatılamadı.');
    }
  };

  const formatDate = (iso?: string) => {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const scoreColor = (pct: number) =>
    pct >= 70 ? Colors.success : pct >= 50 ? '#f97316' : Colors.error;

  if (isLoading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Testlerim</Text>
        <Text style={styles.headerSub}>{tests.length} test</Text>
      </View>

      {/* Filtreler */}
      <View style={styles.filters}>
        {([['all', `Tümü (${tests.length})`], ['pending', `Bekleyen (${pendingCount})`], ['completed', `Tamamlanan (${completedCount})`]] as [FilterType, string][]).map(([key, label]) => (
          <TouchableOpacity
            key={key}
            style={[styles.filterBtn, filter === key && styles.filterBtnActive]}
            onPress={() => setFilter(key)}
          >
            <Text style={[styles.filterText, filter === key && styles.filterTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Liste */}
      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📝</Text>
          <Text style={styles.emptyTitle}>
            {filter === 'pending' ? 'Bekleyen test yok 🎉' : 'Henüz test yok'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.studentTestId}
          contentContainerStyle={styles.list}
          removeClippedSubviews={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={() => fetchTests(true)} colors={[Colors.primary]} />
          }
          renderItem={({ item }) => {
            const badge = STATUS_MAP[item.status] ?? STATUS_MAP.ASSIGNED;
            const isDone = item.status === 'SUBMITTED' || item.status === 'GRADED';

            return (
              <View style={styles.card}>
                {/* Başlık + badge */}
                <View style={styles.cardTop}>
                  <Text style={styles.cardTitle} numberOfLines={2}>{item.test.title}</Text>
                  <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
                  </View>
                </View>

                {/* Meta bilgi */}
                <View style={styles.metaRow}>
                  {item.test.subject && <Text style={styles.metaTag}>📚 {item.test.subject}</Text>}
                  {item.test.classroom && <Text style={styles.metaTag}>🏫 {item.test.classroom.name}</Text>}
                  {item.test.durationMinutes && <Text style={styles.metaTag}>⏱ {item.test.durationMinutes}dk</Text>}
                  {item.test.questionCount && <Text style={styles.metaTag}>❓ {item.test.questionCount} soru</Text>}
                </View>

                {/* Tamamlandıysa skor */}
                {isDone && (
                  <View style={styles.scoreRow}>
                    <View style={styles.scoreItem}>
                      <Text style={[styles.scoreValue, { color: scoreColor(item.percentage ?? 0) }]}>
                        %{Math.round(item.percentage ?? 0)}
                      </Text>
                      <Text style={styles.scoreLabel}>Başarı</Text>
                    </View>
                    <View style={styles.scoreItem}>
                      <Text style={[styles.scoreValue, { color: item.isPassed ? Colors.success : Colors.error }]}>
                        {item.isPassed ? '✓' : '✗'}
                      </Text>
                      <Text style={styles.scoreLabel}>{item.isPassed ? 'Geçti' : 'Kaldı'}</Text>
                    </View>
                    {item.submittedAt && (
                      <View style={styles.scoreItem}>
                        <Text style={styles.scoreValue}>{formatDate(item.submittedAt)}</Text>
                        <Text style={styles.scoreLabel}>Tarih</Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Aksiyon butonu */}
                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    item.status === 'STARTED' && styles.actionBtnContinue,
                    isDone && styles.actionBtnResults,
                  ]}
                  onPress={() => {
                    if (isDone) {
                      navigation.navigate('TestResults', {
                        studentTestId: item.studentTestId,
                        title: item.test.title,
                      });
                    } else {
                      handleStart(item);
                    }
                  }}
                >
                  <Text style={styles.actionBtnText}>
                    {item.status === 'ASSIGNED' && '▶ Testi Başlat'}
                    {item.status === 'STARTED' && '▶ Devam Et'}
                    {isDone && '📊 Sonuçları Gör'}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          }}
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
  headerSub: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  filters: {
    flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 8,
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  filterBtn: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.white,
  },
  filterBtnActive: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  filterText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  filterTextActive: { color: Colors.primary },
  list: { padding: 16, gap: 12, paddingBottom: 100 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.textSecondary },
  card: {
    backgroundColor: Colors.white, borderRadius: 16, padding: 14, gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '800', color: Colors.textPrimary },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metaTag: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
  scoreRow: {
    flexDirection: 'row', gap: 16,
    paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  scoreItem: { alignItems: 'center', gap: 2 },
  scoreValue: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  scoreLabel: { fontSize: 10, color: Colors.textSecondary, fontWeight: '600' },
  actionBtn: {
    backgroundColor: Colors.primary, paddingVertical: 12,
    borderRadius: 12, alignItems: 'center',
  },
  actionBtnContinue: { backgroundColor: '#f97316' },
  actionBtnResults: { backgroundColor: Colors.success },
  actionBtnText: { color: Colors.white, fontWeight: '800', fontSize: 14 },
});
