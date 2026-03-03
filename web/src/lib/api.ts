import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// İstek interceptor - Yetkilendirme tokeni ekle
api.interceptors.request.use(
  (config) => {
    // LocalStorage'dan token al
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Yanıt interceptor - Hataları işle
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token süresi dolmuş veya geçersiz - giriş sayfasına yönlendir
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ==================== ADMIN API ====================

// Tüm kullanıcıları getir (Admin)
export const getAllUsers = async (params?: {
  role?: string;
  search?: string;
  page?: number;
  limit?: number;
}) => {
  const queryParams = new URLSearchParams();
  if (params?.role) queryParams.append('role', params.role);
  if (params?.search) queryParams.append('search', params.search);
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  
  const response = await api.get(`/users?${queryParams.toString()}`);
  return response.data;
};

// Öğrenci ara (Teacher)
export const searchStudents = async (search: string, limit?: number) => {
  const queryParams = new URLSearchParams();
  queryParams.append('search', search);
  if (limit) queryParams.append('limit', limit.toString());
  
  const response = await api.get(`/users/search/students?${queryParams.toString()}`);
  return response.data;
};

// ID ile kullanıcı getir
export const getUserById = async (id: string) => {
  const response = await api.get(`/users/${id}`);
  return response.data;
};

// Kullanıcı güncelle (Admin)
export const updateUser = async (id: string, data: any) => {
  const response = await api.put(`/users/${id}`, data);
  return response.data;
};

// Kullanıcı sil (Admin)
export const deleteUser = async (id: string) => {
  const response = await api.delete(`/users/${id}`);
  return response.data;
};

// Kullanıcı istatistikleri getir (Admin)
export const getUserStats = async () => {
  const response = await api.get('/users/stats');
  return response.data;
};

// Audit log listesi (Admin)
export const getAuditLogs = async (params?: {
  page?: number;
  limit?: number;
  action?: string;
  entityType?: string;
  userId?: string;
}) => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.action) queryParams.append('action', params.action);
  if (params?.entityType) queryParams.append('entityType', params.entityType);
  if (params?.userId) queryParams.append('userId', params.userId);
  
  const response = await api.get(`/audit-logs?${queryParams.toString()}`);
  return response.data;
};

// Audit log istatistikleri (Admin)
export const getAuditStats = async () => {
  const response = await api.get('/audit-logs/stats');
  return response.data;
};

// ==================== AUTH API ====================

// Kayıt
export const register = async (data: any) => {
  const response = await api.post('/auth/register', data);
  return response.data;
};

// Giriş
export const login = async (email: string, password: string) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

  // Mevcut kullanıcı bilgisi getir
export const getMe = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

// Profil güncelle
export const updateProfile = async (data: any) => {
  const response = await api.put('/auth/profile', data);
  return response.data;
};

// Şifre değiştir
export const changePassword = async (currentPassword: string, newPassword: string) => {
  const response = await api.put('/auth/change-password', {
    currentPassword,
    newPassword,
  });
  return response.data;
};

// ==================== CLASSROOM API ====================

// Tüm classroom'ları getir (kullanıcıya göre)
export const getClassrooms = async () => {
  const response = await api.get('/classrooms');
  return response.data;
};

// Öğretmenin classroom'larını getir
export const getTeacherClassrooms = async () => {
  const response = await api.get('/classrooms');
  return response.data;
};

// Classroom detayını getir
export const getClassroomById = async (id: string) => {
  const response = await api.get(`/classrooms/${id}`);
  return response.data;
};

// Kod ile classroom bul
export const getClassroomByCode = async (code: string) => {
  const response = await api.get(`/classrooms/code/${code}`);
  return response.data;
};

// Yeni classroom oluştur
export const createClassroom = async (data: {
  name: string;
  description?: string;
  subject?: string;
  grade?: string;
  inviteOnly?: boolean;
  autoApprove?: boolean;
}) => {
  const response = await api.post('/classrooms', data);
  return response.data;
};

// Classroom güncelle
export const updateClassroom = async (id: string, data: {
  name?: string;
  description?: string;
  subject?: string;
  grade?: string;
  inviteOnly?: boolean;
  autoApprove?: boolean;
  isActive?: boolean;
}) => {
  const response = await api.put(`/classrooms/${id}`, data);
  return response.data;
};

// Classroom sil
export const deleteClassroom = async (id: string) => {
  const response = await api.delete(`/classrooms/${id}`);
  return response.data;
};

// Classroom üyelerini getir
export const getClassroomMembers = async (id: string) => {
  const response = await api.get(`/classrooms/${id}/members`);
  return response.data;
};

// Üyeyi çıkar
export const removeMember = async (classroomId: string, studentId: string) => {
  const response = await api.delete(`/classrooms/${classroomId}/members/${studentId}`);
  return response.data;
};

// Classroom'dan ayrıl
export const leaveClassroom = async (id: string) => {
  const response = await api.post(`/classrooms/${id}/leave`);
  return response.data;
};

// ==================== INVITATION API ====================

// Direkt davet gönder
export const sendDirectInvite = async (data: {
  classroomId: string;
  studentId: string;
  message?: string;
}) => {
  const response = await api.post('/invitations/direct', data);
  return response.data;
};

// Kodla katılım isteği gönder
export const requestJoinByCode = async (code: string) => {
  const response = await api.post('/invitations/join', { code });
  return response.data;
};

// Bekleyen davetleri getir
export const getPendingInvitations = async (type?: 'received' | 'sent') => {
  const params = type ? `?type=${type}` : '';
  const response = await api.get(`/invitations/pending${params}`);
  return response.data;
};

