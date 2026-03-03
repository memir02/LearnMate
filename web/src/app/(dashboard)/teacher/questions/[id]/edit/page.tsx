'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getQuestionById, updateQuestion } from '@/lib/api';

export default function EditQuestionPage() {
  const router = useRouter();
  const params = useParams();
  const questionId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    questionText: '',
    subject: 'Matematik',
    topic: '',
    grade: '4. Sınıf',
    difficulty: 'MEDIUM',
    points: 5,
    explanation: '',
    imageUrl: '',
    isPublic: false,
    tags: [] as string[],
    options: [
      { optionText: '', isCorrect: false, orderIndex: 1 },
      { optionText: '', isCorrect: false, orderIndex: 2 },
      { optionText: '', isCorrect: false, orderIndex: 3 },
      { optionText: '', isCorrect: false, orderIndex: 4 },
    ],
  });

  useEffect(() => {
    loadQuestion();
  }, [questionId]);

  const loadQuestion = async () => {
    try {
      const response = await getQuestionById(questionId);
      const question = response.data;
      
      setFormData({
        questionText: question.questionText || '',
        subject: question.subject || 'Matematik',
        topic: question.topic || '',
        grade: question.grade || '4. Sınıf',
        difficulty: question.difficulty || 'MEDIUM',
        points: question.points || 5,
        explanation: question.explanation || '',
        imageUrl: question.imageUrl || '',
        isPublic: question.isPublic || false,
        tags: question.tags || [],
        options: question.options?.length > 0 
          ? question.options.map((opt: any) => ({
              optionText: opt.optionText,
              isCorrect: opt.isCorrect,
              orderIndex: opt.orderIndex,
            }))
          : [
              { optionText: '', isCorrect: false, orderIndex: 1 },
              { optionText: '', isCorrect: false, orderIndex: 2 },
              { optionText: '', isCorrect: false, orderIndex: 3 },
              { optionText: '', isCorrect: false, orderIndex: 4 },
            ],
      });
    } catch (error: any) {
      console.error('Error loading question:', error);
      alert(error.response?.data?.message || 'Soru yüklenirken bir hata oluştu.');
      router.push('/teacher/questions');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.questionText.trim()) {
      alert('Soru metni zorunludur!');
      return;
    }

    const hasCorrect = formData.options.some(opt => opt.isCorrect);
    if (!hasCorrect) {
      alert('En az bir doğru cevap işaretlemelisiniz!');
      return;
    }

    const hasEmptyOptions = formData.options.some(opt => !opt.optionText.trim());
    if (hasEmptyOptions) {
      alert('Tüm şıkları doldurmalısınız!');
      return;
    }

    setSaving(true);
    try {
      await updateQuestion(questionId, formData);
      alert('Soru başarıyla güncellendi!');
      router.push('/teacher/questions');
    } catch (error: any) {
      console.error('Error:', error);
      alert(error.response?.data?.message || 'Soru güncellenirken bir hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  const updateOption = (index: number, field: string, value: any) => {
    const newOptions = [...formData.options];
    (newOptions[index] as any)[field] = value;
    setFormData({ ...formData, options: newOptions });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 text-gray-900">
      <div className="mb-6">
        <h1 className="text-3xl font-bold"> Soru Düzenle</h1>
        <p className="text-gray-600 mt-2">Soru bilgilerini güncelleyin</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-lg shadow p-6">
        {/* Soru Metni */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Soru Metni <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.questionText}
            onChange={(e) => setFormData({ ...formData, questionText: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
            placeholder="Sorunuzu buraya yazın..."
            required
          />
        </div>

        {/* Konu Bilgileri */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Ders</label>
            <select
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Matematik">Matematik</option>
              <option value="Türkçe">Türkçe</option>
              <option value="Fen Bilimleri">Fen Bilimleri</option>
              <option value="Sosyal Bilgiler">Sosyal Bilgiler</option>
              <option value="İngilizce">İngilizce</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Konu</label>
            <input
              type="text"
              value={formData.topic}
              onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Örn: Toplama İşlemi"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Sınıf</label>
            <select
              value={formData.grade}
              onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((grade) => (
                <option key={grade} value={`${grade}. Sınıf`}>
                  {grade}. Sınıf
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Zorluk ve Puan */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Zorluk</label>
            <select
              value={formData.difficulty}
              onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="EASY">Kolay</option>
              <option value="MEDIUM">Orta</option>
              <option value="HARD">Zor</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Puan</label>
            <input
              type="number"
              value={formData.points}
              onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
              max="100"
            />
          </div>
        </div>

        {/* Şıklar */}
        <div>
          <label className="block text-sm font-medium mb-3">
            Şıklar <span className="text-red-500">*</span>
          </label>
          <div className="space-y-3">
            {formData.options.map((option, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded">
                  {String.fromCharCode(65 + index)}
                </div>
                <input
                  type="text"
                  value={option.optionText}
                  onChange={(e) => updateOption(index, 'optionText', e.target.value)}
                  className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={`Şık ${String.fromCharCode(65 + index)}`}
                  required
                />
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={option.isCorrect}
                    onChange={(e) => updateOption(index, 'isCorrect', e.target.checked)}
                    className="w-5 h-5 text-green-500 cursor-pointer"
                  />
                  <span className="text-sm text-gray-600">Doğru</span>
                </label>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-2">
            * En az bir şıkkı "Doğru" olarak işaretlemelisiniz
          </p>
        </div>

        {/* Açıklama */}
        <div>
          <label className="block text-sm font-medium mb-2">Açıklama (Opsiyonel)</label>
          <textarea
            value={formData.explanation}
            onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Sorunun cevabı hakkında açıklama..."
          />
        </div>

        {/* Soru Havuzu */}
        <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
          <input
            type="checkbox"
            id="isPublic"
            checked={formData.isPublic}
            onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
            className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500 cursor-pointer"
          />
          <label htmlFor="isPublic" className="flex-1 cursor-pointer">
            <div className="font-medium text-black-900 flex items-center gap-2">
              Bu soruyu genel havuza ekle
            </div>
            <div className="text-sm text-black-700 mt-1">
              Diğer öğretmenler ve öğrenciler bu soruyu kullanabilir. Öğrenciler pratik çalışmalarında bu soruyu çözebilir.
            </div>
          </label>
        </div>

        {/* Butonlar */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
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



