import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  getPoolQuestions,
  startPracticeSession,
  answerPracticeQuestion,
  completePracticeSession,
  getPracticeSessions,
  getPracticeSession,
  getPracticeStats,
} from '../controllers/practice.controller';

const router = Router();

// Tüm route'lar authentication gerektirir
router.use(authenticate);

// Havuz soruları
router.get('/pool', getPoolQuestions);

// Pratik oturumları
router.post('/sessions', startPracticeSession);
router.get('/sessions', getPracticeSessions);
router.get('/sessions/:id', getPracticeSession);
router.post('/sessions/:id/answer', answerPracticeQuestion);
router.post('/sessions/:id/complete', completePracticeSession);

// İstatistikler
router.get('/stats', getPracticeStats);

export default router;

