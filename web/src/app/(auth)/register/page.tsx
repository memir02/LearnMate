'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAppDispatch } from '@/store/hooks';
import { setCredentials } from '@/store/slices/authSlice';

// Register form schema
const registerSchema = z.object({
  firstName: z.string().min(2, 'Ad en az 2 karakter olmalıdır'),
  lastName: z.string().min(2, 'Soyad en az 2 karakter olmalıdır'),
  email: z.string().email('Geçerli bir email adresi giriniz'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır'),
  confirmPassword: z.string(),
  role: z.enum(['TEACHER', 'STUDENT']),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Şifreler eşleşmiyor',
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'STUDENT',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);

    try {
      const { confirmPassword, ...registerData } = data;
      const response = await api.post('/auth/register', registerData);

      if (response.data.status === 'success') {
        const { user, token } = response.data.data;

        // Save to Redux store
        dispatch(setCredentials({ user, token }));

        toast.success('Kayıt başarılı! Hoş geldiniz!');

        // Redirect based on role
        if (user.role === 'TEACHER') {
          router.push('/teacher');
        } else {
          router.push('/student');
        }
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Kayıt başarısız';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">LearnMate</h1>
          <p className="text-gray-600">Yeni hesap oluşturun</p>
        </div>

        {/* Register Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hesap Türü
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="relative flex items-center justify-center px-4 py-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50">
                <input
                  {...register('role')}
                  type="radio"
                  value="STUDENT"
                  className="sr-only"
                />
                <span className="text-sm font-medium text-gray-900">👨‍🎓 Öğrenci</span>
              </label>
              <label className="relative flex items-center justify-center px-4 py-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50">
                <input
                  {...register('role')}
                  type="radio"
                  value="TEACHER"
                  className="sr-only"
                />
                <span className="text-sm font-medium text-gray-900">👨‍🏫 Öğretmen</span>
              </label>
            </div>
            {errors.role && (
              <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
            )}
          </div>

          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                Ad
              </label>
              <input
                {...register('firstName')}
                type="text"
                id="firstName"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                placeholder="Ahmet"
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                Soyad
              </label>
              <input
                {...register('lastName')}
                type="text"
                id="lastName"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                placeholder="Yılmaz"
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              {...register('email')}
              type="email"
              id="email"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              placeholder="ornek@email.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Şifre
            </label>
            <input
              {...register('password')}
              type="password"
              id="password"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Şifre Tekrar
            </label>
            <input
              {...register('confirmPassword')}
              type="password"
              id="confirmPassword"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              placeholder="••••••••"
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Kayıt yapılıyor...' : 'Kayıt Ol'}
          </button>
        </form>

        {/* Login Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Zaten hesabınız var mı?{' '}
            <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
              Giriş Yap
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}




