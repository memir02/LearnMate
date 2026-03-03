'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getMyQuestions, createTest, getTeacherClassrooms } from '@/lib/api';

export default function CreateTestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: 'Matematik',
    topic: '',
    grade: '4. Sınıf',
    classroomId: '',
    durationMinutes: 40,
    passingScore: 70,
    showResults: true,
    shuffleQuestions: false,
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    loadQuestions();
    loadClassrooms();
  }, [formData.subject]);

  const loadQuestions = async () => {
    try {
      const response = await getMyQuestions({ 
        subject: formData.subject,
        limit: 1000  // Tüm soruları getir
      });
      setQuestions(response.data.questions || []);
    } catch (error) {
      console.error('Error loading questions:', error);
    }
  };

  const loadClassrooms = async () => {
    try {
      const response = await getTeacherClassrooms();
      setClassrooms(response.data || []);
    } catch (error) {
      console.error('Error loading classrooms:', error);
    }
  };

  const toggleQuestion = (questionId: string) => {
    if (selectedQuestions.includes(questionId)) {
      setSelectedQuestions(selectedQuestions.filter(id => id !== questionId));
    } else {
      setSelectedQuestions([...selectedQuestions, questionId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedQuestions.length === 0) {
      alert('En az bir soru seçmelisiniz!');
      return;
    }

    if (!formData.classroomId) {
      alert('Bir sınıf seçmelisiniz!');
      return;
    }

    setLoading(true);
    try {
      await createTest({
        ...formData,
        questionIds: selectedQuestions,
      });
      alert('Test başarıyla oluşturuldu!');
      router.push('/teacher/tests');
    } catch (error: any) {
      console.error('Error:', error);
      alert(error.response?.data?.message || 'Test oluşturulurken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const totalPoints = questions
    .filter(q => selectedQuestions.includes(q.id))
    .reduce((sum, q) => sum + q.points, 0);

  return (
    <div className="max-w-6xl mx-auto p-6 text-gray-900">
      <h1 className="text-3xl font-bold mb-6">Yeni Test Oluştur</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Test Bilgileri */}
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Test Bilgileri</h2>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Test Başlığı <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg text-gray-900"
              placeholder="Örn: Doğal Sayılar Testi"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Açıklama</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
              rows={3}
              placeholder="Test hakkında açıklama..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Ders</label>
              <select
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="Matematik">Matematik</option>
                <option value="Türkçe">Türkçe</option>
                <option value="Fen Bilimleri">Fen Bilimleri</option>
                <option value="Sosyal Bilgiler">Sosyal Bilgiler</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Konu</label>
              <input
                type="text"
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="Örn: Toplama İşlemi"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Sınıf</label>
              <select
                value={formData.grade}
                onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((grade) => (
                  <option key={grade} value={`${grade}. Sınıf`}>
                    {grade}. Sınıf
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Sınıf Seç <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.classroomId}
                onChange={(e) => setFormData({ ...formData, classroomId: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                required
              >
                <option value="">Sınıf seçin...</option>
                {classrooms.map((classroom) => (
                  <option key={classroom.id} value={classroom.id}>
                    {classroom.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Süre (dakika)</label>
              <input
                type="number"
                value={formData.durationMinutes}
                onChange={(e) => setFormData({ ...formData, durationMinutes: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border rounded-lg"
                min="1"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Geçme Notu (%)</label>
              <input
                type="number"
                value={formData.passingScore}
                onChange={(e) => setFormData({ ...formData, passingScore: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border rounded-lg"
                min="0"
                max="100"
              />
            </div>
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.showResults}
                onChange={(e) => setFormData({ ...formData, showResults: e.target.checked })}
                className="w-5 h-5"
              />
              <span className="text-sm">Sonuçları göster</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.shuffleQuestions}
                onChange={(e) => setFormData({ ...formData, shuffleQuestions: e.target.checked })}
                className="w-5 h-5"
              />
              <span className="text-sm">Soruları karıştır</span>
            </label>
          </div>
        </div>

        {/* Soru Seçimi */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">
            Sorular Seç ({selectedQuestions.length} soru seçildi • Toplam: {totalPoints} puan)
          </h2>

          {questions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">Henüz soru oluşturmadınız.</p>
              <button
                type="button"
                onClick={() => router.push('/teacher/questions/new')}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg"
              >
                Soru Oluştur
              </button>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {questions.map((question) => (
                <div
                  key={question.id}
                  className={`p-4 border rounded-lg cursor-pointer transition ${
                    selectedQuestions.includes(question.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => toggleQuestion(question.id)}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedQuestions.includes(question.id)}
                      onChange={() => {}}
                      className="mt-1 w-5 h-5"
                    />
                    <div className="flex-1">
                      <p className="font-medium mb-2">{question.questionText}</p>
                      <div className="flex gap-2 text-xs">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                          {question.topic || 'Konu Yok'}
                        </span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">
                          {question.points} puan
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Butonlar */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading || selectedQuestions.length === 0}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Oluşturuluyor...' : 'Test Oluştur'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition"
          >
            İptal
          </button>
        </div>
      </form>
    </div>
  );
}

