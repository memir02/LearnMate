'use client';

import { useEffect, useState } from 'react';
import { getPendingInvitations, acceptInvitation, rejectInvitation } from '@/lib/api';
import { ClassroomInvitation } from '@/lib/types';
import Link from 'next/link';

export default function StudentInvitations() {
  const [invitations, setInvitations] = useState<ClassroomInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const response = await getPendingInvitations('received');
      setInvitations(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Davetler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (id: string) => {
    try {
      await acceptInvitation(id);
      fetchInvitations();
      alert('Davet kabul edildi! Classroom\'ınıza hoş geldiniz.');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Davet kabul edilemedi');
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm('Bu daveti reddetmek istediğinize emin misiniz?')) {
      return;
    }

    try {
      await rejectInvitation(id);
      fetchInvitations();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Davet reddedilemedi');
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
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Davetlerim</h1>
          <p className="text-gray-600 mt-2">
            Size gönderilen classroom davetleri
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Invitations */}
        {invitations.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Davet yok
            </h3>
            <p className="text-gray-600 mb-6">
              Henüz bekleyen classroom davetiniz bulunmuyor
            </p>
            <Link
              href="/student/classrooms"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Classroom'larıma Git
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {invitations.map((invitation) => (
              <div
                key={invitation.id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Classroom Info */}
                    <div className="mb-4">
                      <h3 className="text-xl font-bold text-gray-900 mb-1">
                        {invitation.classroom?.name}
                      </h3>
                      {(invitation.classroom?.subject || invitation.classroom?.grade) && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                          {invitation.classroom.subject && <span>{invitation.classroom.subject}</span>}
                          {invitation.classroom.subject && invitation.classroom.grade && <span>•</span>}
                          {invitation.classroom.grade && <span>{invitation.classroom.grade}. Sınıf</span>}
                        </div>
                      )}
                      {invitation.classroom?.description && (
                        <p className="text-gray-600">{invitation.classroom.description}</p>
                      )}
                    </div>

                    {/* Teacher Info */}
                    {invitation.inviter?.teacher && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>
                          {invitation.inviter.teacher.firstName} {invitation.inviter.teacher.lastName}
                        </span>
                        <span className="text-gray-400">tarafından davet edildiniz</span>
                      </div>
                    )}

                    {/* Message */}
                    {invitation.message && (
                      <div className="bg-blue-50 border-l-4 border-blue-600 p-3 mb-3">
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Mesaj:</span> {invitation.message}
                        </p>
                      </div>
                    )}

                    {/* Date */}
                    <p className="text-xs text-gray-500">
                      Davet tarihi: {new Date(invitation.createdAt).toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>

                    {/* Expiry */}
                    {invitation.expiresAt && (
                      <p className="text-xs text-orange-600 mt-1">
                        Son geçerlilik: {new Date(invitation.expiresAt).toLocaleDateString('tr-TR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 ml-4">
                    <button
                      onClick={() => handleAccept(invitation.id)}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      Kabul Et
                    </button>
                    <button
                      onClick={() => handleReject(invitation.id)}
                      className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                    >
                      Reddet
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}











