import { Router } from 'express';
import {
  createQuestion,
  getMyQuestions,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
  getRandomQuestions,
  toggleQuestionPublic,
} from '../controllers/question.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// Tüm route'lar authentication gerektirir
router.use(authenticate);

/**
 * @route   POST /api/questions
 * @desc    Yeni soru oluştur
 * @access  Teacher
 */
router.post('/', authorize('TEACHER', 'ADMIN'), createQuestion);

/**
 * @route   GET /api/questions/my-questions
 * @desc    Öğretmenin sorularını listele (filtreleme ile)
 * @access  Teacher
 */
router.get('/my-questions', authorize('TEACHER', 'ADMIN'), getMyQuestions);

/**
 * @route   GET /api/questions/random
 * @desc    Rastgele soru seç (soru havuzu)
 * @access  Teacher
 */
router.get('/random', authorize('TEACHER', 'ADMIN'), getRandomQuestions);

/**
 * @route   GET /api/questions/:id
 * @desc    Soru detayı getir
 * @access  Teacher (sadece kendi sorusu)
 */
router.get('/:id', authorize('TEACHER', 'ADMIN'), getQuestionById);

/**
 * @route   PUT /api/questions/:id
 * @desc    Soru güncelle
 * @access  Teacher (sadece kendi sorusu)
 */
router.put('/:id', authorize('TEACHER', 'ADMIN'), updateQuestion);

/**
 * @route   PATCH /api/questions/:id/toggle-public
 * @desc    Soruyu genel havuza ekle/çıkar
 * @access  Teacher (sadece kendi sorusu)
 */
router.patch('/:id/toggle-public', authorize('TEACHER', 'ADMIN'), toggleQuestionPublic);

/**
 * @route   DELETE /api/questions/:id
 * @desc    Soru sil
 * @access  Teacher (sadece kendi sorusu)
 */
router.delete('/:id', authorize('TEACHER', 'ADMIN'), deleteQuestion);

export default router;






