import { Router } from 'express';
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserStats,
  searchStudents
} from '../controllers/user.controller';
import { authenticate, authorize, checkOwnerOrAdmin } from '../middleware/auth.middleware';

const router = Router();

// Tüm yönlendirmeler kimlik doğrulama gerektirir
router.use(authenticate);

// Admin sadece yönlendirmeler (tüm kullanıcıları getirir)
router.get('/', authorize('ADMIN'), getAllUsers);
router.get('/stats', authorize('ADMIN'), getUserStats);

// Öğretmen öğrenci arama (Teacher ve Admin)
router.get('/search/students', authorize('TEACHER', 'ADMIN'), searchStudents);

// Admin, Teacher, veya Owner kullanıcı detaylarını görüntüleyebilir
router.get('/:id', checkOwnerOrAdmin, getUserById);

// Admin sadece kullanıcıları güncelleyebilir veya siler
router.put('/:id', authorize('ADMIN'), updateUser);
router.delete('/:id', authorize('ADMIN'), deleteUser);

export default router;








