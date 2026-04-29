import { useState } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { StudentPracticeStackParamList } from '../../navigation/StudentPracticeStackNavigator';
import { practiceApi } from '../../lib/api';
import { Colors } from '../../constants/colors';

type Props = {
  navigation: NativeStackNavigationProp<StudentPracticeStackParamList, 'PracticeSolve'>;
  route: RouteProp<StudentPracticeStackParamList, 'PracticeSolve'>;
};

const LABELS = ['A', 'B', 'C', 'D', 'E'];

export default function PracticeSolveScreen({ navigation, route }: Props) {
  const { sessionId, questions } = route.params;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<any>(null);
  const [isAnswering, setIsAnswering] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [answeredCount, setAnsweredCount] = useState(0);

  const currentQuestion = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;

  useFocusEffect(useCallback(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      Alert.alert('Pratikten Çık', 'Pratik oturumundan çıkmak istiyor musun?', [
        { text: 'Devam Et', style: 'cancel' },
        { text: 'Çık', style: 'destructive', onPress: () => navigation.goBack() },
      ]);
      return true;
    });
    return () => sub.remove();
  }, [navigation]));

  const handleAnswer = async () => {
    if (!selectedOption) { Alert.alert('Uyarı', 'Lütfen bir şık seçin.'); return; }
    setIsAnswering(true);
    try {
      const res = await practiceApi.answerQuestion(sessionId, {
        questionId: currentQuestion.id,
        selectedOptionId: selectedOption,
      });
      setFeedback(res.data.data);
      setAnsweredCount((c) => c + 1);
    } catch (err: any) {
      Alert.alert('Hata', err?.response?.data?.message ?? 'Cevap kaydedilemedi.');
    } finally {
      setIsAnswering(false);
    }
  };

  const handleNext = async () => {
    if (!isLast) {
      setCurrentIndex((i) => i + 1);
      setSelectedOption(null);
      setFeedback(null);
    } else {
      setIsCompleting(true);
      try {
        await practiceApi.completeSession(sessionId);
        navigation.replace('PracticeResults', { sessionId });
      } catch {
        Alert.alert('Hata', 'Oturum tamamlanamadı.');
      } finally {
        setIsCompleting(false);
      }
    }
  };

  const progress = (currentIndex + 1) / questions.length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() =>
            Alert.alert('Pratikten Çık', 'Oturumdan çıkmak istiyor musun?', [
              { text: 'Devam Et', style: 'cancel' },
              { text: 'Çık', style: 'destructive', onPress: () => navigation.goBack() },
            ])
          }
        >
          <Text style={styles.exitBtn}>✕</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerProgress}>
            {currentIndex + 1} / {questions.length}
          </Text>
          <Text style={styles.headerAnswered}>✓ {answeredCount} cevaplandı</Text>
        </View>
        <View style={{ width: 32 }} />
      </View>

      {/* Progress bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Soru */}
        <View style={styles.questionCard}>
          <Text style={styles.questionMeta}>
            {currentQuestion.subject}
            {currentQuestion.topic ? ` • ${currentQuestion.topic}` : ''}
            {currentQuestion.difficulty
              ? ` • ${currentQuestion.difficulty === 'EASY' ? 'Kolay' : currentQuestion.difficulty === 'MEDIUM' ? 'Orta' : 'Zor'}`
              : ''}
          </Text>
          <Text style={styles.questionText}>{currentQuestion.questionText}</Text>
        </View>

        {/* Seçenekler */}
        <View style={styles.optionsContainer}>
          {currentQuestion.options?.map((opt: any, i: number) => {
            const isSelected = selectedOption === opt.id;
            const isCorrect = feedback?.correctOptionId === opt.id;
            const isWrong = feedback && isSelected && !feedback.isCorrect;

            let optStyle = styles.option;
            let labelStyle = styles.optionLabel;
            let textStyle = styles.optionText;

            if (feedback) {
              if (isCorrect) {
                optStyle = { ...styles.option, ...styles.optionCorrect };
                labelStyle = { ...styles.optionLabel, ...styles.optionLabelCorrect };
                textStyle = { ...styles.optionText, color: '#15803d' };
              } else if (isWrong) {
                optStyle = { ...styles.option, ...styles.optionWrong };
                labelStyle = { ...styles.optionLabel, ...styles.optionLabelWrong };
                textStyle = { ...styles.optionText, color: '#b91c1c' };
              }
            } else if (isSelected) {
              optStyle = { ...styles.option, ...styles.optionSelected };
              labelStyle = { ...styles.optionLabel, ...styles.optionLabelSelected };
            }

            return (
              <TouchableOpacity
                key={opt.id}
                style={optStyle}
                onPress={() => !feedback && setSelectedOption(opt.id)}
                disabled={!!feedback}
                activeOpacity={0.7}
              >
                <View style={labelStyle}>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: 'inherit' }}>{LABELS[i]}</Text>
                </View>
                <Text style={[textStyle, { flex: 1 }]}>{opt.optionText}</Text>
                {feedback && isCorrect && <Text style={styles.feedbackIcon}>✓</Text>}
                {isWrong && <Text style={[styles.feedbackIcon, { color: '#b91c1c' }]}>✗</Text>}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Feedback */}
        {feedback && (
          <View style={[styles.feedbackCard, feedback.isCorrect ? styles.feedbackCorrect : styles.feedbackWrong]}>
            <Text style={[styles.feedbackTitle, { color: feedback.isCorrect ? '#15803d' : '#b91c1c' }]}>
              {feedback.isCorrect ? '🎉 Doğru!' : '❌ Yanlış!'}
            </Text>
            {feedback.explanation && (
              <Text style={styles.feedbackExplanation}>
                <Text style={{ fontWeight: '700' }}>Açıklama: </Text>
                {feedback.explanation}
              </Text>
            )}
          </View>
        )}
      </ScrollView>

      {/* Alt butonlar */}
      <View style={styles.footer}>
        {!feedback ? (
          <TouchableOpacity
            style={[styles.answerBtn, (!selectedOption || isAnswering) && styles.answerBtnDisabled]}
            onPress={handleAnswer}
            disabled={!selectedOption || isAnswering}
          >
            {isAnswering
              ? <ActivityIndicator color={Colors.white} />
              : <Text style={styles.answerBtnText}>Cevabı Kontrol Et</Text>
            }
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.nextBtn, isCompleting && styles.answerBtnDisabled]}
            onPress={handleNext}
            disabled={isCompleting}
          >
            {isCompleting
              ? <ActivityIndicator color={Colors.white} />
              : <Text style={styles.nextBtnText}>
                  {isLast ? 'Bitir ve Sonuçları Gör 🏁' : 'Sonraki Soru →'}
                </Text>
            }
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  exitBtn: { fontSize: 18, color: Colors.textSecondary, fontWeight: '700', padding: 4 },
  headerCenter: { alignItems: 'center' },
  headerProgress: { fontSize: 15, fontWeight: '900', color: Colors.textPrimary },
  headerAnswered: { fontSize: 11, color: '#16a34a', fontWeight: '600' },
  progressBar: { height: 4, backgroundColor: Colors.border },
  progressFill: { height: 4, backgroundColor: Colors.primary, borderRadius: 2 },
  scroll: { padding: 16, gap: 14, paddingBottom: 20 },
  questionCard: {
    backgroundColor: Colors.white, borderRadius: 16, padding: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  questionMeta: { fontSize: 11, color: Colors.textMuted, fontWeight: '600', marginBottom: 10, textTransform: 'uppercase' },
  questionText: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary, lineHeight: 25 },
  optionsContainer: { gap: 10 },
  option: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.white, borderRadius: 14, padding: 14,
    borderWidth: 2, borderColor: Colors.border,
  },
  optionSelected: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  optionCorrect: { borderColor: '#16a34a', backgroundColor: '#dcfce7' },
  optionWrong: { borderColor: '#dc2626', backgroundColor: '#fee2e2' },
  optionLabel: {
    width: 32, height: 32, borderRadius: 8, borderWidth: 2, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  optionLabelSelected: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  optionLabelCorrect: { borderColor: '#16a34a', backgroundColor: '#16a34a' },
  optionLabelWrong: { borderColor: '#dc2626', backgroundColor: '#dc2626' },
  optionText: { fontSize: 14, color: Colors.textPrimary, lineHeight: 20 },
  feedbackIcon: { fontSize: 18, color: '#16a34a', fontWeight: '900' },
  feedbackCard: { borderRadius: 14, padding: 16, gap: 8, borderWidth: 1.5 },
  feedbackCorrect: { backgroundColor: '#dcfce7', borderColor: '#86efac' },
  feedbackWrong: { backgroundColor: '#fee2e2', borderColor: '#fca5a5' },
  feedbackTitle: { fontSize: 16, fontWeight: '900' },
  feedbackExplanation: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  footer: {
    padding: 16, paddingBottom: 24, backgroundColor: Colors.white,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  answerBtn: { backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  answerBtnDisabled: { opacity: 0.5 },
  answerBtnText: { color: Colors.white, fontSize: 15, fontWeight: '900' },
  nextBtn: { backgroundColor: '#16a34a', borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  nextBtnText: { color: Colors.white, fontSize: 15, fontWeight: '900' },
});
