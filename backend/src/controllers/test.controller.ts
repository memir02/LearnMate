import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';
import { createAuditLog, getIpAddress, getUserAgent } from '../utils/auditLog';

/**
 * Yeni test oluştur (Sadece öğretmen)
 */
export const createTest = async (req: AuthRequest, res: Response) => {
  try {
    const teacherId = req.user?.id;
    const {
      title,
      description,
      subject,
      topic,
      grade,
      classroomId,
      durationMinutes,
      passingScore,
      showResults,
      shuffleQuestions,
      startDate,
      endDate,
      questionIds, // Seçilen soru ID'leri
    } = req.body;

    // Validasyon
    if (!title) {
      return res.status(400).json({
        status: 'error',
        message: 'Test başlığı zorunludur.',
      });
    }

    if (!questionIds || questionIds.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'En az bir soru seçmelisiniz.',
      });
    }

    // Classroom kontrolü (eğer belirtilmişse)
    if (classroomId) {
      const classroom = await prisma.classroom.findUnique({
        where: { id: classroomId },
      });

      if (!classroom) {
        return res.status(404).json({
          status: 'error',
          message: 'Sınıf bulunamadı.',
        });
      }

      if (classroom.teacherId !== teacherId) {
        return res.status(403).json({
          status: 'error',
          message: 'Bu sınıfa test atama yetkiniz yok.',
        });
      }
    }

    // Soruları kontrol et
    const questions = await prisma.question.findMany({
      where: {
        id: { in: questionIds },
        createdBy: teacherId, // Sadece kendi soruları
      },
    });

    if (questions.length !== questionIds.length) {
      return res.status(400).json({
        status: 'error',
        message: 'Bazı sorular bulunamadı veya size ait değil.',
      });
    }

    // Toplam puanı hesapla
    const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

    // Test oluştur
    const test = await prisma.test.create({
      data: {
        title,
        description,
        subject,
        topic,
        grade,
        teacherId: teacherId!,
        classroomId: classroomId || null,
        durationMinutes: durationMinutes || null,
        totalPoints,
        passingScore: passingScore || null,
        showResults: showResults !== undefined ? showResults : true,
        shuffleQuestions: shuffleQuestions || false,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        testQuestions: {
          create: questionIds.map((qId: string, index: number) => {
            const question = questions.find((q) => q.id === qId);
            return {
              questionId: qId,
              orderIndex: index + 1,
              points: question?.points || 1,
            };
          }),
        },
      },
      include: {
        testQuestions: {
          include: {
            question: {
              include: {
                options: true,
              },
            },
          },
          orderBy: { orderIndex: 'asc' },
        },
        classroom: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Eğer classroom'a atandıysa, öğrencilere StudentTest kayıtları oluştur
    if (classroomId) {
      console.log('🔍 Classroom ID:', classroomId);
      
      const classroomMembers = await prisma.classroomMember.findMany({
        where: {
          classroomId,
          status: 'ACTIVE',
        },
        select: {
          studentId: true,
        },
      });

      console.log('👥 Classroom members found:', classroomMembers.length);
      console.log('📋 Members:', classroomMembers);

      if (classroomMembers.length > 0) {
        await prisma.studentTest.createMany({
          data: classroomMembers.map((member) => ({
            testId: test.id,
            studentId: member.studentId,
            status: 'ASSIGNED',
          })),
        });

        console.log('✅ StudentTest kayıtları oluşturuldu!');
        // TODO: Öğrencilere bildirim gönder
      } else {
        console.log('⚠️ Bu sınıfta aktif üye yok!');
      }
    }

    // Audit log - Test oluşturma
    await createAuditLog({
      userId: teacherId!,
      action: 'TEST_CREATED',
      entityType: 'TEST',
      entityId: test.id,
      entityName: test.title,
      details: { subject: test.subject, questionCount: questionIds.length },
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req),
    });

    return res.status(201).json({
      status: 'success',
      message: 'Test başarıyla oluşturuldu.',
      data: test,
    });
  } catch (error: any) {
    console.error('createTest error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Test oluşturulurken bir hata oluştu.',
      error: error.message,
    });
  }
};

