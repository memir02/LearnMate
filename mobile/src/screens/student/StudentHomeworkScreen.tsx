import { useCallback, useRef, useState } from 'react';
import {
  StyleSheet, Text, View, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, Linking, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { homeworkApi } from '../../lib/api';
import { Colors } from '../../constants/colors';

interface Homework {
  id: string;
  title: string;
  description?: string;
  fileUrl: string;
  fileType: 'PDF' | 'IMAGE';
  dueDate?: string;
  classroom?: { id: string; name: string };
  teacher?: { teacher?: { firstName: string; lastName: string } };
  createdAt: string;
}

export default function StudentHomeworkScreen() {
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'done'>('all');
  const isFetchingRef = useRef(false);

  const fetchHomeworks = useCallback(async (refresh = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    try {
      const res = await homeworkApi.getStudentHomeworks();
      setHomeworks(res.data.data || []);
    } catch {
      Alert.alert('Hata', 'Ödevler yüklenemedi.');
    } finally {
      isFetchingRef.current = false;
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchHomeworks(); }, [fetchHomeworks]));

  const handleOpenFile = async (hw: Homework) => {
    setOpeningId(hw.id);
    try {
      const ext = hw.fileType === 'PDF' ? 'pdf' : 'jpg';
      const localUri = FileSystem.cacheDirectory + `hw_${hw.id}.${ext}`;
      const info = await FileSystem.getInfoAsync(localUri);
      if (!info.exists) {
        await FileSystem.downloadAsync(hw.fileUrl, localUri);
      }
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(localUri, {
          mimeType: hw.fileType === 'PDF' ? 'application/pdf' : 'image/jpeg',
          dialogTitle: hw.title,
        });
      } else {
        await Linking.openURL(hw.fileUrl);
      }
    } catch {
      Alert.alert('Hata', 'Dosya açılamadı, lütfen tekrar deneyin.');
    } finally {
      setOpeningId(null);
    }
  };

  const now = new Date();
  const filtered = homeworks.filter((hw) => {
    if (filter === 'pending') return !hw.dueDate || new Date(hw.dueDate) >= now;
    if (filter === 'done') return hw.dueDate && new Date(hw.dueDate) < now;
    return true;
  });

  if (isLoading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Ödevlerim</Text>
          {homeworks.length > 0 && (
            <Text style={styles.headerSub}>{homeworks.length} ödev</Text>
          )}
        </View>
      </View>

      {/* Filtreler */}
      <View style={styles.filterRow}>
        {(['all', 'pending', 'done'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterBtnText, filter === f && styles.filterBtnTextActive]}>
              {f === 'all' ? `Tümü (${homeworks.length})` : f === 'pending' ? 'Bekleyen' : 'Geçmiş'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>
            {homeworks.length === 0 ? 'Henüz ödev yok' : 'Bu filtrede ödev yok'}
          </Text>
          <Text style={styles.emptySub}>
            {homeworks.length === 0
              ? 'Öğretmenin henüz ödev vermedi'
              : 'Farklı bir filtre deneyin'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          removeClippedSubviews={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => fetchHomeworks(true)}
              colors={[Colors.primary]}
            />
          }
          renderItem={({ item }) => {
            const isOpening = openingId === item.id;
            const dueDate = item.dueDate ? new Date(item.dueDate) : null;
            const isOverdue = dueDate ? dueDate < now : false;
            const teacherName = item.teacher?.teacher
              ? `${item.teacher.teacher.firstName} ${item.teacher.teacher.lastName}`
              : 'Öğretmen';

            return (
              <View style={styles.card}>
                {/* Üst alan */}
                <View style={styles.cardTop}>
                  <View style={[styles.fileIcon, item.fileType === 'PDF' ? styles.pdfBg : styles.imgBg]}>
                    <Text style={styles.fileIconText}>
                      {item.fileType === 'PDF' ? '📄' : '🖼️'}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    {item.description ? (
                      <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
                    ) : null}
                    <View style={styles.cardMeta}>
                      {item.classroom && (
                        <View style={styles.metaBadge}>
                          <Text style={styles.metaBadgeText}>🏫 {item.classroom.name}</Text>
                        </View>
                      )}
                      <View style={styles.metaBadge}>
                        <Text style={styles.metaBadgeText}>👨‍🏫 {teacherName}</Text>
                      </View>
                    </View>
                    {dueDate && (
                      <Text style={[styles.dueText, isOverdue && styles.dueOverdue]}>
                        {isOverdue ? '⚠️ Süresi geçti: ' : '📅 Son teslim: '}
                        {dueDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </Text>
                    )}
                  </View>
                </View>

                {/* Aç butonu */}
                <TouchableOpacity
                  style={[styles.openBtn, isOpening && { opacity: 0.6 }]}
                  onPress={() => handleOpenFile(item)}
                  disabled={isOpening}
                >
                  {isOpening ? (
                    <ActivityIndicator size="small" color={Colors.primary} />
                  ) : (
                    <Text style={styles.openBtnText}>
                      {item.fileType === 'PDF' ? '📄 PDF\'yi Aç' : '🖼️ Görseli Aç'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  headerSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  filterRow: {
    flexDirection: 'row', gap: 8, padding: 12,
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  filterBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 10,
    alignItems: 'center', borderWidth: 1.5, borderColor: Colors.border,
  },
  filterBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterBtnText: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary },
  filterBtnTextActive: { color: Colors.white },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyIcon: { fontSize: 52 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  emptySub: { fontSize: 13, color: Colors.textSecondary },
  list: { padding: 16, gap: 12, paddingBottom: 100 },
  card: {
    backgroundColor: Colors.white, borderRadius: 16, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    gap: 12,
  },
  cardTop: { flexDirection: 'row', gap: 12 },
  fileIcon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  pdfBg: { backgroundColor: '#fee2e2' },
  imgBg: { backgroundColor: '#dbeafe' },
  fileIconText: { fontSize: 24 },
  cardTitle: { fontSize: 15, fontWeight: '800', color: Colors.textPrimary, marginBottom: 3 },
  cardDesc: { fontSize: 12, color: Colors.textSecondary, marginBottom: 6, lineHeight: 17 },
  cardMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 4 },
  metaBadge: { backgroundColor: Colors.primaryLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  metaBadgeText: { fontSize: 11, color: Colors.primary, fontWeight: '600' },
  dueText: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600', marginTop: 2 },
  dueOverdue: { color: Colors.error },
  openBtn: {
    borderWidth: 1.5, borderColor: Colors.primary, borderRadius: 10,
    paddingVertical: 10, alignItems: 'center', backgroundColor: Colors.primaryLight,
  },
  openBtnText: { fontSize: 13, fontWeight: '700', color: Colors.primary },
});
