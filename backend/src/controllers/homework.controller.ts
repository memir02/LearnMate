import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';
import { deleteFromCloudinary } from '../utils/cloudinary';

// Ödev oluştur (Teacher)
export const createHomework = async (req: AuthRequest, res: Response) => {
  try {
    const teacherId = req.user?.id;
    const { title, description, classroomId, dueDate } = req.body;
    const file = req.file as any;

    if (!title || !classroomId) {
      return res.status(400).json({
        status: 'error',
        message: 'Başlık ve sınıf seçimi zorunludur.',
      });
    }

    if (!file) {
      return res.status(400).json({
        status: 'error',
        message: 'Dosya yüklenmedi.',
      });
    }

    // Sınıfın bu öğretmene ait olduğunu doğrula
    const classroom = await prisma.classroom.findFirst({
      where: { id: classroomId, teacherId },
    });

    if (!classroom) {
      return res.status(403).json({
        status: 'error',
        message: 'Bu sınıfa ödev verme yetkiniz yok.',
      });
    }

    const isPdf = file.mimetype === 'application/pdf';
    const fileType = isPdf ? 'PDF' : 'IMAGE';

    const homework = await prisma.homework.create({
      data: {
        title,
        description: description || null,
        fileUrl: file.path,
        fileType,
        publicId: file.filename,
        teacherId: teacherId!,
        classroomId,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
      include: {
        classroom: { select: { id: true, name: true } },
        teacher: {
          select: {
            teacher: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    return res.status(201).json({
      status: 'success',
      message: 'Ödev başarıyla oluşturuldu.',
      data: homework,
    });
  } catch (error) {
    console.error('Create homework error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Ödev oluşturulurken bir hata oluştu.',
    });
  }
};

// Öğretmenin tüm ödevlerini listele
export const getMyHomeworks = async (req: AuthRequest, res: Response) => {
  try {
    const teacherId = req.user?.id;

    const homeworks = await prisma.homework.findMany({
      where: { teacherId },
      include: {
        classroom: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      status: 'success',
      data: homeworks,
    });
  } catch (error) {
    console.error('Get homeworks error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Ödevler getirilirken bir hata oluştu.',
    });
  }
};

// Sınıfa ait ödevleri listele (Teacher veya Student)
export const getClassroomHomeworks = async (req: AuthRequest, res: Response) => {
  try {
    const { classroomId } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    // Öğrenci ise sınıf üyesi mi kontrol et
    if (userRole === 'STUDENT') {
      const membership = await prisma.classroomMember.findFirst({
        where: { classroomId, studentId: userId, status: 'ACTIVE' },
      });
      if (!membership) {
        return res.status(403).json({
          status: 'error',
          message: 'Bu sınıfın ödevlerine erişim yetkiniz yok.',
        });
      }
    }

    const homeworks = await prisma.homework.findMany({
      where: { classroomId },
      include: {
        teacher: {
          select: {
            teacher: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      status: 'success',
      data: homeworks,
    });
  } catch (error) {
    console.error('Get classroom homeworks error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Sınıf ödevleri getirilirken bir hata oluştu.',
    });
  }
};

// Ödev sil (Teacher - sadece kendi ödevi)
export const deleteHomework = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const teacherId = req.user?.id;

    const homework = await prisma.homework.findFirst({
      where: { id, teacherId },
    });

    if (!homework) {
      return res.status(404).json({
        status: 'error',
        message: 'Ödev bulunamadı veya silme yetkiniz yok.',
      });
    }

    // Cloudinary'den dosyayı sil
    const resourceType = homework.fileType === 'PDF' ? 'raw' : 'image';
    await deleteFromCloudinary(homework.publicId, resourceType);

    await prisma.homework.delete({ where: { id } });

    return res.status(200).json({
      status: 'success',
      message: 'Ödev başarıyla silindi.',
    });
  } catch (error) {
    console.error('Delete homework error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Ödev silinirken bir hata oluştu.',
    });
  }
};
