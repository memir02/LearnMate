import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { getAuditLogs, getAuditStats } from '../controllers/auditLog.controller';

const router = Router();

// Tüm route'lar admin yetkisi gerektirir
router.use(authenticate);
router.use(authorize('ADMIN'));

// Audit log listesi
router.get('/', getAuditLogs);

// İstatistikler
router.get('/stats', getAuditStats);

export default router;



