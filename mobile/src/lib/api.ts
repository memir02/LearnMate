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

export default api;
