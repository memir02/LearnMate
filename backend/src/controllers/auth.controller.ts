import { Request, Response } from 'express';
import prisma from '../config/database';
import { hashPassword, comparePassword } from '../utils/bcrypt.utils';
import { generateToken } from '../utils/jwt.utils';
import { AuthRequest } from '../middleware/auth.middleware';

// Kullanıcı kayıt kısmı
export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, role, grade } = req.body;

    // Validate input
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        status: 'error',
        message: 'All fields are required'
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'User with this email already exists'
      });
    }

    // Validate role
    const userRole = role?.toUpperCase() || 'STUDENT';
    if (!['ADMIN', 'TEACHER', 'STUDENT'].includes(userRole)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid role. Must be ADMIN, TEACHER, or STUDENT'
      });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user with role-specific profile
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

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    // Remove password hash from response
    const { passwordHash: _, ...userWithoutPassword } = user;

    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      data: {
        user: userWithoutPassword,
        token
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error registering user'
    });
  }
};

// Kullanıcı giriş kısmı
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Email and password are required'
      });
    }

    // Find user
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
        message: 'Invalid email or password'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        status: 'error',
        message: 'Your account has been deactivated'
      });
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    // Remove password hash from response
    const { passwordHash: _, ...userWithoutPassword } = user;

    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: {
        user: userWithoutPassword,
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error logging in'
    });
  }
};

// Get current user
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
        message: 'User not found'
      });
    }

    // Remove password hash from response
    const { passwordHash: _, ...userWithoutPassword } = user;

    res.status(200).json({
      status: 'success',
      data: userWithoutPassword
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching user data'
    });
  }
};

// Update profile
export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { firstName, lastName, phone, bio } = req.body;

    // Check if user exists
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
        message: 'User not found'
      });
    }

    // Update role-specific profile
    let updatedProfile;
    
    if (user.role === 'STUDENT' && user.student) {
      updatedProfile = await prisma.student.update({
        where: { userId: userId },
        data: {
          firstName: firstName || user.student.firstName,
          lastName: lastName || user.student.lastName,
          phone: phone || user.student.phone
        }
      });
    } else if (user.role === 'TEACHER' && user.teacher) {
      updatedProfile = await prisma.teacher.update({
        where: { userId: userId },
        data: {
          firstName: firstName || user.teacher.firstName,
          lastName: lastName || user.teacher.lastName,
          phone: phone || user.teacher.phone,
          bio: bio || user.teacher.bio
        }
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully',
      data: updatedProfile
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error updating profile'
    });
  }
};

// Change password
export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        status: 'error',
        message: 'Current password and new password are required'
      });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Verify current password
    const isPasswordValid = await comparePassword(currentPassword, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'error',
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash }
    });

    res.status(200).json({
      status: 'success',
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error changing password'
    });
  }
};







