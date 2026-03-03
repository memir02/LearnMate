'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import { getPoolQuestions, startPracticeSession, getPracticeSessions } from '@/lib/api';

export default function PracticePage() {
  const router = useRouter();
  const { user } = useAppSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [checkingPool, setCheckingPool] = useState(false);
  const [availableQuestions, setAvailableQuestions] = useState<number | null>(null);
  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    subject: 'Matematik',
    topic: '',
    grade: user?.student?.grade || '4. Sınıf',
    questionCount: 10,
    difficulty: '',
  });

  useEffect(() => {
    loadRecentSessions();
  }, []);

  useEffect(() => {
    checkAvailableQuestions();
  }, [formData.subject, formData.topic, formData.grade, formData.difficulty]);

  const loadRecentSessions = async () => {
    try {
      const response = await getPracticeSessions({ limit: 5 });
      setRecentSessions(response.data.sessions || []);
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  const checkAvailableQuestions = async () => {
    setCheckingPool(true);
    try {
      const response = await getPoolQuestions({
        subject: formData.subject,
        topic: formData.topic || undefined,
        grade: formData.grade,
        difficulty: formData.difficulty || undefined,
      });
      setAvailableQuestions(response.data.totalQuestions);
    } catch (error) {
      console.error('Error checking pool:', error);
      setAvailableQuestions(0);
    } finally {
      setCheckingPool(false);
    }
  };

  const handleStart = async () => {
    if (!availableQuestions || availableQuestions < formData.questionCount) {
      alert(`Havuzda yeterli soru yok! Sadece ${availableQuestions} soru mevcut.`);
      return;
    }

    setLoading(true);
    try {
      const response = await startPracticeSession({
        subject: formData.subject,
        topic: formData.topic || undefined,
        grade: formData.grade,
        questionCount: formData.questionCount,
        difficulty: formData.difficulty || undefined,
      });

      // Session verilerini localStorage'a kaydet
      localStorage.setItem(`practice_session_${response.data.session.id}`, JSON.stringify(response.data));

      // Soru çözme sayfasına yönlendir
      router.push(`/student/practice/sessions/${response.data.session.id}/solve`);
    } catch (error: any) {
      console.error('Error starting session:', error);
      alert(error.response?.data?.message || 'Pratik oturumu başlatılırken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 text-gray-900 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 text-gray-900">Pratik Çalışma</h1>
        <p className="text-gray-700">
          Soru havuzundan istediğin kadar soru seçip pratik yapabilirsin!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sol: Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6 space-y-6">
            {/* 1. Ders Seç */}
            <div>
              <label className="block text-sm font-medium mb-2">
                1️⃣ Ders Seç
              </label>
              <div className="grid grid-cols-2 gap-3">
                {['Matematik', 'Türkçe', 'Fen Bilimleri', 'Sosyal Bilgiler'].map((subject) => (
                  <button
                    key={subject}
                    type="button"
                    onClick={() => setFormData({ ...formData, subject })}
                    className={`p-4 rounded-lg border-2 transition font-medium ${
                      formData.subject === subject
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {subject}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Konu (Opsiyonel) */}
            <div>
              <label className="block text-sm font-medium mb-2">
                2️⃣ Konu (İsteğe Bağlı)
              </label>
              <input
                type="text"
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Örn: Toplama İşlemi"
              />
              <p className="text-xs text-gray-500 mt-1">
                💡 Not: Boş bırakırsan tüm konulardan sorular gelir
              </p>
            </div>

            {/* 3. Sınıf */}
            <div>
              <label className="block text-sm font-medium mb-2">
                3️⃣ Sınıf Seviyesi
              </label>
              <select
                value={formData.grade}
                onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((grade) => (
                  <option key={grade} value={`${grade}. Sınıf`}>
                    {grade}. Sınıf
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Soru Sayısı */}
            <div>
              <label className="block text-sm font-medium mb-2">
                4️⃣ Kaç Soru Çözmek İstersin?
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="5"
                  value={formData.questionCount}
                  onChange={(e) => setFormData({ ...formData, questionCount: parseInt(e.target.value) })}
                  className="flex-1"
                />
                <div className="text-2xl font-bold text-blue-600 min-w-[60px] text-center">
                  {formData.questionCount}
                </div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>5 soru</span>
                <span>50 soru</span>
              </div>
            </div>

            {/* 5. Zorluk (Opsiyonel) */}
            <div>
              <label className="block text-sm font-medium mb-2">
                5️⃣ Zorluk Seviyesi (İsteğe Bağlı)
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { value: '', label: 'Karışık', color: 'gray' },
                  { value: 'EASY', label: 'Kolay', color: 'green' },
                  { value: 'MEDIUM', label: 'Orta', color: 'yellow' },
                  { value: 'HARD', label: 'Zor', color: 'red' },
                ].map((diff) => (
                  <button
                    key={diff.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, difficulty: diff.value })}
                    className={`p-3 rounded-lg border-2 transition text-sm font-medium ${
                      formData.difficulty === diff.value
                        ? `border-${diff.color}-500 bg-${diff.color}-50 text-${diff.color}-700`
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {diff.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Havuz Durumu */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-blue-900">Soru Havuzu</div>
                  <div className="text-sm text-blue-700 mt-1">
                    {checkingPool ? (
                      'Kontrol ediliyor...'
                    ) : availableQuestions !== null ? (
                      <>
                        <strong>{availableQuestions}</strong> soru mevcut
                        {availableQuestions < formData.questionCount && (
                          <span className="text-red-600 ml-2">⚠️ Yeterli değil!</span>
                        )}
                      </>
                    ) : (
                      'Bilgi yükleniyor...'
                    )}
                  </div>
                </div>
                {availableQuestions !== null && availableQuestions >= formData.questionCount && (
                  <div className="text-green-600 text-2xl">✓</div>
                )}
              </div>
            </div>

            {/* Başlat Butonu */}
            <button
              type="button"
              onClick={handleStart}
              disabled={loading || !availableQuestions || availableQuestions < formData.questionCount}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 rounded-lg font-bold text-lg hover:from-blue-600 hover:to-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {loading ? '🔄 Hazırlanıyor...' : 'Pratik Çalışmaya Başla'}
            </button>
          </div>
        </div>

        {/* Sağ: Son Çalışmalar */}
        <div>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              📊 Son Çalışmalarım
            </h2>

            {recentSessions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>Henüz pratik çalışma yapmadın.</p>
                <p className="text-sm mt-2">İlk çalışmanı başlat! 🎯</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentSessions.map((session) => (
                  <div
                    key={session.id}
                    className="border rounded-lg p-3 hover:shadow-md transition cursor-pointer"
                    onClick={() => router.push(`/student/practice/sessions/${session.id}/results`)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="font-medium text-sm">{session.subject}</div>
                      {session.status === 'COMPLETED' && session.score !== null && (
                        <div className={`text-sm font-bold ${
                          session.score >= 80 ? 'text-green-600' :
                          session.score >= 50 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          %{Math.round(session.score)}
                        </div>
                      )}
                    </div>
                    {session.topic && (
                      <div className="text-xs text-gray-600 mb-1">{session.topic}</div>
                    )}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{session.totalQuestions} soru</span>
                      {session.status === 'COMPLETED' && (
                        <span>{session.correctCount}/{session.totalQuestions} doğru</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {new Date(session.startedAt).toLocaleDateString('tr-TR')}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => router.push('/student/practice/stats')}
              className="w-full mt-4 text-blue-600 hover:text-blue-700 font-medium text-sm py-2 border border-blue-300 rounded-lg hover:bg-blue-50 transition"
            >
              Tüm İstatistiklerimi Gör →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

