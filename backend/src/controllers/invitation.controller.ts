import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';
import { createInvitationExpiry } from '../utils/classroom.utils';
import {
  notifyClassroomInvite,
  notifyJoinRequest,
  notifyInvitationResponse,
  notifyJoinResponse
} from '../utils/notification.utils';

/**
 * Öğretmen direkt davet gönderir
 */
export const sendDirectInvite = async (req: AuthRequest, res: Response) => {
  try {
    const teacherId = req.user?.id;
    const { classroomId, studentId, message } = req.body;

    // Validasyon
    if (!classroomId || !studentId) {
      return res.status(400).json({
        status: 'error',
        message: 'Classroom ID ve öğrenci ID gereklidir.'
      });
    }

    // Classroom kontrolü
    const classroom = await prisma.classroom.findUnique({
      where: { id: classroomId }
    });

    if (!classroom) {
      return res.status(404).json({
        status: 'error',
        message: 'Classroom bulunamadı.'
      });
    }

    // Yetki kontrolü - Sadece classroom sahibi davet gönderebilir
    if (classroom.teacherId !== teacherId) {
      return res.status(403).json({
        status: 'error',
        message: 'Bu classroom\'a davet gönderme yetkiniz yok.'
      });
    }

    // Öğrenci kontrolü
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      include: {
        student: true
      }
    });

    if (!student || student.role !== 'STUDENT') {
      return res.status(404).json({
        status: 'error',
        message: 'Öğrenci bulunamadı.'
      });
    }

    // Zaten üye mi kontrolü
    const existingMember = await prisma.classroomMember.findFirst({
      where: {
        classroomId,
        studentId,
        status: 'ACTIVE'
      }
    });

    if (existingMember) {
      return res.status(400).json({
        status: 'error',
        message: 'Bu öğrenci zaten classroom üyesi.'
      });
    }

    // Bekleyen davet var mı kontrolü
    const existingInvitation = await prisma.classroomInvitation.findFirst({
      where: {
        classroomId,
        studentId,
        status: 'PENDING'
      }
    });

    if (existingInvitation) {
      return res.status(400).json({
        status: 'error',
        message: 'Bu öğrenciye zaten bekleyen bir davet var.'
      });
    }

    // Davet oluştur
    const invitation = await prisma.classroomInvitation.create({
      data: {
        classroomId,
        studentId,
        invitedBy: teacherId!,
        invitationType: 'DIRECT',
        message,
        expiresAt: createInvitationExpiry(30)
      },
      include: {
        classroom: true,
        student: {
          include: {
            student: true
          }
        },
        inviter: {
          include: {
            teacher: true
          }
        }
      }
    });

    // Bildirim gönder
    try {
      const teacherName = invitation.inviter.teacher
        ? `${invitation.inviter.teacher.firstName} ${invitation.inviter.teacher.lastName}`
        : invitation.inviter.email;
      
      await notifyClassroomInvite(
        studentId,
        teacherName,
        classroom.name
      );
    } catch (notificationError) {
      console.error('Notification error:', notificationError);
    }

    res.status(201).json({
      status: 'success',
      message: 'Davet başarıyla gönderildi.',
      data: invitation
    });
  } catch (error) {
    console.error('Send invite error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Davet gönderilirken bir hata oluştu.'
    });
  }
};

/**
 * Öğrenci kodla katılım isteği gönderir
 */
