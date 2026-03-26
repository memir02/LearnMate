import { Router } from 'express';
import {
  createHomework,
  getMyHomeworks,
  getClassroomHomeworks,
  deleteHomework,
} from '../controllers/homework.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { upload } from '../utils/cloudinary';

const router = Router();

router.use(authenticate);

/**
 * @route  POST /api/homework
 * @desc   Ödev oluştur (dosya yükle)
 * @access Teacher
 */
router.post(
  '/',
  authorize('TEACHER', 'ADMIN'),
  upload.single('file'),
  createHomework
);

/**
 * @route  GET /api/homework/my
 * @desc   Öğretmenin ödevlerini listele
 * @access Teacher
 */
router.get('/my', authorize('TEACHER', 'ADMIN'), getMyHomeworks);

/**
 * @route  GET /api/homework/classroom/:classroomId
 * @desc   Sınıfa ait ödevleri listele
 * @access Teacher (owner) veya Student (üye)
 */
router.get('/classroom/:classroomId', getClassroomHomeworks);

/**
 * @route  DELETE /api/homework/:id
 * @desc   Ödevi sil (Cloudinary'den de)
 * @access Teacher (sadece kendi ödevi)
 */
router.delete('/:id', authorize('TEACHER', 'ADMIN'), deleteHomework);

export default router;
