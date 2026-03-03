'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getTeacherStatistics } from '@/lib/api';

interface TeacherStatistics {
  overview: {
    totalTests: number;
    publishedTests: number;
    totalQuestions: number;
    totalStudents: number;
    totalCompletedTests: number;
    averagePercentage: number;
    passedCount: number;
    failedCount: number;
    recentActivity: number;
  };
  topStudents: Array<{
    studentId: string;
    name: string;
    email: string;
    testsTaken: number;
    averagePercentage: number;
  }>;
  studentsNeedingHelp: Array<{
    studentId: string;
    name: string;
    email: string;
    testsTaken: number;
    averagePercentage: number;
  }>;
  classroomPerformance: Array<{
    classroomId: string;
    name: string;
    studentCount: number;
    testsCompleted: number;
    averagePercentage: number;
  }>;
  subjectPerformance: Array<{
    subject: string;
    testsCompleted: number;
    averagePercentage: number;
  }>;
}

export default function TeacherStatisticsPage() {
  const router = useRouter();
  const [statistics, setStatistics] = useState<TeacherStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getTeacherStatistics();
      setStatistics(response.data);
    } catch (err: any) {
      console.error('Error loading statistics:', err);
      setError(err.response?.data?.message || 'İstatistikler yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const getPercentageColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPercentageBgColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-100';
    if (percentage >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">İstatistikler yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error || !statistics) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <p className="mt-4 text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">İstatistikler</h1>
          <p className="text-gray-600 mt-1">Öğrenci performansı ve test analizi</p>
        </div>
        <button
          onClick={loadStatistics}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Yenile
        </button>
      </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Toplam Test</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{statistics.overview.totalTests}</p>
                <p className="text-xs text-gray-500 mt-1">{statistics.overview.publishedTests} yayında</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Toplam Öğrenci</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{statistics.overview.totalStudents}</p>
                <p className="text-xs text-gray-500 mt-1">Aktif öğrenci</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ortalama Başarı</p>
                <p className={`text-3xl font-semibold mt-1 ${getPercentageColor(statistics.overview.averagePercentage)}`}>
                  %{statistics.overview.averagePercentage.toFixed(1)}
                </p>
                <p className="text-xs text-gray-500 mt-1">{statistics.overview.totalCompletedTests} test tamamlandı</p>
              </div>
              <div className={`p-3 rounded-lg ${getPercentageBgColor(statistics.overview.averagePercentage)}`}>
                <svg className={`w-8 h-8 ${getPercentageColor(statistics.overview.averagePercentage)}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Geçen/Kalan</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <p className="text-3xl font-bold text-green-600">{statistics.overview.passedCount}</p>
                  <p className="text-2xl font-bold text-gray-400">/</p>
                  <p className="text-3xl font-bold text-red-600">{statistics.overview.failedCount}</p>
                </div>
                <p className="text-xs text-gray-500 mt-1">Son 7 gün: {statistics.overview.recentActivity} test</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top Students */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900">En Başarılı Öğrenciler</h2>
            </div>

            {statistics.topStudents.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Henüz veri yok</p>
            ) : (
              <div className="space-y-3">
                {statistics.topStudents.map((student, index) => (
                  <div key={student.studentId} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                      index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-400' : 'bg-blue-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{student.name || student.email}</p>
                      <p className="text-sm text-gray-500">{student.testsTaken} test tamamladı</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${getPercentageColor(student.averagePercentage)}`}>
                        %{student.averagePercentage.toFixed(1)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Students Needing Help */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Destek Gereken Öğrenciler</h2>
            </div>

            {statistics.studentsNeedingHelp.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-12 h-12 text-green-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-gray-500">Tüm öğrenciler başarılı! </p>
              </div>
            ) : (
              <div className="space-y-3">
                {statistics.studentsNeedingHelp.map((student) => (
                  <div key={student.studentId} className="flex items-center gap-4 p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{student.name || student.email}</p>
                      <p className="text-sm text-gray-500">{student.testsTaken} test tamamladı</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-red-600">%{student.averagePercentage.toFixed(1)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Classroom Performance */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Sınıf Performansı</h2>
            </div>

            {statistics.classroomPerformance.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Henüz veri yok</p>
            ) : (
              <div className="space-y-4">
                {statistics.classroomPerformance.map((classroom) => (
                  <div key={classroom.classroomId} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">{classroom.name}</h3>
                        <p className="text-sm text-gray-500">
                          {classroom.studentCount} öğrenci • {classroom.testsCompleted} test tamamlandı
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getPercentageBgColor(classroom.averagePercentage)} ${getPercentageColor(classroom.averagePercentage)}`}>
                        %{classroom.averagePercentage.toFixed(1)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          classroom.averagePercentage >= 80 ? 'bg-green-500' :
                          classroom.averagePercentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${classroom.averagePercentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Subject Performance */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Ders Bazlı Performans</h2>
            </div>

            {statistics.subjectPerformance.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Henüz veri yok</p>
            ) : (
              <div className="space-y-4">
                {statistics.subjectPerformance.map((subject) => (
                  <div key={subject.subject} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">{subject.subject}</h3>
                        <p className="text-sm text-gray-500">{subject.testsCompleted} test tamamlandı</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getPercentageBgColor(subject.averagePercentage)} ${getPercentageColor(subject.averagePercentage)}`}>
                        %{subject.averagePercentage.toFixed(1)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          subject.averagePercentage >= 80 ? 'bg-green-500' :
                          subject.averagePercentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${subject.averagePercentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
      </div>
    </div>
  );
}

