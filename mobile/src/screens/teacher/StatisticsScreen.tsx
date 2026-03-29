import { useCallback, useRef, useState } from 'react';
import {
  StyleSheet, Text, View, ScrollView,
  ActivityIndicator, RefreshControl, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { testApi } from '../../lib/api';
import { Colors } from '../../constants/colors';

// ── Tip tanımları ──────────────────────────────────────
interface Overview {
  totalTests: number;
  publishedTests: number;
  totalQuestions: number;
  totalStudents: number;
  totalCompletedTests: number;
  averagePercentage: number;
  passedCount: number;
  failedCount: number;
  recentActivity: number;
}

interface StudentRow {
  studentId: string;
  name: string;
  email: string;
  testsTaken: number;
  averagePercentage: number;
}

interface ClassroomRow {
  classroomId: string;
  name: string;
  studentCount: number;
  testsCompleted: number;
  averagePercentage: number;
}

interface SubjectRow {
  subject: string;
  testsCompleted: number;
  averagePercentage: number;
}

interface Stats {
  overview: Overview;
  topStudents: StudentRow[];
  studentsNeedingHelp: StudentRow[];
  classroomPerformance: ClassroomRow[];
  subjectPerformance: SubjectRow[];
}

// ── Yardımcı bileşenler ────────────────────────────────

function StatCard({
  emoji, value, label, color,
}: {
  emoji: string; value: string | number; label: string; color?: string;
}) {
  return (
    <View style={[styles.statCard, color ? { borderLeftColor: color, borderLeftWidth: 3 } : {}]}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={[styles.statValue, color ? { color } : {}]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function PercentBar({ percent, color }: { percent: number; color: string }) {
  const capped = Math.min(Math.max(percent, 0), 100);
  return (
    <View style={styles.barBg}>
      <View style={[styles.barFill, { width: `${capped}%` as any, backgroundColor: color }]} />
    </View>
  );
}

function ScoreBadge({ pct }: { pct: number }) {
  const color = pct >= 70 ? Colors.success : pct >= 50 ? '#f97316' : Colors.error;
  return (
    <View style={[styles.scoreBadge, { backgroundColor: color + '20' }]}>
      <Text style={[styles.scoreText, { color }]}>%{Math.round(pct)}</Text>
    </View>
  );
}

// ── Ana ekran ──────────────────────────────────────────
export default function StatisticsScreen() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeSection, setActiveSection] = useState<'students' | 'classrooms' | 'subjects'>('students');
  const isFetchingRef = useRef(false);

  const fetchStats = useCallback(async (refresh = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    try {
      const res = await testApi.getTeacherStats();
      setStats(res.data.data);
    } catch {
      // Sessiz hata — veri yoksa boş göster
    } finally {
      isFetchingRef.current = false;
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchStats(); }, [fetchStats]));

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const ov = stats?.overview;

  const successRate = ov && ov.totalCompletedTests > 0
    ? Math.round((ov.passedCount / ov.totalCompletedTests) * 100)
    : 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>İstatistikler</Text>
        <Text style={styles.headerSub}>Son 7 gün: {ov?.recentActivity ?? 0} çözüm</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => fetchStats(true)}
            colors={[Colors.primary]}
          />
        }
      >
        {/* Genel Bakış */}
        <Text style={styles.sectionTitle}>📊 Genel Bakış</Text>
        <View style={styles.grid2}>
          <StatCard emoji="📝" value={ov?.totalTests ?? 0} label="Toplam Test" />
          <StatCard emoji="✅" value={ov?.publishedTests ?? 0} label="Yayında" color={Colors.success} />
          <StatCard emoji="❓" value={ov?.totalQuestions ?? 0} label="Soru" />
          <StatCard emoji="👥" value={ov?.totalStudents ?? 0} label="Öğrenci" color={Colors.primary} />
        </View>

        {/* Başarı Özeti */}
        <View style={styles.successCard}>
          <View style={styles.successTop}>
            <View>
              <Text style={styles.successTitle}>Ortalama Başarı</Text>
              <Text style={styles.successPct}>%{ov?.averagePercentage ?? 0}</Text>
            </View>
            <View style={styles.successRight}>
              <Text style={styles.successSmall}>
                <Text style={{ color: Colors.success }}>✓ {ov?.passedCount ?? 0} geçti</Text>
                {'  '}
                <Text style={{ color: Colors.error }}>✗ {ov?.failedCount ?? 0} kaldı</Text>
              </Text>
              <Text style={styles.successSmall}>
                Toplam {ov?.totalCompletedTests ?? 0} çözüm
              </Text>
            </View>
          </View>
          <PercentBar
            percent={ov?.averagePercentage ?? 0}
            color={
              (ov?.averagePercentage ?? 0) >= 70
                ? Colors.success
                : (ov?.averagePercentage ?? 0) >= 50
                ? '#f97316'
                : Colors.error
            }
          />
          <View style={styles.successFooter}>
            <Text style={styles.successFooterText}>Geçme Oranı</Text>
            <Text style={[styles.successFooterValue, { color: successRate >= 60 ? Colors.success : Colors.error }]}>
              %{successRate}
            </Text>
          </View>
        </View>

        {/* Detay Sekmeleri */}
        <View style={styles.tabs}>
          {(['students', 'classrooms', 'subjects'] as const).map((tab) => {
            const labels = { students: '🏆 Öğrenciler', classrooms: '🏫 Sınıflar', subjects: '📚 Dersler' };
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeSection === tab && styles.tabActive]}
                onPress={() => setActiveSection(tab)}
              >
                <Text style={[styles.tabText, activeSection === tab && styles.tabTextActive]}>
                  {labels[tab]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Öğrenciler */}
        {activeSection === 'students' && (
          <>
            {/* En Başarılı */}
            <View style={styles.listCard}>
              <Text style={styles.listTitle}>🥇 En Başarılı Öğrenciler</Text>
              {(stats?.topStudents?.length ?? 0) === 0 ? (
                <Text style={styles.emptyText}>Henüz veri yok</Text>
              ) : (
                stats!.topStudents.map((s, i) => (
                  <View key={s.studentId} style={styles.listRow}>
                    <View style={styles.rankCircle}>
                      <Text style={styles.rankText}>{i + 1}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowName}>{s.name || s.email}</Text>
                      <Text style={styles.rowSub}>{s.testsTaken} test çözdü</Text>
                      <PercentBar percent={s.averagePercentage} color={Colors.success} />
                    </View>
                    <ScoreBadge pct={s.averagePercentage} />
                  </View>
                ))
              )}
            </View>

            {/* Destek Gereken */}
            <View style={styles.listCard}>
              <Text style={styles.listTitle}>⚠️ Destek Gereken Öğrenciler</Text>
              {(stats?.studentsNeedingHelp?.length ?? 0) === 0 ? (
                <Text style={styles.emptyText}>Tüm öğrenciler başarılı 🎉</Text>
              ) : (
                stats!.studentsNeedingHelp.map((s) => (
                  <View key={s.studentId} style={styles.listRow}>
                    <View style={[styles.rankCircle, { backgroundColor: '#fef2f2' }]}>
                      <Text style={{ fontSize: 16 }}>⚠️</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowName}>{s.name || s.email}</Text>
                      <Text style={styles.rowSub}>{s.testsTaken} test çözdü</Text>
                      <PercentBar percent={s.averagePercentage} color={Colors.error} />
                    </View>
                    <ScoreBadge pct={s.averagePercentage} />
                  </View>
                ))
              )}
            </View>
          </>
        )}

        {/* Sınıflar */}
        {activeSection === 'classrooms' && (
          <View style={styles.listCard}>
            <Text style={styles.listTitle}>🏫 Sınıf Bazlı Performans</Text>
            {(stats?.classroomPerformance?.length ?? 0) === 0 ? (
              <Text style={styles.emptyText}>Henüz sınıf yok</Text>
            ) : (
              stats!.classroomPerformance.map((c) => (
                <View key={c.classroomId} style={styles.listRow}>
                  <View style={[styles.rankCircle, { backgroundColor: Colors.primaryLight }]}>
                    <Text style={{ fontSize: 18 }}>🏫</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowName}>{c.name}</Text>
                    <Text style={styles.rowSub}>
                      {c.studentCount} öğrenci · {c.testsCompleted} çözüm
                    </Text>
                    <PercentBar
                      percent={c.averagePercentage}
                      color={c.averagePercentage >= 70 ? Colors.success : c.averagePercentage >= 50 ? '#f97316' : Colors.error}
                    />
                  </View>
                  <ScoreBadge pct={c.averagePercentage} />
                </View>
              ))
            )}
          </View>
        )}

        {/* Dersler */}
        {activeSection === 'subjects' && (
          <View style={styles.listCard}>
            <Text style={styles.listTitle}>📚 Ders Bazlı Performans</Text>
            {(stats?.subjectPerformance?.length ?? 0) === 0 ? (
              <Text style={styles.emptyText}>Henüz veri yok</Text>
            ) : (
              stats!.subjectPerformance.map((s) => (
                <View key={s.subject} style={styles.listRow}>
                  <View style={[styles.rankCircle, { backgroundColor: '#f0fdf4' }]}>
                    <Text style={{ fontSize: 18 }}>📚</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowName}>{s.subject}</Text>
                    <Text style={styles.rowSub}>{s.testsCompleted} çözüm</Text>
                    <PercentBar
                      percent={s.averagePercentage}
                      color={s.averagePercentage >= 70 ? Colors.success : s.averagePercentage >= 50 ? '#f97316' : Colors.error}
                    />
                  </View>
                  <ScoreBadge pct={s.averagePercentage} />
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Stiller ───────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  headerSub: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
  content: { padding: 16, gap: 16, paddingBottom: 100 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },

  // Stat kartları
  grid2: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    flex: 1, minWidth: '45%', backgroundColor: Colors.white,
    borderRadius: 14, padding: 14, alignItems: 'center', gap: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  statEmoji: { fontSize: 24 },
  statValue: { fontSize: 26, fontWeight: '900', color: Colors.textPrimary },
  statLabel: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600', textAlign: 'center' },

  // Başarı kartı
  successCard: {
    backgroundColor: Colors.white, borderRadius: 16, padding: 16, gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
  },
  successTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  successTitle: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600', marginBottom: 2 },
  successPct: { fontSize: 38, fontWeight: '900', color: Colors.primary },
  successRight: { alignItems: 'flex-end', gap: 4, paddingTop: 6 },
  successSmall: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
  successFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  successFooterText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
  successFooterValue: { fontSize: 13, fontWeight: '800' },

  // Progress bar
  barBg: { height: 6, backgroundColor: Colors.border, borderRadius: 3, overflow: 'hidden', marginTop: 4 },
  barFill: { height: 6, borderRadius: 3 },

  // Sekmeler
  tabs: {
    flexDirection: 'row', backgroundColor: Colors.white,
    borderRadius: 12, padding: 4, borderWidth: 1, borderColor: Colors.border,
  },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: Colors.primaryLight },
  tabText: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary },
  tabTextActive: { color: Colors.primary },

  // Liste kartı
  listCard: {
    backgroundColor: Colors.white, borderRadius: 16, padding: 16, gap: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  listTitle: { fontSize: 14, fontWeight: '800', color: Colors.textPrimary },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rankCircle: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#fefce8', alignItems: 'center', justifyContent: 'center',
  },
  rankText: { fontSize: 16, fontWeight: '800', color: '#854d0e' },
  rowName: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  rowSub: { fontSize: 11, color: Colors.textSecondary, marginBottom: 2 },
  scoreBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  scoreText: { fontSize: 13, fontWeight: '800' },
  emptyText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', paddingVertical: 12 },
});
