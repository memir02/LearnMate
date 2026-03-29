import { useState } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, ScrollView,
  TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { userApi } from '../../lib/api';
import { Colors } from '../../constants/colors';

type Tab = 'info' | 'password';

export default function TeacherProfileScreen() {
  const { user, logout, setUser } = useAuth();

  const [activeTab, setActiveTab] = useState<Tab>('info');

  // Bilgi düzenleme
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState(user?.teacher?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.teacher?.lastName ?? '');
  const [phone, setPhone] = useState(user?.teacher?.phone ?? '');
  const [isSaving, setIsSaving] = useState(false);

  // Şifre değiştirme
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isChangingPw, setIsChangingPw] = useState(false);

  const handleSaveProfile = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Uyarı', 'Ad ve soyad boş bırakılamaz.');
      return;
    }
    setIsSaving(true);
    try {
      const res = await userApi.updateMyProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim() || undefined,
      });
      if (setUser) setUser(res.data.data);
      setIsEditing(false);
      Alert.alert('Başarılı', 'Profil güncellendi.');
    } catch (err: any) {
      Alert.alert('Hata', err?.response?.data?.message ?? 'Profil güncellenemedi.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setFirstName(user?.teacher?.firstName ?? '');
    setLastName(user?.teacher?.lastName ?? '');
    setPhone(user?.teacher?.phone ?? '');
    setIsEditing(false);
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Uyarı', 'Tüm alanları doldurun.'); return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Uyarı', 'Yeni şifreler eşleşmiyor.'); return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Uyarı', 'Yeni şifre en az 6 karakter olmalıdır.'); return;
    }
    setIsChangingPw(true);
    try {
      await userApi.changeMyPassword({ currentPassword, newPassword });
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      Alert.alert('Başarılı', 'Şifreniz değiştirildi.');
    } catch (err: any) {
      Alert.alert('Hata', err?.response?.data?.message ?? 'Şifre değiştirilemedi.');
    } finally {
      setIsChangingPw(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Çıkış Yap', 'Çıkış yapmak istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Çıkış Yap', style: 'destructive', onPress: logout },
    ]);
  };

  const initials = `${user?.teacher?.firstName?.[0] ?? ''}${user?.teacher?.lastName?.[0] ?? ''}`.toUpperCase();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.initials}>{initials || '👨‍🏫'}</Text>
          </View>
          <Text style={styles.fullName}>
            {user?.teacher?.firstName} {user?.teacher?.lastName}
          </Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>👨‍🏫 Öğretmen</Text>
          </View>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'info' && styles.tabActive]}
            onPress={() => setActiveTab('info')}
          >
            <Text style={[styles.tabText, activeTab === 'info' && styles.tabTextActive]}>
              Bilgilerim
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'password' && styles.tabActive]}
            onPress={() => setActiveTab('password')}
          >
            <Text style={[styles.tabText, activeTab === 'password' && styles.tabTextActive]}>
              Şifre Değiştir
            </Text>
          </TouchableOpacity>
        </View>

        {/* Bilgilerim */}
        {activeTab === 'info' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Kişisel Bilgiler</Text>
              {!isEditing ? (
                <TouchableOpacity style={styles.editBtn} onPress={() => setIsEditing(true)}>
                  <Text style={styles.editBtnText}>✏️ Düzenle</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={handleCancelEdit}>
                  <Text style={styles.cancelText}>İptal</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.fieldGroup}>
              <View style={styles.fieldRow}>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Ad</Text>
                  {isEditing ? (
                    <TextInput
                      style={styles.input}
                      value={firstName}
                      onChangeText={setFirstName}
                      placeholder="Ad"
                      placeholderTextColor={Colors.textMuted}
                    />
                  ) : (
                    <Text style={styles.fieldValue}>{user?.teacher?.firstName}</Text>
                  )}
                </View>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Soyad</Text>
                  {isEditing ? (
                    <TextInput
                      style={styles.input}
                      value={lastName}
                      onChangeText={setLastName}
                      placeholder="Soyad"
                      placeholderTextColor={Colors.textMuted}
                    />
                  ) : (
                    <Text style={styles.fieldValue}>{user?.teacher?.lastName}</Text>
                  )}
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Telefon</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.input}
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="Telefon numarası (opsiyonel)"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="phone-pad"
                  />
                ) : (
                  <Text style={styles.fieldValue}>
                    {user?.teacher?.phone || 'Belirtilmemiş'}
                  </Text>
                )}
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>E-posta</Text>
                <Text style={[styles.fieldValue, styles.fieldValueMuted]}>{user?.email}</Text>
              </View>
            </View>

            {isEditing && (
              <TouchableOpacity
                style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
                onPress={handleSaveProfile}
                disabled={isSaving}
              >
                {isSaving
                  ? <ActivityIndicator color={Colors.white} />
                  : <Text style={styles.saveBtnText}>💾 Kaydet</Text>
                }
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Şifre Değiştir */}
        {activeTab === 'password' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Şifre Değiştir</Text>

            <View style={styles.fieldGroup}>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Mevcut Şifre</Text>
                <View style={styles.pwRow}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    placeholder="Mevcut şifreniz"
                    placeholderTextColor={Colors.textMuted}
                    secureTextEntry={!showCurrent}
                  />
                  <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowCurrent(!showCurrent)}>
                    <Text style={styles.eyeIcon}>{showCurrent ? '🙈' : '👁️'}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Yeni Şifre</Text>
                <View style={styles.pwRow}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="En az 6 karakter"
                    placeholderTextColor={Colors.textMuted}
                    secureTextEntry={!showNew}
                  />
                  <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowNew(!showNew)}>
                    <Text style={styles.eyeIcon}>{showNew ? '🙈' : '👁️'}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Yeni Şifre (Tekrar)</Text>
                <View style={styles.pwRow}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Şifreyi tekrar girin"
                    placeholderTextColor={Colors.textMuted}
                    secureTextEntry={!showConfirm}
                  />
                  <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowConfirm(!showConfirm)}>
                    <Text style={styles.eyeIcon}>{showConfirm ? '🙈' : '👁️'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, isChangingPw && styles.saveBtnDisabled]}
              onPress={handleChangePassword}
              disabled={isChangingPw}
            >
              {isChangingPw
                ? <ActivityIndicator color={Colors.white} />
                : <Text style={styles.saveBtnText}>🔒 Şifreyi Değiştir</Text>
              }
            </TouchableOpacity>
          </View>
        )}

        {/* Çıkış */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>🚪 Çıkış Yap</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, gap: 20, paddingBottom: 40 },
  avatarSection: { alignItems: 'center', paddingVertical: 20, gap: 6 },
  avatar: {
    width: 84, height: 84, borderRadius: 42,
    backgroundColor: Colors.primaryLight, borderWidth: 3, borderColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  initials: { fontSize: 32, fontWeight: '800', color: Colors.primary },
  fullName: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  roleBadge: {
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20,
    backgroundColor: Colors.primaryLight,
  },
  roleText: { fontSize: 12, color: Colors.primary, fontWeight: '700' },
  email: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  tabs: {
    flexDirection: 'row', backgroundColor: Colors.white,
    borderRadius: 12, padding: 4, borderWidth: 1, borderColor: Colors.border,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: Colors.primaryLight },
  tabText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  tabTextActive: { color: Colors.primary },
  section: {
    backgroundColor: Colors.white, borderRadius: 16, padding: 16, gap: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  editBtn: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
    backgroundColor: Colors.primaryLight,
  },
  editBtnText: { fontSize: 13, color: Colors.primary, fontWeight: '700' },
  cancelText: { fontSize: 13, color: Colors.error, fontWeight: '600' },
  fieldGroup: { gap: 12 },
  fieldRow: { flexDirection: 'row', gap: 10 },
  field: { gap: 6 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase' },
  fieldValue: { fontSize: 15, color: Colors.textPrimary, fontWeight: '500', paddingVertical: 4 },
  fieldValueMuted: { color: Colors.textSecondary },
  input: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14,
    color: Colors.textPrimary, backgroundColor: Colors.background,
  },
  pwRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyeBtn: { padding: 8 },
  eyeIcon: { fontSize: 18 },
  saveBtn: {
    backgroundColor: Colors.primary, paddingVertical: 14,
    borderRadius: 12, alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: Colors.white, fontSize: 15, fontWeight: '800' },
  logoutBtn: {
    paddingVertical: 14, borderRadius: 12, alignItems: 'center',
    borderWidth: 1.5, borderColor: '#fecaca', backgroundColor: '#fef2f2',
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: Colors.error },
});
