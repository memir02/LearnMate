'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getMyAssignedTests } from '@/lib/api';

export default function StudentTestsPage() {
  const router = useRouter();
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    loadTests();
  }, [filter]);

  const loadTests = async () => {
    try {
      const params = filter !== 'ALL' ? { status: filter } : {};
      const response = await getMyAssignedTests(params);
      setTests(response.data.tests || []);
    } catch (error) {
      console.error('Error loading tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      ASSIGNED: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Atandı' },
      STARTED: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Devam Ediyor' },
      SUBMITTED: { bg: 'bg-green-100', text: 'text-green-700', label: 'Tamamlandı' },
      GRADED: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Puanlandı' },
    };
    const badge = badges[status as keyof typeof badges] || badges.ASSIGNED;
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="p-6 text-gray-900">
      <h1 className="text-3xl font-bold mb-6">Testlerim</h1>

      {/* Filtreler */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex gap-2 overflow-x-auto">
          {['ALL', 'ASSIGNED', 'STARTED', 'SUBMITTED'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status === 'ALL' ? 'Tümü' :
               status === 'ASSIGNED' ? 'Bekleyenler' :
               status === 'STARTED' ? 'Devam Edenler' :
               'Tamamlananlar'}
            </button>
          ))}
        </div>
      </div>

      {/* Test Listesi */}
      {tests.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500 text-lg">Henüz size atanmış test yok.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {tests.map((item) => (
            <div key={item.studentTestId} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold">{item.test.title}</h3>
                    {getStatusBadge(item.status)}
                  </div>
                  {item.test.description && (
                    <p className="text-gray-600 mb-3">{item.test.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {item.test.subject && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-sm rounded">
                        📚 {item.test.subject}
                      </span>
                    )}
                    {item.test.topic && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-sm rounded">
                        📖 {item.test.topic}
                      </span>
                    )}
                    {item.test.grade && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 text-sm rounded">
                        🎓 {item.test.grade}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Test Bilgileri */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                <div>
                  <span className="text-gray-500">Soru Sayısı:</span>
                  <div className="font-medium">{item.test.questionCount}</div>
                </div>
                <div>
                  <span className="text-gray-500">Süre:</span>
                  <div className="font-medium">{item.test.durationMinutes} dakika</div>
                </div>
                <div>
                  <span className="text-gray-500">Toplam Puan:</span>
                  <div className="font-medium">{item.test.totalPoints}</div>
                </div>
                <div>
                  <span className="text-gray-500">Geçme Notu:</span>
                  <div className="font-medium">%{item.test.passingScore}</div>
                </div>
              </div>

              {/* Öğretmen */}
              <div className="text-sm text-gray-600 mb-4">
                <span className="font-medium">Öğretmen:</span>{' '}
                {item.test.teacher.firstName} {item.test.teacher.lastName}
              </div>

              {/* Sonuç (Tamamlandıysa) */}
              {item.status === 'SUBMITTED' || item.status === 'GRADED' ? (
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{item.score}</div>
                      <div className="text-sm text-gray-600">Puan</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">{item.percentage?.toFixed(1)}%</div>
                      <div className="text-sm text-gray-600">Başarı</div>
                    </div>
                    <div>
                      <div className={`text-2xl font-bold ${item.isPassed ? 'text-green-600' : 'text-red-600'}`}>
                        {item.isPassed ? '✓' : '✗'}
                      </div>
                      <div className="text-sm text-gray-600">
                        {item.isPassed ? 'Geçti' : 'Kaldı'}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Aksiyon Butonları */}
              <div className="flex gap-3">
                {item.status === 'ASSIGNED' && (
                  <button
                    onClick={() => router.push(`/student/tests/${item.test.id}/take`)}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition"
                  >
                    Teste Başla
                  </button>
                )}
                {item.status === 'STARTED' && (
                  <button
                    onClick={() => router.push(`/student/tests/${item.test.id}/take`)}
                    className="flex-1 bg-yellow-600 text-white py-3 rounded-lg font-medium hover:bg-yellow-700 transition"
                  >
                    Teste Devam Et
                  </button>
                )}
                {(item.status === 'SUBMITTED' || item.status === 'GRADED') && (
                  <button
                    onClick={() => router.push(`/student/tests/${item.studentTestId}/results`)}
                    className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition"
                  >
                    Sonuçları Gör
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

