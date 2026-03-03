import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

/**
 * Tüm audit log kayıtlarını getir (Admin)
 */
export const getAuditLogs = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 50, action, entityType, userId } = req.query;

    const where: any = {};

    // Filtreler
    if (action) {
      where.action = action;
    }
    if (entityType) {
      where.entityType = entityType;
    }
    if (userId) {
      where.userId = userId;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
              student: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
              teacher: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: Number(limit),
      }),
      prisma.auditLog.count({ where }),
    ]);

    // Format the response
    const formattedLogs = logs.map((log) => {
      const userName =
        log.user.student
          ? `${log.user.student.firstName} ${log.user.student.lastName}`
          : log.user.teacher
          ? `${log.user.teacher.firstName} ${log.user.teacher.lastName}`
          : log.user.email;

      return {
        id: log.id,
        action: log.action,
        actionText: getActionText(log.action),
        entityType: log.entityType,
        entityId: log.entityId,
        entityName: log.entityName,
        details: log.details,
        userName,
        userEmail: log.user.email,
        userRole: log.user.role,
        ipAddress: log.ipAddress,
        createdAt: log.createdAt,
      };
    });

    res.json({
      status: 'success',
      data: {
        logs: formattedLogs,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Denetim kayıtları getirilemedi',
    });
  }
};

/**
 * İstatistikler - Son 24 saat, 7 gün, vb.
 */
export const getAuditStats = async (req: AuthRequest, res: Response) => {
  try {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [last24h, last7d, total, byAction] = await Promise.all([
      prisma.auditLog.count({
        where: {
          createdAt: {
            gte: oneDayAgo,
          },
        },
      }),
      prisma.auditLog.count({
        where: {
          createdAt: {
            gte: oneWeekAgo,
          },
        },
      }),
      prisma.auditLog.count(),
      prisma.auditLog.groupBy({
        by: ['action'],
        _count: {
          action: true,
        },
        orderBy: {
          _count: {
            action: 'desc',
          },
        },
        take: 10,
      }),
    ]);

    res.json({
      status: 'success',
      data: {
        last24h,
        last7d,
        total,
        topActions: byAction.map((item) => ({
          action: item.action,
          actionText: getActionText(item.action),
          count: item._count.action,
        })),
      },
    });
  } catch (error) {
    console.error('Get audit stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'İstatistikler getirilemedi',
    });
  }
};

/**
 * Action türüne göre Türkçe metin döndür
 */
function getActionText(action: string): string {
  const actionTexts: { [key: string]: string } = {
    USER_REGISTERED: 'Kullanıcı kaydı',
    USER_LOGIN: 'Giriş yaptı',
    USER_LOGOUT: 'Çıkış yaptı',
    USER_APPROVED: 'Kullanıcı onayladı',
    USER_REJECTED: 'Kullanıcı reddetti',
    USER_DELETED: 'Kullanıcı sildi',
    USER_UPDATED: 'Profil güncelledi',
    USER_PASSWORD_CHANGED: 'Şifre değiştirdi',
    TEST_CREATED: 'Test oluşturdu',
    TEST_UPDATED: 'Test güncelledi',
    TEST_DELETED: 'Test sildi',
    TEST_PUBLISHED: 'Test yayınladı',
    QUESTION_CREATED: 'Soru oluşturdu',
    QUESTION_UPDATED: 'Soru güncelledi',
    QUESTION_DELETED: 'Soru sildi',
    QUESTION_ADDED_TO_POOL: 'Soruyu havuza ekledi',
    QUESTION_REMOVED_FROM_POOL: 'Soruyu havuzdan çıkardı',
    CLASSROOM_CREATED: 'Sınıf oluşturdu',
    CLASSROOM_DELETED: 'Sınıf sildi',
    CLASSROOM_MEMBER_ADDED: 'Sınıfa üye ekledi',
    CLASSROOM_MEMBER_REMOVED: 'Sınıftan üye çıkardı',
  };

  return actionTexts[action] || action;
}



