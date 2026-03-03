import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';
import { generateClassroomCode } from '../utils/classroom.utils';
import { notifyMemberRemoved } from '../utils/notification.utils';

/**
 * Yeni classroom oluştur (Sadece öğretmen)
 */
export const createClassroom = async (req: AuthRequest, res: Response) => {
  try {
    const teacherId = req.user?.id;
    const { name, description, subject, grade, inviteOnly, autoApprove } = req.body;

    // Validasyon
    if (!name) {
      return res.status(400).json({
        status: 'error',
        message: 'Classroom adı zorunludur.'
      });
    }

    // Benzersiz kod oluştur
    let code = generateClassroomCode();
    let isUnique = false;
    
    while (!isUnique) {
      const existing = await prisma.classroom.findUnique({
        where: { code }
      });
      
      if (!existing) {
        isUnique = true;
      } else {
        code = generateClassroomCode();
      }
    }

    // Classroom oluştur
    const classroom = await prisma.classroom.create({
      data: {
        name,
        description,
        subject,
        grade,
        teacherId: teacherId!,
        code,
        inviteOnly: inviteOnly || false,
        autoApprove: autoApprove || false
      },
      include: {
        teacher: {
          include: {
            teacher: true
          }
        },
        _count: {
          select: {
            members: true
          }
        }
      }
    });

    res.status(201).json({
      status: 'success',
      message: 'Classroom başarıyla oluşturuldu.',
      data: classroom
    });
  } catch (error) {
    console.error('Create classroom error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Classroom oluşturulurken bir hata oluştu.'
    });
  }
};

/**
 * Kullanıcının classroom'larını getir
 */
