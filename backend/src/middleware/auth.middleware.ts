import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'ADMIN' | 'TEACHER' | 'STUDENT';
  };
}

// JWT Token doğrulama
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Yetkilendirme header'ından token al
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        message: 'Token bulunamadı. Lütfen giriş yapın.'
      });
    }

    const token = authHeader.split(' ')[1];

    // Token doğrulama
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
      email: string;
      role: 'ADMIN' | 'TEACHER' | 'STUDENT';
    };

    // Kullanıcı var mı ve aktif mi kontrolü
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true
      }
    });

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Kullanıcı bulunamadı. Lütfen tekrar giriş yapın.'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        status: 'error',
        message: 'Hesabınız devre dışı bırakılmış. Lütfen yönetici ile iletişime geçin.'
      });
    }

    // Kullanıcıyı istekle ilişkilendir
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role
    };
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        status: 'error',
        message: 'Geçersiz token. Lütfen tekrar giriş yapın.'
      });
    }
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        status: 'error',
        message: 'Token süresi dolmuş. Lütfen tekrar giriş yapın.'
      });
    }
    return res.status(401).json({
      status: 'error',
      message: 'Kimlik doğrulama başarısız.'
    });
  }
};

// Rol bazlı yetkilendirme
export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Kimlik doğrulama gerekli.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'Bu işlem için yetkiniz yok.'
      });
    }

    next();
  };
};

// Kullanıcı hesap sahibi mi veya admin mi kontrolü yapılır
export const checkOwnerOrAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({
      status: 'error',
      message: 'Kimlik doğrulama gerekli.'
    });
  }

  const targetUserId = req.params.id;
  const isOwner = req.user.id === targetUserId;
  const isAdmin = req.user.role === 'ADMIN';

  if (!isOwner && !isAdmin) {
    return res.status(403).json({
      status: 'error',
      message: 'Bu işlemi sadece hesap sahibi veya admin yapabilir.'
    });
  }

  next();
};







