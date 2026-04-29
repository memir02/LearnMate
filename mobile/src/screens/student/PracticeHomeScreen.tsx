import { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { StudentPracticeStackParamList } from '../../navigation/StudentPracticeStackNavigator';
import { practiceApi } from '../../lib/api';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';

type Props = { navigation: NativeStackNavigationProp<StudentPracticeStackParamList, 'PracticeHome'> };

const SUBJECTS = ['Matematik', 'Türkçe', 'Fen Bilimleri', 'Sosyal Bilgiler'];
const GRADES = ['1. Sınıf', '2. Sınıf', '3. Sınıf', '4. Sınıf', '5. Sınıf', '6. Sınıf', '7. Sınıf', '8. Sınıf'];
const DIFFICULTIES = [
  { value: '', label: 'Karışık', emoji: '🎲' },
  { value: 'EASY', label: 'Kolay', emoji: '🟢' },
  { value: 'MEDIUM', label: 'Orta', emoji: '🟡' },
  { value: 'HARD', label: 'Zor', emoji: '🔴' },
];
const COUNTS = [5, 10, 15, 20, 30];

export default function PracticeHomeScreen({ navigation }: Props) {
  const { user } = useAuth();
  const studentGrade = (user as any)?.student?.grade ?? '4. Sınıf';

  const [subject, setSubject] = useState('Matematik');
  const [topic, setTopic] = useState('');
  const [grade, setGrade] = useState(studentGrade);
  const [difficulty, setDifficulty] = useState('');
  const [questionCount, setQuestionCount] = useState(10);
  const [availableCount, setAvailableCount] = useState<number | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const checkPool = useCallback(async () => {
    setIsChecking(true);
    try {
      const res = await practiceApi.getPool({
        subject,
        topic: topic || undefined,
        grade,
        difficulty: difficulty || undefined,
      });
      setAvailableCount(res.data.data.totalQuestions);
    } catch {
      setAvailableCount(0);
    } finally {
      setIsChecking(false);
    }
  }, [subject, topic, grade, difficulty]);

  useEffect(() => {
    const timer = setTimeout(checkPool, 500);
    return () => clearTimeout(timer);
  }, [checkPool]);

  const handleStart = async () => {
    if (!availableCount || availableCount < questionCount) {
      Alert.alert(
        'Yetersiz Soru',
        `Bu filtrelerle sadece ${availableCount ?? 0} soru mevcut. Soru sayısını azalt veya filtreleri değiştir.`
      );
      return;
    }
    setIsStarting(true);
    try {
      const res = await practiceApi.startSession({
        subject,
        topic: topic || undefined,
        grade,
        questionCount,
        difficulty: difficulty || undefined,
      });
      const { session, questions } = res.data.data;
      navigation.navigate('PracticeSolve', { sessionId: session.id, questions });
    } catch (err: any) {
      Alert.alert('Hata', err?.response?.data?.message ?? 'Oturum başlatılamadı.');
    } finally {
      setIsStarting(false);
    }
  };

  const poolColor = availableCount === null ? Colors.textMuted
    : availableCount === 0 ? Colors.error
    : availableCount < questionCount ? '#d97706'
    : '#16a34a';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Pratik Çalışma</Text>
          <Text style={styles.headerSub}>Soru havuzundan istediğin kadar soru çöz!</Text>
        </View>

        {/* Havuz göstergesi */}
        <View style={[styles.poolCard, { borderColor: poolColor }]}>
          {isChecking ? (
            <ActivityIndicator color={Colors.primary} size="small" />
          ) : (
            <Text style={[styles.poolNum, { color: poolColor }]}>{availableCount ?? '—'}</Text>
          )}
          <Text style={styles.poolLabel}>soru mevcut</Text>
        </View>

        {/* 1. Ders */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1️⃣ Ders Seç</Text>
          <View style={styles.grid2}>
            {SUBJECTS.map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.chipBtn, subject === s && styles.chipBtnActive]}
                onPress={() => setSubject(s)}
              >
                <Text style={[styles.chipText, subject === s && styles.chipTextActive]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 2. Konu */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2️⃣ Konu <Text style={styles.optional}>(İsteğe Bağlı)</Text></Text>
          <TextInput
            style={styles.input}
            value={topic}
            onChangeText={setTopic}
            placeholder="Örn: Toplama İşlemi"
            placeholderTextColor={Colors.textMuted}
          />
          <Text style={styles.hint}>💡 Boş bırakırsan tüm konulardan sorular gelir</Text>
        </View>

        {/* 3. Sınıf */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3️⃣ Sınıf Seviyesi</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hScroll}>
            <View style={styles.hRow}>
              {GRADES.map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[styles.gradeBtn, grade === g && styles.gradeBtnActive]}
                  onPress={() => setGrade(g)}
                >
                  <Text style={[styles.gradeText, grade === g && styles.gradeTextActive]}>
                    {g.replace('. Sınıf', '')}
                  </Text>
                  <Text style={[styles.gradeSubText, grade === g && styles.gradeTextActive]}>. Sınıf</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* 4. Soru Sayısı */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4️⃣ Soru Sayısı</Text>
          <View style={styles.countRow}>
            {COUNTS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.countBtn, questionCount === c && styles.countBtnActive]}
                onPress={() => setQuestionCount(c)}
              >
                <Text style={[styles.countText, questionCount === c && styles.countTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 5. Zorluk */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5️⃣ Zorluk Seviyesi</Text>
          <View style={styles.diffRow}>
            {DIFFICULTIES.map((d) => (
              <TouchableOpacity
                key={d.value}
                style={[styles.diffBtn, difficulty === d.value && styles.diffBtnActive]}
                onPress={() => setDifficulty(d.value)}
              >
                <Text style={styles.diffEmoji}>{d.emoji}</Text>
                <Text style={[styles.diffText, difficulty === d.value && styles.diffTextActive]}>{d.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Başlat */}
        <TouchableOpacity
          style={[
            styles.startBtn,
            (isStarting || isChecking || !availableCount || availableCount === 0) && styles.startBtnDisabled,
          ]}
          onPress={handleStart}
          disabled={isStarting || isChecking || !availableCount || availableCount === 0}
        >
          {isStarting
            ? <ActivityIndicator color={Colors.white} />
            : <Text style={styles.startBtnText}>🚀 Pratik Başlat ({questionCount} Soru)</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 16, gap: 4, paddingBottom: 40 },
  header: { marginBottom: 8 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: Colors.textPrimary },
  headerSub: { fontSize: 13, color: Colors.textSecondary, marginTop: 3 },
  poolCard: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.white, borderRadius: 14, padding: 14,
    borderWidth: 2, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, elevation: 1,
  },
  poolNum: { fontSize: 28, fontWeight: '900' },
  poolLabel: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  section: { marginTop: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: Colors.textPrimary, marginBottom: 10 },
  optional: { fontSize: 12, fontWeight: '400', color: Colors.textMuted },
  grid2: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chipBtn: {
    flex: 1, minWidth: '45%', paddingVertical: 12, paddingHorizontal: 10,
    borderRadius: 12, borderWidth: 2, borderColor: Colors.border,
    backgroundColor: Colors.white, alignItems: 'center',
  },
  chipBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  chipText: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
  chipTextActive: { color: Colors.primary },
  input: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14,
    color: Colors.textPrimary, backgroundColor: Colors.white,
  },
  hint: { fontSize: 11, color: Colors.textMuted, marginTop: 6 },
  hScroll: { marginHorizontal: -4 },
  hRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 4 },
  gradeBtn: {
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
    borderWidth: 2, borderColor: Colors.border, backgroundColor: Colors.white,
    alignItems: 'center', minWidth: 56,
  },
  gradeBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  gradeText: { fontSize: 16, fontWeight: '900', color: Colors.textSecondary },
  gradeSubText: { fontSize: 9, color: Colors.textMuted },
  gradeTextActive: { color: Colors.primary },
  countRow: { flexDirection: 'row', gap: 10 },
  countBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center',
    borderWidth: 2, borderColor: Colors.border, backgroundColor: Colors.white,
  },
  countBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  countText: { fontSize: 15, fontWeight: '800', color: Colors.textSecondary },
  countTextActive: { color: Colors.primary },
  diffRow: { flexDirection: 'row', gap: 8 },
  diffBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', gap: 4,
    borderWidth: 2, borderColor: Colors.border, backgroundColor: Colors.white,
  },
  diffBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  diffEmoji: { fontSize: 16 },
  diffText: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary },
  diffTextActive: { color: Colors.primary },
  startBtn: {
    marginTop: 24, backgroundColor: Colors.primary, borderRadius: 16,
    paddingVertical: 16, alignItems: 'center',
  },
  startBtnDisabled: { opacity: 0.5 },
  startBtnText: { color: Colors.white, fontSize: 16, fontWeight: '900' },
});
