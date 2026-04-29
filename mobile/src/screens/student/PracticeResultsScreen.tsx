import { useCallback, useState } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import { StudentPracticeStackParamList } from '../../navigation/StudentPracticeStackNavigator';
import { practiceApi } from '../../lib/api';
import { Colors } from '../../constants/colors';

type Props = {
  navigation: NativeStackNavigationProp<StudentPracticeStackParamList, 'PracticeResults'>;
  route: RouteProp<StudentPracticeStackParamList, 'PracticeResults'>;
};

export default function PracticeResultsScreen({ navigation, route }: Props) {
  const { sessionId } = route.params;
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  useFocusEffect(useCallback(() => {
    const load = async () => {
      try {
        const res = await practiceApi.getSession(sessionId);
        setSession(res.data.data);
      } catch {
        // hata sessizce geç
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [sessionId]));

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Sonuçlar yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!session) return null;

  const total = session.totalQuestions ?? 0;
  const correct = session.correctCount ?? 0;
  const wrong = session.wrongCount ?? 0;
  const empty = total - correct - wrong;
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  const passed = pct >= 50;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Başlık */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Pratik Tamamlandı!</Text>
          <Text style={styles.headerSub}>{session.subject} {session.grade && `• ${session.grade}`}</Text>
        </View>

        {/* Skor kartı */}
        <View style={[styles.scoreCard, { borderColor: passed ? '#16a34a' : Colors.error }]}>
          <Text style={[styles.scorePct, { color: passed ? '#16a34a' : Colors.error }]}>%{pct}</Text>
          <Text style={[styles.scoreStatus, { color: passed ? '#16a34a' : Colors.error }]}>
            {passed ? '🎉 Harika!' : '💪 Daha fazla pratik yap!'}
          </Text>
          <View style={styles.scoreStats}>
            <View style={styles.scoreStat}>
              <Text style={[styles.scoreStatNum, { color: '#16a34a' }]}>{correct}</Text>
              <Text style={styles.scoreStatLabel}>Doğru</Text>
            </View>
            <View style={[styles.scoreStat, styles.scoreStatBorder]}>
              <Text style={[styles.scoreStatNum, { color: Colors.error }]}>{wrong}</Text>
              <Text style={styles.scoreStatLabel}>Yanlış</Text>
            </View>
            <View style={styles.scoreStat}>
              <Text style={[styles.scoreStatNum, { color: Colors.textMuted }]}>{empty}</Text>
              <Text style={styles.scoreStatLabel}>Boş</Text>
            </View>
          </View>
        </View>

        {/* Soru detayları */}
        {session.answers && session.answers.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Soru Detayları</Text>
            {session.answers.map((ans: any, i: number) => {
              const isCorrect = ans.isCorrect;
              const expanded = expandedIndex === i;
              return (
                <TouchableOpacity
                  key={ans.questionId ?? i}
                  style={[styles.answerCard, isCorrect ? styles.answerCorrect : styles.answerWrong]}
                  onPress={() => setExpandedIndex(expanded ? null : i)}
                  activeOpacity={0.8}
                >
                  <View style={styles.answerHeader}>
                    <View style={[styles.answerBadge, isCorrect ? styles.badgeCorrect : styles.badgeWrong]}>
                      <Text style={[styles.answerBadgeText, { color: isCorrect ? '#16a34a' : Colors.error }]}>
                        {isCorrect ? '✓' : '✗'}
                      </Text>
                    </View>
                    <Text style={styles.answerNum} numberOfLines={1}>
                      {i + 1}. {ans.questionText}
                    </Text>
                    <Text style={styles.answerChevron}>{expanded ? '▲' : '▼'}</Text>
                  </View>
                  {expanded && (
                    <View style={styles.answerBody}>
                      <Text style={styles.answerQ}>{ans.questionText}</Text>

                      {/* Seçtiğin cevap */}
                      <View style={[styles.answerOpt, isCorrect ? styles.answerOptCorrect : styles.answerOptWrong]}>
                        <Text style={styles.answerOptLabel}>Senin Cevabın</Text>
                        <Text style={[styles.answerOptText, { flex: 1 }]}>
                          {ans.selectedOptionText ?? 'Cevap seçilmedi'}
                        </Text>
                        {isCorrect
                          ? <Text style={{ color: '#16a34a', fontWeight: '700' }}>✓</Text>
                          : <Text style={{ color: Colors.error, fontWeight: '700' }}>✗</Text>
                        }
                      </View>

                      {/* Doğru cevap (yanlışsa göster) */}
                      {!isCorrect && ans.correctOptionText && (
                        <View style={[styles.answerOpt, styles.answerOptCorrect]}>
                          <Text style={styles.answerOptLabel}>Doğru Cevap</Text>
                          <Text style={[styles.answerOptText, { flex: 1 }]}>{ans.correctOptionText}</Text>
                          <Text style={{ color: '#16a34a', fontWeight: '700' }}>✓</Text>
                        </View>
                      )}

                      {ans.explanation && (
                        <View style={styles.explanation}>
                          <Text style={styles.explanationLabel}>💡 Açıklama</Text>
                          <Text style={styles.explanationText}>{ans.explanation}</Text>
                        </View>
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Butonlar */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.againBtn}
            onPress={() => navigation.replace('PracticeHome')}
          >
            <Text style={styles.againBtnText}>🔄 Tekrar Pratik Yap</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: Colors.textSecondary },
  scroll: { padding: 16, gap: 16, paddingBottom: 40 },
  header: { alignItems: 'center', paddingVertical: 8 },
  headerTitle: { fontSize: 24, fontWeight: '900', color: Colors.textPrimary },
  headerSub: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  scoreCard: {
    backgroundColor: Colors.white, borderRadius: 20, padding: 24,
    borderWidth: 2, alignItems: 'center', gap: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 3,
  },
  scorePct: { fontSize: 56, fontWeight: '900' },
  scoreStatus: { fontSize: 18, fontWeight: '800' },
  scoreStats: { flexDirection: 'row', marginTop: 12, width: '100%' },
  scoreStat: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  scoreStatBorder: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: Colors.border },
  scoreStatNum: { fontSize: 28, fontWeight: '900' },
  scoreStatLabel: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600', marginTop: 2 },
  section: { gap: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  answerCard: {
    backgroundColor: Colors.white, borderRadius: 14, overflow: 'hidden',
    borderWidth: 1.5,
  },
  answerCorrect: { borderColor: '#86efac' },
  answerWrong: { borderColor: '#fca5a5' },
  answerHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14,
  },
  answerBadge: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  badgeCorrect: { backgroundColor: '#dcfce7' },
  badgeWrong: { backgroundColor: '#fee2e2' },
  answerBadgeText: { fontSize: 14, fontWeight: '900' },
  answerNum: { flex: 1, fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  answerChevron: { fontSize: 11, color: Colors.textMuted },
  answerBody: {
    borderTopWidth: 1, borderTopColor: Colors.border, padding: 14, gap: 10,
  },
  answerQ: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, lineHeight: 20 },
  answerOpt: {
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10,
    borderRadius: 10, borderWidth: 1.5, borderColor: Colors.border,
  },
  answerOptCorrect: { borderColor: '#16a34a', backgroundColor: '#dcfce7' },
  answerOptWrong: { borderColor: Colors.error, backgroundColor: '#fee2e2' },
  answerOptLabel: { fontSize: 13, fontWeight: '800', color: Colors.textSecondary, width: 20 },
  answerOptText: { fontSize: 13, color: Colors.textPrimary },
  explanation: { backgroundColor: '#fef9c3', borderRadius: 10, padding: 10, gap: 4 },
  explanationLabel: { fontSize: 12, fontWeight: '800', color: '#854d0e' },
  explanationText: { fontSize: 13, color: '#713f12', lineHeight: 19 },
  actions: { gap: 10 },
  againBtn: { backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  againBtnText: { color: Colors.white, fontSize: 15, fontWeight: '900' },
});