export const requestJoinByCode = async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user?.id;
    const { code } = req.body;

    // Validasyon
    if (!code) {
      return res.status(400).json({
        status: 'error',
        message: 'Classroom kodu gereklidir.'
      });
    }

    // Classroom kontrolü
    const classroom = await prisma.classroom.findUnique({
      where: { code },
      include: {
        teacher: {
          include: {
            teacher: true
          }
        }
      }
    });

    if (!classroom) {
      return res.status(404).json({
        status: 'error',
        message: 'Geçersiz classroom kodu.'
      });
    }

    if (!classroom.isActive) {
      return res.status(400).json({
        status: 'error',
        message: 'Bu classroom aktif değil.'
      });
    }

    // Sadece davet ile katılım kontrolü
    if (classroom.inviteOnly) {
      return res.status(403).json({
        status: 'error',
        message: 'Bu classroom\'a sadece davet ile katılabilirsiniz.'
      });
    }

    // Zaten üye mi kontrolü
    const existingMember = await prisma.classroomMember.findFirst({
      where: {
        classroomId: classroom.id,
        studentId,
        status: 'ACTIVE'
      }
    });

    if (existingMember) {
      return res.status(400).json({
        status: 'error',
        message: 'Bu classroom\'ın zaten üyesisiniz.'
      });
    }

    // Bekleyen istek var mı kontrolü
    const existingInvitation = await prisma.classroomInvitation.findFirst({
      where: {
        classroomId: classroom.id,
        studentId,
        status: 'PENDING'
      }
    });

    if (existingInvitation) {
      return res.status(400).json({
        status: 'error',
        message: 'Zaten bekleyen bir katılım isteğiniz var.'
      });
    }

    // Otomatik onay aktif mi?
    if (classroom.autoApprove) {
      // Direkt üye yap
      const member = await prisma.classroomMember.create({
        data: {
          classroomId: classroom.id,
          studentId: studentId!,
          status: 'ACTIVE'
        },
        include: {
          classroom: true,
          student: {
            include: {
              student: true
            }
          }
        }
      });

      return res.status(201).json({
        status: 'success',
        message: 'Classroom\'a başarıyla katıldınız.',
        data: member
      });
    }

    // Katılım isteği oluştur
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      include: {
        student: true
      }
    });

    const invitation = await prisma.classroomInvitation.create({
      data: {
        classroomId: classroom.id,
        studentId: studentId!,
        invitedBy: classroom.teacherId, // Öğretmen onaylayacak
        invitationType: 'CODE_REQUEST',
        expiresAt: createInvitationExpiry(7) // Kod istekleri 7 gün geçerli
      },
      include: {
        classroom: true,
        student: {
          include: {
            student: true
          }
        },
        inviter: {
          include: {
            teacher: true
          }
        }
      }
    });

    // Öğretmene bildirim gönder
    try {
      const studentName = student?.student
        ? `${student.student.firstName} ${student.student.lastName}`
        : student?.email || 'Bir öğrenci';
      
      await notifyJoinRequest(
        classroom.teacherId,
        studentName,
        classroom.name
      );
    } catch (notificationError) {
      console.error('Notification error:', notificationError);
    }

    res.status(201).json({
      status: 'success',
      message: 'Katılım isteğiniz gönderildi. Öğretmen onayını bekleyin.',
      data: invitation
    });
  } catch (error) {
    console.error('Request join error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Katılım isteği gönderilirken bir hata oluştu.'
    });
  }
};

/**
 * Bekleyen davetleri getir
 */
