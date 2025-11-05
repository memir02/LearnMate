import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';

// Tğm kullaanıcıları getir (Admin only)
export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { role, search, page = '1', limit = '10' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {};

    if (role) {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { email: { contains: search as string, mode: 'insensitive' } },
        { profile: { firstName: { contains: search as string, mode: 'insensitive' } } },
        { profile: { lastName: { contains: search as string, mode: 'insensitive' } } }
      ];
    }

    // Get users
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          profile: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.user.count({ where })
    ]);

    // Remove password hashes
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
      message: 'Error fetching users'
    });
  }
};

// Get user by ID
export const getUserById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        profile: true
      }
    });

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Remove password hash
    const { passwordHash, ...userWithoutPassword } = user;

    res.status(200).json({
      status: 'success',
      data: userWithoutPassword
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching user'
    });
  }
};

// Kullanıcı Guncelle (Admin only)
export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { email, role, isActive, firstName, lastName, phone } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
      include: { profile: true }
    });

    if (!existingUser) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Update user and profile
    const user = await prisma.user.update({
      where: { id },
      data: {
        email: email || existingUser.email,
        role: role || existingUser.role,
        isActive: isActive !== undefined ? isActive : existingUser.isActive,
        profile: {
          update: {
            firstName: firstName || existingUser.profile?.firstName,
            lastName: lastName || existingUser.profile?.lastName,
            phone: phone || existingUser.profile?.phone
          }
        }
      },
      include: {
        profile: true
      }
    });

    // Remove password hash
    const { passwordHash, ...userWithoutPassword } = user;

    res.status(200).json({
      status: 'success',
      message: 'User updated successfully',
      data: userWithoutPassword
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error updating user'
    });
  }
};

// Delete user (Admin only)
export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Don't allow deleting yourself
    if (id === req.user?.id) {
      return res.status(400).json({
        status: 'error',
        message: 'You cannot delete your own account'
      });
    }

    // Delete user (cascade will delete profile)
    await prisma.user.delete({
      where: { id }
    });

    res.status(200).json({
      status: 'success',
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error deleting user'
    });
  }
};

// Get user statistics (Admin)
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
      message: 'Error fetching user statistics'
    });
  }
};







