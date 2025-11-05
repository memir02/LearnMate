'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { logout } from '@/store/slices/authSlice';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const handleLogout = () => {
    dispatch(logout());
    router.push('/login');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-blue-600">LearnMate</h1>
              <span className="ml-4 px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                {user?.role}
              </span>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                {user?.student?.firstName || user?.teacher?.firstName} {user?.student?.lastName || user?.teacher?.lastName}
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
              >
                Çıkış Yap
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      {children}
    </div>
  );
}