// Classroom için bekleyen istekleri getir
export const getClassroomPendingRequests = async (classroomId: string) => {
  const response = await api.get(`/invitations/classroom/${classroomId}/requests`);
  return response.data;
};

// Daveti kabul et
export const acceptInvitation = async (id: string) => {
  const response = await api.patch(`/invitations/${id}/accept`);
  return response.data;
};

// Daveti reddet
export const rejectInvitation = async (id: string) => {
  const response = await api.patch(`/invitations/${id}/reject`);
  return response.data;
};

// Daveti iptal et
export const cancelInvitation = async (id: string) => {
  const response = await api.delete(`/invitations/${id}`);
  return response.data;
};

// ==================== QUIZ/TEST API ====================

// Question API
export const createQuestion = async (data: any) => {
  const response = await api.post('/questions', data);
  return response.data;
};

export const getMyQuestions = async (params?: {
  subject?: string;
  topic?: string;
  grade?: string;
  page?: number;
  limit?: number;
}) => {
  const response = await api.get('/questions/my-questions', { params });
  return response.data;
};

export const getQuestionById = async (id: string) => {
  const response = await api.get(`/questions/${id}`);
  return response.data;
};

export const updateQuestion = async (id: string, data: any) => {
  const response = await api.put(`/questions/${id}`, data);
  return response.data;
};

export const deleteQuestion = async (id: string) => {
  const response = await api.delete(`/questions/${id}`);
  return response.data;
};

export const getRandomQuestions = async (params: {
  subject?: string;
  topic?: string;
  count?: number;
}) => {
  const response = await api.get('/questions/random', { params });
  return response.data;
};

// Test API
export const createTest = async (data: any) => {
  const response = await api.post('/tests', data);
  return response.data;
};

export const getMyTests = async (params?: {
  classroomId?: string;
  subject?: string;
  topic?: string;
  page?: number;
  limit?: number;
}) => {
  const response = await api.get('/tests/my-tests', { params });
  return response.data;
};

export const getTestById = async (id: string) => {
  const response = await api.get(`/tests/${id}`);
  return response.data;
};

export const updateTest = async (id: string, data: any) => {
  const response = await api.put(`/tests/${id}`, data);
  return response.data;
};

export const publishTest = async (id: string, isPublished: boolean) => {
  const response = await api.patch(`/tests/${id}/publish`, { isPublished });
  return response.data;
};

export const deleteTest = async (id: string) => {
  const response = await api.delete(`/tests/${id}`);
  return response.data;
};

export const getTeacherStatistics = async () => {
  const response = await api.get('/tests/statistics');
  return response.data;
};

// Student Test API
export const getMyAssignedTests = async (params?: {
  status?: string;
  page?: number;
  limit?: number;
}) => {
  const response = await api.get('/student-tests/assigned', { params });
  return response.data;
};

export const startTest = async (testId: string) => {
  const response = await api.post(`/student-tests/${testId}/start`);
  return response.data;
};

export const submitAnswer = async (studentTestId: string, data: {
  questionId: string;
  selectedOptionId: string;
}) => {
  const response = await api.post(`/student-tests/${studentTestId}/answer`, data);
  return response.data;
};

export const submitTest = async (studentTestId: string) => {
  const response = await api.post(`/student-tests/${studentTestId}/submit`);
  return response.data;
};

export const getTestResults = async (studentTestId: string) => {
  const response = await api.get(`/student-tests/${studentTestId}/results`);
  return response.data;
};

// ==================== PRACTICE (SORU HAVUZU) API ====================

// Havuzdaki soru sayısını kontrol et
export const getPoolQuestions = async (params: {
  subject: string;
  topic?: string;
  grade: string;
  difficulty?: string;
}) => {
  const response = await api.get('/practice/pool', { params });
  return response.data;
};

// Yeni pratik oturumu başlat
export const startPracticeSession = async (data: {
  subject: string;
  topic?: string;
  grade: string;
  questionCount: number;
  difficulty?: string;
}) => {
  const response = await api.post('/practice/sessions', data);
  return response.data;
};

// Soru cevapla (anında feedback)
export const answerPracticeQuestion = async (sessionId: string, data: {
  questionId: string;
  selectedOptionId: string;
  timeSpent?: number;
}) => {
  const response = await api.post(`/practice/sessions/${sessionId}/answer`, data);
  return response.data;
};

// Oturumu tamamla ve sonuçları al
export const completePracticeSession = async (sessionId: string) => {
  const response = await api.post(`/practice/sessions/${sessionId}/complete`);
  return response.data;
};

// Geçmiş pratik oturumlarını listele
export const getPracticeSessions = async (params?: {
  subject?: string;
  status?: string;
  page?: number;
  limit?: number;
}) => {
  const response = await api.get('/practice/sessions', { params });
  return response.data;
};

// Tek oturum detayı
export const getPracticeSession = async (sessionId: string) => {
  const response = await api.get(`/practice/sessions/${sessionId}`);
  return response.data;
};

// Pratik çalışma istatistikleri
export const getPracticeStats = async (subject?: string) => {
  const params = subject ? { subject } : {};
  const response = await api.get('/practice/stats', { params });
  return response.data;
};

// ==================== QUESTION API (Havuz Toggle) ====================

// Soruyu genel havuza ekle/çıkar
export const toggleQuestionPublic = async (questionId: string, isPublic: boolean) => {
  const response = await api.patch(`/questions/${questionId}/toggle-public`, { isPublic });
  return response.data;
};
export default api;
