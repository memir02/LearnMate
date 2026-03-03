import { Router } from 'express';
import {
  getMyAssignedTests,
  startTest,
  submitAnswer,
  submitTest,
  getTestResults,
} from '../controllers/student-test.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// Tüm route'lar authentication gerektirir
router.use(authenticate);

/**
 * @route   GET /api/student-tests/assigned
 * @desc    Öğrenciye atanan testleri listele
 * @access  Student
 */
router.get('/assigned', authorize('STUDENT'), getMyAssignedTests);

/**
 * @route   POST /api/student-tests/:testId/start
 * @desc    Teste başla
 * @access  Student
 */
router.post('/:testId/start', authorize('STUDENT'), startTest);

/**
 * @route   POST /api/student-tests/:studentTestId/answer
 * @desc    Cevap gönder (tek soru)
 * @access  Student
 */
router.post('/:studentTestId/answer', authorize('STUDENT'), submitAnswer);

/**
 * @route   POST /api/student-tests/:studentTestId/submit
 * @desc    Testi tamamla
 * @access  Student
 */
router.post('/:studentTestId/submit', authorize('STUDENT'), submitTest);

/**
 * @route   GET /api/student-tests/:studentTestId/results
 * @desc    Test sonuçlarını görüntüle
 * @access  Student
 */
router.get('/:studentTestId/results', authorize('STUDENT'), getTestResults);

export default router;








