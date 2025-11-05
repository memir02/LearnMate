// User Types
export interface User {
  id: string;
  email: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT';
  student?: Student;
  teacher?: Teacher;
}

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  grade?: string; // Sınıf (1-8)
  phone?: string;
  parentPhone?: string; // Veli telefonu
  avatarUrl?: string;
}

export interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  subject?: string; // Branş
  experience?: number; // Deneyim (yıl)
  title?: string; // Unvan
  phone?: string;
  avatarUrl?: string;
  bio?: string;
}

// Auth Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'TEACHER' | 'STUDENT';
}

export interface AuthResponse {
  token: string;
  user: User;
}

// Classroom Types
export interface Classroom {
  id: string;
  name: string;
  description?: string;
  teacherId: string;
  code: string;
  isActive: boolean;
  createdAt: string;
  teacher?: User;
  _count?: {
    members: number;
  };
}

// Subject & Topic Types
export interface Subject {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  orderIndex?: number;
}

export interface Topic {
  id: string;
  subjectId: string;
  name: string;
  description?: string;
  orderIndex?: number;
  subject?: Subject;
}

// Question Types
export type QuestionType = 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'OPEN_ENDED';
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface QuestionOption {
  id: string;
  questionId: string;
  optionText: string;
  isCorrect: boolean;
  orderIndex: number;
}

export interface Question {
  id: string;
  topicId?: string;
  questionText: string;
  questionType: QuestionType;
  difficulty: Difficulty;
  points: number;
  explanation?: string;
  createdBy: string;
  isPublic: boolean;
  createdAt: string;
  topic?: Topic;
  options: QuestionOption[];
}

// Test Types
export interface Test {
  id: string;
  title: string;
  description?: string;
  teacherId: string;
  classroomId?: string;
  durationMinutes?: number;
  totalPoints: number;
  passingScore?: number;
  isPublished: boolean;
  showResults: boolean;
  shuffleQuestions: boolean;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  teacher?: User;
  classroom?: Classroom;
  _count?: {
    testQuestions: number;
  };
}

export interface TestQuestion {
  id: string;
  testId: string;
  questionId: string;
  orderIndex: number;
  points: number;
  question: Question;
}

// Student Test Types
export type StudentTestStatus = 'ASSIGNED' | 'STARTED' | 'SUBMITTED' | 'GRADED';

export interface StudentTest {
  id: string;
  testId: string;
  studentId: string;
  status: StudentTestStatus;
  score?: number;
  percentage?: number;
  isPassed?: boolean;
  startedAt?: string;
  submittedAt?: string;
  createdAt: string;
  test: Test;
  student: User;
}

export interface StudentAnswer {
  id: string;
  studentTestId: string;
  questionId: string;
  selectedOptionId?: string;
  answerText?: string;
  isCorrect?: boolean;
  pointsEarned: number;
  answeredAt: string;
}

// Notification Types
export type NotificationType = 
  | 'TEST_ASSIGNED' 
  | 'TEST_GRADED' 
  | 'ANNOUNCEMENT' 
  | 'REMINDER' 
  | 'SYSTEM';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
}

export interface PaginatedResponse<T> {
  status: 'success';
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}







