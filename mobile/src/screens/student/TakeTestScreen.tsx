import { useCallback, useEffect, useRef, useState } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, BackHandler, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { StudentTestsStackParamList } from '../../navigation/StudentTestsStackNavigator';
import { studentTestApi } from '../../lib/api';
import { Colors } from '../../constants/colors';

type Props = {
  navigation: NativeStackNavigationProp<StudentTestsStackParamList, 'TakeTest'>;
  route: RouteProp<StudentTestsStackParamList, 'TakeTest'>;
};

interface Option {
  id: string;
  optionText: string;
  orderIndex: number;
}

interface Question {
  questionId: string;
  questionText: string;
  imageUrl?: string;
  points: number;
  orderIndex: number;
  options: Option[];
}

interface TestInfo {
  id: string;
  title: string;
  durationMinutes?: number;
  totalPoints: number;
  showResults: boolean;
}

export default function TakeTestScreen({ navigation, route }: Props) {
  const { testId, studentTestId: initialStudentTestId, title } = route.params;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [testInfo, setTestInfo] = useState<TestInfo | null>(null);
  const [studentTestId, setStudentTestId] = useState(initialStudentTestId);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Testi yükle / başlat
  useEffect(() => {
    const loadTest = async () => {
      try {
        const res = await studentTestApi.start(testId);
        const data = res.data.data;
        setStudentTestId(data.studentTestId);
        setTestInfo(data.test);
        setQuestions(data.questions);
        if (data.test.durationMinutes) {
          setTimeLeft(data.test.durationMinutes * 60);
        }
      } catch (err: any) {
        const msg = err?.response?.data?.message ?? 'Test yüklenemedi.';
        Alert.alert('Hata', msg, [{ text: 'Geri Dön', onPress: () => navigation.goBack() }]);
      } finally {
        setIsLoading(false);
      }
    };
    loadTest();
  }, [testId]);

  // Geri tuşunu engelle
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      Alert.alert('Testi Bırak', 'Testi bırakmak istediğinize emin misiniz? İlerlemeniz kaydedilmiş olabilir.', [
        { text: 'Devam Et', style: 'cancel' },
        { text: 'Çık', style: 'destructive', onPress: () => navigation.goBack() },
      ]);
      return true;
    });
    return () => sub.remove();
  }, []);

  // Sayaç
  useEffect(() => {
    if (timeLeft === null) return;
    if (timeLeft <= 0) {
      handleSubmit(true);
      return;
    }
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timeLeft !== null ? Math.floor(timeLeft / 60) : null]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSelectOption = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const handleSubmit = useCallback(async (autoSubmit = false) => {
    const unanswered = questions.filter((q) => !answers[q.questionId]).length;
    if (!autoSubmit && unanswered > 0) {
      Alert.alert(
        'Eksik Cevap',
        `${unanswered} soru boş bırakıldı. Yine de göndermek istiyor musunuz?`,
        [
          { text: 'Devam Et', style: 'cancel' },
          { text: 'Gönder', onPress: () => doSubmit() },
        ]
      );
      return;
    }
    doSubmit();
  }, [questions, answers, studentTestId]);

  const doSubmit = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsSubmitting(true);
    try {
      // Tüm cevapları gönder
      for (const q of questions) {
        if (answers[q.questionId]) {
          await studentTestApi.submitAnswer(studentTestId, {
            questionId: q.questionId,
            selectedOptionId: answers[q.questionId],
          });
        }
      }
      // Testi tamamla
      await studentTestApi.submit(studentTestId);
      navigation.replace('TestResults', {
        studentTestId,
        title: testInfo?.title ?? title,
      });
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Gönderim başarısız.';
      Alert.alert('Hata', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }

  const question = questions[currentIdx];
  const answeredCount = Object.keys(answers).length;
  const progress = questions.length > 0 ? answeredCount / questions.length : 0;
  const isLast = currentIdx === questions.length - 1;
  const timerWarning = timeLeft !== null && timeLeft < 60;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>{testInfo?.title ?? title}</Text>
          <Text style={styles.headerSub}>{currentIdx + 1} / {questions.length} soru</Text>
        </View>
        {timeLeft !== null && (
          <View style={[styles.timer, timerWarning && styles.timerWarning]}>
            <Text style={[styles.timerText, timerWarning && styles.timerTextWarning]}>
              ⏱ {formatTime(timeLeft)}
            </Text>
          </View>
        )}
      </View>

      {/* Progress bar */}
      <View style={styles.progressBg}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` as any }]} />
      </View>

      {/* Soru içeriği */}
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Puan */}
        <View style={styles.questionHeader}>
          <Text style={styles.questionNum}>Soru {currentIdx + 1}</Text>
          <View style={styles.pointBadge}>
            <Text style={styles.pointText}>{question?.points ?? 1} puan</Text>
          </View>
        </View>

        {/* Görsel */}
        {question?.imageUrl && (
          <Image
            source={{ uri: question.imageUrl }}
            style={styles.questionImage}
            resizeMode="contain"
          />
        )}

        {/* Soru metni */}
        <Text style={styles.questionText}>{question?.questionText}</Text>

        {/* Seçenekler */}
        <View style={styles.options}>
          {question?.options.map((opt, i) => {
            const isSelected = answers[question.questionId] === opt.id;
            const label = String.fromCharCode(65 + i);
            return (
              <TouchableOpacity
                key={opt.id}
                style={[styles.option, isSelected && styles.optionSelected]}
                onPress={() => handleSelectOption(question.questionId, opt.id)}
              >
                <View style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                  <Text style={[styles.optionLabelText, isSelected && styles.optionLabelTextSelected]}>
                    {label}
                  </Text>
                </View>
                <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                  {opt.optionText}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Navigasyon butonları */}
        <View style={styles.navRow}>
          <TouchableOpacity
            style={[styles.navBtn, currentIdx === 0 && styles.navBtnDisabled]}
            disabled={currentIdx === 0}
            onPress={() => setCurrentIdx((i) => i - 1)}
          >
            <Text style={styles.navBtnText}>← Önceki</Text>
          </TouchableOpacity>

          {!isLast ? (
            <TouchableOpacity
              style={styles.navBtnNext}
              onPress={() => setCurrentIdx((i) => i + 1)}
            >
              <Text style={styles.navBtnNextText}>Sonraki →</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.submitBtn, isSubmitting && { opacity: 0.6 }]}
              onPress={() => handleSubmit(false)}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? <ActivityIndicator color={Colors.white} />
                : <Text style={styles.submitBtnText}>✓ Testi Bitir ({answeredCount}/{questions.length})</Text>
              }
            </TouchableOpacity>
          )}
        </View>

        {/* Soru grid'i */}
        <View style={styles.gridSection}>
          <Text style={styles.gridTitle}>Cevaplanan: {answeredCount}/{questions.length}</Text>
          <View style={styles.grid}>
            {questions.map((q, i) => (
              <TouchableOpacity
                key={q.questionId}
                style={[
                  styles.gridItem,
                  answers[q.questionId] && styles.gridItemAnswered,
                  i === currentIdx && styles.gridItemCurrent,
                ]}
                onPress={() => setCurrentIdx(i)}
              >
                <Text style={[
                  styles.gridItemText,
                  answers[q.questionId] && styles.gridItemTextAnswered,
                  i === currentIdx && styles.gridItemTextCurrent,
                ]}>
                  {i + 1}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary },
  headerSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  timer: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10,
    backgroundColor: Colors.primaryLight,
  },
  timerWarning: { backgroundColor: '#fef2f2' },
  timerText: { fontSize: 15, fontWeight: '800', color: Colors.primary },
  timerTextWarning: { color: Colors.error },
  progressBg: { height: 4, backgroundColor: Colors.border },
  progressFill: { height: 4, backgroundColor: Colors.primary },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  questionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  questionNum: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
  pointBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
    backgroundColor: Colors.primaryLight,
  },
  pointText: { fontSize: 12, color: Colors.primary, fontWeight: '700' },
  questionImage: { width: '100%', height: 180, borderRadius: 12 },
  questionText: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary, lineHeight: 26 },
  options: { gap: 10 },
  option: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 14, borderWidth: 2,
    borderColor: Colors.border, backgroundColor: Colors.white,
  },
  optionSelected: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  optionLabel: {
    width: 32, height: 32, borderRadius: 10, borderWidth: 2,
    borderColor: Colors.border, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  optionLabelSelected: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  optionLabelText: { fontSize: 14, fontWeight: '800', color: Colors.textSecondary },
  optionLabelTextSelected: { color: Colors.white },
  optionText: { flex: 1, fontSize: 14, color: Colors.textPrimary, fontWeight: '500' },
  optionTextSelected: { color: Colors.primary, fontWeight: '700' },
  navRow: { flexDirection: 'row', gap: 10 },
  navBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center',
    borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.white,
  },
  navBtnDisabled: { opacity: 0.4 },
  navBtnText: { fontSize: 14, fontWeight: '700', color: Colors.textSecondary },
  navBtnNext: {
    flex: 2, paddingVertical: 12, borderRadius: 12, alignItems: 'center',
    backgroundColor: Colors.primary,
  },
  navBtnNextText: { fontSize: 14, fontWeight: '800', color: Colors.white },
  submitBtn: {
    flex: 2, paddingVertical: 12, borderRadius: 12, alignItems: 'center',
    backgroundColor: Colors.success,
  },
  submitBtnText: { fontSize: 14, fontWeight: '800', color: Colors.white },
  gridSection: { gap: 10 },
  gridTitle: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  gridItem: {
    width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border,
  },
  gridItemAnswered: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  gridItemCurrent: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  gridItemText: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary },
  gridItemTextAnswered: { color: Colors.primary },
  gridItemTextCurrent: { color: Colors.white },
});
