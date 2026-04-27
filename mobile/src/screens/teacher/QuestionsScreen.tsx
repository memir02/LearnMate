import { useCallback, useEffect, useRef, useState } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, FlatList,
  ActivityIndicator, Alert, RefreshControl, Image,
  TextInput, Animated, LayoutAnimation, Platform, UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { QuestionsStackParamList } from '../../navigation/QuestionsStackNavigator';
import { questionApi } from '../../lib/api';
import { Colors } from '../../constants/colors';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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

interface Filters {
  subject: string;
  topic: string;
  grade: string;
  difficulty: string;
}

const DIFFICULTY_LABEL: Record<string, string> = { EASY: 'Kolay', MEDIUM: 'Orta', HARD: 'Zor' };
const DIFFICULTY_COLOR: Record<string, string> = { EASY: '#dcfce7', MEDIUM: '#fef9c3', HARD: '#fee2e2' };
const DIFFICULTY_TEXT: Record<string, string> = { EASY: '#16a34a', MEDIUM: '#92400e', HARD: '#dc2626' };

const SUBJECTS = ['Matematik', 'Türkçe', 'Fen Bilimleri', 'Sosyal Bilgiler', 'İngilizce'];
const GRADES = ['1', '2', '3', '4', '5', '6', '7', '8'];
const DIFFICULTIES: { value: string; label: string }[] = [
  { value: 'EASY', label: 'Kolay' },
  { value: 'MEDIUM', label: 'Orta' },
  { value: 'HARD', label: 'Zor' },
];

const EMPTY_FILTERS: Filters = { subject: '', topic: '', grade: '', difficulty: '' };

const PAGE_LIMIT = 40; // Yeterince büyük tutarak çoğu durumda tek sayfada yüklüyoruz

