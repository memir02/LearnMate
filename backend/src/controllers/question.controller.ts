import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';
import { createAuditLog, getIpAddress, getUserAgent } from '../utils/auditLog';

/**
 * Yeni soru oluştur (Sadece öğretmen)
 */
export const createQuestion = async (req: AuthRequest, res: Response) => {
  try {
    const teacherId = req.user?.id;
    const {
      questionText,
      questionType,
      difficulty,
      points,
      explanation,
      imageUrl,
      subject,
      topic,
      grade,
      tags,
      options,
      isPublic,
    } = req.body;

    // Validasyon
    if (!questionText || !options || options.length < 2) {
      return res.status(400).json({
        status: 'error',
        message: 'Soru metni ve en az 2 şık zorunludur.',
      });
    }

    // En az bir doğru cevap olmalı
    const hasCorrectAnswer = options.some((opt: any) => opt.isCorrect === true);
    if (!hasCorrectAnswer) {
      return res.status(400).json({
        status: 'error',
        message: 'En az bir doğru cevap işaretlemelisiniz.',
      });
    }

    // Soruyu ve şıkları oluştur
    const question = await prisma.question.create({
      data: {
        questionText,
        questionType: questionType || 'MULTIPLE_CHOICE',
        difficulty: difficulty || 'MEDIUM',
        points: points || 1,
        explanation,
        imageUrl,
        subject,
        topic,
        grade,
        tags: tags || [],
        isPublic: isPublic || false,
        createdBy: teacherId!,
        options: {
          create: options.map((opt: any, index: number) => ({
            optionText: opt.optionText,
            isCorrect: opt.isCorrect || false,
            orderIndex: opt.orderIndex || index + 1,
          })),
        },
      },
      include: {
        options: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    // Audit log - Soru oluşturma
    await createAuditLog({
      userId: teacherId!,
      action: 'QUESTION_CREATED',
      entityType: 'QUESTION',
      entityId: question.id,
      entityName: questionText.substring(0, 50) + '...',
      details: { subject, topic, grade, isPublic },
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req),
    });

    return res.status(201).json({
      status: 'success',
      message: 'Soru başarıyla oluşturuldu.',
      data: question,
    });
  } catch (error: any) {
    console.error('createQuestion error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Soru oluşturulurken bir hata oluştu.',
      error: error.message,
    });
  }
};

/**
 * Öğretmenin sorularını listele (filtreleme ile)
 */
export const getMyQuestions = async (req: AuthRequest, res: Response) => {
  try {
    const teacherId = req.user?.id;
    const { subject, topic, grade, difficulty, page = 1, limit = 20 } = req.query;

    // Filtreler
    const where: any = {
      createdBy: teacherId,
    };

    // Subject filtresi - exact match (dropdown olduğu için)
    if (subject) where.subject = subject as string;
    
    // Topic araması - contains ile (arama kutusu olduğu için)
    if (topic) {
      where.OR = [
        { topic: { contains: topic as string, mode: 'insensitive' } },
        { questionText: { contains: topic as string, mode: 'insensitive' } },
        { explanation: { contains: topic as string, mode: 'insensitive' } },
      ];
    }
    
    // Grade ve difficulty filtreleri - exact match
    if (grade) where.grade = grade as string;
    if (difficulty) where.difficulty = difficulty as string;

    // Sayfalama
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const [questions, total] = await Promise.all([
      prisma.question.findMany({
        where,
        include: {
          options: {
            orderBy: { orderIndex: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.question.count({ where }),
    ]);

    return res.status(200).json({
      status: 'success',
      data: {
        questions,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error: any) {
    console.error('getMyQuestions error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Sorular listelenirken bir hata oluştu.',
      error: error.message,
    });
  }
};

/**
 * Tek soru detayı getir
 */
export const getQuestionById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const question = await prisma.question.findUnique({
      where: { id },
      include: {
        options: {
          orderBy: { orderIndex: 'asc' },
        },
        creator: {
          select: {
            id: true,
            email: true,
            role: true,
            teacher: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!question) {
      return res.status(404).json({
        status: 'error',
        message: 'Soru bulunamadı.',
      });
    }

    // Sadece soru sahibi veya admin görebilir
    if (question.createdBy !== userId && req.user?.role !== 'ADMIN') {
      return res.status(403).json({
        status: 'error',
        message: 'Bu soruya erişim yetkiniz yok.',
      });
    }

    return res.status(200).json({
      status: 'success',
      data: question,
    });
  } catch (error: any) {
    console.error('getQuestionById error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Soru getirilirken bir hata oluştu.',
      error: error.message,
    });
  }
};

/**
 * Soru güncelle
 */
export const updateQuestion = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const {
      questionText,
      questionType,
      difficulty,
      points,
      explanation,
      imageUrl,
      subject,
      topic,
      grade,
      tags,
      options,
      isPublic,
    } = req.body;

    // Soruyu kontrol et
    const existingQuestion = await prisma.question.findUnique({
      where: { id },
    });

    if (!existingQuestion) {
      return res.status(404).json({
        status: 'error',
        message: 'Soru bulunamadı.',
      });
    }

    // Sadece soru sahibi güncelleyebilir
    if (existingQuestion.createdBy !== userId) {
      return res.status(403).json({
        status: 'error',
        message: 'Bu soruyu güncelleme yetkiniz yok.',
      });
    }

    // Şıklar güncelleniyor mu?
    if (options && Array.isArray(options)) {
      // En az bir doğru cevap kontrolü
      const hasCorrectAnswer = options.some((opt: any) => opt.isCorrect === true);
      if (!hasCorrectAnswer) {
        return res.status(400).json({
          status: 'error',
          message: 'En az bir doğru cevap işaretlemelisiniz.',
        });
      }

      // Mevcut şıkları sil ve yenilerini ekle
      await prisma.questionOption.deleteMany({
        where: { questionId: id },
      });
    }

    // Soruyu güncelle
    const updatedQuestion = await prisma.question.update({
      where: { id },
      data: {
        questionText,
        questionType,
        difficulty,
        points,
        explanation,
        imageUrl,
        subject,
        topic,
        grade,
        tags: tags || existingQuestion.tags,
        ...(isPublic !== undefined && { isPublic }),
        ...(options && {
          options: {
            create: options.map((opt: any, index: number) => ({
              optionText: opt.optionText,
              isCorrect: opt.isCorrect || false,
              orderIndex: opt.orderIndex || index + 1,
            })),
          },
        }),
      },
      include: {
        options: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    return res.status(200).json({
      status: 'success',
      message: 'Soru başarıyla güncellendi.',
      data: updatedQuestion,
    });
  } catch (error: any) {
    console.error('updateQuestion error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Soru güncellenirken bir hata oluştu.',
      error: error.message,
    });
  }
};

/**
 * Soru sil
 */
export const deleteQuestion = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    // Soruyu kontrol et
    const question = await prisma.question.findUnique({
      where: { id },
    });

    if (!question) {
      return res.status(404).json({
        status: 'error',
        message: 'Soru bulunamadı.',
      });
    }

    // Sadece soru sahibi silebilir
    if (question.createdBy !== userId) {
      return res.status(403).json({
        status: 'error',
        message: 'Bu soruyu silme yetkiniz yok.',
      });
    }

    // Audit log - Soru silme
    await createAuditLog({
      userId: userId!,
      action: 'QUESTION_DELETED',
      entityType: 'QUESTION',
      entityId: question.id,
      entityName: question.questionText.substring(0, 50) + '...',
      details: { subject: question.subject, topic: question.topic, grade: question.grade },
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req),
    });

    // Soruyu sil (şıklar CASCADE ile otomatik silinir)
    await prisma.question.delete({
      where: { id },
    });

    return res.status(200).json({
      status: 'success',
      message: 'Soru başarıyla silindi.',
    });
  } catch (error: any) {
    console.error('deleteQuestion error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Soru silinirken bir hata oluştu.',
      error: error.message,
    });
  }
};

/**
 * Soruyu genel havuza ekle/çıkar (Toggle isPublic)
 */
export const toggleQuestionPublic = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const { isPublic } = req.body;

    // Validasyon
    if (isPublic === undefined) {
      return res.status(400).json({
        status: 'error',
        message: 'isPublic değeri gerekli.',
      });
    }

    // Soruyu kontrol et
    const question = await prisma.question.findUnique({
      where: { id },
    });

    if (!question) {
      return res.status(404).json({
        status: 'error',
        message: 'Soru bulunamadı.',
      });
    }

    // Sadece soru sahibi değiştirebilir
    if (question.createdBy !== userId) {
      return res.status(403).json({
        status: 'error',
        message: 'Bu soruyu düzenleme yetkiniz yok.',
      });
    }

    // isPublic'i güncelle
    const updatedQuestion = await prisma.question.update({
      where: { id },
      data: {
        isPublic: isPublic as boolean,
      },
    });

    // Audit log - Soru havuza ekleme/çıkarma
    await createAuditLog({
      userId: userId!,
      action: isPublic ? 'QUESTION_ADDED_TO_POOL' : 'QUESTION_REMOVED_FROM_POOL',
      entityType: 'QUESTION',
      entityId: question.id,
      entityName: question.questionText.substring(0, 50) + '...',
      details: { subject: question.subject, topic: question.topic, grade: question.grade },
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req),
    });

    return res.status(200).json({
      status: 'success',
      message: isPublic 
        ? 'Soru genel havuza eklendi!' 
        : 'Soru genel havuzdan çıkarıldı.',
      data: updatedQuestion,
    });
  } catch (error: any) {
    console.error('toggleQuestionPublic error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'İşlem sırasında bir hata oluştu.',
      error: error.message,
    });
  }
};

/**
 * Rastgele soru seç (Soru havuzu için)
 */
export const getRandomQuestions = async (req: AuthRequest, res: Response) => {
  try {
    const teacherId = req.user?.id;
    const { subject, topic, grade, count = 10 } = req.query;

    // Filtreler
    const where: any = {
      createdBy: teacherId,
    };

    if (subject) where.subject = subject as string;
    if (topic) where.topic = topic as string;
    if (grade) where.grade = grade as string;

    // Toplam soru sayısını al
    const totalQuestions = await prisma.question.count({ where });

    if (totalQuestions === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Bu kriterlere uygun soru bulunamadı.',
      });
    }

    // Rastgele soruları seç
    const requestedCount = Math.min(Number(count), totalQuestions);
    const skip = Math.max(0, Math.floor(Math.random() * (totalQuestions - requestedCount)));

    const questions = await prisma.question.findMany({
      where,
      include: {
        options: {
          orderBy: { orderIndex: 'asc' },
        },
      },
      skip,
      take: requestedCount,
    });

    return res.status(200).json({
      status: 'success',
      data: {
        questions,
        count: questions.length,
      },
    });
  } catch (error: any) {
    console.error('getRandomQuestions error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Rastgele sorular seçilirken bir hata oluştu.',
      error: error.message,
    });
  }
};






