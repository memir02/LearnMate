'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getPracticeSession } from '@/lib/api';

export default function PracticeResultsPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId as string;
  
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    loadSessionResults();
  }, [sessionId]);

  const loadSessionResults = async () => {
    try {
      const response = await getPracticeSession(sessionId);
      const sessionData = response.data;
      
      // completePracticeSession'dan gelen veriyi kullan
      if (sessionData.answers) {
        setSession(sessionData);
      } else {
        alert('Sonuçlar bulunamadı!');
        router.push('/student/practice');
      }
    } catch (error: any) {
      console.error('Error:', error);
      alert('Sonuçlar yüklenirken hata oluştu.');
      router.push('/student/practice');
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

  if (!session) {
    return null;
  }

  const score = session.score || 0;
  const correctCount = session.correctCount || 0;
  const wrongCount = session.wrongCount || 0;
  const totalQuestions = session.totalQuestions || 0;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 text-gray-900">
             Çalışma Tamamlandı!
          </h1>
          <p className="text-gray-700 text-lg">İşte performansın</p>
        </div>

        {/* Score Card */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-xl p-8 mb-8">
          <div className="text-center">
            <div className="text-6xl font-bold mb-2">%{Math.round(score)}</div>
            <div className="text-xl mb-4">Başarı Oranı</div>
            <div className="flex justify-center gap-8 text-sm">
              <div>
                <div className="text-3xl font-bold">{correctCount}</div>
                <div className="opacity-90">Doğru</div>
              </div>
              <div>
                <div className="text-3xl font-bold">{wrongCount}</div>
                <div className="opacity-90">Yanlış</div>
              </div>
              <div>
                <div className="text-3xl font-bold">{totalQuestions}</div>
                <div className="opacity-90">Toplam</div>
              </div>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 text-gray-900">📝 Detaylı Analiz</h2>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-3xl font-bold text-green-600">{correctCount}</div>
              <div className="text-sm text-gray-800 font-medium">Doğru Cevap</div>
            </div>
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="text-3xl font-bold text-red-600">{wrongCount}</div>
              <div className="text-sm text-gray-800 font-medium">Yanlış Cevap</div>
            </div>
          </div>
        </div>

        {/* Wrong Answers */}
        {session.answers && session.answers.filter((a: any) => !a.isCorrect).length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold mb-4 text-red-600">❌ Yanlış Yaptığın Sorular</h2>
            <div className="space-y-4">
              {session.answers
                .filter((a: any) => !a.isCorrect)
                .map((answer: any, index: number) => (
                  <div key={index} className="border rounded-lg p-4 bg-red-50">
                    <div className="font-medium mb-2 text-gray-900">{answer.questionText}</div>
                    <div className="text-sm space-y-1">
                      <div className="text-red-700">
                        <strong>Senin Cevabın:</strong> {answer.selectedOptionText}
                      </div>
                      <div className="text-green-700">
                        <strong>Doğru Cevap:</strong> {answer.correctOptionText}
                      </div>
                      {answer.explanation && (
                        <div className="text-gray-800 mt-2 pt-2 border-t">
                          <strong>Açıklama:</strong> {answer.explanation}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={() => router.push('/student/practice')}
            className="flex-1 bg-blue-600 text-white py-4 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            🔄 Yeni Çalışma Başlat
          </button>
          <button
            onClick={() => router.push('/student/practice/stats')}
            className="flex-1 bg-gray-600 text-white py-4 rounded-lg font-medium hover:bg-gray-700 transition"
          >
            📊 İstatistiklerimi Gör
          </button>
        </div>
      </div>
    </div>
  );
}

