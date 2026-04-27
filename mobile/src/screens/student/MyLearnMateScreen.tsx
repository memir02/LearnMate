import { useCallback, useRef, useState } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { aiApi } from '../../lib/api';
import { Colors } from '../../constants/colors';

interface PriorityTopic {
  ders: string;
  konu: string;
  aciklama: string;
  oneri: string;
}

interface DayPlan {
  gun: string;
  aktivite: string;
}

interface StudyPlan {
  genelDurum: string;
  gucluDersler: string[];
  eksikDersler: string[];
  oncelikliKonular: PriorityTopic[];
  haftalikPlan: DayPlan[];
  motivasyonMesaji: string;
}

interface PlanData {
  plan: StudyPlan | null;
  overallAverage: number;
  totalTests: number;
  generatedAt: string;
  message?: string;
}

const DAY_COLORS = ['#dbeafe', '#dcfce7', '#fef9c3', '#fce7f3', '#ede9fe', '#ffedd5', '#f0fdf4'];
const DAY_TEXT = ['#1d4ed8', '#15803d', '#854d0e', '#be185d', '#6d28d9', '#c2410c', '#166534'];

export default function MyLearnMateScreen() {
  const [data, setData] = useState<PlanData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedTopic, setExpandedTopic] = useState<number | null>(null);
  const hasFetchedRef = useRef(false);

  const fetchPlan = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);
    try {
      const res = await aiApi.getStudyPlan();
      setData(res.data.data);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Çalışma planı yüklenemedi.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const retryFetch = useCallback(() => {
    hasFetchedRef.current = false;
    fetchPlan();
  }, [fetchPlan]);

  const refreshFetch = useCallback(() => {
    hasFetchedRef.current = true;
    fetchPlan(true);
  }, [fetchPlan]);

  useFocusEffect(useCallback(() => {
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchPlan();
    }
  }, [fetchPlan]));

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingRobot}>🤖</Text>
          <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 16 }} />
          <Text style={styles.loadingText}>Kişisel çalışma planın hazırlanıyor...</Text>
          <Text style={styles.loadingSubText}>Gemini AI test sonuçlarını analiz ediyor</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerEmoji}>🤖</Text>
          <View>
            <Text style={styles.headerTitle}>My LearnMate</Text>
            <Text style={styles.headerSub}>Kişisel AI Çalışma Asistanın</Text>
          </View>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={retryFetch}>
            <Text style={styles.retryBtnText}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!data || data.message) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerEmoji}>🤖</Text>
          <View>
            <Text style={styles.headerTitle}>My LearnMate</Text>
            <Text style={styles.headerSub}>Kişisel AI Çalışma Asistanın</Text>
          </View>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📝</Text>
          <Text style={styles.emptyTitle}>Henüz Yeterli Veri Yok</Text>
          <Text style={styles.emptyDesc}>
            {data?.message ?? 'Test çözdükten sonra kişisel çalışma planın oluşturulacak.'}
          </Text>
          <TouchableOpacity style={styles.refreshBtn} onPress={retryFetch}>
            <Text style={styles.refreshBtnText}>🔄 Yenile</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const { plan, overallAverage, totalTests, generatedAt } = data;
  if (!plan) return null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refreshFetch}
            colors={[Colors.primary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerEmoji}>🤖</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>My LearnMate</Text>
            <Text style={styles.headerSub}>Kişisel AI Çalışma Asistanın</Text>
          </View>
          <View style={styles.avgBadge}>
            <Text style={styles.avgValue}>%{overallAverage}</Text>
            <Text style={styles.avgLabel}>Ort.</Text>
          </View>
        </View>

        {/* Motivasyon */}
        <View style={styles.motivCard}>
          <Text style={styles.motivEmoji}>✨</Text>
          <Text style={styles.motivText}>"{plan.motivasyonMesaji}"</Text>
        </View>

        {/* Genel Durum */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Genel Durumun</Text>
          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <View style={styles.statBox}>
                <Text style={styles.statNum}>{totalTests}</Text>
                <Text style={styles.statLbl}>Çözülen Test</Text>
              </View>
              <View style={[styles.statBox, { borderLeftWidth: 1, borderLeftColor: Colors.border }]}>
                <Text style={[styles.statNum, { color: overallAverage >= 70 ? '#16a34a' : overallAverage >= 50 ? '#d97706' : Colors.error }]}>
                  %{overallAverage}
                </Text>
                <Text style={styles.statLbl}>Genel Başarı</Text>
              </View>
            </View>
            <Text style={styles.genelDurum}>{plan.genelDurum}</Text>
          </View>
        </View>

        {/* Güçlü & Eksik Dersler */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📚 Ders Analizi</Text>
          <View style={styles.dersRow}>
            {plan.gucluDersler.length > 0 && (
              <View style={[styles.dersCard, styles.gucluCard]}>
                <Text style={styles.dersCardTitle}>💪 Güçlü</Text>
                {plan.gucluDersler.map((d, i) => (
                  <Text key={i} style={[styles.dersItem, styles.gucluItem]}>• {d}</Text>
                ))}
              </View>
            )}
            {plan.eksikDersler.length > 0 && (
              <View style={[styles.dersCard, styles.eksikCard]}>
                <Text style={styles.dersCardTitle}>📌 Geliştirilecek</Text>
                {plan.eksikDersler.map((d, i) => (
                  <Text key={i} style={[styles.dersItem, styles.eksikItem]}>• {d}</Text>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Öncelikli Konular */}
        {plan.oncelikliKonular.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎯 Öncelikli Konular</Text>
            {plan.oncelikliKonular.map((t, i) => (
              <TouchableOpacity
                key={i}
                style={styles.topicCard}
                onPress={() => setExpandedTopic(expandedTopic === i ? null : i)}
                activeOpacity={0.8}
              >
                <View style={styles.topicHeader}>
                  <View style={styles.topicBadge}>
                    <Text style={styles.topicBadgeNum}>{i + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.topicDers}>{t.ders}</Text>
                    <Text style={styles.topicKonu}>{t.konu}</Text>
                  </View>
                  <Text style={styles.topicChevron}>{expandedTopic === i ? '▲' : '▼'}</Text>
                </View>
                {expandedTopic === i && (
                  <View style={styles.topicBody}>
                    <Text style={styles.topicAciklama}>{t.aciklama}</Text>
                    <View style={styles.oneriBox}>
                      <Text style={styles.oneriLabel}>💡 Öneri</Text>
                      <Text style={styles.oneriText}>{t.oneri}</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Haftalık Plan */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📅 Haftalık Çalışma Planı</Text>
          <View style={styles.weekGrid}>
            {plan.haftalikPlan.map((day, i) => (
              <View key={i} style={[styles.dayCard, { backgroundColor: DAY_COLORS[i % DAY_COLORS.length] }]}>
                <Text style={[styles.dayName, { color: DAY_TEXT[i % DAY_TEXT.length] }]}>{day.gun}</Text>
                <Text style={[styles.dayActivity, { color: DAY_TEXT[i % DAY_TEXT.length] }]}>{day.aktivite}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Yenilenme tarihi */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            🕒 Son güncelleme: {new Date(generatedAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
          </Text>
          <TouchableOpacity onPress={refreshFetch}>
            <Text style={styles.refreshLink}>🔄 Yenile</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingBottom: 100 },

  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  loadingRobot: { fontSize: 64 },
  loadingText: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center', marginTop: 8 },
  loadingSubText: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center' },

  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  errorIcon: { fontSize: 48 },
  errorText: { fontSize: 14, color: Colors.error, textAlign: 'center' },
  retryBtn: { backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 8 },
  retryBtnText: { color: Colors.white, fontWeight: '800', fontSize: 14 },

  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  emptyIcon: { fontSize: 52 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  emptyDesc: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  refreshBtn: { borderWidth: 1.5, borderColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12, marginTop: 8 },
  refreshBtnText: { color: Colors.primary, fontWeight: '700', fontSize: 14 },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 16, backgroundColor: Colors.white,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerEmoji: { fontSize: 32 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  headerSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  avgBadge: { backgroundColor: Colors.primary, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center' },
  avgValue: { fontSize: 18, fontWeight: '900', color: Colors.white },
  avgLabel: { fontSize: 10, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },

  motivCard: {
    margin: 16, marginBottom: 0, backgroundColor: '#fef3c7',
    borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    borderLeftWidth: 4, borderLeftColor: '#f59e0b',
  },
  motivEmoji: { fontSize: 20, marginTop: 2 },
  motivText: { flex: 1, fontSize: 14, fontStyle: 'italic', color: '#92400e', lineHeight: 20, fontWeight: '500' },

  section: { marginHorizontal: 16, marginTop: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary, marginBottom: 10 },

  statusCard: {
    backgroundColor: Colors.white, borderRadius: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    overflow: 'hidden',
  },
  statusRow: { flexDirection: 'row' },
  statBox: { flex: 1, alignItems: 'center', padding: 16 },
  statNum: { fontSize: 28, fontWeight: '900', color: Colors.primary },
  statLbl: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600', marginTop: 2 },
  genelDurum: { padding: 14, fontSize: 13, color: Colors.textSecondary, lineHeight: 20, borderTopWidth: 1, borderTopColor: Colors.border },

  dersRow: { flexDirection: 'row', gap: 10 },
  dersCard: { flex: 1, borderRadius: 14, padding: 12 },
  gucluCard: { backgroundColor: '#dcfce7' },
  eksikCard: { backgroundColor: '#fee2e2' },
  dersCardTitle: { fontSize: 12, fontWeight: '800', marginBottom: 8, color: Colors.textPrimary },
  dersItem: { fontSize: 12, lineHeight: 20 },
  gucluItem: { color: '#15803d' },
  eksikItem: { color: '#b91c1c' },

  topicCard: {
    backgroundColor: Colors.white, borderRadius: 14, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
    overflow: 'hidden',
  },
  topicHeader: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  topicBadge: { width: 28, height: 28, borderRadius: 8, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  topicBadgeNum: { fontSize: 13, fontWeight: '900', color: Colors.white },
  topicDers: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  topicKonu: { fontSize: 14, fontWeight: '800', color: Colors.textPrimary, marginTop: 1 },
  topicChevron: { fontSize: 11, color: Colors.textMuted },
  topicBody: { borderTopWidth: 1, borderTopColor: Colors.border, padding: 14, gap: 10 },
  topicAciklama: { fontSize: 13, color: Colors.textSecondary, lineHeight: 19 },
  oneriBox: { backgroundColor: Colors.primaryLight, borderRadius: 10, padding: 10, gap: 4 },
  oneriLabel: { fontSize: 11, fontWeight: '800', color: Colors.primary },
  oneriText: { fontSize: 13, color: Colors.textPrimary, lineHeight: 19 },

  weekGrid: { gap: 8 },
  dayCard: { borderRadius: 12, padding: 12 },
  dayName: { fontSize: 12, fontWeight: '800', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  dayActivity: { fontSize: 13, fontWeight: '500', lineHeight: 18 },

  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, marginTop: 8 },
  footerText: { fontSize: 11, color: Colors.textMuted },
  refreshLink: { fontSize: 12, fontWeight: '700', color: Colors.primary },
});
