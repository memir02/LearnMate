'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getClassroomById } from '@/lib/api';

export default function StudentClassroomDetailPage() {
  const router = useRouter();
  const params = useParams();
  const classroomId = params.id as string;

  const [classroom, setClassroom] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClassroom();
  }, []);

  const loadClassroom = async () => {
    try {
      const response = await getClassroomById(classroomId);
      setClassroom(response.data);
    } catch (error: any) {
      console.error('Error loading classroom:', error);
      alert('Sınıf yüklenemedi.');
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

  if (!classroom) return null;

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
          <h1 className="text-3xl font-bold mb-2">{classroom.name}</h1>
          {classroom.description && (
            <p className="text-gray-600">{classroom.description}</p>
          )}
        </div>

        {/* Classroom Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Sınıf Bilgileri</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {classroom.subject && (
              <div>
                <span className="text-gray-500 text-sm">Ders:</span>
                <div className="font-medium">{classroom.subject}</div>
              </div>
            )}
            {classroom.grade && (
              <div>
                <span className="text-gray-500 text-sm">Sınıf:</span>
                <div className="font-medium">{classroom.grade}</div>
              </div>
            )}
            <div>
              <span className="text-gray-500 text-sm">Kod:</span>
              <div className="font-mono font-medium text-blue-600">{classroom.code}</div>
            </div>
            {classroom.memberCount !== undefined && (
              <div>
                <span className="text-gray-500 text-sm">Üye Sayısı:</span>
                <div className="font-medium">{classroom.memberCount} öğrenci</div>
              </div>
            )}
          </div>

          {classroom.teacher && (
            <div className="mt-4 pt-4 border-t">
              <span className="text-gray-500 text-sm">Öğretmen:</span>
              <div className="font-medium">
                {classroom.teacher.teacher?.firstName} {classroom.teacher.teacher?.lastName}
              </div>
            </div>
          )}
        </div>

        {/* Classroom Tests */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Bu Sınıfa Ait Testler</h2>
          
          {classroom.tests && classroom.tests.length > 0 ? (
            <div className="space-y-3">
              {classroom.tests.map((test: any) => (
                <div key={test.id} className="border rounded-lg p-4 hover:border-blue-300 transition">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium mb-1">{test.title}</h3>
                      <div className="flex gap-2 text-sm">
                        {test.topic && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                            {test.topic}
                          </span>
                        )}
                        <span className="text-gray-600">
                          {test.questionCount || 0} soru • {test.totalPoints} puan
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => router.push(`/student/tests`)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                    >
                      Çöz
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              Bu sınıfa henüz test atanmamış.
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="mt-6">
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








