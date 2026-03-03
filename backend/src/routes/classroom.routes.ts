import { Router } from 'express';
import {
  createClassroom,
  getClassrooms,
  getClassroomById,
  getClassroomByCode,
  updateClassroom,
  deleteClassroom,
  getClassroomMembers,
  removeMember,
  leaveClassroom
} from '../controllers/classroom.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// Tüm route'lar authentication gerektirir
router.use(authenticate);

/**
 * @route   POST /api/classrooms
 * @desc    Yeni classroom oluştur
 * @access  Teacher
 */
router.post('/', authorize('TEACHER', 'ADMIN'), createClassroom);

/**
 * @route   GET /api/classrooms
 * @desc    Kullanıcının classroom'larını getir
 * @access  Authenticated
 */
router.get('/', getClassrooms);

/**
 * @route   GET /api/classrooms/code/:code
 * @desc    Kod ile classroom bul
 * @access  Authenticated
 */
router.get('/code/:code', getClassroomByCode);

/**
 * @route   GET /api/classrooms/:id
 * @desc    Classroom detayını getir
 * @access  Teacher (owner) or Member
 */
router.get('/:id', getClassroomById);

/**
 * @route   PUT /api/classrooms/:id
 * @desc    Classroom güncelle
 * @access  Teacher (owner)
 */
router.put('/:id', authorize('TEACHER', 'ADMIN'), updateClassroom);

/**
 * @route   DELETE /api/classrooms/:id
 * @desc    Classroom sil
 * @access  Teacher (owner)
 */
router.delete('/:id', authorize('TEACHER', 'ADMIN'), deleteClassroom);

/**
 * @route   GET /api/classrooms/:id/members
 * @desc    Classroom üyelerini getir
 * @access  Teacher (owner) or Member
 */
router.get('/:id/members', getClassroomMembers);

/**
 * @route   DELETE /api/classrooms/:id/members/:studentId
 * @desc    Classroom'dan üye çıkar
 * @access  Teacher (owner)
 */
router.delete('/:id/members/:studentId', authorize('TEACHER', 'ADMIN'), removeMember);

/**
 * @route   POST /api/classrooms/:id/leave
 * @desc    Classroom'dan ayrıl
 * @access  Student
 */
router.post('/:id/leave', authorize('STUDENT'), leaveClassroom);

export default router;











