'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  getClassroomById,
  getClassroomPendingRequests,
  removeMember,
  acceptInvitation,
  rejectInvitation,
  sendDirectInvite,
  searchStudents
} from '@/lib/api';
import { Classroom, ClassroomInvitation, User } from '@/lib/types';

export default function ClassroomDetail() {
  const params = useParams();
  const router = useRouter();
  const classroomId = params.id as string;

  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [pendingRequests, setPendingRequests] = useState<ClassroomInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'members' | 'pending'>('members');

  // Davet modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    if (classroomId) {
      fetchClassroom();
      fetchPendingRequests();
    }
  }, [classroomId]);

  const fetchClassroom = async () => {
    try {
      setLoading(true);
      const response = await getClassroomById(classroomId);
      setClassroom(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Classroom yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const response = await getClassroomPendingRequests(classroomId);
      setPendingRequests(response.data);
    } catch (err: any) {
      console.error('Bekleyen istekler yüklenemedi:', err);
    }
  };

  const handleAcceptRequest = async (invitationId: string) => {
    try {
      await acceptInvitation(invitationId);
      // Refresh
      fetchClassroom();
      fetchPendingRequests();
    } catch (err: any) {
      alert(err.response?.data?.message || 'İstek kabul edilemedi');
    }
  };

  const handleRejectRequest = async (invitationId: string) => {
    try {
      await rejectInvitation(invitationId);
      fetchPendingRequests();
    } catch (err: any) {
      alert(err.response?.data?.message || 'İstek reddedilemedi');
    }
  };

  const handleRemoveMember = async (studentId: string, studentName: string) => {
    if (!confirm(`${studentName} isimli öğrenciyi classroom'dan çıkarmak istediğinize emin misiniz?`)) {
      return;
    }

    try {
      await removeMember(classroomId, studentId);
      fetchClassroom();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Üye çıkarılamadı');
    }
  };

  const performSearch = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await searchStudents(query);
      setSearchResults(response.data);
    } catch (err: any) {
      console.error('Arama hatası:', err);
    }
  };

  const handleInviteStudent = async (studentId: string) => {
    try {
      setInviting(true);
      await sendDirectInvite({
        classroomId,
        studentId
      });
      alert('Davet başarıyla gönderildi!');
      setShowInviteModal(false);
      setSearchQuery('');
      setSearchResults([]);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Davet gönderilemedi');
    } finally {
      setInviting(false);
    }
  };

  const copyCode = () => {
    if (classroom?.code) {
      navigator.clipboard.writeText(classroom.code);
      alert('Kod kopyalandı!');
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

  if (!classroom) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Classroom bulunamadı'}</p>
          <Link href="/teacher/classrooms" className="text-blue-600 hover:underline">
            Classroom'lara Dön
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/teacher/classrooms"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Classroom'lara Dön
          </Link>

          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{classroom.name}</h1>
              {(classroom.subject || classroom.grade) && (
                <div className="flex items-center gap-2 text-gray-600 mt-2">
                  {classroom.subject && <span>{classroom.subject}</span>}
                  {classroom.subject && classroom.grade && <span>•</span>}
                  {classroom.grade && <span>{classroom.grade}. Sınıf</span>}
                </div>
              )}
              {classroom.description && (
                <p className="text-gray-600 mt-2">{classroom.description}</p>
              )}
            </div>
            <button
              onClick={() => setShowInviteModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Öğrenci Davet Et
            </button>
          </div>
        </div>

        {/* Classroom Code Card */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Classroom Kodu</h3>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-mono font-bold text-blue-600">
                  {classroom.code}
                </span>
                <button
                  onClick={copyCode}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Kodu Kopyala"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Öğrenciler bu kodu kullanarak classroom'a katılabilir
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                {classroom.members?.length || 0}
              </div>
              <p className="text-sm text-gray-600">Toplam Öğrenci</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('members')}
                className={`px-6 py-4 font-medium transition-colors ${
                  activeTab === 'members'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Üyeler ({classroom.members?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('pending')}
                className={`px-6 py-4 font-medium transition-colors relative ${
                  activeTab === 'pending'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Bekleyen İstekler ({pendingRequests.length})
                {pendingRequests.length > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'members' && (
              <div className="space-y-4">
                {classroom.members && classroom.members.length > 0 ? (
                  classroom.members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-lg">
                            {member.student?.student?.firstName?.charAt(0) || '?'}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {member.student?.student?.firstName} {member.student?.student?.lastName}
                          </h4>
                          <p className="text-sm text-gray-600">{member.student?.email}</p>
                          {member.student?.student?.grade && (
                            <p className="text-sm text-gray-500">{member.student.student.grade}. Sınıf</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveMember(
                          member.studentId,
                          `${member.student?.student?.firstName} ${member.student?.student?.lastName}`
                        )}
                        className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        Çıkar
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <p className="text-gray-600">Henüz üye yok</p>
                    <button
                      onClick={() => setShowInviteModal(true)}
                      className="mt-4 text-blue-600 hover:underline"
                    >
                      Öğrenci Davet Et
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'pending' && (
              <div className="space-y-4">
                {pendingRequests.length > 0 ? (
                  pendingRequests.map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between p-4 border border-orange-200 bg-orange-50 rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-orange-200 rounded-full flex items-center justify-center">
                          <span className="text-orange-700 font-semibold text-lg">
                            {request.student?.student?.firstName?.charAt(0) || '?'}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {request.student?.student?.firstName} {request.student?.student?.lastName}
                          </h4>
                          <p className="text-sm text-gray-600">{request.student?.email}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(request.createdAt).toLocaleDateString('tr-TR', {
                              day: 'numeric',
                              month: 'long',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAcceptRequest(request.id)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Onayla
                        </button>
                        <button
                          onClick={() => handleRejectRequest(request.id)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                          Reddet
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-gray-600">Bekleyen istek yok</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Öğrenci Davet Et</h3>
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <input
              type="text"
              placeholder="Öğrenci adı veya email ara..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                performSearch(e.target.value);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4 text-gray-900"
            />

            <div className="max-h-96 overflow-y-auto space-y-2">
              {searchResults.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {student.student?.firstName} {student.student?.lastName}
                    </p>
                    <p className="text-sm text-gray-600">{student.email}</p>
                  </div>
                  <button
                    onClick={() => handleInviteStudent(student.id)}
                    disabled={inviting}
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm disabled:bg-gray-400"
                  >
                    Davet Et
                  </button>
                </div>
              ))}

              {searchQuery.length >= 2 && searchResults.length === 0 && (
                <p className="text-center text-gray-600 py-4">Sonuç bulunamadı</p>
              )}

              {searchQuery.length < 2 && (
                <p className="text-center text-gray-500 py-4 text-sm">
                  Aramak için en az 2 karakter girin
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