export const getPendingInvitations = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    const { type } = req.query; // 'received' veya 'sent'

    let invitations;

    if (type === 'received' || role === 'STUDENT') {
      // Kullanıcıya gelen davetler
      invitations = await prisma.classroomInvitation.findMany({
        where: {
          studentId: userId,
          status: 'PENDING',
          OR: [
            { expiresAt: null },
            { expiresAt: { gte: new Date() } }
          ]
        },
        include: {
          classroom: {
            include: {
              teacher: {
                include: {
                  teacher: true
                }
              }
            }
          },
          inviter: {
            include: {
              teacher: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    } else if (type === 'sent' || role === 'TEACHER') {
      // Öğretmenin gönderdiği davetler
      invitations = await prisma.classroomInvitation.findMany({
        where: {
          invitedBy: userId,
          status: 'PENDING',
          OR: [
            { expiresAt: null },
            { expiresAt: { gte: new Date() } }
          ]
        },
        include: {
          classroom: true,
          student: {
            include: {
              student: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    }

    res.status(200).json({
      status: 'success',
      data: invitations || []
    });
  } catch (error) {
    console.error('Get invitations error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Davetler getirilirken bir hata oluştu.'
    });
  }
};

/**
 * Belirli bir classroom için bekleyen istekleri getir (Öğretmen için)
 */
export const getClassroomPendingRequests = async (req: AuthRequest, res: Response) => {
  try {
    const teacherId = req.user?.id;
    const { classroomId } = req.params;

    // Classroom kontrolü ve yetki
    const classroom = await prisma.classroom.findUnique({
      where: { id: classroomId }
    });

    if (!classroom) {
      return res.status(404).json({
        status: 'error',
        message: 'Classroom bulunamadı.'
      });
    }

    if (classroom.teacherId !== teacherId) {
      return res.status(403).json({
        status: 'error',
        message: 'Bu classroom\'ın isteklerini görme yetkiniz yok.'
      });
    }

    // Bekleyen istekleri getir
    const requests = await prisma.classroomInvitation.findMany({
      where: {
        classroomId,
        status: 'PENDING',
        invitationType: 'CODE_REQUEST',
        OR: [
          { expiresAt: null },
          { expiresAt: { gte: new Date() } }
        ]
      },
      include: {
        student: {
          include: {
            student: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    res.status(200).json({
      status: 'success',
      data: requests
    });
  } catch (error) {
    console.error('Get classroom requests error:', error);
    res.status(500).json({
      status: 'error',
      message: 'İstekler getirilirken bir hata oluştu.'
    });
  }
};

/**
 * Daveti kabul et
 */
export const acceptInvitation = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    const { id } = req.params;

    // Davet kontrolü
    const invitation = await prisma.classroomInvitation.findUnique({
      where: { id },
      include: {
        classroom: true,
        student: {
          include: {
            student: true
          }
        }
      }
    });

    if (!invitation) {
      return res.status(404).json({
        status: 'error',
        message: 'Davet bulunamadı.'
      });
    }

    if (invitation.status !== 'PENDING') {
      return res.status(400).json({
        status: 'error',
        message: 'Bu davet zaten işleme alınmış.'
      });
    }

    // Yetki kontrolü
    const isStudent = invitation.invitationType === 'DIRECT' && invitation.studentId === userId;
    const isTeacher = invitation.invitationType === 'CODE_REQUEST' && invitation.invitedBy === userId;

    if (!isStudent && !isTeacher && role !== 'ADMIN') {
      return res.status(403).json({
        status: 'error',
        message: 'Bu daveti kabul etme yetkiniz yok.'
      });
    }

    // Expire kontrolü
    if (invitation.expiresAt && invitation.expiresAt < new Date()) {
      await prisma.classroomInvitation.update({
        where: { id },
        data: { status: 'EXPIRED' }
      });

      return res.status(400).json({
        status: 'error',
        message: 'Bu davet süresi dolmuş.'
      });
    }

    // Zaten üye mi kontrolü
    const existingMember = await prisma.classroomMember.findFirst({
      where: {
        classroomId: invitation.classroomId,
        studentId: invitation.studentId,
        status: 'ACTIVE'
      }
    });

    if (existingMember) {
      await prisma.classroomInvitation.update({
        where: { id },
        data: { status: 'ACCEPTED', respondedAt: new Date() }
      });

      return res.status(400).json({
        status: 'error',
        message: 'Öğrenci zaten classroom üyesi.'
      });
    }

    // Transaction: Daveti kabul et ve üye ekle
    const result = await prisma.$transaction([
      // Daveti güncelle
      prisma.classroomInvitation.update({
        where: { id },
        data: {
          status: 'ACCEPTED',
          respondedAt: new Date()
        }
      }),
      // Üye ekle
      prisma.classroomMember.create({
        data: {
          classroomId: invitation.classroomId,
          studentId: invitation.studentId,
          status: 'ACTIVE'
        }
      })
    ]);

    // Bildirim gönder
    try {
      const studentName = invitation.student.student
        ? `${invitation.student.student.firstName} ${invitation.student.student.lastName}`
        : invitation.student.email;

      if (invitation.invitationType === 'DIRECT') {
        // Öğretmene bildirim: Öğrenci daveti kabul etti
        await notifyInvitationResponse(
          invitation.invitedBy,
          studentName,
          invitation.classroom.name,
          true
        );
      } else {
        // Öğrenciye bildirim: Öğretmen katılımı onayladı
        await notifyJoinResponse(
          invitation.studentId,
          invitation.classroom.name,
          true
        );
      }
    } catch (notificationError) {
      console.error('Notification error:', notificationError);
    }

    res.status(200).json({
      status: 'success',
      message: 'Davet kabul edildi.',
      data: result[1] // ClassroomMember
    });
  } catch (error) {
    console.error('Accept invitation error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Davet kabul edilirken bir hata oluştu.'
    });
  }
};

/**
 * Daveti reddet
 */
export const rejectInvitation = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    const { id } = req.params;

    // Davet kontrolü
    const invitation = await prisma.classroomInvitation.findUnique({
      where: { id },
      include: {
        classroom: true,
        student: {
          include: {
            student: true
          }
        }
      }
    });

    if (!invitation) {
      return res.status(404).json({
        status: 'error',
        message: 'Davet bulunamadı.'
      });
    }

    if (invitation.status !== 'PENDING') {
      return res.status(400).json({
        status: 'error',
        message: 'Bu davet zaten işleme alınmış.'
      });
    }

    // Yetki kontrolü
    const isStudent = invitation.invitationType === 'DIRECT' && invitation.studentId === userId;
    const isTeacher = invitation.invitationType === 'CODE_REQUEST' && invitation.invitedBy === userId;

    if (!isStudent && !isTeacher && role !== 'ADMIN') {
      return res.status(403).json({
        status: 'error',
        message: 'Bu daveti reddetme yetkiniz yok.'
      });
    }

    // Daveti reddet
    await prisma.classroomInvitation.update({
      where: { id },
      data: {
        status: 'REJECTED',
        respondedAt: new Date()
      }
    });

    // Bildirim gönder
    try {
      const studentName = invitation.student.student
        ? `${invitation.student.student.firstName} ${invitation.student.student.lastName}`
        : invitation.student.email;

      if (invitation.invitationType === 'DIRECT') {
        // Öğretmene bildirim: Öğrenci daveti reddetti
        await notifyInvitationResponse(
          invitation.invitedBy,
          studentName,
          invitation.classroom.name,
          false
        );
      } else {
        // Öğrenciye bildirim: Öğretmen katılımı reddetti
        await notifyJoinResponse(
          invitation.studentId,
          invitation.classroom.name,
          false
        );
      }
    } catch (notificationError) {
      console.error('Notification error:', notificationError);
    }

    res.status(200).json({
      status: 'success',
      message: 'Davet reddedildi.'
    });
  } catch (error) {
    console.error('Reject invitation error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Davet reddedilirken bir hata oluştu.'
    });
  }
};

/**
 * Daveti iptal et (Öğretmen kendi gönderdiği daveti iptal edebilir)
 */
export const cancelInvitation = async (req: AuthRequest, res: Response) => {
  try {
    const teacherId = req.user?.id;
    const { id } = req.params;

    // Davet kontrolü
    const invitation = await prisma.classroomInvitation.findUnique({
      where: { id }
    });

    if (!invitation) {
      return res.status(404).json({
        status: 'error',
        message: 'Davet bulunamadı.'
      });
    }

    if (invitation.status !== 'PENDING') {
      return res.status(400).json({
        status: 'error',
        message: 'Bu davet zaten işleme alınmış.'
      });
    }

    // Yetki kontrolü
    if (invitation.invitedBy !== teacherId) {
      return res.status(403).json({
        status: 'error',
        message: 'Bu daveti iptal etme yetkiniz yok.'
      });
    }

    // Daveti iptal et
    await prisma.classroomInvitation.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        respondedAt: new Date()
      }
    });

    res.status(200).json({
      status: 'success',
      message: 'Davet iptal edildi.'
    });
  } catch (error) {
    console.error('Cancel invitation error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Davet iptal edilirken bir hata oluştu.'
    });
  }
};











