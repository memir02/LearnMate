'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { startTest, submitAnswer, submitTest } from '@/lib/api';

export default function TakeTestPage() {
  const router = useRouter();
  const params = useParams();
  const testId = params.id as string;

  const [testData, setTestData] = useState<any>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadTest();
  }, []);

  const loadTest = async () => {
    try {
      const response = await startTest(testId);
      setTestData(response.data);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Test yüklenemedi.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = async (questionId: string, optionId: string) => {
    setAnswers({ ...answers, [questionId]: optionId });

    // Cevabı backend'e kaydet
    try {
      await submitAnswer(testData.studentTestId, {
        questionId,
        selectedOptionId: optionId,
      });
    } catch (error) {
      console.error('Error saving answer:', error);
    }
  };

  const handleSubmitTest = async () => {
    const unansweredCount = testData.questions.length - Object.keys(answers).length;
    
    if (unansweredCount > 0) {
      if (!confirm(`${unansweredCount} soru cevaplanmadı. Yine de testi bitirmek istiyor musunuz?`)) {
        return;
      }
    }

    setSubmitting(true);
    try {
      const response = await submitTest(testData.studentTestId);
      alert(`Test tamamlandı! Puanınız: ${response.data.score}/${response.data.totalPoints}`);
      router.push(`/student/tests/${testData.studentTestId}/results`);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Test tamamlanamadı.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Test yükleniyor...</div>
      </div>
    );
  }

  if (!testData) return null;

  const currentQuestion = testData.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / testData.questions.length) * 100;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-xl font-bold">{testData.test.title}</h1>
            <div className="text-sm text-gray-600">
              {testData.test.durationMinutes} dakika
            </div>
          </div>
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>{testData.test.subject} • {testData.test.topic}</span>
            <span>{answeredCount}/{testData.questions.length} cevaplandı</span>
          </div>
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8 text-gray-900">
          {/* Question Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-700">
              Soru {currentQuestionIndex + 1} / {testData.questions.length}
            </h2>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded">
              {currentQuestion.points} puan
            </span>
          </div>

          {/* Question Text */}
          <div className="mb-8">
            <p className="text-xl font-medium mb-4">{currentQuestion.questionText}</p>
            {currentQuestion.imageUrl && (
              <img
                src={currentQuestion.imageUrl}
                alt="Soru görseli"
                className="max-w-md rounded-lg"
              />
            )}
          </div>

          {/* Options */}
          <div className="space-y-3 mb-8">
            {currentQuestion.options.map((option: any, index: number) => {
              const isSelected = answers[currentQuestion.questionId] === option.id;
              return (
                <button
                  key={option.id}
                  onClick={() => handleAnswerSelect(currentQuestion.questionId, option.id)}
                  className={`w-full p-4 rounded-lg border-2 text-left transition ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-full font-medium ${
                        isSelected
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {String.fromCharCode(65 + index)}
                    </div>
                    <span className="flex-1 pt-1">{option.optionText}</span>
                    {isSelected && (
                      <div className="text-blue-500 font-bold">✓</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center pt-6 border-t">
            <button
              onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
              disabled={currentQuestionIndex === 0}
              className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Önceki
            </button>

            <div className="flex gap-2">
              {testData.questions.map((_: any, index: number) => (
                <button
                  key={index}
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={`w-10 h-10 rounded-lg font-medium transition ${
                    index === currentQuestionIndex
                      ? 'bg-blue-600 text-white'
                      : answers[testData.questions[index].questionId]
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>

            {currentQuestionIndex < testData.questions.length - 1 ? (
              <button
                onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
              >
                Sonraki →
              </button>
            ) : (
              <button
                onClick={handleSubmitTest}
                disabled={submitting}
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50"
              >
                {submitting ? 'Gönderiliyor...' : 'Testi Bitir'}
              </button>
            )}
          </div>
        </div>

        {/* Quick Submit Button */}
        <div className="mt-6 text-center">
          <button
            onClick={handleSubmitTest}
            disabled={submitting}
            className="px-8 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50"
          >
            {submitting ? 'Gönderiliyor...' : 'Testi Şimdi Bitir'}
          </button>
        </div>
      </div>
    </div>
  );
}

