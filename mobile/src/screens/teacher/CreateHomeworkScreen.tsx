import { useEffect, useState } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, ScrollView,
  TextInput, ActivityIndicator, Alert, Image, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { homeworkApi, classroomApi } from '../../lib/api';
import { Colors } from '../../constants/colors';
import { HomeworkStackParamList } from './HomeworkScreen';

interface Classroom {
  id: string;
  name: string;
}

interface SelectedFile {
  uri: string;
  name: string;
  mimeType: string;
  type: 'IMAGE' | 'PDF';
}

export default function CreateHomeworkScreen({
  navigation,
}: {
  navigation: NativeStackNavigationProp<HomeworkStackParamList, 'CreateHomework'>;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedClassroomId, setSelectedClassroomId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [classroomsLoading, setClassroomsLoading] = useState(true);

  useEffect(() => {
    const loadClassrooms = async () => {
      try {
        const res = await classroomApi.getAll();
        setClassrooms(res.data.data || []);
      } catch {
        Alert.alert('Hata', 'Sınıflar yüklenemedi.');
      } finally {
        setClassroomsLoading(false);
      }
    };
    loadClassrooms();
  }, []);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Fotoğraf galerisine erişim izni gereklidir.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const name = asset.fileName ?? `photo_${Date.now()}.jpg`;
      const mimeType = asset.mimeType ?? 'image/jpeg';
      setSelectedFile({ uri: asset.uri, name, mimeType, type: 'IMAGE' });
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Kamera erişim izni gereklidir.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const name = asset.fileName ?? `camera_${Date.now()}.jpg`;
      const mimeType = asset.mimeType ?? 'image/jpeg';
      setSelectedFile({ uri: asset.uri, name, mimeType, type: 'IMAGE' });
    }
  };

  const pickPdf = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setSelectedFile({
          uri: asset.uri,
          name: asset.name,
          mimeType: 'application/pdf',
          type: 'PDF',
        });
      }
    } catch {
      Alert.alert('Hata', 'PDF seçilemedi.');
    }
  };

  const showFilePicker = () => {
    Alert.alert('Dosya Seç', 'Yüklemek istediğiniz dosya türünü seçin:', [
      { text: '📷 Kameradan Çek', onPress: takePhoto },
      { text: '🖼️ Galeriden Seç', onPress: pickImage },
      { text: '📕 PDF Seç', onPress: pickPdf },
      { text: 'İptal', style: 'cancel' },
    ]);
  };

  const isValidDate = (str: string) => {
    if (!str) return true;
    const parts = str.split('.');
    if (parts.length !== 3) return false;
    const d = parseInt(parts[0]), m = parseInt(parts[1]), y = parseInt(parts[2]);
    if (isNaN(d) || isNaN(m) || isNaN(y)) return false;
    const date = new Date(y, m - 1, d);
    return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
  };

  const handleCreate = async () => {
    if (!title.trim()) { Alert.alert('Uyarı', 'Ödev başlığı giriniz.'); return; }
    if (!selectedClassroomId) { Alert.alert('Uyarı', 'Lütfen bir sınıf seçin.'); return; }
    if (!selectedFile) { Alert.alert('Uyarı', 'Lütfen bir dosya seçin (PDF veya fotoğraf).'); return; }
    if (dueDate && !isValidDate(dueDate)) { Alert.alert('Uyarı', 'Geçerli bir tarih giriniz (GG.AA.YYYY)'); return; }

    let parsedDueDate: string | undefined;
    if (dueDate) {
      const [d, m, y] = dueDate.split('.');
      parsedDueDate = new Date(parseInt(y), parseInt(m) - 1, parseInt(d)).toISOString();
    }

    setIsLoading(true);
    try {
      await homeworkApi.create({
        title: title.trim(),
        description: description.trim() || undefined,
        classroomId: selectedClassroomId,
        dueDate: parsedDueDate,
        fileUri: selectedFile.uri,
        fileName: selectedFile.name,
        fileMimeType: selectedFile.mimeType,
      });
      Alert.alert('Başarılı', 'Ödev oluşturuldu!', [
        { text: 'Tamam', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Ödev oluşturulamadı.';
      Alert.alert('Hata', msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Geri</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Yeni Ödev</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Başlık */}
        <View style={styles.field}>
          <Text style={styles.label}>Başlık <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="Ödev başlığını girin..."
            placeholderTextColor={Colors.textMuted}
            value={title}
            onChangeText={setTitle}
          />
        </View>

        {/* Açıklama */}
        <View style={styles.field}>
          <Text style={styles.label}>Açıklama</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Ödev hakkında kısa bilgi (opsiyonel)..."
            placeholderTextColor={Colors.textMuted}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Sınıf Seçimi */}
        <View style={styles.field}>
          <Text style={styles.label}>Sınıf <Text style={styles.required}>*</Text></Text>
          {classroomsLoading ? (
            <ActivityIndicator color={Colors.primary} />
          ) : classrooms.length === 0 ? (
            <Text style={styles.emptyText}>Henüz sınıf oluşturmadınız.</Text>
          ) : (
            <View style={styles.chips}>
              {classrooms.map((c) => {
                const isSelected = selectedClassroomId === c.id;
                return (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.chip, isSelected && styles.chipSelected]}
                    onPress={() => setSelectedClassroomId(c.id)}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                      🏫 {c.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Son Teslim Tarihi */}
        <View style={styles.field}>
          <Text style={styles.label}>Son Teslim Tarihi</Text>
          <TextInput
            style={styles.input}
            placeholder="GG.AA.YYYY (opsiyonel)"
            placeholderTextColor={Colors.textMuted}
            value={dueDate}
            onChangeText={setDueDate}
            keyboardType="numeric"
            maxLength={10}
          />
        </View>

        {/* Dosya Seçimi */}
        <View style={styles.field}>
          <Text style={styles.label}>Dosya <Text style={styles.required}>*</Text></Text>

          {selectedFile ? (
            <View style={styles.filePreview}>
              {selectedFile.type === 'IMAGE' ? (
                <Image source={{ uri: selectedFile.uri }} style={styles.previewImage} resizeMode="cover" />
              ) : (
                <View style={styles.pdfPreview}>
                  <Text style={styles.pdfPreviewIcon}>📕</Text>
                  <Text style={styles.pdfPreviewName} numberOfLines={1}>{selectedFile.name}</Text>
                </View>
              )}
              <View style={styles.previewOverlay}>
                <TouchableOpacity style={styles.changeFileBtn} onPress={showFilePicker}>
                  <Text style={styles.changeFileBtnText}>Değiştir</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.removeFileBtn} onPress={() => setSelectedFile(null)}>
                  <Text style={styles.removeFileBtnText}>Kaldır</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity style={styles.filePickerBtn} onPress={showFilePicker}>
              <Text style={styles.filePickerIcon}>📎</Text>
              <Text style={styles.filePickerTitle}>Dosya Seç</Text>
              <Text style={styles.filePickerSub}>PDF, JPG veya PNG (max 10MB)</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Oluştur Butonu */}
        <TouchableOpacity
          style={[styles.createBtn, isLoading && styles.createBtnDisabled]}
          onPress={handleCreate}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.createBtnText}>📤 Ödevi Yükle</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
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
  backBtn: { padding: 4 },
  backText: { fontSize: 15, color: Colors.primary, fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  field: { gap: 8 },
  label: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  required: { color: Colors.error },
  input: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14,
    color: Colors.textPrimary, backgroundColor: Colors.white,
  },
  textarea: { minHeight: 90 },
  emptyText: { fontSize: 13, color: Colors.textSecondary },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.white,
  },
  chipSelected: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  chipText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  chipTextSelected: { color: Colors.primary },
  filePickerBtn: {
    borderWidth: 2, borderColor: Colors.border, borderRadius: 16,
    borderStyle: 'dashed', paddingVertical: 32,
    alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.white,
  },
  filePickerIcon: { fontSize: 36 },
  filePickerTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  filePickerSub: { fontSize: 12, color: Colors.textSecondary },
  filePreview: {
    borderRadius: 16, overflow: 'hidden',
    borderWidth: 1.5, borderColor: Colors.border,
  },
  previewImage: { width: '100%', height: 200 },
  pdfPreview: {
    backgroundColor: '#fee2e2', padding: 24,
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  pdfPreviewIcon: { fontSize: 48 },
  pdfPreviewName: { fontSize: 14, fontWeight: '700', color: '#dc2626', textAlign: 'center' },
  previewOverlay: {
    flexDirection: 'row', padding: 12, gap: 8,
    backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  changeFileBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 8,
    alignItems: 'center', backgroundColor: Colors.primaryLight,
  },
  changeFileBtnText: { fontSize: 13, color: Colors.primary, fontWeight: '700' },
  removeFileBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 8,
    alignItems: 'center', backgroundColor: '#fef2f2',
  },
  removeFileBtnText: { fontSize: 13, color: Colors.error, fontWeight: '700' },
  createBtn: {
    backgroundColor: Colors.primary, paddingVertical: 16,
    borderRadius: 14, alignItems: 'center', marginTop: 8,
  },
  createBtnDisabled: { opacity: 0.6 },
  createBtnText: { color: Colors.white, fontSize: 16, fontWeight: '800' },
});