export default function QuestionsScreen({ navigation }: Props) {
  const rawTabBarHeight = useBottomTabBarHeight();
  const tabBarHeight = typeof rawTabBarHeight === 'function'
    ? (rawTabBarHeight as unknown as () => number)()
    : rawTabBarHeight;
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [searchText, setSearchText] = useState('');

  const activeFilterCount = [
    filters.subject, filters.grade, filters.difficulty, filters.topic,
  ].filter(Boolean).length;

  // Sayfalama değerlerini ref'te tut — loadMore her zaman güncel değeri okusun
  const currentPageRef = useRef(1);
  const totalPagesRef = useRef(1);
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  // loadMore çift tetiklenmesin
  const isLoadingMoreRef = useRef(false);

  // fetchPage1'in çalışıp çalışmadığını takip et — loadMore buna paralel başlamasın
  const isFetchingPage1Ref = useRef(false);

  // İlk render'ı takip et — useEffect mount'ta çalışmasın
  const isFirstRender = useRef(true);

  const buildParams = (f: Filters, page: number) => {
    const params: Record<string, string | number> = { page, limit: PAGE_LIMIT };
    if (f.subject) params.subject = f.subject;
    if (f.grade) params.grade = `${f.grade}. Sınıf`;
    if (f.difficulty) params.difficulty = f.difficulty;
    if (f.topic) params.topic = f.topic;
    return params;
  };

  // Sayfa 1'den yükle, listeyi sıfırla
  const fetchPage1 = useCallback(async (currentFilters: Filters, refresh = false) => {
    if (isFetchingPage1Ref.current) return; // Zaten çalışıyorsa atla
    isFetchingPage1Ref.current = true;
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    try {
      const res = await questionApi.getMyQuestions(buildParams(currentFilters, 1));
      const data = res.data.data;
      currentPageRef.current = 1;
      totalPagesRef.current = data?.pagination?.totalPages ?? 1;
      setQuestions(data?.questions || []);
      setCurrentPage(1);
      setTotalPages(data?.pagination?.totalPages ?? 1);
      setTotal(data?.pagination?.total ?? 0);
    } catch {
      Alert.alert('Hata', 'Sorular yüklenemedi.');
    } finally {
      isFetchingPage1Ref.current = false;
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Sonraki sayfayı yükle ve mevcut listeye ekle
  const loadMore = useCallback(async () => {
    if (isLoadingMoreRef.current || isFetchingPage1Ref.current) return;
    if (currentPageRef.current >= totalPagesRef.current) return;

    isLoadingMoreRef.current = true;
    setIsLoadingMore(true);
    const nextPage = currentPageRef.current + 1;
    try {
      const res = await questionApi.getMyQuestions(buildParams(filtersRef.current, nextPage));
      const newQuestions = res.data.data?.questions || [];
      currentPageRef.current = nextPage;
      setQuestions((prev) => {
        // Tekrarlanan ID'leri önle (non-deterministik sıralama güvenliği)
        const existingIds = new Set(prev.map((q) => q.id));
        const unique = newQuestions.filter((q: Question) => !existingIds.has(q.id));
        return [...prev, ...unique];
      });
      setCurrentPage(nextPage);
    } catch {
      Alert.alert('Hata', 'Daha fazla soru yüklenemedi.');
    } finally {
      isLoadingMoreRef.current = false;
      setIsLoadingMore(false);
    }
  }, []);

  // Ekran odaklandığında (ilk açılış + geri dönüş): tek seferde çalışır
  useFocusEffect(
    useCallback(() => {
      fetchPage1(filtersRef.current);
    }, [fetchPage1])
  );

  // Filtreler değişince yeniden yükle — mount'ta ÇALIŞMAZ (çift fetch önlenir)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    fetchPage1(filters);
  }, [filters]);

  // Arama için debounce — değer değişmediyse yeni nesne oluşturma
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => {
        if (prev.topic === searchText) return prev; // Aynıysa referansı koru
        return { ...prev, topic: searchText };
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [searchText]);

  const toggleFilters = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowFilters((v) => !v);
  };

  const clearFilters = () => {
    setFilters(EMPTY_FILTERS);
    setSearchText('');
  };

  const setFilter = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: prev[key] === value ? '' : value,
    }));
  };

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

  const correctOption = (q: Question) => q.options.find((o) => o.isCorrect);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Sorularım</Text>
          {total > 0 && (
            <Text style={styles.headerCount}>
              {questions.length}/{total} yüklendi
              {questions.length !== new Set(questions.map(q => q.id)).size ? ' ⚠️ duplikat' : ''}
            </Text>
          )}
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.filterToggle} onPress={toggleFilters}>
            <Text style={styles.filterToggleText}>🔍 Filtrele</Text>
            {activeFilterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('CreateQuestion')}>
            <Text style={styles.addBtnText}>+ Yeni</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filtre Paneli */}
      {showFilters && (
        <View style={styles.filterPanel}>
          {/* Arama */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>🔎 Arama</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Soru metni, konu veya açıklama..."
              placeholderTextColor={Colors.textMuted}
              value={searchText}
              onChangeText={setSearchText}
              returnKeyType="search"
            />
          </View>

          {/* Ders */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>📚 Ders</Text>
            <View style={styles.chipRow}>
              {SUBJECTS.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.chip, filters.subject === s && styles.chipActive]}
                  onPress={() => setFilter('subject', s)}
                >
                  <Text style={[styles.chipText, filters.subject === s && styles.chipTextActive]}>
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Sınıf */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>🎓 Sınıf</Text>
            <View style={styles.chipRow}>
              {GRADES.map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[styles.gradeChip, filters.grade === g && styles.chipActive]}
                  onPress={() => setFilter('grade', g)}
                >
                  <Text style={[styles.chipText, filters.grade === g && styles.chipTextActive]}>
                    {g}.
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Zorluk */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>⚡ Zorluk</Text>
            <View style={styles.chipRow}>
              {DIFFICULTIES.map((d) => (
                <TouchableOpacity
                  key={d.value}
                  style={[styles.diffChip, filters.difficulty === d.value && styles.diffChipActive]}
                  onPress={() => setFilter('difficulty', d.value)}
                >
                  <Text style={[styles.diffChipText, filters.difficulty === d.value && styles.diffChipTextActive]}>
                    {d.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Filtre özeti ve temizle */}
          {activeFilterCount > 0 && (
            <View style={styles.filterFooter}>
              <Text style={styles.filterCount}>{total} sonuç bulundu</Text>
              <TouchableOpacity onPress={clearFilters} style={styles.clearBtn}>
                <Text style={styles.clearBtnText}>✕ Temizle</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Liste */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : questions.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>{activeFilterCount > 0 ? '🔍' : '❓'}</Text>
          <Text style={styles.emptyTitle}>
            {activeFilterCount > 0 ? 'Sonuç bulunamadı' : 'Henüz soru yok'}
          </Text>

          <Text style={styles.emptySubtitle}>
            {activeFilterCount > 0
              ? 'Farklı filtre kriterleri deneyin'
              : 'İlk soruyu oluşturmak için "+ Yeni" butonuna bas'}
          </Text>
          {activeFilterCount > 0 && (
            <TouchableOpacity style={styles.clearFiltersBtn} onPress={clearFilters}>
              <Text style={styles.clearFiltersBtnText}>Filtreleri Temizle</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={questions}
          keyExtractor={(item, index) => item.id ?? `fallback-${index}`}
          contentContainerStyle={[styles.list, { paddingBottom: tabBarHeight + 24 }]}
          removeClippedSubviews={false}
          initialNumToRender={50}
          maxToRenderPerBatch={50}
          windowSize={10}
          scrollIndicatorInsets={{ bottom: 0 }}
          automaticallyAdjustContentInsets={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => fetchPage1(filtersRef.current, true)}
              colors={[Colors.primary]}
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            isLoadingMore ? (
              <View style={styles.loadMoreIndicator}>
                <ActivityIndicator color={Colors.primary} size="small" />
                <Text style={styles.loadMoreText}>Daha fazla yükleniyor...</Text>
              </View>
            ) : currentPage < totalPages ? (
              <TouchableOpacity style={styles.loadMoreBtn} onPress={loadMore}>
                <Text style={styles.loadMoreBtnText}>Daha Fazla Göster ({total - questions.length} soru kaldı)</Text>
              </TouchableOpacity>
            ) : questions.length > 0 ? (
              <Text style={styles.endText}>Tüm {total} soru gösteriliyor</Text>
            ) : null
          }
          renderItem={({ item, index }) => (
            <View style={styles.card}>
              {/* Kart başlığı */}
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

              {/* Meta */}
              <View style={styles.metaRow}>
                {item.subject ? <Text style={styles.metaTag}>📚 {item.subject}</Text> : null}
                {item.grade ? <Text style={styles.metaTag}>🎓 {item.grade}</Text> : null}
                {item.topic ? <Text style={styles.metaTag}>📌 {item.topic}</Text> : null}
              </View>

              {/* Doğru cevap */}
              {correctOption(item) && (
                <View style={styles.correctRow}>
                  <Text style={styles.correctLabel}>✅ Doğru: </Text>
                  <Text style={styles.correctValue} numberOfLines={1}>
                    {correctOption(item)?.optionText}
                  </Text>
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

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  headerCount: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  headerRight: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  filterToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
    borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.white,
  },
  filterToggleText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  filterBadge: {
    backgroundColor: Colors.primary, borderRadius: 10,
    minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  filterBadgeText: { color: Colors.white, fontSize: 10, fontWeight: '800' },
  addBtn: { backgroundColor: Colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  addBtnText: { color: Colors.white, fontWeight: '700', fontSize: 13 },

  // Filtre Paneli
  filterPanel: {
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border,
    paddingHorizontal: 16, paddingVertical: 12, gap: 14,
  },
  filterSection: { gap: 8 },
  filterLabel: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary },
  searchInput: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14,
    color: Colors.textPrimary, backgroundColor: Colors.background,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.white,
  },
  gradeChip: {
    width: 40, height: 34, borderRadius: 10, borderWidth: 1.5,
    borderColor: Colors.border, backgroundColor: Colors.white,
    alignItems: 'center', justifyContent: 'center',
  },
  chipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  chipText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  chipTextActive: { color: Colors.primary },
  diffChip: {
    paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.white,
  },
  diffChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  diffChipText: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary },
  diffChipTextActive: { color: Colors.primary },
  filterFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 6, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  filterCount: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
  clearBtn: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
    borderWidth: 1.5, borderColor: '#fecaca', backgroundColor: '#fef2f2',
  },
  clearBtnText: { fontSize: 12, fontWeight: '700', color: '#dc2626' },

  // Liste
  list: { padding: 16, gap: 12 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 40 },
  emptyIcon: { fontSize: 52 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  emptySubtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
  clearFiltersBtn: {
    marginTop: 8, paddingHorizontal: 20, paddingVertical: 10,
    backgroundColor: Colors.primary, borderRadius: 10,
  },
  clearFiltersBtnText: { color: Colors.white, fontWeight: '700', fontSize: 14 },

  // Kart
  card: {
    backgroundColor: Colors.white, borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
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
  editBtn: {
    padding: 8, borderRadius: 10, borderWidth: 1.5,
    borderColor: Colors.border, backgroundColor: Colors.white,
  },
  editBtnText: { fontSize: 16 },
  deleteBtn: {
    padding: 8, borderRadius: 10, borderWidth: 1.5,
    borderColor: '#fecaca', backgroundColor: '#fef2f2',
  },
  deleteBtnText: { fontSize: 16 },

  // Sayfalama
  loadMoreIndicator: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 16,
  },
  loadMoreText: { fontSize: 13, color: Colors.textSecondary },
  loadMoreBtn: {
    marginHorizontal: 16, marginBottom: 16, paddingVertical: 12,
    borderRadius: 12, borderWidth: 1.5, borderColor: Colors.primary,
    alignItems: 'center', backgroundColor: Colors.primaryLight,
  },
  loadMoreBtnText: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  endText: {
    textAlign: 'center', fontSize: 12, color: Colors.textMuted,
    paddingVertical: 16,
  },
});
