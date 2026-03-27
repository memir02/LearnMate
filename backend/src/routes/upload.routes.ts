import { Router, Response } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { upload } from '../utils/cloudinary';
import { AuthRequest } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

/**
 * @route  POST /api/upload/image
 * @desc   Görsel yükle, Cloudinary URL döndür
 * @access Teacher
 */
router.post(
  '/image',
  authorize('TEACHER', 'ADMIN'),
  upload.single('image'),
  (req: AuthRequest, res: Response) => {
    const file = req.file as any;
    if (!file) {
      return res.status(400).json({ status: 'error', message: 'Görsel yüklenmedi.' });
    }
    return res.status(200).json({
      status: 'success',
      data: {
        url: file.path,
        publicId: file.filename,
      },
    });
  }
);

export default router;
