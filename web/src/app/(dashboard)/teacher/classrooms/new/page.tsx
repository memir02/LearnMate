'use client';

import { useState } from 'react';
import { createClassroom } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewClassroom() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    subject: '',
    grade: '',
    inviteOnly: false,
    autoApprove: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Classroom adı gereklidir');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const response = await createClassroom({
        name: formData.name,
        description: formData.description || undefined,
        subject: formData.subject || undefined,
        grade: formData.grade || undefined,
        inviteOnly: formData.inviteOnly,
        autoApprove: formData.autoApprove
      });

      // Başarılı - classroom detay sayfasına yönlendir
      router.push(`/teacher/classrooms/${response.data.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Classroom oluşturulamadı');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/teacher/classrooms"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Classroom'lara Dön
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Yeni Classroom Oluştur</h1>
          <p className="text-gray-600 mt-2">
            Öğrencileriniz için yeni bir classroom oluşturun
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Classroom Adı */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Classroom Adı *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                placeholder="örn: 4. Sınıf Matematik"
                required
              />
            </div>

            {/* Açıklama */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Açıklama
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                placeholder="Classroom hakkında kısa bir açıklama..."
              />
            </div>

            {/* Ders ve Sınıf */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                  Ders
                </label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                >
                  <option value="">Seçiniz</option>
                  <option value="Matematik">Matematik</option>
                  <option value="Türkçe">Türkçe</option>
                  <option value="Fen Bilimleri">Fen Bilimleri</option>
                  <option value="Sosyal Bilgiler">Sosyal Bilgiler</option>
                  <option value="İngilizce">İngilizce</option>
                  <option value="Diğer">Diğer</option>
                </select>
              </div>

              <div>
                <label htmlFor="grade" className="block text-sm font-medium text-gray-700 mb-2">
                  Sınıf Seviyesi
                </label>
                <select
                  id="grade"
                  name="grade"
                  value={formData.grade}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                >
                  <option value="">Seçiniz</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(grade => (
                    <option key={grade} value={grade}>{grade}. Sınıf</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Ayarlar */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Katılım Ayarları
              </h3>
              
              <div className="space-y-4">
                {/* Invite Only */}
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      type="checkbox"
                      id="inviteOnly"
                      name="inviteOnly"
                      checked={formData.inviteOnly}
                      onChange={handleChange}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </div>
                  <div className="ml-3">
                    <label htmlFor="inviteOnly" className="font-medium text-gray-700">
                      Sadece Davet ile Katılım
                    </label>
                    <p className="text-sm text-gray-600">
                      Öğrenciler kodla katılım isteği gönderemez, sadece direkt davet ile katılabilir
                    </p>
                  </div>
                </div>

                {/* Auto Approve */}
                {!formData.inviteOnly && (
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        type="checkbox"
                        id="autoApprove"
                        name="autoApprove"
                        checked={formData.autoApprove}
                        onChange={handleChange}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </div>
                    <div className="ml-3">
                      <label htmlFor="autoApprove" className="font-medium text-gray-700">
                        Otomatik Onay
                      </label>
                      <p className="text-sm text-gray-600">
                        Kodla katılım istekleri otomatik olarak onaylanır
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-6 border-t">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
              >
                {loading ? 'Oluşturuluyor...' : 'Classroom Oluştur'}
              </button>
              <Link
                href="/teacher/classrooms"
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                İptal
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

