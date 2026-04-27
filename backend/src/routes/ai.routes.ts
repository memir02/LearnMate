import { Router } from 'express';
import { getStudyPlan, analyzeTestResult } from '../controllers/ai.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

/**
 * @route  GET /api/ai/study-plan
 * @desc   Öğrencinin test sonuçlarına göre kişisel çalışma planı oluştur
 * @access Student
 */
router.get('/study-plan', authorize('STUDENT'), getStudyPlan);

/**
 * @route  GET /api/ai/analyze/:studentTestId
 * @desc   Belirli bir test sonucunu analiz et
 * @access Student
 */
router.get('/analyze/:studentTestId', authorize('STUDENT'), analyzeTestResult);

export default router;
