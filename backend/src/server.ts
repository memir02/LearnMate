import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// ========================================
// MIDDLEWARE
// ========================================

// Security
app.use(helmet());

// CORS Configuration
app.use(cors({
  origin: [
    process.env.WEB_URL || 'http://localhost:3000',
    process.env.MOBILE_URL || 'http://localhost:8081'
  ],
  credentials: true
}));

// Rate Limiting - Development'ta devre dışı, Production'da aktif
if (process.env.NODE_ENV === 'production') {
  // Production için genel rate limit
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 dakika
    max: 100, // 100 istek
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api/', limiter);
}

// Authentication route'ları için özel rate limiting (her ortamda aktif)
app.use('/api/auth/login', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: process.env.NODE_ENV === 'production' ? 5 : 50, // Production'da 5, Development'ta 50
  message: 'Too many login attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
}));

app.use('/api/auth/register', rateLimit({
  windowMs: 60 * 60 * 1000, // 1 saat
  max: process.env.NODE_ENV === 'production' ? 3 : 30, // Production'da 3, Development'ta 30
  message: 'Too many registration attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
}));

// Body Parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie Parser
app.use(cookieParser());

// ========================================
// ROUTES
// ========================================

// Import routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import classroomRoutes from './routes/classroom.routes';
import invitationRoutes from './routes/invitation.routes';
import questionRoutes from './routes/question.routes';
import testRoutes from './routes/test.routes';
import studentTestRoutes from './routes/student-test.routes';
import practiceRoutes from './routes/practice.routes';
import auditLogRoutes from './routes/auditLog.routes';
import homeworkRoutes from './routes/homework.routes';
import uploadRoutes from './routes/upload.routes';
import aiRoutes from './routes/ai.routes';

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'LearnMate API is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/classrooms', classroomRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/student-tests', studentTestRoutes);
app.use('/api/practice', practiceRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/homework', homeworkRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/ai', aiRoutes);
// app.use('/api/subjects', subjectRoutes);
// app.use('/api/notifications', notificationRoutes);

// 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found'
  });
});

// ========================================
// ERROR HANDLER
// ========================================

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    status: 'error',
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ========================================
// START SERVER
// ========================================

app.listen(PORT, () => {
  console.log(`🚀 LearnMate API running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
});

export default app;