export const getClassrooms = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;

    let classrooms;

    if (role === 'TEACHER') {
      // Öğretmenin oluşturduğu classroom'lar
      classrooms = await prisma.classroom.findMany({
        where: {
          teacherId: userId,
          isActive: true
        },
        include: {
          teacher: {
            include: {
              teacher: true
            }
          },
          _count: {
            select: {
              members: true,
              invitations: {
                where: {
                  status: 'PENDING'
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    } else if (role === 'STUDENT') {
      // Öğrencinin üye olduğu classroom'lar
      const memberships = await prisma.classroomMember.findMany({
        where: {
          studentId: userId,
          status: 'ACTIVE'
        },
        include: {
          classroom: {
            include: {
              teacher: {
                include: {
                  teacher: true
                }
              },
              _count: {
                select: {
                  members: true
                }
              }
            }
          }
        },
        orderBy: {
          joinedAt: 'desc'
        }
      });

      classrooms = memberships.map(m => m.classroom);
    } else {
      // Admin tüm classroom'ları görebilir
      classrooms = await prisma.classroom.findMany({
        where: {
          isActive: true
        },
        include: {
          teacher: {
            include: {
              teacher: true
            }
          },
          _count: {
            select: {
              members: true
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
      data: classrooms
    });
  } catch (error) {
    console.error('Get classrooms error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Classroom\'lar getirilirken bir hata oluştu.'
    });
  }
};

/**
 * Classroom detayını getir
 */
export const getClassroomById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const role = req.user?.role;

    const classroom = await prisma.classroom.findUnique({
      where: { id },
      include: {
        teacher: {
          include: {
            teacher: true
          }
        },
        members: {
          where: {
            status: 'ACTIVE'
          },
          include: {
            student: {
              include: {
                student: true
              }
            }
          },
          orderBy: {
            joinedAt: 'asc'
          }
        },
        _count: {
          select: {
            members: true,
            tests: true,
            invitations: {
              where: {
                status: 'PENDING'
              }
            }
          }
        }
      }
    });

    if (!classroom) {
      return res.status(404).json({
        status: 'error',
        message: 'Classroom bulunamadı.'
      });
    }

    // Yetki kontrolü
    const isTeacher = classroom.teacherId === userId;
    const isMember = classroom.members.some(m => m.studentId === userId);
    const isAdmin = role === 'ADMIN';

    if (!isTeacher && !isMember && !isAdmin) {
      return res.status(403).json({
        status: 'error',
        message: 'Bu classroom\'a erişim yetkiniz yok.'
      });
    }

    res.status(200).json({
      status: 'success',
      data: classroom
    });
  } catch (error) {
    console.error('Get classroom error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Classroom getirilirken bir hata oluştu.'
    });
  }
};

/**
 * Kod ile classroom bul (Öğrenci katılım için)
 */
export const getClassroomByCode = async (req: AuthRequest, res: Response) => {
  try {
    const { code } = req.params;

    const classroom = await prisma.classroom.findUnique({
      where: { code },
      include: {
        teacher: {
          include: {
            teacher: true
          }
        },
        _count: {
          select: {
            members: true
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

    // Sadece genel bilgileri döndür (güvenlik için)
    const { inviteOnly, autoApprove, ...publicInfo } = classroom;

    res.status(200).json({
      status: 'success',
      data: {
        ...publicInfo,
        canJoin: !inviteOnly // Sadece davet ile katılım var mı?
      }
    });
  } catch (error) {
    console.error('Get classroom by code error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Classroom bulunamadı.'
    });
  }
};

/**
 * Classroom güncelle (Sadece öğretmen)
 */
export const updateClassroom = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const teacherId = req.user?.id;
    const { name, description, subject, grade, inviteOnly, autoApprove, isActive } = req.body;

    // Classroom kontrolü
    const classroom = await prisma.classroom.findUnique({
      where: { id }
    });

    if (!classroom) {
      return res.status(404).json({
        status: 'error',
        message: 'Classroom bulunamadı.'
      });
    }

    // Yetki kontrolü
    if (classroom.teacherId !== teacherId) {
      return res.status(403).json({
        status: 'error',
        message: 'Bu classroom\'ı güncelleme yetkiniz yok.'
      });
    }

    // Güncelle
    const updatedClassroom = await prisma.classroom.update({
      where: { id },
      data: {
        name: name || classroom.name,
        description: description !== undefined ? description : classroom.description,
        subject: subject !== undefined ? subject : classroom.subject,
        grade: grade !== undefined ? grade : classroom.grade,
        inviteOnly: inviteOnly !== undefined ? inviteOnly : classroom.inviteOnly,
        autoApprove: autoApprove !== undefined ? autoApprove : classroom.autoApprove,
        isActive: isActive !== undefined ? isActive : classroom.isActive
      },
      include: {
        teacher: {
          include: {
            teacher: true
          }
        },
        _count: {
          select: {
            members: true
          }
        }
      }
    });

    res.status(200).json({
      status: 'success',
      message: 'Classroom başarıyla güncellendi.',
      data: updatedClassroom
    });
  } catch (error) {
    console.error('Update classroom error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Classroom güncellenirken bir hata oluştu.'
    });
  }
};

/**
 * Classroom sil (Sadece öğretmen)
 */
export const deleteClassroom = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const teacherId = req.user?.id;

    // Classroom kontrolü
    const classroom = await prisma.classroom.findUnique({
      where: { id }
    });

    if (!classroom) {
      return res.status(404).json({
        status: 'error',
        message: 'Classroom bulunamadı.'
      });
    }

    // Yetki kontrolü
    if (classroom.teacherId !== teacherId) {
      return res.status(403).json({
        status: 'error',
        message: 'Bu classroom\'ı silme yetkiniz yok.'
      });
    }

    // Sil (Cascade ile ilişkili veriler de silinir)
    await prisma.classroom.delete({
      where: { id }
    });

    res.status(200).json({
      status: 'success',
      message: 'Classroom başarıyla silindi.'
    });
  } catch (error) {
    console.error('Delete classroom error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Classroom silinirken bir hata oluştu.'
    });
  }
};

/**
 * Classroom üyelerini getir
 */
export const getClassroomMembers = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const role = req.user?.role;

    // Classroom kontrolü
    const classroom = await prisma.classroom.findUnique({
      where: { id }
    });

    if (!classroom) {
      return res.status(404).json({
        status: 'error',
        message: 'Classroom bulunamadı.'
      });
    }

    // Yetki kontrolü
    const isTeacher = classroom.teacherId === userId;
    const isMember = await prisma.classroomMember.findFirst({
      where: {
        classroomId: id,
        studentId: userId,
        status: 'ACTIVE'
      }
    });
    const isAdmin = role === 'ADMIN';

    if (!isTeacher && !isMember && !isAdmin) {
      return res.status(403).json({
        status: 'error',
        message: 'Bu classroom\'ın üyelerini görme yetkiniz yok.'
      });
    }

    // Üyeleri getir
    const members = await prisma.classroomMember.findMany({
      where: {
        classroomId: id,
        status: 'ACTIVE'
      },
      include: {
        student: {
          include: {
            student: true
          }
        }
      },
      orderBy: {
        joinedAt: 'asc'
      }
    });

    res.status(200).json({
      status: 'success',
      data: members
    });
  } catch (error) {
    console.error('Get classroom members error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Üyeler getirilirken bir hata oluştu.'
    });
  }
};

