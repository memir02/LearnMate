'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getMyTests, deleteTest, publishTest } from '@/lib/api';

export default function TeacherTestsPage() {
  const router = useRouter();
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    subject: '',
    topic: '',
  });

  useEffect(() => {
    loadTests();
  }, [filters]);

  const loadTests = async () => {
    try {
      const response = await getMyTests(filters);
      setTests(response.data.tests || []);
    } catch (error) {
      console.error('Error loading tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu testi silmek istediğinizden emin misiniz?')) return;

    try {
      await deleteTest(id);
      alert('Test silindi!');
      loadTests();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Silme başarısız.');
    }
  };

  const handlePublish = async (id: string, isPublished: boolean) => {
    try {
      await publishTest(id, !isPublished);
      alert(isPublished ? 'Test yayından kaldırıldı!' : 'Test yayınlandı!');
      loadTests();
    } catch (error: any) {
      alert(error.response?.data?.message || 'İşlem başarısız.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-900">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="p-6 text-gray-900">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Testlerim</h1>
        <button
          onClick={() => router.push('/teacher/tests/new')}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
        >
          + Yeni Test Oluştur
        </button>
      </div>

      {/* Filtreler */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">Ders</label>
            <select
              value={filters.subject}
              onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg text-gray-900"
            >
              <option value="">Tümü</option>
              <option value="Matematik">Matematik</option>
              <option value="Türkçe">Türkçe</option>
              <option value="Fen Bilimleri">Fen Bilimleri</option>
              <option value="Sosyal Bilgiler">Sosyal Bilgiler</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">Arama</label>
            <input
              type="text"
              value={filters.topic}
              onChange={(e) => setFilters({ ...filters, topic: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg text-gray-900"
              placeholder="Test başlığı, konu veya açıklama ile ara..."
            />
          </div>
        </div>
      </div>

      {/* Test Listesi */}
      {tests.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500 text-lg mb-4">Henüz test oluşturmadınız.</p>
          <button
            onClick={() => router.push('/teacher/tests/new')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            İlk Testinizi Oluşturun
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {tests.map((test) => (
            <div key={test.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold">{test.title}</h3>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        test.isPublished
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {test.isPublished ? 'Yayında' : 'Taslak'}
                    </span>
                  </div>
                  {test.description && (
                    <p className="text-gray-600 mb-3">{test.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {test.subject && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-sm rounded">
                        📚 {test.subject}
                      </span>
                    )}
                    {test.topic && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-sm rounded">
                        📖 {test.topic}
                      </span>
                    )}
                    {test.grade && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 text-sm rounded">
                        🎓 {test.grade}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Test İstatistikleri */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{test.questionCount}</div>
                  <div className="text-sm text-gray-600">Soru</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{test.totalPoints}</div>
                  <div className="text-sm text-gray-600">Puan</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">{test.studentCount || 0}</div>
                  <div className="text-sm text-gray-600">Öğrenci</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">{test.completedCount || 0}</div>
                  <div className="text-sm text-gray-600">Tamamlanan</div>
                </div>
              </div>

              {/* Test Bilgileri */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4 text-sm">
                {test.classroom && (
                  <div>
                    <span className="text-gray-500">Sınıf:</span>
                    <div className="font-medium">{test.classroom.name}</div>
                  </div>
                )}
                {test.durationMinutes && (
                  <div>
                    <span className="text-gray-500">Süre:</span>
                    <div className="font-medium">{test.durationMinutes} dakika</div>
                  </div>
                )}
                {test.passingScore && (
                  <div>
                    <span className="text-gray-500">Geçme Notu:</span>
                    <div className="font-medium">%{test.passingScore}</div>
                  </div>
                )}
              </div>

              {/* Tarihler */}
              {(test.startDate || test.endDate) && (
                <div className="flex gap-4 text-sm text-gray-600 mb-4">
                  {test.startDate && (
                    <div>
                      <span className="font-medium">Başlangıç:</span>{' '}
                      {new Date(test.startDate).toLocaleDateString('tr-TR')}
                    </div>
                  )}
                  {test.endDate && (
                    <div>
                      <span className="font-medium">Bitiş:</span>{' '}
                      {new Date(test.endDate).toLocaleDateString('tr-TR')}
                    </div>
                  )}
                </div>
              )}

              {/* Aksiyon Butonları */}
              <div className="flex gap-2 pt-4 border-t">
                <button
                  onClick={() => router.push(`/teacher/tests/${test.id}`)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Detaylar
                </button>
                <button
                  onClick={() => handlePublish(test.id, test.isPublished)}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                    test.isPublished
                      ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {test.isPublished ? 'Yayından Kaldır' : 'Yayınla'}
                </button>
                <button
                  onClick={() => handleDelete(test.id)}
                  className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                >
                  Sil
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}




