'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getMyQuestions, deleteQuestion, toggleQuestionPublic } from '@/lib/api';

export default function QuestionsListPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    subject: '',
    topic: '',
    grade: '',
  });

  useEffect(() => {
    loadQuestions();
  }, [filters]);

  const loadQuestions = async () => {
    try {
      const response = await getMyQuestions(filters);
      setQuestions(response.data.questions || []);
    } catch (error) {
      console.error('Error loading questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu soruyu silmek istediğinizden emin misiniz?')) return;

    try {
      await deleteQuestion(id);
      alert('Soru silindi!');
      loadQuestions();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Silme başarısız.');
    }
  };

  const handleTogglePublic = async (id: string, currentStatus: boolean) => {
    try {
      await toggleQuestionPublic(id, !currentStatus);
      loadQuestions();
    } catch (error: any) {
      alert(error.response?.data?.message || 'İşlem başarısız.');
    }
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Sorularım</h1>
        <button
          onClick={() => router.push('/teacher/questions/new')}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
        >
          + Yeni Soru Oluştur
        </button>
      </div>

      {/* Filtreler */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Ders</label>
            <select
              value={filters.subject}
              onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value="">Tümü</option>
              <option value="Matematik">Matematik</option>
              <option value="Türkçe">Türkçe</option>
              <option value="Fen Bilimleri">Fen Bilimleri</option>
              <option value="Sosyal Bilgiler">Sosyal Bilgiler</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Arama</label>
            <input
              type="text"
              value={filters.topic}
              onChange={(e) => setFilters({ ...filters, topic: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="Soru metni, konu veya açıklama ile ara..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Sınıf</label>
            <select
              value={filters.grade}
              onChange={(e) => setFilters({ ...filters, grade: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value="">Tümü</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((grade) => (
                <option key={grade} value={`${grade}. Sınıf`}>
                  {grade}. Sınıf
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Sorular Listesi */}
      {questions.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500 text-lg mb-4">Henüz soru oluşturmadınız.</p>
          <button
            onClick={() => router.push('/teacher/questions/new')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            İlk Sorunuzu Oluşturun
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {questions.map((question) => (
            <div key={question.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                      {question.subject || 'Ders Yok'}
                    </span>
                    {question.topic && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                        {question.topic}
                      </span>
                    )}
                    {question.grade && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                        {question.grade}
                      </span>
                    )}
                    <span className={`px-2 py-1 text-xs rounded ${
                      question.difficulty === 'EASY' ? 'bg-green-100 text-green-700' :
                      question.difficulty === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {question.difficulty === 'EASY' ? 'Kolay' : 
                       question.difficulty === 'MEDIUM' ? 'Orta' : 'Zor'}
                    </span>
                    {question.isPublic && (
                      <span className="px-2 py-1 bg-emerald-100 text-black-700 text-xs rounded flex items-center gap-1">
                         Genel Havuzda
                      </span>
                    )}
                  </div>
                  <p className="text-lg font-medium mb-2">{question.questionText}</p>
                  <div className="text-sm text-gray-500">
                    {question.options?.length || 0} şık • {question.points} puan
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => router.push(`/teacher/questions/${question.id}/edit`)}
                    className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition border border-blue-300"
                  >
                   Düzenle
                  </button>
                  <button
                    onClick={() => handleTogglePublic(question.id, question.isPublic)}
                    className={`px-4 py-2 rounded-lg transition font-medium ${
                      question.isPublic
                        ? 'text-orange-600 hover:bg-orange-50 border border-orange-300'
                        : 'text-green-600 hover:bg-green-50 border border-green-300'
                    }`}
                    title={question.isPublic ? 'Havuzdan Çıkar' : 'Havuza Ekle'}
                  >
                    {question.isPublic ? ' Gizle' : ' Paylaş'}
                  </button>
                  <button
                    onClick={() => handleDelete(question.id)}
                    className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    Sil
                  </button>
                </div>
              </div>

              {/* Şıklar */}
              <div className="mt-4 space-y-2">
                {question.options?.map((option: any, index: number) => (
                  <div
                    key={option.id}
                    className={`flex items-center gap-2 p-2 rounded ${
                      option.isCorrect ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                    }`}
                  >
                    <span className="font-medium text-sm">{String.fromCharCode(65 + index)})</span>
                    <span className="text-sm">{option.optionText}</span>
                    {option.isCorrect && (
                      <span className="ml-auto text-green-600 text-sm font-medium">✓ Doğru</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

