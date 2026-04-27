import { useEffect, useState } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { StudentTestsStackParamList } from '../../navigation/StudentTestsStackNavigator';
import { studentTestApi } from '../../lib/api';
import { Colors } from '../../constants/colors';

type Props = {
  navigation: NativeStackNavigationProp<StudentTestsStackParamList, 'TestResults'>;
  route: RouteProp<StudentTestsStackParamList, 'TestResults'>;
};

interface ResultQuestion {
  questionId: string;
  questionText: string;
  imageUrl?: string;
  explanation?: string;
  points: number;
  options: { id: string; optionText: string; isCorrect: boolean; isSelected: boolean }[];
  studentAnswer: { selectedOptionId?: string; isCorrect?: boolean; pointsEarned?: number };
}

interface ResultData {
  test: { title: string; subject?: string; totalPoints: number; passingScore?: number };
  result: { score?: number; percentage?: number; isPassed?: boolean; submittedAt?: string };
  questions: ResultQuestion[];
}

export default function TestResultsScreen({ navigation, route }: Props) {
  const { studentTestId, title } = route.params;
  const [data, setData] = useState<ResultData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await studentTestApi.getResults(studentTestId);
        setData(res.data.data);
      } catch (err: any) {
        const msg = err?.response?.data?.message ?? 'Sonuçlar yüklenemedi.';
        Alert.alert('Hata', msg, [{ text: 'Geri Dön', onPress: () => navigation.goBack() }]);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [studentTestId]);

  if (isLoading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }

  if (!data) return null;

  const { result, questions, test } = data;
  const pct = Math.round(result.percentage ?? 0);
  const isPassed = result.isPassed;
  const scoreColor = pct >= 70 ? Colors.success : pct >= 50 ? '#f97316' : Colors.error;
  const correctCount = questions.filter((q) => q.studentAnswer.isCorrect).length;
  const wrongCount = questions.filter((q) => !q.studentAnswer.isCorrect && q.studentAnswer.selectedOptionId).length;
  const emptyCount = questions.filter((q) => !q.studentAnswer.selectedOptionId).length;

  const formatDate = (iso?: string) => {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('TestsList')} style={styles.backBtn}>
          <Text style={styles.backText}>← Testlere Dön</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
        <View style={{ width: 80 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Sonuç Kartı */}
        <View style={[styles.resultCard, { borderColor: scoreColor }]}>
          <View style={styles.resultTop}>
            <Text style={styles.resultEmoji}>{isPassed ? '🎉' : '📚'}</Text>
            <View>
              <Text style={[styles.resultPct, { color: scoreColor }]}>%{pct}</Text>
              <Text style={[styles.resultStatus, { color: scoreColor }]}>
                {isPassed ? 'Geçti ✓' : 'Kaldı ✗'}
              </Text>
            </View>
          </View>

          <View style={styles.resultStats}>
            <View style={styles.statItem}>
              <Text style={[styles.statVal, { color: Colors.success }]}>{correctCount}</Text>
              <Text style={styles.statLbl}>Doğru</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statVal, { color: Colors.error }]}>{wrongCount}</Text>
              <Text style={styles.statLbl}>Yanlış</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statVal, { color: Colors.textMuted }]}>{emptyCount}</Text>
              <Text style={styles.statLbl}>Boş</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statVal}>{result.score ?? 0}</Text>
              <Text style={styles.statLbl}>Puan</Text>
            </View>
          </View>

          {result.submittedAt && (
            <Text style={styles.dateText}>📅 {formatDate(result.submittedAt)}</Text>
          )}
        </View>

        {/* Sorular */}
        <Text style={styles.sectionTitle}>Soru Bazlı Değerlendirme</Text>
        {questions.map((q, i) => {
          const isCorrect = q.studentAnswer.isCorrect;
          const isExpanded = expandedIdx === i;
          const hasAnswer = !!q.studentAnswer.selectedOptionId;

          return (
            <TouchableOpacity
              key={q.questionId}
              style={[
                styles.questionCard,
                isCorrect ? styles.questionCorrect : hasAnswer ? styles.questionWrong : styles.questionEmpty,
              ]}
              onPress={() => setExpandedIdx(isExpanded ? null : i)}
              activeOpacity={0.8}
            >
              <View style={styles.questionRow}>
                <View style={[
                  styles.questionStatus,
                  { backgroundColor: isCorrect ? Colors.success : hasAnswer ? Colors.error : Colors.textMuted },
                ]}>
                  <Text style={styles.questionStatusText}>
                    {isCorrect ? '✓' : hasAnswer ? '✗' : '—'}
                  </Text>
                </View>
                <Text style={styles.questionNum} numberOfLines={isExpanded ? undefined : 2}>
                  {i + 1}. {q.questionText}
                </Text>
                <Text style={styles.expandIcon}>{isExpanded ? '▲' : '▼'}</Text>
              </View>

              {isExpanded && (
                <View style={styles.questionDetail}>
                  {q.imageUrl && (
                    <Image source={{ uri: q.imageUrl }} style={styles.questionImage} resizeMode="contain" />
                  )}
                  {q.options.map((opt) => {
                    const isSelected = opt.isSelected;
                    const optCorrect = opt.isCorrect;
                    let bg = Colors.white;
                    let border = Colors.border;
                    let textColor = Colors.textPrimary;
                    if (optCorrect) { bg = '#f0fdf4'; border = Colors.success; textColor = Colors.success; }
                    if (isSelected && !optCorrect) { bg = '#fef2f2'; border = Colors.error; textColor = Colors.error; }

                    return (
                      <View key={opt.id} style={[styles.option, { backgroundColor: bg, borderColor: border }]}>
                        <Text style={[styles.optionText, { color: textColor }]}>
                          {optCorrect ? '✓ ' : isSelected ? '✗ ' : '  '}
                          {opt.optionText}
                        </Text>
                      </View>
                    );
                  })}
                  {q.explanation && (
                    <View style={styles.explanation}>
                      <Text style={styles.explanationTitle}>💡 Açıklama</Text>
                      <Text style={styles.explanationText}>{q.explanation}</Text>
                    </View>
                  )}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
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
  backBtn: { width: 80 },
  backText: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  headerTitle: { flex: 1, fontSize: 15, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center' },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  resultCard: {
    backgroundColor: Colors.white, borderRadius: 20, padding: 20, gap: 16,
    borderWidth: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  resultTop: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  resultEmoji: { fontSize: 52 },
  resultPct: { fontSize: 42, fontWeight: '900' },
  resultStatus: { fontSize: 16, fontWeight: '800', marginTop: 2 },
  resultStats: { flexDirection: 'row', alignItems: 'center' },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statVal: { fontSize: 22, fontWeight: '900', color: Colors.textPrimary },
  statLbl: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600' },
  statDivider: { width: 1, height: 36, backgroundColor: Colors.border },
  dateText: { fontSize: 12, color: Colors.textSecondary, textAlign: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  questionCard: {
    backgroundColor: Colors.white, borderRadius: 14, padding: 14,
    borderWidth: 2, gap: 0,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  questionCorrect: { borderColor: '#bbf7d0' },
  questionWrong: { borderColor: '#fecaca' },
  questionEmpty: { borderColor: Colors.border },
  questionRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  questionStatus: {
    width: 28, height: 28, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  questionStatusText: { fontSize: 14, fontWeight: '900', color: Colors.white },
  questionNum: { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.textPrimary, lineHeight: 20 },
  expandIcon: { fontSize: 12, color: Colors.textMuted, paddingTop: 4 },
  questionDetail: { marginTop: 12, gap: 8 },
  questionImage: { width: '100%', height: 160, borderRadius: 10 },
  option: {
    padding: 12, borderRadius: 10, borderWidth: 1.5,
  },
  optionText: { fontSize: 13, fontWeight: '600' },
  explanation: {
    backgroundColor: '#fffbeb', borderRadius: 10, padding: 12, gap: 4,
    borderWidth: 1, borderColor: '#fde68a',
  },
  explanationTitle: { fontSize: 13, fontWeight: '800', color: '#92400e' },
  explanationText: { fontSize: 13, color: '#78350f', lineHeight: 20 },
});
