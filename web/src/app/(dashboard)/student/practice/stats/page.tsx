'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getPracticeStats } from '@/lib/api';

export default function PracticeStatsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [selectedSubject, setSelectedSubject] = useState<string>('');

  useEffect(() => {
    loadStats();
  }, [selectedSubject]);

  const loadStats = async () => {
    try {
      const response = await getPracticeStats(selectedSubject || undefined);
      setStats(response.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-xl text-gray-900">Yükleniyor...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6 text-center bg-gray-50 min-h-screen">
        <p className="text-gray-900 text-lg">İstatistikler yüklenemedi.</p>
      </div>
    );
  }

  const { overview, subjectStats, recentSessions } = stats;

  return (
    <div className="p-6 text-gray-900 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Pratik Çalışma İstatistiklerim</h1>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6 shadow">
          <div className="text-3xl font-bold mb-2">{overview.totalSessions}</div>
          <div className="text-sm opacity-90">Toplam Çalışma</div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-6 shadow">
          <div className="text-3xl font-bold mb-2">{overview.totalQuestions}</div>
          <div className="text-sm opacity-90">Çözülen Soru</div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-6 shadow">
          <div className="text-3xl font-bold mb-2">{overview.totalCorrect}</div>
          <div className="text-sm opacity-90">Doğru Cevap</div>
        </div>
        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white rounded-lg p-6 shadow">
          <div className="text-3xl font-bold mb-2">%{overview.avgScore}</div>
          <div className="text-sm opacity-90">Ortalama Başarı</div>
        </div>
      </div>

      {/* Ders Bazlı */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-bold mb-4 text-gray-900">📚 Ders Bazlı Performans</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(subjectStats).map(([subject, data]: [string, any]) => (
            <div key={subject} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="font-medium text-lg">{subject}</div>
                <div className={`text-xl font-bold ${
                  data.avgScore >= 80 ? 'text-green-600' :
                  data.avgScore >= 50 ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  %{Math.round(data.avgScore)}
                </div>
              </div>
              <div className="text-sm text-gray-700 space-y-1 font-medium">
                <div>{data.count} çalışma</div>
                <div>{data.correctAnswers}/{data.totalQuestions} doğru</div>
              </div>

              {/* Konu Bazlı */}
              {data.topicStats && Object.keys(data.topicStats).length > 0 && (
                <div className="mt-3 pt-3 border-t space-y-2">
                  {Object.entries(data.topicStats).map(([topic, topicData]: [string, any]) => (
                    <div key={topic} className="flex items-center justify-between text-xs">
                      <span className="text-gray-700 font-medium">{topic}</span>
                      <span className={`font-bold ${
                        topicData.avgScore >= 80 ? 'text-green-600' :
                        topicData.avgScore >= 50 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        %{Math.round(topicData.avgScore)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Son Çalışmalar */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-900">🕐 Son Çalışmalar</h2>
        <div className="space-y-3">
          {recentSessions.map((session: any) => (
            <div
              key={session.id}
              className="border rounded-lg p-4 hover:shadow-md transition cursor-pointer"
              onClick={() => router.push(`/student/practice/sessions/${session.id}/results`)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium">{session.subject}</div>
                <div className={`font-bold ${
                  session.score >= 80 ? 'text-green-600' :
                  session.score >= 50 ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  %{Math.round(session.score)}
                </div>
              </div>
              {session.topic && (
                <div className="text-sm text-gray-700 mb-2 font-medium">{session.topic}</div>
              )}
              <div className="flex items-center justify-between text-sm text-gray-700">
                <span>{session.totalQuestions} soru</span>
                <span>{session.correctCount} doğru</span>
                <span>{new Date(session.completedAt).toLocaleDateString('tr-TR')}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-8 flex justify-center">
        <button
          onClick={() => router.push('/student/practice')}
          className="bg-blue-600 text-white px-8 py-4 rounded-lg font-medium hover:bg-blue-700 transition"
        >
         Yeni Pratik Çalışma Başlat
        </button>
      </div>
    </div>
  );
}

