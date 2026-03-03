'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getTestById } from '@/lib/api';

export default function TestDetailPage() {
  const router = useRouter();
  const params = useParams();
  const testId = params.id as string;

  const [test, setTest] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTest();
  }, []);

  const loadTest = async () => {
    try {
      const response = await getTestById(testId);
      setTest(response.data);
    } catch (error: any) {
      console.error('Error loading test:', error);
      alert('Test yüklenemedi.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-900">Yükleniyor...</div>
      </div>
    );
  }

  if (!test) return null;

  return (
    <div className="p-6 text-gray-900">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-700 mb-4"
          >
            ← Geri Dön
          </button>
          <h1 className="text-3xl font-bold mb-2">{test.title}</h1>
          {test.description && (
            <p className="text-gray-600">{test.description}</p>
          )}
        </div>

        {/* Test Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Bilgileri</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {test.subject && (
              <div>
                <span className="text-gray-500 text-sm">Ders:</span>
                <div className="font-medium">{test.subject}</div>
              </div>
            )}
            {test.topic && (
              <div>
                <span className="text-gray-500 text-sm">Konu:</span>
                <div className="font-medium">{test.topic}</div>
              </div>
            )}
            {test.grade && (
              <div>
                <span className="text-gray-500 text-sm">Sınıf:</span>
                <div className="font-medium">{test.grade}</div>
              </div>
            )}
            <div>
              <span className="text-gray-500 text-sm">Soru Sayısı:</span>
              <div className="font-medium">{test.testQuestions?.length || 0}</div>
            </div>
            <div>
              <span className="text-gray-500 text-sm">Toplam Puan:</span>
              <div className="font-medium">{test.totalPoints}</div>
            </div>
            {test.durationMinutes && (
              <div>
                <span className="text-gray-500 text-sm">Süre:</span>
                <div className="font-medium">{test.durationMinutes} dakika</div>
              </div>
            )}
            {test.passingScore && (
              <div>
                <span className="text-gray-500 text-sm">Geçme Notu:</span>
                <div className="font-medium">%{test.passingScore}</div>
              </div>
            )}
            <div>
              <span className="text-gray-500 text-sm">Durum:</span>
              <div className="font-medium">
                {test.isPublished ? (
                  <span className="text-green-600">Yayında</span>
                ) : (
                  <span className="text-gray-600">Taslak</span>
                )}
              </div>
            </div>
          </div>

          {test.classroom && (
            <div className="mt-4 pt-4 border-t">
              <span className="text-gray-500 text-sm">Sınıf:</span>
              <div className="font-medium">{test.classroom.name}</div>
            </div>
          )}
        </div>

        {/* Questions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">
            Sorular ({test.testQuestions?.length || 0})
          </h2>

          <div className="space-y-4">
            {test.testQuestions?.map((tq: any, index: number) => (
              <div key={tq.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium">Soru {index + 1}</h3>
                  <span className="text-sm text-gray-600">{tq.points} puan</span>
                </div>
                <p className="text-gray-700 mb-3">{tq.question.questionText}</p>
                
                {/* Options */}
                <div className="space-y-2">
                  {tq.question.options?.map((option: any, optIndex: number) => (
                    <div
                      key={option.id}
                      className={`p-2 rounded ${
                        option.isCorrect
                          ? 'bg-green-50 border border-green-200'
                          : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {String.fromCharCode(65 + optIndex)})
                        </span>
                        <span>{option.optionText}</span>
                        {option.isCorrect && (
                          <span className="ml-auto text-green-600 text-sm font-medium">
                            ✓ Doğru
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-4">
          <button
            onClick={() => router.push(`/teacher/tests/${testId}/edit`)}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            Düzenle
          </button>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition"
          >
            Geri
          </button>
        </div>
      </div>
    </div>
  );
}








