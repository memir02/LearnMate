'use client';

import { useAppSelector } from '@/store/hooks';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { getMyAssignedTests } from '@/lib/api';

interface TestItem {
  studentTestId: string;
  status: string;
  score?: number;
  percentage?: number;
  isPassed?: boolean;
  submittedAt?: string;
  test: {
    id: string;
    title: string;
    description?: string;
    subject?: string;
    topic?: string;
    durationMinutes?: number;
    totalPoints: number;
    questionCount?: number;
    teacher?: {
      firstName: string;
      lastName: string;
    };
  };
}

export default function StudentDashboard() {
  const { user } = useAppSelector((state) => state.auth);
  const router = useRouter();
  const [stats, setStats] = useState({
    assigned: 0,
    completed: 0,
    averageScore: 0,
  });
  const [pendingTests, setPendingTests] = useState<TestItem[]>([]);
  const [recentResults, setRecentResults] = useState<TestItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        const response = await getMyAssignedTests();
        
        if (!isMounted) return;
        
        const tests: TestItem[] = response.data?.tests || [];
      
      // Bekleyen testler (ASSIGNED veya STARTED)
      const pending = tests.filter((t) => 
        t.status === 'ASSIGNED' || t.status === 'STARTED'
      );
      setPendingTests(pending);
      
      // Tamamlanan testler (SUBMITTED veya GRADED)
      const completed = tests.filter((t) => 
        t.status === 'SUBMITTED' || t.status === 'GRADED'
      );
      
      // Son 3 sonucu al (en son tamamlananlar)
      const sortedCompleted = [...completed].sort((a, b) => {
        const dateA = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
        const dateB = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
        return dateB - dateA;
      });
      setRecentResults(sortedCompleted.slice(0, 3));
      
      const avgScore = completed.length > 0
        ? completed.reduce((sum: number, t) => sum + (t.percentage || 0), 0) / completed.length
        : 0;

        if (isMounted) {
          setStats({
            assigned: tests.length,
            completed: completed.length,
            averageScore: Math.round(avgScore),
          });
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error loading data:', error);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []); // Boş dependency array - sadece mount'ta çalış

  const getStatusBadge = (status: string) => {
    const badges = {
      ASSIGNED: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Bekliyor' },
      STARTED: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Devam Ediyor' },
      SUBMITTED: { bg: 'bg-green-100', text: 'text-green-700', label: 'Tamamlandı' },
      GRADED: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Puanlandı' },
    };
    const badge = badges[status as keyof typeof badges] || badges.ASSIGNED;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Dashboard
        </h1>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Atanan Testler</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {loading ? '...' : stats.assigned}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tamamlanan</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {loading ? '...' : stats.completed}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Ortalama Başarı</p>
              <p className={`text-3xl font-bold mt-1 ${
                stats.averageScore >= 70 ? 'text-green-600' :
                stats.averageScore >= 50 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {loading ? '...' : `${stats.averageScore}%`}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Tests */}
      <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">
              Bekleyen Testler
            </h2>
            {pendingTests.length > 0 && (
              <Link 
                href="/student/tests?filter=pending" 
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Tümünü Gör →
              </Link>
            )}
          </div>
          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-500">Yükleniyor...</p>
              </div>
            ) : pendingTests.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="mt-4 text-gray-600">Tüm testlerinizi tamamladınız! 🎉</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingTests.slice(0, 3).map((item) => (
                  <div
                    key={item.studentTestId}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/50 transition-all cursor-pointer group"
                    onClick={() => router.push(`/student/tests/${item.test.id}/take`)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-700">
                          {item.test.title}
                        </h3>
                        {getStatusBadge(item.status)}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                        {item.test.subject && (
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                            {item.test.subject}
                          </span>
                        )}
                        {item.test.durationMinutes && (
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {item.test.durationMinutes} dk
                          </span>
                        )}
                        {item.test.questionCount && (
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {item.test.questionCount} soru
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                        item.status === 'STARTED'
                          ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/student/tests/${item.test.id}/take`);
                      }}
                    >
                      {item.status === 'STARTED' ? 'Devam Et' : 'Başla'}
                    </button>
                  </div>
                ))}
                {pendingTests.length > 3 && (
                  <p className="text-center text-sm text-gray-500 pt-2">
                    +{pendingTests.length - 3} daha fazla bekleyen test var
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

      {/* Recent Results */}
      <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">
              Son Sonuçlar
            </h2>
            {recentResults.length > 0 && (
              <Link 
                href="/student/tests?filter=completed" 
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Tümünü Gör →
              </Link>
            )}
          </div>
          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-500">Yükleniyor...</p>
              </div>
            ) : recentResults.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="mt-4 text-gray-600">Henüz tamamlanmış testiniz bulunmuyor.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentResults.map((item) => (
                  <div
                    key={item.studentTestId}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50/50 transition-all cursor-pointer group"
                    onClick={() => router.push(`/student/tests/${item.studentTestId}/results`)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 group-hover:text-green-700">
                          {item.test.title}
                        </h3>
                        {getStatusBadge(item.status)}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                        {item.test.subject && (
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                            {item.test.subject}
                          </span>
                        )}
                        {item.submittedAt && (
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {formatDate(item.submittedAt)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      {/* Sonuç İstatistikleri */}
                      <div className="flex items-center gap-4 text-center">
                        <div className="px-3">
                          <div className="text-lg font-bold text-blue-600">
                            {item.score || 0}
                          </div>
                          <div className="text-xs text-gray-500">Puan</div>
                        </div>
                        <div className="px-3 border-l border-gray-200">
                          <div className={`text-lg font-bold ${
                            (item.percentage || 0) >= 70 ? 'text-green-600' : 
                            (item.percentage || 0) >= 50 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            %{item.percentage?.toFixed(0) || 0}
                          </div>
                          <div className="text-xs text-gray-500">Başarı</div>
                        </div>
                        <div className="px-3 border-l border-gray-200">
                          <div className={`text-lg font-bold ${
                            item.isPassed ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {item.isPassed ? '✓' : '✗'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {item.isPassed ? 'Geçti' : 'Kaldı'}
                          </div>
                        </div>
                      </div>
                      <button
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/student/tests/${item.studentTestId}/results`);
                        }}
                      >
                        Detaylar
                      </button>
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








