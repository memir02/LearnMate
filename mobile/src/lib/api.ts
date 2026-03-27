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
  getMyQuestions: (params?: { subject?: string; grade?: string; topic?: string; difficulty?: string }) =>
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

export default api;
