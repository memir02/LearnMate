import { useEffect, useState } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert, FlatList,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TestsStackParamList } from '../../navigation/TestsStackNavigator';
import { testApi, questionApi, classroomApi } from '../../lib/api';
import { Colors } from '../../constants/colors';

type Props = {
  navigation: NativeStackNavigationProp<TestsStackParamList, 'CreateTest'>;
};

interface Question {
  id: string;
  questionText: string;
  subject?: string;
  topic?: string;
  grade?: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  points: number;
  options: { id: string; optionText: string; isCorrect: boolean }[];
}

interface Classroom {
  id: string;
  name: string;
}

const DIFFICULTY_COLOR = { EASY: '#dcfce7', MEDIUM: '#fef9c3', HARD: '#fee2e2' };
const DIFFICULTY_TEXT = { EASY: '#16a34a', MEDIUM: '#92400e', HARD: '#dc2626' };
const DIFFICULTY_LABEL = { EASY: 'Kolay', MEDIUM: 'Orta', HARD: 'Zor' };

export default function CreateTestScreen({ navigation }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [selectedClassroomId, setSelectedClassroomId] = useState('');
  const [shuffleQuestions, setShuffleQuestions] = useState(false);

  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [questionSearch, setQuestionSearch] = useState('');

  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [qRes, cRes] = await Promise.all([
        questionApi.getMyQuestions({ limit: 100 }),
        classroomApi.getAll(),
      ]);
      setAllQuestions(qRes.data.data?.questions || []);
      // GET /classrooms → { data: [...] } (dizi direkt, classrooms anahtarı yok)
      setClassrooms(cRes.data.data || []);
    } catch {
      Alert.alert('Hata', 'Veriler yüklenemedi.');
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  const toggleQuestion = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const filteredQuestions = allQuestions.filter((q) => {
    if (!questionSearch) return true;
    const s = questionSearch.toLowerCase();
    return (
      q.questionText.toLowerCase().includes(s) ||
      (q.subject || '').toLowerCase().includes(s) ||
      (q.topic || '').toLowerCase().includes(s)
    );
  });

  const totalPoints = allQuestions
    .filter((q) => selectedIds.has(q.id))
    .reduce((sum, q) => sum + (q.points || 1), 0);

  const handleSave = async () => {
    if (!title.trim()) { Alert.alert('Uyarı', 'Test başlığı zorunludur.'); return; }
    if (selectedIds.size === 0) { Alert.alert('Uyarı', 'En az bir soru seçmelisiniz.'); return; }

    setIsSaving(true);
    try {
      await testApi.create({
        title: title.trim(),
        description: description.trim() || undefined,
        subject: subject.trim() || undefined,
        grade: grade || undefined,
        classroomId: selectedClassroomId || undefined,
        durationMinutes: durationMinutes ? parseInt(durationMinutes) : undefined,
        shuffleQuestions,
        questionIds: Array.from(selectedIds),
      });
      Alert.alert('Başarılı', 'Test oluşturuldu.', [
        { text: 'Tamam', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      Alert.alert('Hata', e.response?.data?.message || 'Test oluşturulamadı.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Geri</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Yeni Test</Text>
        <TouchableOpacity
          style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving
            ? <ActivityIndicator color={Colors.white} size="small" />
            : <Text style={styles.saveBtnText}>Kaydet</Text>}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Test Bilgileri */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📋 Test Bilgileri</Text>
            <View style={styles.sectionCard}>
              <Text style={styles.label}>Başlık *</Text>
              <TextInput
                style={styles.input}
                placeholder="Test başlığını girin..."
                placeholderTextColor={Colors.textMuted}
                value={title}
                onChangeText={setTitle}
              />

              <Text style={[styles.label, { marginTop: 12 }]}>Açıklama</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                placeholder="Test hakkında kısa açıklama..."
                placeholderTextColor={Colors.textMuted}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { marginTop: 12 }]}>Branş</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Matematik..."
                    placeholderTextColor={Colors.textMuted}
                    value={subject}
                    onChangeText={setSubject}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { marginTop: 12 }]}>Süre (dk)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="30"
                    placeholderTextColor={Colors.textMuted}
                    value={durationMinutes}
                    onChangeText={setDurationMinutes}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Sınıfa Ata */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏫 Sınıfa Ata (Opsiyonel)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              <TouchableOpacity
                style={[styles.classChip, !selectedClassroomId && styles.classChipActive]}
                onPress={() => setSelectedClassroomId('')}
              >
                <Text style={[styles.classChipText, !selectedClassroomId && styles.classChipTextActive]}>
                  Sınıf Seçme
                </Text>
              </TouchableOpacity>
              {classrooms.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.classChip, selectedClassroomId === c.id && styles.classChipActive]}
                  onPress={() => setSelectedClassroomId(c.id)}
                >
                  <Text style={[styles.classChipText, selectedClassroomId === c.id && styles.classChipTextActive]}>
                    {c.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Ayarlar */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚙️ Ayarlar</Text>
            <TouchableOpacity
              style={[styles.toggleRow, shuffleQuestions && styles.toggleRowActive]}
              onPress={() => setShuffleQuestions((v) => !v)}
            >
              <View>
                <Text style={styles.toggleTitle}>Soruları Karıştır</Text>
                <Text style={styles.toggleSub}>Her öğrenciye farklı sırada göster</Text>
              </View>
              <View style={[styles.toggle, shuffleQuestions && styles.toggleOn]}>
                <View style={[styles.toggleThumb, shuffleQuestions && styles.toggleThumbOn]} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Soru Seçimi */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>❓ Soru Seç</Text>
              {selectedIds.size > 0 && (
                <View style={styles.selectedBadge}>
                  <Text style={styles.selectedBadgeText}>{selectedIds.size} seçildi • {totalPoints} puan</Text>
                </View>
              )}
            </View>

            <TextInput
              style={[styles.input, { marginBottom: 10 }]}
              placeholder="Soru ara..."
              placeholderTextColor={Colors.textMuted}
              value={questionSearch}
              onChangeText={setQuestionSearch}
            />

            {isLoadingQuestions ? (
              <ActivityIndicator color={Colors.primary} />
            ) : filteredQuestions.length === 0 ? (
              <Text style={styles.noQuestion}>
                {allQuestions.length === 0
                  ? 'Henüz soru oluşturmadınız. Önce "Sorular" sekmesinden soru ekleyin.'
                  : 'Aramayla eşleşen soru bulunamadı.'}
              </Text>
            ) : (
              filteredQuestions.map((q) => {
                const isSelected = selectedIds.has(q.id);
                return (
                  <TouchableOpacity
                    key={q.id}
                    style={[styles.questionItem, isSelected && styles.questionItemSelected]}
                    onPress={() => toggleQuestion(q.id)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                      {isSelected && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={styles.questionItemText} numberOfLines={2}>{q.questionText}</Text>
                      <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                        {q.subject && <Text style={styles.qMeta}>📚 {q.subject}</Text>}
                        {q.topic && <Text style={styles.qMeta}>📌 {q.topic}</Text>}
                        <View style={[styles.diffTag, { backgroundColor: DIFFICULTY_COLOR[q.difficulty] }]}>
                          <Text style={[styles.diffTagText, { color: DIFFICULTY_TEXT[q.difficulty] }]}>
                            {DIFFICULTY_LABEL[q.difficulty]}
                          </Text>
                        </View>
                        <Text style={styles.qMeta}>⭐ {q.points || 1}p</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>

          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { width: 60 },
  backText: { color: Colors.primary, fontSize: 15, fontWeight: '600' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: Colors.textPrimary },
  saveBtn: { backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, minWidth: 70, alignItems: 'center' },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
  content: { padding: 16 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: Colors.textPrimary, marginBottom: 10 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sectionCard: { backgroundColor: Colors.white, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border },
  label: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary, marginBottom: 6 },
  input: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14,
    color: Colors.textPrimary, backgroundColor: Colors.white,
  },
  inputMultiline: { height: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 10 },
  chipScroll: { flexDirection: 'row' },
  classChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.white,
    marginRight: 8,
  },
  classChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  classChipText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  classChipTextActive: { color: Colors.primary },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 14, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.white,
  },
  toggleRowActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  toggleTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  toggleSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  toggle: {
    width: 44, height: 24, borderRadius: 12, backgroundColor: Colors.border,
    justifyContent: 'center', paddingHorizontal: 2,
  },
  toggleOn: { backgroundColor: Colors.primary },
  toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.white },
  toggleThumbOn: { alignSelf: 'flex-end' },
  selectedBadge: { backgroundColor: Colors.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  selectedBadgeText: { color: Colors.white, fontSize: 12, fontWeight: '700' },
  noQuestion: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', padding: 20 },
  questionItem: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    padding: 12, borderRadius: 12, borderWidth: 1.5,
    borderColor: Colors.border, backgroundColor: Colors.white, marginBottom: 8,
  },
  questionItemSelected: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2,
    borderColor: Colors.border, backgroundColor: Colors.white,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxSelected: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  checkmark: { color: Colors.white, fontSize: 13, fontWeight: '800' },
  questionItemText: { fontSize: 13, color: Colors.textPrimary, lineHeight: 18 },
  qMeta: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600' },
  diffTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  diffTagText: { fontSize: 10, fontWeight: '700' },
});
