'use client';

import { useAppSelector } from '@/store/hooks';

export default function TeacherDashboard() {
  const { user } = useAppSelector((state) => state.auth);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Öğretmen Paneli
          </h1>
          <p className="text-gray-600 mt-2">
            Hoş geldiniz, {user?.profile?.firstName} {user?.profile?.lastName}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Quick Actions */}
          <button className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow text-left">
            <div className="p-3 bg-blue-100 rounded-lg w-fit mb-3">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900">Yeni Test</h3>
            <p className="text-sm text-gray-600 mt-1">Test oluştur</p>
          </button>

          <button className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow text-left">
            <div className="p-3 bg-green-100 rounded-lg w-fit mb-3">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900">Soru Bankası</h3>
            <p className="text-sm text-gray-600 mt-1">Sorularım</p>
          </button>

          <button className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow text-left">
            <div className="p-3 bg-purple-100 rounded-lg w-fit mb-3">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900">Sınıflarım</h3>
            <p className="text-sm text-gray-600 mt-1">Sınıf yönetimi</p>
          </button>

          <button className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow text-left">
            <div className="p-3 bg-orange-100 rounded-lg w-fit mb-3">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900">İstatistikler</h3>
            <p className="text-sm text-gray-600 mt-1">Performans raporu</p>
          </button>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Son Testler
          </h2>
          <p className="text-gray-600">
            Henüz test oluşturmadınız.
          </p>
        </div>
      </div>
    </div>
  );
}








