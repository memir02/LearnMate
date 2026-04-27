import { useCallback, useRef, useState } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { studentTestApi, invitationApi } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/colors';
import { StudentTabParamList } from '../../navigation/StudentTabNavigator';

type Nav = BottomTabNavigationProp<StudentTabParamList>;

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
    durationMinutes?: number;
    questionCount?: number;
  };
}

interface Invitation {
  id: string;
  classroom: { name: string };
  type: string;
}

export default function StudentHomeScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<Nav>();

  const [pendingTests, setPendingTests] = useState<TestItem[]>([]);
  const [recentResults, setRecentResults] = useState<TestItem[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [stats, setStats] = useState({ assigned: 0, completed: 0, averageScore: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isFetchingRef = useRef(false);

  const fetchData = useCallback(async (refresh = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);
    try {
      const [testRes, invRes] = await Promise.all([
        studentTestApi.getAssigned(),
        invitationApi.getPending(),
      ]);

      const allTests: TestItem[] = testRes.data?.data?.tests || testRes.data?.tests || [];
      const pending = allTests.filter((t) => t.status === 'ASSIGNED' || t.status === 'STARTED');
      const completed = allTests.filter((t) => t.status === 'SUBMITTED' || t.status === 'GRADED');
      const sorted = [...completed].sort((a, b) =>
        new Date(b.submittedAt ?? 0).getTime() - new Date(a.submittedAt ?? 0).getTime()
      );
      const avg = completed.length > 0
        ? Math.round(completed.reduce((s, t) => s + (t.percentage ?? 0), 0) / completed.length)
        : 0;

      setPendingTests(pending);
      setRecentResults(sorted.slice(0, 3));
      setStats({ assigned: allTests.length, completed: completed.length, averageScore: avg });

      const invList: Invitation[] = invRes.data?.data || invRes.data?.invitations || [];
      setInvitations(invList.slice(0, 3));
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Bilinmeyen hata';
      setError(`Veriler yüklenemedi: ${msg}`);
    } finally {
      isFetchingRef.current = false;
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const handleAcceptInvitation = async (id: string) => {
    try {
      await invitationApi.accept(id);
      setInvitations((prev) => prev.filter((i) => i.id !== id));
      Alert.alert('Başarılı', 'Sınıfa katıldınız!');
    } catch {
      Alert.alert('Hata', 'İşlem başarısız oldu.');
    }
  };

  const handleRejectInvitation = async (id: string) => {
    try {
      await invitationApi.reject(id);
      setInvitations((prev) => prev.filter((i) => i.id !== id));
    } catch {
      Alert.alert('Hata', 'İşlem başarısız oldu.');
    }
  };

  const scoreColor = (pct: number) =>
    pct >= 70 ? Colors.success : pct >= 50 ? '#f97316' : Colors.error;

  const formatDate = (iso?: string) => {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  };

  const firstName = user?.student?.firstName ?? user?.email ?? '';

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={{ fontSize: 32 }}>⚠️</Text>
          <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.error, marginTop: 8, textAlign: 'center', paddingHorizontal: 32 }}>
            {error}
          </Text>
          <TouchableOpacity
            style={{ marginTop: 16, paddingHorizontal: 24, paddingVertical: 10, backgroundColor: Colors.primary, borderRadius: 10 }}
            onPress={() => fetchData()}
          >
            <Text style={{ color: Colors.white, fontWeight: '700' }}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => fetchData(true)}
            colors={[Colors.primary]}
          />
        }
      >
        {/* Karşılama */}
        <View style={styles.greeting}>
          <View>
            <Text style={styles.greetingHello}>Merhaba, {firstName} 👋</Text>
            <Text style={styles.greetingSub}>Bugün ne çalışacaksın?</Text>
          </View>
          <TouchableOpacity
            style={styles.aiBtn}
            onPress={() => navigation.navigate('MyLearnMate')}
          >
            <Text style={styles.aiBtnText}>🤖 My LearnMate</Text>
          </TouchableOpacity>
        </View>

        {/* İstatistik Kartları */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.assigned}</Text>
            <Text style={styles.statLabel}>Toplam Test</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: Colors.success }]}>{stats.completed}</Text>
            <Text style={styles.statLabel}>Tamamlanan</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: scoreColor(stats.averageScore) }]}>
              %{stats.averageScore}
            </Text>
            <Text style={styles.statLabel}>Ortalama</Text>
          </View>
        </View>

        {/* Bekleyen Davetler */}
        {invitations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📩 Sınıf Davetleri</Text>
            {invitations.map((inv) => (
              <View key={inv.id} style={styles.invCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.invName}>{inv.classroom.name}</Text>
                  <Text style={styles.invSub}>Sınıfa katılmak istiyor musunuz?</Text>
                </View>
                <View style={styles.invActions}>
                  <TouchableOpacity
                    style={styles.acceptBtn}
                    onPress={() => handleAcceptInvitation(inv.id)}
                  >
                    <Text style={styles.acceptBtnText}>✓</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.rejectBtn}
                    onPress={() => handleRejectInvitation(inv.id)}
                  >
                    <Text style={styles.rejectBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Bekleyen Testler */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>⏳ Bekleyen Testler</Text>
            {pendingTests.length > 3 && (
              <TouchableOpacity onPress={() => navigation.navigate('Tests')}>
                <Text style={styles.seeAll}>Tümü →</Text>
              </TouchableOpacity>
            )}
          </View>
          {pendingTests.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>🎉 Tüm testlerini tamamladın!</Text>
            </View>
          ) : (
            pendingTests.slice(0, 3).map((item) => (
              <View key={item.studentTestId} style={styles.testCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.testTitle} numberOfLines={1}>{item.test.title}</Text>
                  <View style={styles.testMeta}>
                    {item.test.subject && <Text style={styles.metaText}>📚 {item.test.subject}</Text>}
                    {item.test.durationMinutes && <Text style={styles.metaText}>⏱ {item.test.durationMinutes}dk</Text>}
                    {item.test.questionCount && <Text style={styles.metaText}>❓ {item.test.questionCount} soru</Text>}
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.startBtn, item.status === 'STARTED' && styles.continueBtn]}
                  onPress={() => navigation.navigate('Tests')}
                >
                  <Text style={styles.startBtnText}>
                    {item.status === 'STARTED' ? 'Devam' : 'Başla'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Son Sonuçlar */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📊 Son Sonuçlar</Text>
            {recentResults.length > 0 && (
              <TouchableOpacity onPress={() => navigation.navigate('Tests')}>
                <Text style={styles.seeAll}>Tümü →</Text>
              </TouchableOpacity>
            )}
          </View>
          {recentResults.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>Henüz tamamlanmış test yok.</Text>
            </View>
          ) : (
            recentResults.map((item) => (
              <View key={item.studentTestId} style={styles.resultCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.testTitle} numberOfLines={1}>{item.test.title}</Text>
                  <Text style={styles.metaText}>{formatDate(item.submittedAt)}</Text>
                </View>
                <View style={styles.resultRight}>
                  <Text style={[styles.resultPct, { color: scoreColor(item.percentage ?? 0) }]}>
                    %{Math.round(item.percentage ?? 0)}
                  </Text>
                  <Text style={[styles.resultPass, { color: item.isPassed ? Colors.success : Colors.error }]}>
                    {item.isPassed ? '✓ Geçti' : '✗ Kaldı'}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, gap: 20, paddingBottom: 100 },

  greeting: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greetingHello: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  greetingSub: { fontSize: 14, color: Colors.textSecondary, marginTop: 2 },
  aiBtn: {
    backgroundColor: Colors.primary, paddingHorizontal: 12,
    paddingVertical: 8, borderRadius: 12,
  },
  aiBtnText: { color: Colors.white, fontSize: 12, fontWeight: '700' },

  statsRow: {
    flexDirection: 'row', gap: 10,
  },
  statCard: {
    flex: 1, backgroundColor: Colors.white, borderRadius: 14, padding: 14,
    alignItems: 'center', gap: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  statValue: { fontSize: 24, fontWeight: '900', color: Colors.textPrimary },
  statLabel: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600', textAlign: 'center' },

  section: { gap: 10 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  seeAll: { fontSize: 13, color: Colors.primary, fontWeight: '700' },

  invCard: {
    backgroundColor: Colors.white, borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderLeftWidth: 3, borderLeftColor: Colors.primary,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  invName: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  invSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  invActions: { flexDirection: 'row', gap: 8 },
  acceptBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#f0fdf4', borderWidth: 1.5, borderColor: Colors.success,
    alignItems: 'center', justifyContent: 'center',
  },
  acceptBtnText: { color: Colors.success, fontWeight: '800', fontSize: 16 },
  rejectBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#fef2f2', borderWidth: 1.5, borderColor: Colors.error,
    alignItems: 'center', justifyContent: 'center',
  },
  rejectBtnText: { color: Colors.error, fontWeight: '800', fontSize: 16 },

  testCard: {
    backgroundColor: Colors.white, borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  testTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  testMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metaText: { fontSize: 12, color: Colors.textSecondary },
  startBtn: {
    backgroundColor: Colors.primary, paddingHorizontal: 14,
    paddingVertical: 8, borderRadius: 10,
  },
  continueBtn: { backgroundColor: '#f97316' },
  startBtnText: { color: Colors.white, fontWeight: '700', fontSize: 13 },

  resultCard: {
    backgroundColor: Colors.white, borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  resultRight: { alignItems: 'flex-end', gap: 2 },
  resultPct: { fontSize: 20, fontWeight: '900' },
  resultPass: { fontSize: 12, fontWeight: '700' },

  emptyBox: {
    backgroundColor: Colors.white, borderRadius: 14, padding: 20,
    alignItems: 'center',
  },
  emptyText: { fontSize: 14, color: Colors.textSecondary },
});
