'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import { getUserById, updateUser } from '@/lib/api';
import Link from 'next/link';

interface User {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  student?: {
    id: string;
    firstName: string;
    lastName: string;
    grade?: string;
    phone?: string;
    parentPhone?: string;
  };
  teacher?: {
    id: string;
    firstName: string;
    lastName: string;
    subject?: string;
    phone?: string;
    bio?: string;
    experience?: number;
    title?: string;
  };
}

export default function EditUser() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  const { user: currentUser } = useAppSelector((state) => state.auth);

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form data
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  
  // Student specific
  const [grade, setGrade] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  
  // Teacher specific
  const [subject, setSubject] = useState('');
  const [bio, setBio] = useState('');
  const [experience, setExperience] = useState('');
  const [title, setTitle] = useState('');

  useEffect(() => {
    if (currentUser && currentUser.role !== 'ADMIN') {
      router.push(`/${currentUser.role.toLowerCase()}`);
      return;
    }
    fetchUser();
  }, [currentUser, router, userId]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getUserById(userId);
      const userData = response.data;
      setUser(userData);
      
      // Set form data
      setEmail(userData.email);
      setRole(userData.role);
      setIsActive(userData.isActive);
      
      if (userData.student) {
        setFirstName(userData.student.firstName);
        setLastName(userData.student.lastName);
        setPhone(userData.student.phone || '');
        setGrade(userData.student.grade || '');
        setParentPhone(userData.student.parentPhone || '');
      }
      
      if (userData.teacher) {
        setFirstName(userData.teacher.firstName);
        setLastName(userData.teacher.lastName);
        setPhone(userData.teacher.phone || '');
        setSubject(userData.teacher.subject || '');
        setBio(userData.teacher.bio || '');
        setExperience(userData.teacher.experience?.toString() || '');
        setTitle(userData.teacher.title || '');
      }
    } catch (err: any) {
      console.error('Error fetching user:', err);
      setError(err.response?.data?.message || 'Kullanıcı yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firstName || !lastName || !email) {
      setError('Ad, soyad ve email zorunludur.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      
      const updateData: any = {
        email,
        role,
        isActive,
        firstName,
        lastName,
        phone: phone || null,
      };

      if (role === 'STUDENT') {
        updateData.grade = grade || null;
        updateData.parentPhone = parentPhone || null;
      }

      if (role === 'TEACHER') {
        updateData.subject = subject || null;
        updateData.bio = bio || null;
        updateData.experience = experience ? parseInt(experience) : null;
        updateData.title = title || null;
      }

      await updateUser(userId, updateData);
      setSuccess('Kullanıcı başarıyla güncellendi!');
      
      setTimeout(() => {
        router.push('/admin/users');
      }, 1500);
    } catch (err: any) {
      console.error('Error updating user:', err);
      setError(err.response?.data?.message || 'Kullanıcı güncellenirken bir hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Kullanıcı bulunamadı.</p>
          <Link href="/admin/users" className="text-blue-600 hover:text-blue-700 mt-4 inline-block">
            Kullanıcı Listesine Dön
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/users"
            className="text-blue-600 hover:text-blue-700 mb-2 inline-flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Kullanıcı Listesine Dön
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            Kullanıcı Düzenle
          </h1>
          <p className="text-gray-600 mt-2">
            Kullanıcı bilgilerini güncelleyin
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
          {/* Basic Info */}
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Temel Bilgiler</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ad *
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Soyad *
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefon
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rol *
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                >
                  <option value="STUDENT">Öğrenci</option>
                  <option value="TEACHER">Öğretmen</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              <div className="flex items-center">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">
                    Aktif Kullanıcı
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Student Specific Fields */}
          {role === 'STUDENT' && (
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Öğrenci Bilgileri</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sınıf
                  </label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                  >
                    <option value="">Seçiniz</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((g) => (
                      <option key={g} value={g}>{g}. Sınıf</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Veli Telefonu
                  </label>
                  <input
                    type="tel"
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Teacher Specific Fields */}
          {role === 'TEACHER' && (
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Öğretmen Bilgileri</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Branş
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Matematik, Fen, vb."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unvan
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Öğretmen, Uzman Öğretmen, vb."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Deneyim (Yıl)
                  </label>
                  <input
                    type="number"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Biyografi
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                    placeholder="Kısa tanıtım..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-400"
                  />
                </div>
              </div>
            </div>
          )}

          {/* User Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Kullanıcı Bilgileri</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Kullanıcı ID:</span>
                <p className="text-gray-900 font-mono">{user.id}</p>
              </div>
              <div>
                <span className="text-gray-500">Kayıt Tarihi:</span>
                <p className="text-gray-900">
                  {new Date(user.createdAt).toLocaleString('tr-TR')}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6">
            <Link
              href="/admin/users"
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              İptal
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Kaydediliyor...
                </>
              ) : (
                'Kaydet'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

