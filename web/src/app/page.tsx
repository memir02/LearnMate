'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated && user) {
      // Redirect to appropriate dashboard
      if (user.role === 'ADMIN') {
        router.push('/admin');
      } else if (user.role === 'TEACHER') {
        router.push('/teacher');
      } else {
        router.push('/student');
      }
    }
  }, [isAuthenticated, user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center px-4">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">
          Learn<span className="text-blue-600">Mate</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Modern Eğitim ve Test Platformu
        </p>
        
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Giriş Yap
          </Link>
          <Link
            href="/register"
            className="px-8 py-3 bg-white text-blue-600 rounded-lg hover:bg-gray-50 transition-colors font-medium border border-blue-600"
          >
            Kayıt Ol
          </Link>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-4xl mb-3">👨‍🏫</div>
            <h3 className="font-bold text-gray-900 mb-2">Öğretmenler İçin</h3>
            <p className="text-sm text-gray-600">
              Test oluşturun, sınıflarınızı yönetin, öğrenci performansını takip edin
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-4xl mb-3">👨‍🎓</div>
            <h3 className="font-bold text-gray-900 mb-2">Öğrenciler İçin</h3>
            <p className="text-sm text-gray-600">
              Testleri çözün, sonuçlarınızı görüntüleyin, kendinizi geliştirin
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-4xl mb-3">📊</div>
            <h3 className="font-bold text-gray-900 mb-2">Detaylı Raporlar</h3>
            <p className="text-sm text-gray-600">
              Anlık istatistikler ve performans analizi ile gelişimi izleyin
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