/**
 * Öğretmenin testlerini listele
 */
export const getMyTests = async (req: AuthRequest, res: Response) => {
  try {
    const teacherId = req.user?.id;
    const { classroomId, subject, topic, isPublished, page = 1, limit = 20 } = req.query;

    // Filtreler
    const where: any = {
      teacherId,
    };

    if (classroomId) where.classroomId = classroomId as string;
    
    // Subject filtresi - exact match (dropdown olduğu için)
    if (subject) where.subject = subject as string;
    
    // Topic araması - contains ile (arama kutusu olduğu için)
    if (topic) {
      where.OR = [
        { topic: { contains: topic as string, mode: 'insensitive' } },
        { title: { contains: topic as string, mode: 'insensitive' } },
        { description: { contains: topic as string, mode: 'insensitive' } },
      ];
    }
    
    if (isPublished !== undefined) where.isPublished = isPublished === 'true';

    // Sayfalama
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const [tests, total] = await Promise.all([
      prisma.test.findMany({
        where,
        include: {
          classroom: {
            select: {
              id: true,
              name: true,
            },
          },
          testQuestions: {
            select: {
              id: true,
            },
          },
          studentTests: {
            select: {
              id: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.test.count({ where }),
    ]);

    // İstatistikler ekle
    const testsWithStats = tests.map((test) => ({
      ...test,
      questionCount: test.testQuestions.length,
      studentCount: test.studentTests.length,
      completedCount: test.studentTests.filter((st) => st.status === 'SUBMITTED' || st.status === 'GRADED').length,
    }));

    return res.status(200).json({
      status: 'success',
      data: {
        tests: testsWithStats,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error: any) {
    console.error('getMyTests error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Testler listelenirken bir hata oluştu.',
      error: error.message,
    });
  }
};

/**
 * Test detayı getir
 */
export const getTestById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    const test = await prisma.test.findUnique({
      where: { id },
      include: {
        testQuestions: {
          include: {
            question: {
              include: {
                options: {
                  orderBy: { orderIndex: 'asc' },
                },
              },
            },
          },
          orderBy: { orderIndex: 'asc' },
        },
        classroom: {
          select: {
            id: true,
            name: true,
          },
        },
        teacher: {
          select: {
            id: true,
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

    if (!test) {
      return res.status(404).json({
        status: 'error',
        message: 'Test bulunamadı.',
      });
    }

    // Yetki kontrolü
    if (userRole === 'TEACHER' && test.teacherId !== userId) {
      return res.status(403).json({
        status: 'error',
        message: 'Bu teste erişim yetkiniz yok.',
      });
    }

    // Öğrenci ise, sadece atanmış testleri görebilir
    if (userRole === 'STUDENT') {
      const studentTest = await prisma.studentTest.findUnique({
        where: {
          testId_studentId: {
            testId: id,
            studentId: userId!,
          },
        },
      });

      if (!studentTest) {
        return res.status(403).json({
          status: 'error',
          message: 'Bu test size atanmamış.',
        });
      }
    }

    return res.status(200).json({
      status: 'success',
      data: test,
    });
  } catch (error: any) {
    console.error('getTestById error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Test getirilirken bir hata oluştu.',
      error: error.message,
    });
  }
};

/**
 * Test güncelle
 */
export const updateTest = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const {
      title,
      description,
      subject,
      topic,
      grade,
      durationMinutes,
      passingScore,
      showResults,
      shuffleQuestions,
      startDate,
      endDate,
    } = req.body;

    // Test kontrolü
    const test = await prisma.test.findUnique({
      where: { id },
    });

    if (!test) {
      return res.status(404).json({
        status: 'error',
        message: 'Test bulunamadı.',
      });
    }

    if (test.teacherId !== userId) {
      return res.status(403).json({
        status: 'error',
        message: 'Bu testi güncelleme yetkiniz yok.',
      });
    }

    // Test güncelle
    const updatedTest = await prisma.test.update({
      where: { id },
      data: {
        title,
        description,
        subject,
        topic,
        grade,
        durationMinutes,
        passingScore,
        showResults,
        shuffleQuestions,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      },
      include: {
        testQuestions: {
          include: {
            question: {
              include: {
                options: true,
              },
            },
          },
        },
      },
    });

    return res.status(200).json({
      status: 'success',
      message: 'Test başarıyla güncellendi.',
      data: updatedTest,
    });
  } catch (error: any) {
    console.error('updateTest error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Test güncellenirken bir hata oluştu.',
      error: error.message,
    });
  }
};

/**
 * Test yayınla/yayından kaldır
 */
export const publishTest = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const { isPublished } = req.body;

    const test = await prisma.test.findUnique({
      where: { id },
    });

    if (!test) {
      return res.status(404).json({
        status: 'error',
        message: 'Test bulunamadı.',
      });
    }

    if (test.teacherId !== userId) {
      return res.status(403).json({
        status: 'error',
        message: 'Bu testi yayınlama yetkiniz yok.',
      });
    }

    const updatedTest = await prisma.test.update({
      where: { id },
      data: { isPublished },
    });

    // Audit log - Test yayınlama
    if (isPublished) {
      await createAuditLog({
        userId: userId!,
        action: 'TEST_PUBLISHED',
        entityType: 'TEST',
        entityId: test.id,
        entityName: test.title,
        details: { subject: test.subject },
        ipAddress: getIpAddress(req),
        userAgent: getUserAgent(req),
      });
    }

    return res.status(200).json({
      status: 'success',
      message: isPublished ? 'Test yayınlandı.' : 'Test yayından kaldırıldı.',
      data: updatedTest,
    });
  } catch (error: any) {
    console.error('publishTest error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Test durumu güncellenirken bir hata oluştu.',
      error: error.message,
    });
  }
};

/**
 * Test sil
 */
export const deleteTest = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const test = await prisma.test.findUnique({
      where: { id },
    });

    if (!test) {
      return res.status(404).json({
        status: 'error',
        message: 'Test bulunamadı.',
      });
    }

    if (test.teacherId !== userId) {
      return res.status(403).json({
        status: 'error',
        message: 'Bu testi silme yetkiniz yok.',
      });
    }

    // Audit log - Test silme
    await createAuditLog({
      userId: userId!,
      action: 'TEST_DELETED',
      entityType: 'TEST',
      entityId: test.id,
      entityName: test.title,
      details: { subject: test.subject },
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req),
    });

    // Test sil (ilişkili veriler CASCADE ile silinir)
    await prisma.test.delete({
      where: { id },
    });

    return res.status(200).json({
      status: 'success',
      message: 'Test başarıyla silindi.',
    });
  } catch (error: any) {
    console.error('deleteTest error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Test silinirken bir hata oluştu.',
      error: error.message,
    });
  }
};

