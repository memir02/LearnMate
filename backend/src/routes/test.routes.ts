import { Router } from 'express';
import {
  createTest,
  getMyTests,
  getTestById,
  updateTest,
  publishTest,
  deleteTest,
  getTeacherStatistics,
} from '../controllers/test.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// Tüm route'lar authentication gerektirir
router.use(authenticate);

/**
 * @route   POST /api/tests
 * @desc    Yeni test oluştur
 * @access  Teacher
 */
router.post('/', authorize('TEACHER', 'ADMIN'), createTest);

/**
 * @route   GET /api/tests/statistics
 * @desc    Öğretmen istatistiklerini getir
 * @access  Teacher
 */
router.get('/statistics', authorize('TEACHER', 'ADMIN'), getTeacherStatistics);

/**
 * @route   GET /api/tests/my-tests
 * @desc    Öğretmenin testlerini listele
 * @access  Teacher
 */
router.get('/my-tests', authorize('TEACHER', 'ADMIN'), getMyTests);

/**
 * @route   GET /api/tests/:id
 * @desc    Test detayı getir
 * @access  Teacher (kendi testi) veya Student (atanmış test)
 */
router.get('/:id', getTestById);

/**
 * @route   PUT /api/tests/:id
 * @desc    Test güncelle
 * @access  Teacher (sadece kendi testi)
 */
router.put('/:id', authorize('TEACHER', 'ADMIN'), updateTest);

/**
 * @route   PATCH /api/tests/:id/publish
 * @desc    Test yayınla/yayından kaldır
 * @access  Teacher
 */
router.patch('/:id/publish', authorize('TEACHER', 'ADMIN'), publishTest);

/**
 * @route   DELETE /api/tests/:id
 * @desc    Test sil
 * @access  Teacher (sadece kendi testi)
 */
router.delete('/:id', authorize('TEACHER', 'ADMIN'), deleteTest);

export default router;




