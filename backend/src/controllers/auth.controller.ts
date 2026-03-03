import { Request, Response } from 'express';
import prisma from '../config/database';
import { hashPassword, comparePassword } from '../utils/bcrypt.utils';
import { generateToken } from '../utils/jwt.utils';
import { AuthRequest } from '../middleware/auth.middleware';
import { createAuditLog, getIpAddress, getUserAgent } from '../utils/auditLog';

// Kullanıcı kayıt kısmı
export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, role, grade } = req.body;


    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        status: 'error',
        message: 'Tüm alanlar zorunludur.'
      });
    }


    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'Bu email adresi zaten kayıtlı.'
      });
    }


    const userRole = role?.toUpperCase() || 'STUDENT';
    if (!['ADMIN', 'TEACHER', 'STUDENT'].includes(userRole)) {
      return res.status(400).json({
        status: 'error',
        message: 'Geçersiz rol. ADMIN, TEACHER veya STUDENT olmalı.'
      });
    }


    const passwordHash = await hashPassword(password);


    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: userRole as 'ADMIN' | 'TEACHER' | 'STUDENT',
        ...(userRole === 'STUDENT' && {
          student: {
            create: {
              firstName,
              lastName,
              grade: grade || null
            }
          }
        }),
        ...(userRole === 'TEACHER' && {
          teacher: {
            create: {
              firstName,
              lastName
            }
          }
        })
      },
      include: {
        student: true,
        teacher: true
      }
    });


    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });


    // Audit log - Kullanıcı kaydı
    await createAuditLog({
      userId: user.id,
      action: 'USER_REGISTERED',
      entityType: 'USER',
      entityId: user.id,
      entityName: email,
      details: { role: user.role },
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req),
    });

    const { passwordHash: _, ...userWithoutPassword } = user;

    res.status(201).json({
      status: 'success',
      message: 'Kullanıcı başarıyla kaydedildi.',
      data: {
        user: userWithoutPassword,
        token
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Kullanıcı kaydedilirken bir hata oluştu.'
    });
  }
};

// Kullanıcı giriş kısmı
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

   
    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Email ve şifre gereklidir.'
      });
    }


    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        student: true,
        teacher: true
      }
    });

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Email veya şifre hatalı.'
      });
    }


    if (!user.isActive) {
      return res.status(403).json({
        status: 'error',
        message: 'Hesabınız devre dışı bırakılmış.'
      });
    }

  
    const isPasswordValid = await comparePassword(password, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'error',
        message: 'Email veya şifre hatalı.'
      });
    }

    // JWT Token oluşturma
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    // Audit log - Başarılı giriş
    await createAuditLog({
      userId: user.id,
      action: 'USER_LOGIN',
      entityType: 'USER',
      entityId: user.id,
      entityName: user.email,
      details: { role: user.role },
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req),
    });
 
    const { passwordHash: _, ...userWithoutPassword } = user;

    res.status(200).json({
      status: 'success',
      message: 'Giriş başarılı.',
      data: {
        user: userWithoutPassword,
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Giriş yapılırken bir hata oluştu.'
    });
  }
};


export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        student: true,
        teacher: true
      }
    });

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Kullanıcı bulunamadı.'
      });
    }

    
    const { passwordHash: _, ...userWithoutPassword } = user;

    res.status(200).json({
      status: 'success',
      data: userWithoutPassword
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Kullanıcı bilgileri getirilirken bir hata oluştu.'
    });
  }
};


export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { firstName, lastName, phone, bio, grade, parentPhone, subject, experience, title } = req.body;


    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { 
        student: true,
        teacher: true
      }
    });

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Kullanıcı bulunamadı.'
      });
    }

    // Rol bazlı profil güncelleme
    let updatedProfile;
    
    if (user.role === 'STUDENT' && user.student) {
      updatedProfile = await prisma.student.update({
        where: { userId: userId },
        data: {
          firstName: firstName || user.student.firstName,
          lastName: lastName || user.student.lastName,
          phone: phone || user.student.phone,
          grade: grade !== undefined ? grade : user.student.grade,
          parentPhone: parentPhone !== undefined ? parentPhone : user.student.parentPhone
        }
      });
    } else if (user.role === 'TEACHER' && user.teacher) {
      updatedProfile = await prisma.teacher.update({
        where: { userId: userId },
        data: {
          firstName: firstName || user.teacher.firstName,
          lastName: lastName || user.teacher.lastName,
          phone: phone || user.teacher.phone,
          bio: bio !== undefined ? bio : user.teacher.bio,
          subject: subject !== undefined ? subject : user.teacher.subject,
          experience: experience !== undefined ? experience : user.teacher.experience,
          title: title !== undefined ? title : user.teacher.title
        }
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Profil başarıyla güncellendi.',
      data: updatedProfile
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Profil güncellenirken bir hata oluştu.'
    });
  }
};


export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        status: 'error',
        message: 'Mevcut şifre ve yeni şifre gereklidir.'
      });
    }

    // Kullanıcı bulma
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Kullanıcı bulunamadı.'
      });
    }

    // Mevcut şifre doğrulama
    const isPasswordValid = await comparePassword(currentPassword, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'error',
        message: 'Mevcut şifre hatalı.'
      });
    }

    // Yeni şifre şifreleme
    const newPasswordHash = await hashPassword(newPassword);

    // Şifre güncelleme
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash }
    });

    // Audit log - Şifre değiştirme
    await createAuditLog({
      userId: user.id,
      action: 'USER_PASSWORD_CHANGED',
      entityType: 'USER',
      entityId: user.id,
      entityName: user.email,
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req),
    });

    res.status(200).json({
      status: 'success',
      message: 'Şifre başarıyla değiştirildi.'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Şifre değiştirilirken bir hata oluştu.'
    });
  }
};