/**
 * Classroom'dan üye çıkar (Sadece öğretmen)
 */
export const removeMember = async (req: AuthRequest, res: Response) => {
  try {
    const { id, studentId } = req.params;
    const teacherId = req.user?.id;

    // Classroom kontrolü
    const classroom = await prisma.classroom.findUnique({
      where: { id }
    });

    if (!classroom) {
      return res.status(404).json({
        status: 'error',
        message: 'Classroom bulunamadı.'
      });
    }

    // Yetki kontrolü
    if (classroom.teacherId !== teacherId) {
      return res.status(403).json({
        status: 'error',
        message: 'Bu işlemi yapma yetkiniz yok.'
      });
    }

    // Üye kontrolü
    const member = await prisma.classroomMember.findFirst({
      where: {
        classroomId: id,
        studentId,
        status: 'ACTIVE'
      }
    });

    if (!member) {
      return res.status(404).json({
        status: 'error',
        message: 'Üye bulunamadı.'
      });
    }

    // Üyeyi çıkar (soft delete)
    await prisma.classroomMember.update({
      where: {
        id: member.id
      },
      data: {
        status: 'REMOVED',
        leftAt: new Date()
      }
    });

    // Bildirim gönder
    try {
      await notifyMemberRemoved(studentId, classroom.name);
    } catch (notificationError) {
      console.error('Notification error:', notificationError);
      // Bildirim hatası işlemi engellemesin
    }

    res.status(200).json({
      status: 'success',
      message: 'Üye başarıyla çıkarıldı.'
    });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Üye çıkarılırken bir hata oluştu.'
    });
  }
};

/**
 * Classroom'dan ayrıl (Öğrenci kendisi çıkar)
 */
export const leaveClassroom = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const studentId = req.user?.id;

    // Üye kontrolü
    const member = await prisma.classroomMember.findFirst({
      where: {
        classroomId: id,
        studentId,
        status: 'ACTIVE'
      }
    });

    if (!member) {
      return res.status(404).json({
        status: 'error',
        message: 'Bu classroom\'ın üyesi değilsiniz.'
      });
    }

    // Ayrıl (soft delete)
    await prisma.classroomMember.update({
      where: {
        id: member.id
      },
      data: {
        status: 'LEFT',
        leftAt: new Date()
      }
    });

    res.status(200).json({
      status: 'success',
      message: 'Classroom\'dan başarıyla ayrıldınız.'
    });
  } catch (error) {
    console.error('Leave classroom error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Classroom\'dan ayrılırken bir hata oluştu.'
    });
  }
};











