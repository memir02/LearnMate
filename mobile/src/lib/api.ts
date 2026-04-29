import axios from 'axios';
import { getToken, clearAuth } from './storage';
import { API_BASE_URL } from './config';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await clearAuth();
    }
    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  register: (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: 'STUDENT' | 'TEACHER';
    grade?: string;
  }) => api.post('/auth/register', data),

  getMe: () => api.get('/auth/me'),
};

// ── Classrooms ────────────────────────────────────────
export const classroomApi = {
  getAll: () => api.get('/classrooms'),

  getById: (id: string) => api.get(`/classrooms/${id}`),

  create: (data: {
    name: string;
    description?: string;
    subject?: string;
    grade?: string;
  }) => api.post('/classrooms', data),

  delete: (id: string) => api.delete(`/classrooms/${id}`),

  removeMember: (classroomId: string, studentId: string) =>
    api.delete(`/classrooms/${classroomId}/members/${studentId}`),

  leave: (classroomId: string) => api.post(`/classrooms/${classroomId}/leave`),

  getMembers: (classroomId: string) => api.get(`/classrooms/${classroomId}/members`),
};

// ── Upload ────────────────────────────────────────────
export const uploadApi = {
  image: async (uri: string) => {
    const formData = new FormData();
    const filename = uri.split('/').pop() ?? 'image.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';
    formData.append('image', { uri, name: filename, type } as any);
    return api.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// ── Questions ─────────────────────────────────────────
export const questionApi = {
  getMyQuestions: (params?: { subject?: string; grade?: string; topic?: string; difficulty?: string; page?: number; limit?: number }) =>
    api.get('/questions/my-questions', { params }),

  getById: (id: string) => api.get(`/questions/${id}`),

  create: (data: {
    questionText: string;
    subject?: string;
    topic?: string;
    grade?: string;
    difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
    imageUrl?: string;
    isPublic?: boolean;
    options: { optionText: string; isCorrect: boolean; orderIndex: number }[];
  }) => api.post('/questions', data),

  update: (id: string, data: any) => api.put(`/questions/${id}`, data),

  delete: (id: string) => api.delete(`/questions/${id}`),

  togglePublic: (id: string, isPublic: boolean) =>
    api.patch(`/questions/${id}/toggle-public`, { isPublic }),
};

// ── Tests ─────────────────────────────────────────────
export const testApi = {
  getMyTests: (params?: { page?: number; limit?: number; subject?: string; topic?: string }) =>
    api.get('/tests/my-tests', { params }),

  getById: (id: string) => api.get(`/tests/${id}`),

  create: (data: {
    title: string;
    description?: string;
    subject?: string;
    topic?: string;
    grade?: string;
    classroomId?: string;
    durationMinutes?: number;
    passingScore?: number;
    showResults?: boolean;
    shuffleQuestions?: boolean;
    startDate?: string;
    endDate?: string;
    questionIds: string[];
  }) => api.post('/tests', data),

  publish: (id: string, isPublished: boolean) =>
    api.patch(`/tests/${id}/publish`, { isPublished }),

  delete: (id: string) => api.delete(`/tests/${id}`),

  getTeacherStats: () => api.get('/tests/statistics'),
};

// ── User / Profile ───────────────────────────────────
export const userApi = {
  updateMyProfile: (data: { firstName?: string; lastName?: string; phone?: string; grade?: string; parentPhone?: string }) =>
    api.put('/users/me', data),

  changeMyPassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put('/users/me/password', data),
};

// ── Homework ──────────────────────────────────────────
export const homeworkApi = {
  getByClassroom: (classroomId: string) => api.get(`/homework/classroom/${classroomId}`),
  getStudentHomeworks: () => api.get('/homework/student'),
  getMyHomeworks: () => api.get('/homework/my'),

  create: async (data: {
    title: string;
    description?: string;
    classroomId: string;
    dueDate?: string;
    fileUri: string;
    fileName: string;
    fileMimeType: string;
  }) => {
    const formData = new FormData();
    formData.append('title', data.title);
    if (data.description) formData.append('description', data.description);
    formData.append('classroomId', data.classroomId);
    if (data.dueDate) formData.append('dueDate', data.dueDate);
    formData.append('file', {
      uri: data.fileUri,
      name: data.fileName,
      type: data.fileMimeType,
    } as any);
    return api.post('/homework', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 90000, // Cloudinary yüklemesi için 90s
      transformRequest: [(d) => d], // FormData'yı JSON'a çevirme
    });
  },

  delete: (id: string) => api.delete(`/homework/${id}`),
};

// ── Student Tests ─────────────────────────────────────
export const studentTestApi = {
  getAssigned: () => api.get('/student-tests/assigned'),
  start: (testId: string) => api.post(`/student-tests/${testId}/start`),
  submitAnswer: (studentTestId: string, data: { questionId: string; selectedOptionId: string }) =>
    api.post(`/student-tests/${studentTestId}/answer`, data),
  submit: (studentTestId: string) => api.post(`/student-tests/${studentTestId}/submit`),
  getResults: (studentTestId: string) => api.get(`/student-tests/${studentTestId}/results`),
};

// ── Invitations ───────────────────────────────────────
export const invitationApi = {
  getPending: () => api.get('/invitations/pending?type=received'),
  joinByCode: (code: string) => api.post('/invitations/join', { code }),
  accept: (id: string) => api.patch(`/invitations/${id}/accept`),
  reject: (id: string) => api.patch(`/invitations/${id}/reject`),
};

// ── AI ────────────────────────────────────────────────
export const practiceApi = {
  getPool: (params: { subject?: string; topic?: string; grade?: string; difficulty?: string }) =>
    api.get('/practice/pool', { params }),
  startSession: (data: {
    subject: string;
    topic?: string;
    grade: string;
    questionCount: number;
    difficulty?: string;
  }) => api.post('/practice/sessions', data),
  answerQuestion: (sessionId: string, data: { questionId: string; selectedOptionId: string }) =>
    api.post(`/practice/sessions/${sessionId}/answer`, data),
  completeSession: (sessionId: string) => api.post(`/practice/sessions/${sessionId}/complete`),
  getSession: (sessionId: string) => api.get(`/practice/sessions/${sessionId}`),
  getSessions: (params?: { limit?: number }) => api.get('/practice/sessions', { params }),
};

export const aiApi = {
  getStudyPlan: () => api.get('/ai/study-plan'),
  analyzeTest: (studentTestId: string) => api.get(`/ai/analyze/${studentTestId}`),
};

export default api;
