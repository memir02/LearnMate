import { useEffect, useState } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { QuestionsStackParamList } from '../../navigation/QuestionsStackNavigator';
import { questionApi, uploadApi } from '../../lib/api';
import { Colors } from '../../constants/colors';

type Props = {
  navigation: NativeStackNavigationProp<QuestionsStackParamList, 'EditQuestion'>;
  route: RouteProp<QuestionsStackParamList, 'EditQuestion'>;
};

type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

const DIFFICULTY_OPTIONS: { value: Difficulty; label: string; color: string; textColor: string }[] = [
  { value: 'EASY', label: 'Kolay', color: '#dcfce7', textColor: '#16a34a' },
  { value: 'MEDIUM', label: 'Orta', color: '#fef9c3', textColor: '#92400e' },
  { value: 'HARD', label: 'Zor', color: '#fee2e2', textColor: '#dc2626' },
];
const GRADES = ['1', '2', '3', '4', '5', '6', '7', '8'];
const OPTION_LABELS = ['A', 'B', 'C', 'D'];

export default function EditQuestionScreen({ navigation, route }: Props) {
  const { questionId } = route.params;

  const [isLoadingQuestion, setIsLoadingQuestion] = useState(true);
  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctIndex, setCorrectIndex] = useState<number | null>(null);
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [grade, setGrade] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('MEDIUM');
  const [isPublic, setIsPublic] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadQuestion();
  }, []);

  const loadQuestion = async () => {
    try {
      const res = await questionApi.getById(questionId);
      const q = res.data.data;

      setQuestionText(q.questionText || '');
      setSubject(q.subject || '');
      setTopic(q.topic || '');
      // grade "4. Sınıf" formatından sadece rakamı al
      const gradeNum = (q.grade || '').replace(/[^0-9]/g, '');
      setGrade(gradeNum);
      setDifficulty(q.difficulty || 'MEDIUM');
      setIsPublic(q.isPublic || false);

      if (q.imageUrl) {
        setImageUri(q.imageUrl);
        setImageUrl(q.imageUrl);
      }

      if (q.options?.length >= 4) {
        const sorted = [...q.options].sort((a: any, b: any) => a.orderIndex - b.orderIndex);
        setOptions(sorted.map((o: any) => o.optionText));
        const ci = sorted.findIndex((o: any) => o.isCorrect);
        setCorrectIndex(ci >= 0 ? ci : null);
      }
    } catch {
      Alert.alert('Hata', 'Soru yüklenemedi.', [
        { text: 'Tamam', onPress: () => navigation.goBack() },
      ]);
    } finally {
      setIsLoadingQuestion(false);
    }
  };

  const pickImage = async (fromCamera: boolean) => {
    const permResult = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permResult.granted) {
      Alert.alert('İzin Gerekli', fromCamera ? 'Kamera izni verilmedi.' : 'Galeri izni verilmedi.');
      return;
    }

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setImageUri(uri);
      setIsUploadingImage(true);
      try {
        const res = await uploadApi.image(uri);
        setImageUrl(res.data.data.url);
      } catch {
        Alert.alert('Hata', 'Görsel yüklenemedi.');
        setImageUri(imageUrl); // eski görsele geri dön
      } finally {
        setIsUploadingImage(false);
      }
    }
  };

  const showImageOptions = () => {
    Alert.alert('Görsel Değiştir', 'Görsel kaynağını seçin', [
      { text: 'Kameradan Çek 📷', onPress: () => pickImage(true) },
      { text: 'Galeriden Seç 🖼️', onPress: () => pickImage(false) },
      { text: 'Görseli Kaldır', style: 'destructive', onPress: () => { setImageUri(null); setImageUrl(null); } },
      { text: 'İptal', style: 'cancel' },
    ]);
  };

  const updateOption = (index: number, value: string) =>
    setOptions((prev) => prev.map((o, i) => (i === index ? value : o)));

  const validate = () => {
    if (!questionText.trim()) { Alert.alert('Uyarı', 'Soru metni zorunludur.'); return false; }
    if (options.some((o) => !o.trim())) { Alert.alert('Uyarı', 'Tüm şıklar doldurulmalıdır.'); return false; }
    if (correctIndex === null) { Alert.alert('Uyarı', 'Doğru cevabı işaretleyin.'); return false; }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    if (isUploadingImage) { Alert.alert('Uyarı', 'Görsel yükleniyor, lütfen bekleyin.'); return; }

    setIsSaving(true);
    try {
      await questionApi.update(questionId, {
        questionText: questionText.trim(),
        subject: subject.trim() || undefined,
        topic: topic.trim() || undefined,
        grade: grade || undefined,
        difficulty,
        isPublic,
        imageUrl: imageUrl || null,
        options: options.map((text, i) => ({
          optionText: text.trim(),
          isCorrect: i === correctIndex,
          orderIndex: i,
        })),
      });
      Alert.alert('Başarılı', 'Soru güncellendi.', [
        { text: 'Tamam', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      Alert.alert('Hata', e.response?.data?.message || 'Soru güncellenemedi.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingQuestion) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Soru yükleniyor...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Geri</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Soruyu Düzenle</Text>
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

          {/* Soru Metni */}
          <View style={styles.section}>
            <Text style={styles.label}>Soru Metni *</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              placeholder="Soruyu buraya yazın..."
              placeholderTextColor={Colors.textMuted}
              value={questionText}
              onChangeText={setQuestionText}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Görsel */}
          <View style={styles.section}>
            <Text style={styles.label}>Soru Görseli (Opsiyonel)</Text>
            {imageUri ? (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: imageUri }} style={styles.imagePreview} resizeMode="cover" />
                {isUploadingImage && (
                  <View style={styles.imageOverlay}>
                    <ActivityIndicator color={Colors.white} size="large" />
                    <Text style={styles.imageOverlayText}>Yükleniyor...</Text>
                  </View>
                )}
                {!isUploadingImage && (
                  <TouchableOpacity style={styles.changeImageBtn} onPress={showImageOptions}>
                    <Text style={styles.changeImageText}>✏️ Görseli Değiştir</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <TouchableOpacity style={styles.imagePicker} onPress={showImageOptions}>
                <Text style={styles.imagePickerIcon}>📷</Text>
                <Text style={styles.imagePickerText}>Görsel Ekle</Text>
                <Text style={styles.imagePickerSub}>Kamera veya galeriden seçin</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Şıklar */}
          <View style={styles.section}>
            <Text style={styles.label}>Şıklar * — Doğru cevabı işaretleyin</Text>
            <View style={styles.optionsContainer}>
              {options.map((opt, i) => (
                <View key={i} style={styles.optionRow}>
                  <TouchableOpacity
                    style={[styles.optionLetter, correctIndex === i && styles.optionLetterCorrect]}
                    onPress={() => setCorrectIndex(i)}
                  >
                    <Text style={[styles.optionLetterText, correctIndex === i && styles.optionLetterTextCorrect]}>
                      {OPTION_LABELS[i]}
                    </Text>
                  </TouchableOpacity>
                  <TextInput
                    style={[styles.input, styles.optionInput, correctIndex === i && styles.optionInputCorrect]}
                    placeholder={`${OPTION_LABELS[i]} şıkkı...`}
                    placeholderTextColor={Colors.textMuted}
                    value={opt}
                    onChangeText={(v) => updateOption(i, v)}
                  />
                </View>
              ))}
            </View>
            {correctIndex !== null && (
              <Text style={styles.correctHint}>✅ {OPTION_LABELS[correctIndex]} şıkkı doğru cevap olarak işaretlendi</Text>
            )}
          </View>

          {/* Meta */}
          <View style={styles.section}>
            <Text style={styles.label}>Branş</Text>
            <TextInput style={styles.input} placeholder="Örn: Matematik" placeholderTextColor={Colors.textMuted} value={subject} onChangeText={setSubject} />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Konu</Text>
            <TextInput style={styles.input} placeholder="Örn: Kesirler" placeholderTextColor={Colors.textMuted} value={topic} onChangeText={setTopic} />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Sınıf Seviyesi</Text>
            <View style={styles.chipRow}>
              {GRADES.map((g) => (
                <TouchableOpacity key={g} style={[styles.chip, grade === g && styles.chipActive]} onPress={() => setGrade(grade === g ? '' : g)}>
                  <Text style={[styles.chipText, grade === g && styles.chipTextActive]}>{g}.</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Zorluk</Text>
            <View style={styles.chipRow}>
              {DIFFICULTY_OPTIONS.map((d) => (
                <TouchableOpacity key={d.value} style={[styles.diffChip, difficulty === d.value && { backgroundColor: d.color, borderColor: d.textColor }]} onPress={() => setDifficulty(d.value)}>
                  <Text style={[styles.diffChipText, difficulty === d.value && { color: d.textColor }]}>{d.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <TouchableOpacity style={[styles.publicToggle, isPublic && styles.publicToggleActive]} onPress={() => setIsPublic(!isPublic)}>
              <Text style={styles.publicToggleIcon}>{isPublic ? '🌐' : '🔒'}</Text>
              <View>
                <Text style={[styles.publicToggleTitle, isPublic && styles.publicToggleTitleActive]}>
                  {isPublic ? 'Soru Havuzunda' : 'Özel Soru'}
                </Text>
                <Text style={styles.publicToggleSub}>
                  {isPublic ? 'Diğer öğretmenler bu soruyu kullanabilir' : 'Sadece sen kullanabilirsin'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: Colors.textSecondary },
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
  label: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
  input: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
    color: Colors.textPrimary, backgroundColor: Colors.white,
  },
  inputMultiline: { height: 100, textAlignVertical: 'top' },
  imagePicker: {
    borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed',
    borderRadius: 14, padding: 24, alignItems: 'center', gap: 6, backgroundColor: Colors.white,
  },
  imagePickerIcon: { fontSize: 32 },
  imagePickerText: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  imagePickerSub: { fontSize: 12, color: Colors.textSecondary },
  imagePreviewContainer: { borderRadius: 14, overflow: 'hidden', position: 'relative' },
  imagePreview: { width: '100%', height: 200 },
  imageOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#00000066', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  imageOverlayText: { color: Colors.white, fontWeight: '700' },
  changeImageBtn: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#00000077', padding: 10, alignItems: 'center',
  },
  changeImageText: { color: Colors.white, fontWeight: '700', fontSize: 13 },
  optionsContainer: { gap: 10 },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  optionLetter: {
    width: 40, height: 40, borderRadius: 10, borderWidth: 1.5,
    borderColor: Colors.border, backgroundColor: Colors.white,
    alignItems: 'center', justifyContent: 'center',
  },
  optionLetterCorrect: { borderColor: '#16a34a', backgroundColor: '#dcfce7' },
  optionLetterText: { fontWeight: '800', fontSize: 15, color: Colors.textSecondary },
  optionLetterTextCorrect: { color: '#16a34a' },
  optionInput: { flex: 1, marginBottom: 0 },
  optionInputCorrect: { borderColor: '#16a34a' },
  correctHint: { fontSize: 12, color: '#16a34a', fontWeight: '600', marginTop: 6 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    width: 44, height: 36, borderRadius: 10, borderWidth: 1.5,
    borderColor: Colors.border, backgroundColor: Colors.white,
    alignItems: 'center', justifyContent: 'center',
  },
  chipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  chipText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  chipTextActive: { color: Colors.primary },
  diffChip: {
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.white,
  },
  diffChipText: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
  publicToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16,
    borderRadius: 14, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.white,
  },
  publicToggleActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  publicToggleIcon: { fontSize: 24 },
  publicToggleTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  publicToggleTitleActive: { color: Colors.primary },
  publicToggleSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
});
