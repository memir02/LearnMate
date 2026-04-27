import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';
import { createAuditLog, getIpAddress, getUserAgent } from '../utils/auditLog';

// Tüm kullanıcıları getir (Admin)
export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { role, search, page = '1', limit = '10' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;


    const where: any = {};

    if (role) {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { email: { contains: search as string, mode: 'insensitive' } },
        { student: { firstName: { contains: search as string, mode: 'insensitive' } } },
        { student: { lastName: { contains: search as string, mode: 'insensitive' } } },
        { teacher: { firstName: { contains: search as string, mode: 'insensitive' } } },
        { teacher: { lastName: { contains: search as string, mode: 'insensitive' } } }
      ];
    }

    // Kullanıcıları getir
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          student: true,
          teacher: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.user.count({ where })
    ]);

    const usersWithoutPasswords = users.map(({ passwordHash, ...user }) => user);

    res.status(200).json({
      status: 'success',
      data: usersWithoutPasswords,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Kullanıcılar getirilirken bir hata oluştu.'
    });
  }
};

// ID ile kullanıcı getir
export const getUserById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
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


    const { passwordHash, ...userWithoutPassword } = user;

    res.status(200).json({
      status: 'success',
      data: userWithoutPassword
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Kullanıcı getirilirken bir hata oluştu.'
    });
  }
};

// Kullanıcı güncelle (Admin)
export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { email, role, isActive, firstName, lastName, phone } = req.body;


    const existingUser = await prisma.user.findUnique({
      where: { id },
      include: { 
        student: true,
        teacher: true
      }
    });

    if (!existingUser) {
      return res.status(404).json({
        status: 'error',
        message: 'Kullanıcı bulunamadı.'
      });
    }


    const user = await prisma.user.update({
      where: { id },
      data: {
        email: email || existingUser.email,
        role: role || existingUser.role,
        isActive: isActive !== undefined ? isActive : existingUser.isActive
      },
      include: {
        student: true,
        teacher: true
      }
    });


    if (existingUser.role === 'STUDENT' && existingUser.student) {
      await prisma.student.update({
        where: { userId: id },
        data: {
          firstName: firstName || existingUser.student.firstName,
          lastName: lastName || existingUser.student.lastName,
          phone: phone || existingUser.student.phone
        }
      });
    } else if (existingUser.role === 'TEACHER' && existingUser.teacher) {
      await prisma.teacher.update({
        where: { userId: id },
        data: {
          firstName: firstName || existingUser.teacher.firstName,
          lastName: lastName || existingUser.teacher.lastName,
          phone: phone || existingUser.teacher.phone
        }
      });
    }


    // Audit log - Kullanıcı güncelleme
    const adminId = req.user?.id;
    if (adminId) {
      // isActive değişikliği yapıldıysa özel log
      if (isActive !== undefined && isActive !== existingUser.isActive) {
        await createAuditLog({
          userId: adminId,
          action: isActive ? 'USER_APPROVED' : 'USER_REJECTED',
          entityType: 'USER',
          entityId: user.id,
          entityName: user.email,
          details: { role: user.role, previousStatus: existingUser.isActive },
          ipAddress: getIpAddress(req),
          userAgent: getUserAgent(req),
        });
      } else {
        await createAuditLog({
          userId: adminId,
          action: 'USER_UPDATED',
          entityType: 'USER',
          entityId: user.id,
          entityName: user.email,
          details: { role: user.role },
          ipAddress: getIpAddress(req),
          userAgent: getUserAgent(req),
        });
      }
    }

    const { passwordHash, ...userWithoutPassword } = user;

    res.status(200).json({
      status: 'success',
      message: 'Kullanıcı başarıyla güncellendi.',
      data: userWithoutPassword
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Kullanıcı güncellenirken bir hata oluştu.'
    });
  }
};


