import { Router } from 'express';
import {
  sendDirectInvite,
  requestJoinByCode,
  getPendingInvitations,
  getClassroomPendingRequests,
  acceptInvitation,
  rejectInvitation,
  cancelInvitation
} from '../controllers/invitation.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// Tüm route'lar authentication gerektirir
router.use(authenticate);

/**
 * @route   POST /api/invitations/direct
 * @desc    Öğretmen direkt davet gönderir
 * @access  Teacher
 */
router.post('/direct', authorize('TEACHER', 'ADMIN'), sendDirectInvite);

/**
 * @route   POST /api/invitations/join
 * @desc    Öğrenci kodla katılım isteği gönderir
 * @access  Student
 */
router.post('/join', authorize('STUDENT'), requestJoinByCode);

/**
 * @route   GET /api/invitations/pending
 * @desc    Bekleyen davetleri getir
 * @access  Authenticated
 * @query   type=received|sent
 */
router.get('/pending', getPendingInvitations);

/**
 * @route   GET /api/invitations/classroom/:classroomId/requests
 * @desc    Belirli bir classroom için bekleyen istekleri getir
 * @access  Teacher (owner)
 */
router.get('/classroom/:classroomId/requests', authorize('TEACHER', 'ADMIN'), getClassroomPendingRequests);

/**
 * @route   PATCH /api/invitations/:id/accept
 * @desc    Daveti kabul et
 * @access  Student (DIRECT) or Teacher (CODE_REQUEST)
 */
router.patch('/:id/accept', acceptInvitation);

/**
 * @route   PATCH /api/invitations/:id/reject
 * @desc    Daveti reddet
 * @access  Student (DIRECT) or Teacher (CODE_REQUEST)
 */
router.patch('/:id/reject', rejectInvitation);

/**
 * @route   DELETE /api/invitations/:id
 * @desc    Daveti iptal et
 * @access  Teacher (sender)
 */
router.delete('/:id', authorize('TEACHER', 'ADMIN'), cancelInvitation);

export default router;











