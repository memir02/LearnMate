'use client';

import { useEffect, useState } from 'react';
import { getClassrooms, requestJoinByCode } from '@/lib/api';
import { Classroom } from '@/lib/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function StudentClassrooms() {
  const router = useRouter();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Katılım modali
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState('');

  useEffect(() => {
    fetchClassrooms();
  }, []);

  const fetchClassrooms = async () => {
    try {
      setLoading(true);
      const response = await getClassrooms();
      setClassrooms(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Classroom\'lar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinClassroom = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!joinCode.trim()) {
      setJoinError('Classroom kodu gereklidir');
      return;
    }

    try {
      setJoining(true);
      setJoinError('');
      
      const response = await requestJoinByCode(joinCode.toUpperCase());
      
      alert(response.message || 'Katılım isteği gönderildi!');
      setShowJoinModal(false);
      setJoinCode('');
      
      // Eğer otomatik onaylı ise listeyi yenile
      if (response.data?.status === 'ACTIVE') {
        fetchClassrooms();
      }
    } catch (err: any) {
      setJoinError(err.response?.data?.message || 'Katılım isteği gönderilemedi');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Classroom'larım</h1>
            <p className="text-gray-600 mt-2">
              Katıldığınız classroom'lar
            </p>
          </div>
          <button
            onClick={() => setShowJoinModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            Classroom'a Katıl
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Classrooms Grid */}
        {classrooms.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Henüz bir classroom'a katılmadınız
            </h3>
            <p className="text-gray-600 mb-6">
              Öğretmeninizden aldığınız kodu kullanarak classroom'a katılın
            </p>
            <button
              onClick={() => setShowJoinModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              Classroom'a Katıl
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classrooms.map((classroom) => (
              <div
                key={classroom.id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push(`/student/classrooms/${classroom.id}`)}
              >
                <div className="p-6">
                  {/* Header */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {classroom.name}
                  </h3>
                  {(classroom.subject || classroom.grade) && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                      {classroom.subject && <span>{classroom.subject}</span>}
                      {classroom.subject && classroom.grade && <span>•</span>}
                      {classroom.grade && <span>{classroom.grade}. Sınıf</span>}
                    </div>
                  )}

                  {/* Description */}
                  {classroom.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {classroom.description}
                    </p>
                  )}

                  {/* Teacher */}
                  {classroom.teacher?.teacher && (
                    <div className="flex items-center gap-2 mb-4 text-sm text-gray-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>
                        {classroom.teacher.teacher.firstName} {classroom.teacher.teacher.lastName}
                      </span>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <span>{classroom._count?.members || 0} öğrenci</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Join Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Classroom'a Katıl</h3>
              <button
                onClick={() => {
                  setShowJoinModal(false);
                  setJoinCode('');
                  setJoinError('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleJoinClassroom}>
              {joinError && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {joinError}
                </div>
              )}

              <div className="mb-4">
                <label htmlFor="joinCode" className="block text-sm font-medium text-gray-700 mb-2">
                  Classroom Kodu
                </label>
                <input
                  type="text"
                  id="joinCode"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-lg text-center text-gray-900"
                  placeholder="ABC123"
                  maxLength={6}
                  required
                />
                <p className="mt-2 text-sm text-gray-600">
                  Öğretmeninizden aldığınız 6 haneli kodu girin
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={joining}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {joining ? 'Gönderiliyor...' : 'Katılım İsteği Gönder'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowJoinModal(false);
                    setJoinCode('');
                    setJoinError('');
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