/**
 * Öğretmen istatistiklerini getir
 */
export const getTeacherStatistics = async (req: AuthRequest, res: Response) => {
  try {
    const teacherId = req.user?.id;

    // Toplam testler
    const totalTests = await prisma.test.count({
      where: { teacherId },
    });

    // Yayınlanmış testler
    const publishedTests = await prisma.test.count({
      where: { teacherId, isPublished: true },
    });

    // Toplam sorular
    const totalQuestions = await prisma.question.count({
      where: { createdBy: teacherId },
    });

    // Toplam öğrenciler (tüm classroom'lardaki benzersiz öğrenciler)
    const classrooms = await prisma.classroom.findMany({
      where: { teacherId },
      include: {
        members: {
          where: { status: 'ACTIVE' },
          select: { studentId: true },
        },
      },
    });

    const uniqueStudents = new Set(
      classrooms.flatMap((c) => c.members.map((m) => m.studentId))
    );
    const totalStudents = uniqueStudents.size;

    // Tüm student test'leri
    const allStudentTests = await prisma.studentTest.findMany({
      where: {
        test: { teacherId },
        status: { in: ['SUBMITTED', 'GRADED'] },
      },
      select: {
        id: true,
        testId: true,
        studentId: true,
        score: true,
        percentage: true,
        isPassed: true,
        submittedAt: true,
        student: {
          select: {
            id: true,
            email: true,
            student: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        test: {
          select: {
            id: true,
            title: true,
            subject: true,
            classroomId: true,
            classroom: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // Genel başarı oranı
    const averagePercentage =
      allStudentTests.length > 0
        ? allStudentTests.reduce((sum, st) => sum + (st.percentage || 0), 0) / allStudentTests.length
        : 0;

    // Geçen/kalan sayısı
    const passedCount = allStudentTests.filter((st) => st.isPassed === true).length;
    const failedCount = allStudentTests.filter((st) => st.isPassed === false).length;

    // En başarılı öğrenciler (Top 5)
    const studentPerformance: { [key: string]: { total: number; sum: number; student: any } } = {};
    
    allStudentTests.forEach((st) => {
      if (!studentPerformance[st.studentId]) {
        studentPerformance[st.studentId] = {
          total: 0,
          sum: 0,
          student: st.student,
        };
      }
      studentPerformance[st.studentId].total++;
      studentPerformance[st.studentId].sum += st.percentage || 0;
    });

    const topStudents = Object.entries(studentPerformance)
      .map(([studentId, data]) => ({
        studentId,
        name: `${data.student.student?.firstName || ''} ${data.student.student?.lastName || ''}`.trim(),
        email: data.student.email,
        testsTaken: data.total,
        averagePercentage: data.sum / data.total,
      }))
      .sort((a, b) => b.averagePercentage - a.averagePercentage)
      .slice(0, 5);

    // Destek gereken öğrenciler (Ortalama %50'nin altında)
    const studentsNeedingHelp = Object.entries(studentPerformance)
      .map(([studentId, data]) => ({
        studentId,
        name: `${data.student.student?.firstName || ''} ${data.student.student?.lastName || ''}`.trim(),
        email: data.student.email,
        testsTaken: data.total,
        averagePercentage: data.sum / data.total,
      }))
      .filter((s) => s.averagePercentage < 50)
      .sort((a, b) => a.averagePercentage - b.averagePercentage)
      .slice(0, 5);

    // Classroom bazlı performans
    const classroomPerformance = classrooms.map((classroom) => {
      const classroomTests = allStudentTests.filter(
        (st) => st.test.classroomId === classroom.id
      );
      const avgPercentage =
        classroomTests.length > 0
          ? classroomTests.reduce((sum, st) => sum + (st.percentage || 0), 0) / classroomTests.length
          : 0;

      return {
        classroomId: classroom.id,
        name: classroom.name,
        studentCount: classroom.members.length,
        testsCompleted: classroomTests.length,
        averagePercentage: avgPercentage,
      };
    });

    // Ders bazlı performans
    const subjectPerformance: { [key: string]: { total: number; sum: number } } = {};
    
    allStudentTests.forEach((st) => {
      const subject = st.test.subject || 'Diğer';
      if (!subjectPerformance[subject]) {
        subjectPerformance[subject] = { total: 0, sum: 0 };
      }
      subjectPerformance[subject].total++;
      subjectPerformance[subject].sum += st.percentage || 0;
    });

    const subjectStats = Object.entries(subjectPerformance).map(([subject, data]) => ({
      subject,
      testsCompleted: data.total,
      averagePercentage: data.sum / data.total,
    }));

    // Son 7 günlük aktivite
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentActivity = allStudentTests
      .filter((st) => st.submittedAt && new Date(st.submittedAt) >= sevenDaysAgo)
      .length;

    return res.status(200).json({
      status: 'success',
      data: {
        overview: {
          totalTests,
          publishedTests,
          totalQuestions,
          totalStudents,
          totalCompletedTests: allStudentTests.length,
          averagePercentage: Math.round(averagePercentage * 10) / 10,
          passedCount,
          failedCount,
          recentActivity,
        },
        topStudents,
        studentsNeedingHelp,
        classroomPerformance: classroomPerformance.sort((a, b) => b.averagePercentage - a.averagePercentage),
        subjectPerformance: subjectStats.sort((a, b) => b.averagePercentage - a.averagePercentage),
      },
    });
  } catch (error: any) {
    console.error('getTeacherStatistics error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'İstatistikler getirilirken bir hata oluştu.',
      error: error.message,
    });
  }
};