export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;


    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Kullanıcı bulunamadı.'
      });
    }


    if (id === req.user?.id) {
      return res.status(400).json({
        status: 'error',
        message: 'Kendi hesabınızı silemezsiniz.'
      });
    }


    // Audit log - Kullanıcı silme
    const adminId = req.user?.id;
    if (adminId) {
      await createAuditLog({
        userId: adminId,
        action: 'USER_DELETED',
        entityType: 'USER',
        entityId: user.id,
        entityName: user.email,
        details: { role: user.role },
        ipAddress: getIpAddress(req),
        userAgent: getUserAgent(req),
      });
    }

    await prisma.user.delete({
      where: { id }
    });

    res.status(200).json({
      status: 'success',
      message: 'Kullanıcı başarıyla silindi.'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Kullanıcı silinirken bir hata oluştu.'
    });
  }
};

// Kullanıcı istatistikleri getir (Admin)
export const getUserStats = async (req: AuthRequest, res: Response) => {
  try {
    const [totalUsers, totalTeachers, totalStudents, totalAdmins] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'TEACHER' } }),
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.user.count({ where: { role: 'ADMIN' } })
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        totalUsers,
        totalTeachers,
        totalStudents,
        totalAdmins
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Kullanıcı istatistikleri getirilirken bir hata oluştu.'
    });
  }
};

// Kendi profilini güncelle (Teacher / Student)
export const updateMyProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    const { firstName, lastName, phone, grade, parentPhone } = req.body;

    if (role === 'TEACHER') {
      await prisma.teacher.update({
        where: { userId },
        data: {
          ...(firstName && { firstName }),
          ...(lastName && { lastName }),
          ...(phone !== undefined && { phone }),
        },
      });
    } else if (role === 'STUDENT') {
      await prisma.student.update({
        where: { userId },
        data: {
          ...(firstName && { firstName }),
          ...(lastName && { lastName }),
          ...(phone !== undefined && { phone }),
          ...(grade !== undefined && { grade }),
          ...(parentPhone !== undefined && { parentPhone }),
        },
      });
    }

    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { teacher: true, student: true },
    });

    const { passwordHash, ...userWithoutPassword } = updatedUser!;

    return res.status(200).json({
      status: 'success',
      message: 'Profil başarıyla güncellendi.',
      data: userWithoutPassword,
    });
  } catch (error) {
    console.error('Update my profile error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Profil güncellenirken bir hata oluştu.',
    });
  }
};

// Kendi şifresini değiştir
export const changeMyPassword = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        status: 'error',
        message: 'Mevcut ve yeni şifre zorunludur.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        status: 'error',
        message: 'Yeni şifre en az 6 karakter olmalıdır.',
      });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'Kullanıcı bulunamadı.' });
    }

    const bcrypt = await import('bcryptjs');
    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ status: 'error', message: 'Mevcut şifre yanlış.' });
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash: hashed } });

    return res.status(200).json({ status: 'success', message: 'Şifre başarıyla değiştirildi.' });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ status: 'error', message: 'Şifre değiştirilirken bir hata oluştu.' });
  }
};

// Öğrenci ara (Teacher)
export const searchStudents = async (req: AuthRequest, res: Response) => {
  try {
    const { search, limit = '20' } = req.query;

    if (!search || (search as string).length < 2) {
      return res.status(400).json({
        status: 'error',
        message: 'Arama için en az 2 karakter gereklidir.'
      });
    }

    const limitNum = parseInt(limit as string);

    // Sadece öğrencileri ara
    const students = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        isActive: true,
        OR: [
          { email: { contains: search as string, mode: 'insensitive' } },
          { student: { firstName: { contains: search as string, mode: 'insensitive' } } },
          { student: { lastName: { contains: search as string, mode: 'insensitive' } } }
        ]
      },
      take: limitNum,
      include: {
        student: true
      },
      orderBy: [
        { student: { firstName: 'asc' } }
      ]
    });

    // Şifreleri kaldır
    const studentsWithoutPasswords = students.map(({ passwordHash, ...student }) => student);

    res.status(200).json({
      status: 'success',
      data: studentsWithoutPasswords
    });
  } catch (error) {
    console.error('Search students error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Öğrenciler aranırken bir hata oluştu.'
    });
  }
};







