import { Router } from 'express';
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserStats
} from '../controllers/user.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Admin only routes
router.get('/', authorize('ADMIN'), getAllUsers);
router.get('/stats', authorize('ADMIN'), getUserStats);
router.get('/:id', authorize('ADMIN', 'TEACHER'), getUserById);
router.put('/:id', authorize('ADMIN'), updateUser);
router.delete('/:id', authorize('ADMIN'), deleteUser);

export default router;








