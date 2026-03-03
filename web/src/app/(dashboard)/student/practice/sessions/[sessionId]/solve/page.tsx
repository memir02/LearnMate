'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { answerPracticeQuestion, completePracticeSession } from '@/lib/api';

export default function PracticeSolvePage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId as string;
  
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<any>(null);

  useEffect(() => {
    // Session verisini localStorage'dan al (startPracticeSession'dan gelen)
    const sessionData = localStorage.getItem(`practice_session_${sessionId}`);
    if (sessionData) {
      const { questions: qs } = JSON.parse(sessionData);
      setQuestions(qs);
    } else {
      alert('Oturum bulunamadı!');
      router.push('/student/practice');
    }
  }, [sessionId, router]);

  useEffect(() => {
    // Session'ı localStorage'a kaydet
    if (questions.length > 0) {
      localStorage.setItem(`practice_session_${sessionId}`, JSON.stringify({ questions }));
    }
  }, [questions, sessionId]);

  const currentQuestion = questions[currentIndex];

  const handleAnswer = async () => {
    if (!selectedOption) {
      alert('Lütfen bir şık seçin!');
      return;
    }

    setLoading(true);
    try {
      const response = await answerPracticeQuestion(sessionId, {
        questionId: currentQuestion.id,
        selectedOptionId: selectedOption,
      });

      setFeedback(response.data);
      setAnsweredQuestions(new Set([...answeredQuestions, currentQuestion.id]));
    } catch (error: any) {
      console.error('Error:', error);
      alert(error.response?.data?.message || 'Cevap kaydedilirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(null);
      setFeedback(null);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    try {
      await completePracticeSession(sessionId);
      localStorage.removeItem(`practice_session_${sessionId}`);
      router.push(`/student/practice/sessions/${sessionId}/results`);
    } catch (error: any) {
      console.error('Error:', error);
      alert(error.response?.data?.message || 'Oturum tamamlanırken hata oluştu.');
    }
  };

  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-xl text-gray-900">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600">
              Soru {currentIndex + 1} / {questions.length}
            </div>
            <div className="text-sm font-medium text-gray-900">
              {answeredQuestions.size} / {questions.length} Cevaplandı
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="mb-4">
            <span className="text-sm font-medium text-gray-500">
              {currentQuestion.subject} {currentQuestion.topic && `• ${currentQuestion.topic}`}
            </span>
          </div>

          <h2 className="text-xl font-medium mb-6 text-gray-900">
            {currentQuestion.questionText}
          </h2>

          {/* Options */}
          <div className="space-y-3">
            {currentQuestion.options?.map((option: any, index: number) => {
              const isSelected = selectedOption === option.id;
              const isCorrect = feedback?.correctOptionId === option.id;
              const isWrong = feedback && isSelected && !feedback.isCorrect;

              return (
                <button
                  key={option.id}
                  onClick={() => !feedback && setSelectedOption(option.id)}
                  disabled={!!feedback}
                  className={`w-full text-left p-4 rounded-lg border-2 transition ${
                    feedback
                      ? isCorrect
                        ? 'border-green-500 bg-green-50'
                        : isWrong
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200'
                      : isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center font-medium text-gray-900">
                      {String.fromCharCode(65 + index)}
                    </div>
                    <div className="flex-1 text-gray-900">{option.optionText}</div>
                    {feedback && isCorrect && <span className="text-green-600 text-xl">✓</span>}
                    {isWrong && <span className="text-red-600 text-xl">✗</span>}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Feedback */}
          {feedback && (
            <div className={`mt-6 p-4 rounded-lg ${
              feedback.isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <div className={`font-medium mb-2 ${feedback.isCorrect ? 'text-green-900' : 'text-red-900'}`}>
                {feedback.isCorrect ? '🎉 Doğru!' : '❌ Yanlış!'}
              </div>
              {feedback.explanation && (
                <div className="text-sm text-gray-700">
                  <strong>Açıklama:</strong> {feedback.explanation}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          {!feedback ? (
            <button
              onClick={handleAnswer}
              disabled={!selectedOption || loading}
              className="flex-1 bg-blue-600 text-white py-4 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Kontrol Ediliyor...' : 'Cevabı Kontrol Et'}
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="flex-1 bg-green-600 text-white py-4 rounded-lg font-medium hover:bg-green-700 transition"
            >
              {currentIndex < questions.length - 1 ? 'Sonraki Soru →' : 'Bitir ve Sonuçları Gör'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

