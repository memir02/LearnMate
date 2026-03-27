import { useCallback, useState } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, FlatList,
  ActivityIndicator, Alert, RefreshControl, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { QuestionsStackParamList } from '../../navigation/QuestionsStackNavigator';
import { questionApi } from '../../lib/api';
import { Colors } from '../../constants/colors';

type Props = {
  navigation: NativeStackNavigationProp<QuestionsStackParamList, 'QuestionsList'>;
};

interface Question {
  id: string;
  questionText: string;
  subject?: string;
  topic?: string;
  grade?: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  isPublic: boolean;
  imageUrl?: string;
  options: { id: string; optionText: string; isCorrect: boolean; orderIndex: number }[];
}

const DIFFICULTY_LABEL = { EASY: 'Kolay', MEDIUM: 'Orta', HARD: 'Zor' };
const DIFFICULTY_COLOR = { EASY: '#dcfce7', MEDIUM: '#fef9c3', HARD: '#fee2e2' };
const DIFFICULTY_TEXT = { EASY: '#16a34a', MEDIUM: '#92400e', HARD: '#dc2626' };

export default function QuestionsScreen({ navigation }: Props) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchQuestions = async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    try {
      const res = await questionApi.getMyQuestions();
      setQuestions(res.data.data?.questions || []);
    } catch {
      Alert.alert('Hata', 'Sorular yüklenemedi.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchQuestions(); }, []));

  const handleDelete = (id: string) => {
    Alert.alert('Soruyu Sil', 'Bu soruyu silmek istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil', style: 'destructive',
        onPress: async () => {
          try {
            await questionApi.delete(id);
            setQuestions((prev) => prev.filter((q) => q.id !== id));
          } catch {
            Alert.alert('Hata', 'Soru silinemedi.');
          }
        },
      },
    ]);
  };

  const handleTogglePublic = async (id: string, current: boolean) => {
    try {
      await questionApi.togglePublic(id, !current);
      setQuestions((prev) =>
        prev.map((q) => (q.id === id ? { ...q, isPublic: !current } : q))
      );
    } catch {
      Alert.alert('Hata', 'Güncelleme yapılamadı.');
    }
  };

  if (isLoading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }

  const correctOption = (q: Question) => q.options.find((o) => o.isCorrect);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Sorularım</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('CreateQuestion')}>
          <Text style={styles.addBtnText}>+ Yeni</Text>
        </TouchableOpacity>
      </View>

      {questions.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>❓</Text>
          <Text style={styles.emptyTitle}>Henüz soru yok</Text>
          <Text style={styles.emptySubtitle}>İlk soruyu oluşturmak için "+ Yeni" butonuna bas</Text>
        </View>
      ) : (
        <FlatList
          data={questions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={() => fetchQuestions(true)} colors={[Colors.primary]} />
          }
          renderItem={({ item, index }) => (
            <View style={styles.card}>
              {/* Soru başlığı */}
              <View style={styles.cardHeader}>
                <View style={styles.questionNumber}>
                  <Text style={styles.questionNumberText}>{index + 1}</Text>
                </View>
                <View style={styles.badges}>
                  <View style={[styles.diffBadge, { backgroundColor: DIFFICULTY_COLOR[item.difficulty] }]}>
                    <Text style={[styles.diffText, { color: DIFFICULTY_TEXT[item.difficulty] }]}>
                      {DIFFICULTY_LABEL[item.difficulty]}
                    </Text>
                  </View>
                  {item.isPublic && (
                    <View style={styles.publicBadge}>
                      <Text style={styles.publicBadgeText}>🌐 Havuzda</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Görsel */}
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.questionImage} resizeMode="cover" />
              ) : null}

              {/* Soru metni */}
              <Text style={styles.questionText} numberOfLines={3}>{item.questionText}</Text>

              {/* Meta bilgiler */}
              <View style={styles.metaRow}>
                {item.subject ? <Text style={styles.metaTag}>📚 {item.subject}</Text> : null}
                {item.grade ? <Text style={styles.metaTag}>🎓 {item.grade}. Sınıf</Text> : null}
                {item.topic ? <Text style={styles.metaTag}>📌 {item.topic}</Text> : null}
              </View>

              {/* Doğru cevap özeti */}
              {correctOption(item) && (
                <View style={styles.correctRow}>
                  <Text style={styles.correctLabel}>✅ Doğru: </Text>
                  <Text style={styles.correctValue} numberOfLines={1}>{correctOption(item)?.optionText}</Text>
                </View>
              )}

              {/* Aksiyonlar */}
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.actionBtn, item.isPublic ? styles.actionBtnActive : null]}
                  onPress={() => handleTogglePublic(item.id, item.isPublic)}
                >
                  <Text style={[styles.actionBtnText, item.isPublic ? styles.actionBtnTextActive : null]}>
                    {item.isPublic ? '🌐 Havuzdan Çıkar' : '📤 Havuza Ekle'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => navigation.navigate('EditQuestion', { questionId: item.id })}
                >
                  <Text style={styles.editBtnText}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
                  <Text style={styles.deleteBtnText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16,
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  addBtn: { backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  addBtnText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
  list: { padding: 16, gap: 12 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 40 },
  emptyIcon: { fontSize: 52 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  emptySubtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
  card: {
    backgroundColor: Colors.white, borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
    gap: 10,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  questionNumber: {
    width: 28, height: 28, borderRadius: 8, backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  questionNumberText: { fontSize: 13, fontWeight: '800', color: Colors.primary },
  badges: { flexDirection: 'row', gap: 6, flex: 1 },
  diffBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  diffText: { fontSize: 12, fontWeight: '700' },
  publicBadge: { backgroundColor: Colors.primaryLight, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  publicBadgeText: { fontSize: 12, fontWeight: '600', color: Colors.primary },
  questionImage: { width: '100%', height: 160, borderRadius: 10 },
  questionText: { fontSize: 14, color: Colors.textPrimary, lineHeight: 20 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  metaTag: {
    fontSize: 12, color: Colors.textSecondary, backgroundColor: Colors.background,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, fontWeight: '600',
  },
  correctRow: { flexDirection: 'row', alignItems: 'center' },
  correctLabel: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
  correctValue: { fontSize: 12, color: '#16a34a', fontWeight: '700', flex: 1 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  actionBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center',
    borderWidth: 1.5, borderColor: Colors.border,
  },
  actionBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  actionBtnText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  actionBtnTextActive: { color: Colors.primary },
  editBtn: { padding: 8, borderRadius: 10, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.white },
  editBtnText: { fontSize: 16 },
  deleteBtn: { padding: 8, borderRadius: 10, borderWidth: 1.5, borderColor: '#fecaca', backgroundColor: '#fef2f2' },
  deleteBtnText: { fontSize: 16 },
});
