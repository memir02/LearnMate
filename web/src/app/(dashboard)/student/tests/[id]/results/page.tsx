'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getTestResults } from '@/lib/api';

export default function TestResultsPage() {
  const router = useRouter();
  const params = useParams();
  const studentTestId = params.id as string;

  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    try {
      const response = await getTestResults(studentTestId);
      setResults(response.data);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Sonuçlar yüklenemedi.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Sonuçlar yükleniyor...</div>
      </div>
    );
  }

  if (!results) return null;

  const correctCount = results.questions.filter((q: any) => q.studentAnswer?.isCorrect).length;
  const wrongCount = results.questions.length - correctCount;

  return (
    <div className="min-h-screen bg-gray-50 py-8 text-gray-900">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <h1 className="text-3xl font-bold mb-4">{results.test.title}</h1>
          <div className="flex gap-2 text-sm mb-6">
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded">
              {results.test.subject}
            </span>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded">
              {results.test.topic}
            </span>
            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded">
              {results.test.grade}
            </span>
          </div>

          {/* Score Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600 mb-1">
                {results.result.score}
              </div>
              <div className="text-sm text-gray-600">Toplam Puan</div>
              <div className="text-xs text-gray-500 mt-1">
                / {results.test.totalPoints}
              </div>
            </div>

            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600 mb-1">
                {results.result.percentage?.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Başarı Oranı</div>
            </div>

            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-3xl font-bold text-purple-600 mb-1">
                {correctCount}
              </div>
              <div className="text-sm text-gray-600">Doğru</div>
              <div className="text-xs text-gray-500 mt-1">
                / {results.questions.length}
              </div>
            </div>

            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-3xl font-bold text-red-600 mb-1">
                {wrongCount}
              </div>
              <div className="text-sm text-gray-600">Yanlış</div>
            </div>
          </div>

          {/* Pass/Fail */}
          <div
            className={`text-center p-6 rounded-lg ${
              results.result.isPassed
                ? 'bg-green-100 border-2 border-green-500'
                : 'bg-red-100 border-2 border-red-500'
            }`}
          >
            <div className="text-2xl font-bold mb-2">
              {results.result.isPassed ? '✓ Geçtiniz!' : '✗ Kaldınız'}
            </div>
            <div className="text-sm text-gray-600">
              Geçme Notu: %{results.test.passingScore}
            </div>
          </div>
        </div>

        {/* Questions Review */}
        <div className="space-y-6">
          {results.questions.map((question: any, index: number) => {
            const isCorrect = question.studentAnswer?.isCorrect;
            return (
              <div
                key={question.questionId}
                className={`bg-white rounded-lg shadow p-6 ${
                  isCorrect ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'
                }`}
              >
                {/* Question Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                        isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold">Soru {index + 1}</h3>
                      <span
                        className={`text-sm ${
                          isCorrect ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {isCorrect ? '✓ Doğru' : '✗ Yanlış'} •{' '}
                        {question.studentAnswer?.pointsEarned || 0}/{question.points} puan
                      </span>
                    </div>
                  </div>
                </div>

                {/* Question Text */}
                <p className="text-lg mb-4">{question.questionText}</p>

                {/* Options */}
                <div className="space-y-2 mb-4">
                  {question.options.map((option: any, optIndex: number) => {
                    const isSelectedOption = option.isSelected;
                    const isCorrectOption = option.isCorrect;

                    return (
                      <div
                        key={option.id}
                        className={`p-4 rounded-lg border-2 ${
                          isCorrectOption
                            ? 'border-green-500 bg-green-50'
                            : isSelectedOption
                            ? 'border-red-500 bg-red-50'
                            : 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`flex items-center justify-center w-8 h-8 rounded-full font-medium ${
                              isCorrectOption
                                ? 'bg-green-500 text-white'
                                : isSelectedOption
                                ? 'bg-red-500 text-white'
                                : 'bg-gray-200 text-gray-700'
                            }`}
                          >
                            {String.fromCharCode(65 + optIndex)}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{option.optionText}</p>
                            {isCorrectOption && (
                              <span className="text-green-600 text-sm font-medium">
                                ✓ Doğru Cevap
                              </span>
                            )}
                            {isSelectedOption && !isCorrectOption && (
                              <span className="text-red-600 text-sm font-medium">
                                ✗ Sizin Cevabınız
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Explanation */}
                {question.explanation && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="font-medium text-blue-900 mb-1">💡 Açıklama:</div>
                    <p className="text-blue-800">{question.explanation}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Back Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/student/tests')}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
          >
            Testlerime Dön
          </button>
        </div>
      </div>
    </div>
  );
}

