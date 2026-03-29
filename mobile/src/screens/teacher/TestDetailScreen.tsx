import { useCallback, useState } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { TestsStackParamList } from '../../navigation/TestsStackNavigator';
import { testApi } from '../../lib/api';
import { Colors } from '../../constants/colors';

type Props = {
  navigation: NativeStackNavigationProp<TestsStackParamList, 'TestDetail'>;
  route: RouteProp<TestsStackParamList, 'TestDetail'>;
};

const DIFFICULTY_COLOR: Record<string, string> = { EASY: '#dcfce7', MEDIUM: '#fef9c3', HARD: '#fee2e2' };
const DIFFICULTY_TEXT: Record<string, string> = { EASY: '#16a34a', MEDIUM: '#92400e', HARD: '#dc2626' };
const DIFFICULTY_LABEL: Record<string, string> = { EASY: 'Kolay', MEDIUM: 'Orta', HARD: 'Zor' };

export default function TestDetailScreen({ navigation, route }: Props) {
  const { testId } = route.params;
  const [test, setTest] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);

  const loadTest = useCallback(async () => {
    try {
      const res = await testApi.getById(testId);
      setTest(res.data.data);
    } catch {
      Alert.alert('Hata', 'Test yüklenemedi.', [
        { text: 'Tamam', onPress: () => navigation.goBack() },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [testId]);

  useFocusEffect(useCallback(() => { loadTest(); }, [loadTest]));

  const handleTogglePublish = async () => {
    if (!test) return;
    setIsPublishing(true);
    try {
      await testApi.publish(testId, !test.isPublished);
      setTest((prev: any) => ({ ...prev, isPublished: !prev.isPublished }));
    } catch {
      Alert.alert('Hata', 'Güncelleme yapılamadı.');
    } finally {
      setIsPublishing(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!test) return null;

  const correctOption = (opts: any[]) => opts?.find((o: any) => o.isCorrect);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Geri</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Test Detayı</Text>
        <TouchableOpacity
          style={[styles.publishBtn, test.isPublished ? styles.publishBtnActive : null]}
          onPress={handleTogglePublish}
          disabled={isPublishing}
        >
          {isPublishing
            ? <ActivityIndicator size="small" color={test.isPublished ? '#f97316' : Colors.white} />
            : <Text style={[styles.publishBtnText, test.isPublished ? styles.publishBtnTextActive : null]}>
                {test.isPublished ? 'Yayından Al' : '🚀 Yayınla'}
              </Text>}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Test özeti */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryTitleRow}>
            <Text style={styles.testTitle}>{test.title}</Text>
            <View style={[styles.statusBadge, test.isPublished ? styles.publishedBadge : styles.draftBadge]}>
              <Text style={[styles.statusText, test.isPublished ? styles.publishedText : styles.draftText]}>
                {test.isPublished ? '✅ Yayında' : '📝 Taslak'}
              </Text>
            </View>
          </View>

          {test.description ? <Text style={styles.testDesc}>{test.description}</Text> : null}

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{test.testQuestions?.length || 0}</Text>
              <Text style={styles.statLabel}>Soru</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{test.totalPoints}</Text>
              <Text style={styles.statLabel}>Puan</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{test.durationMinutes || '∞'}</Text>
              <Text style={styles.statLabel}>Dakika</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{test.studentTests?.length || 0}</Text>
              <Text style={styles.statLabel}>Öğrenci</Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            {test.subject ? <Text style={styles.metaTag}>📚 {test.subject}</Text> : null}
            {test.grade ? <Text style={styles.metaTag}>🎓 {test.grade}</Text> : null}
            {test.classroom ? <Text style={styles.metaTag}>🏫 {test.classroom.name}</Text> : null}
            {test.shuffleQuestions ? <Text style={styles.metaTag}>🔀 Karışık</Text> : null}
          </View>
        </View>

        {/* Sorular */}
        <Text style={styles.sectionTitle}>Sorular ({test.testQuestions?.length || 0})</Text>
        {test.testQuestions?.map((tq: any, idx: number) => {
          const q = tq.question;
          if (!q) return null;
          return (
            <View key={tq.id} style={styles.questionCard}>
              <View style={styles.questionHeader}>
                <View style={styles.questionNum}>
                  <Text style={styles.questionNumText}>{idx + 1}</Text>
                </View>
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={[styles.diffBadge, { backgroundColor: DIFFICULTY_COLOR[q.difficulty] }]}>
                    <Text style={[styles.diffText, { color: DIFFICULTY_TEXT[q.difficulty] }]}>
                      {DIFFICULTY_LABEL[q.difficulty]}
                    </Text>
                  </View>
                  <Text style={styles.pointsText}>⭐ {tq.points}p</Text>
                </View>
              </View>
              <Text style={styles.questionText}>{q.questionText}</Text>
              {q.options?.map((opt: any, oi: number) => (
                <View key={opt.id} style={[styles.optionRow, opt.isCorrect && styles.correctOption]}>
                  <Text style={styles.optionLetter}>{String.fromCharCode(65 + oi)})</Text>
                  <Text style={[styles.optionText, opt.isCorrect && styles.correctOptionText]}>
                    {opt.optionText}
                  </Text>
                  {opt.isCorrect && <Text style={styles.correctMark}>✓</Text>}
                </View>
              ))}
            </View>
          );
        })}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
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
  headerTitle: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary, flex: 1, textAlign: 'center' },
  publishBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
    backgroundColor: Colors.primary, minWidth: 80, alignItems: 'center',
  },
  publishBtnActive: { backgroundColor: '#fff7ed', borderWidth: 1.5, borderColor: '#f97316' },
  publishBtnText: { color: Colors.white, fontWeight: '700', fontSize: 13 },
  publishBtnTextActive: { color: '#f97316' },
  content: { padding: 16 },
  summaryCard: {
    backgroundColor: Colors.white, borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 3, gap: 12, marginBottom: 20,
  },
  summaryTitleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  testTitle: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary, flex: 1 },
  testDesc: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  publishedBadge: { backgroundColor: '#dcfce7' },
  draftBadge: { backgroundColor: Colors.background },
  statusText: { fontSize: 11, fontWeight: '700' },
  publishedText: { color: '#16a34a' },
  draftText: { color: Colors.textSecondary },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statValue: { fontSize: 22, fontWeight: '800', color: Colors.primary },
  statLabel: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600' },
  statDivider: { width: 1, height: 36, backgroundColor: Colors.border },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  metaTag: {
    fontSize: 12, color: Colors.textSecondary, backgroundColor: Colors.background,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, fontWeight: '600',
  },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary, marginBottom: 12 },
  questionCard: {
    backgroundColor: Colors.white, borderRadius: 14, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 2, gap: 8, marginBottom: 10,
  },
  questionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  questionNum: {
    width: 26, height: 26, borderRadius: 7, backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  questionNumText: { fontSize: 12, fontWeight: '800', color: Colors.primary },
  diffBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  diffText: { fontSize: 11, fontWeight: '700' },
  pointsText: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600' },
  questionText: { fontSize: 14, color: Colors.textPrimary, lineHeight: 20 },
  optionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    padding: 8, borderRadius: 8, backgroundColor: Colors.background,
  },
  correctOption: { backgroundColor: '#dcfce7' },
  optionLetter: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, width: 20 },
  optionText: { fontSize: 13, color: Colors.textPrimary, flex: 1 },
  correctOptionText: { color: '#16a34a', fontWeight: '600' },
  correctMark: { fontSize: 14, color: '#16a34a', fontWeight: '800' },
});
