import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';

/**
 * Havuzdaki soru sayısını kontrol et (Preview için)
 */
export const getPoolQuestions = async (req: AuthRequest, res: Response) => {
  try {
    const { subject, topic, grade, difficulty } = req.query;

    // Filtreler
    const where: any = {
      isPublic: true, // Sadece genel havuzdaki sorular
    };

    if (subject) where.subject = subject as string;
    if (topic) {
      where.OR = [
        { topic: { contains: topic as string, mode: 'insensitive' } },
        { questionText: { contains: topic as string, mode: 'insensitive' } },
      ];
    }
    if (grade) where.grade = grade as string;
    if (difficulty) where.difficulty = difficulty as string;

    // Toplam soru sayısı
    const totalQuestions = await prisma.question.count({ where });

    // DEBUG: Sorguyu logla
    console.log('🔍 Pool Query:', JSON.stringify(where, null, 2));
    console.log('📊 Found Questions:', totalQuestions);

    return res.status(200).json({
      status: 'success',
      data: {
        totalQuestions,
        canPractice: totalQuestions > 0,
        // DEBUG: Filtreleri de gönder
        filters: { subject, topic, grade, difficulty },
      },
    });
  } catch (error: any) {
    console.error('getPoolQuestions error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Havuz sorgulanırken hata oluştu.',
    });
  }
};

/**
 * Yeni pratik oturumu başlat ve soruları getir
 */
export const startPracticeSession = async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user?.id;
    const { subject, topic, grade, questionCount, difficulty } = req.body;

    // Validasyon
    if (!subject || !grade || !questionCount) {
      return res.status(400).json({
        status: 'error',
        message: 'Ders, sınıf ve soru sayısı gerekli.',
      });
    }

    if (questionCount < 1 || questionCount > 50) {
      return res.status(400).json({
        status: 'error',
        message: 'Soru sayısı 1-50 arasında olmalıdır.',
      });
    }

    // Soruları havuzdan rastgele seç
    const where: any = {
      isPublic: true,
      subject,
      grade,
    };

    if (topic) {
      where.OR = [
        { topic: { contains: topic, mode: 'insensitive' } },
      ];
    }
    if (difficulty) where.difficulty = difficulty;

    // Toplam soru sayısı
    const totalQuestions = await prisma.question.count({ where });

    if (totalQuestions === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Bu kriterlere uygun soru bulunamadı.',
      });
    }

    if (totalQuestions < questionCount) {
      return res.status(400).json({
        status: 'error',
        message: `Havuzda sadece ${totalQuestions} soru var. Lütfen soru sayısını azaltın.`,
      });
    }

    // Rastgele sorular seç
    const skip = Math.max(0, Math.floor(Math.random() * (totalQuestions - questionCount)));
    const questions = await prisma.question.findMany({
      where,
      include: {
        options: {
          orderBy: { orderIndex: 'asc' },
        },
      },
      skip,
      take: questionCount,
    });

    // Pratik oturumu oluştur
    const session = await prisma.practiceSession.create({
      data: {
        studentId: studentId!,
        subject,
        topic: topic || 'Karışık Konular',
        grade,
        questionCount,
        difficulty,
        totalQuestions: questions.length,
        status: 'IN_PROGRESS',
      },
    });

    // Soruları döndür (ama doğru cevapları GİZLE!)
    const questionsForClient = questions.map(q => ({
      id: q.id,
      questionText: q.questionText,
      questionType: q.questionType,
      difficulty: q.difficulty,
      points: q.points,
      imageUrl: q.imageUrl,
      subject: q.subject,
      topic: q.topic,
      options: q.options.map(opt => ({
        id: opt.id,
        optionText: opt.optionText,
        orderIndex: opt.orderIndex,
        // isCorrect'i GÖNDERMİYORUZ!
      })),
    }));

    return res.status(201).json({
      status: 'success',
      message: 'Pratik oturumu başlatıldı!',
      data: {
        session: {
          id: session.id,
          subject: session.subject,
          topic: session.topic,
          grade: session.grade,
          totalQuestions: session.totalQuestions,
          startedAt: session.startedAt,
        },
        questions: questionsForClient,
      },
    });
  } catch (error: any) {
    console.error('startPracticeSession error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Pratik oturumu başlatılırken hata oluştu.',
      error: error.message,
    });
  }
};

/**
 * Soru cevapla (anında feedback)
 */
export const answerPracticeQuestion = async (req: AuthRequest, res: Response) => {
  try {
    const { id: sessionId } = req.params;
    const studentId = req.user?.id;
    const { questionId, selectedOptionId, timeSpent } = req.body;

    // Validasyon
    if (!questionId || !selectedOptionId) {
      return res.status(400).json({
        status: 'error',
        message: 'Soru ID ve seçilen şık gerekli.',
      });
    }

    // Oturumu kontrol et
    const session = await prisma.practiceSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return res.status(404).json({
        status: 'error',
        message: 'Oturum bulunamadı.',
      });
    }

    if (session.studentId !== studentId) {
      return res.status(403).json({
        status: 'error',
        message: 'Bu oturuma erişim yetkiniz yok.',
      });
    }

    if (session.status !== 'IN_PROGRESS') {
      return res.status(400).json({
        status: 'error',
        message: 'Bu oturum artık aktif değil.',
      });
    }

    // Daha önce bu soruyu cevapladı mı kontrol et
    const existingAnswer = await prisma.practiceAnswer.findUnique({
      where: {
        sessionId_questionId: {
          sessionId,
          questionId,
        },
      },
    });

    if (existingAnswer) {
      return res.status(400).json({
        status: 'error',
        message: 'Bu soruyu zaten cevapladınız.',
      });
    }

    // Seçilen şık doğru mu kontrol et
    const selectedOption = await prisma.questionOption.findUnique({
      where: { id: selectedOptionId },
      include: {
        question: {
          include: {
            options: true,
          },
        },
      },
    });

    if (!selectedOption) {
      return res.status(404).json({
        status: 'error',
        message: 'Seçilen şık bulunamadı.',
      });
    }

    const isCorrect = selectedOption.isCorrect;
    
    // Doğru cevabı bul
    const correctOption = selectedOption.question.options.find(opt => opt.isCorrect);

    // Cevabı kaydet
    const answer = await prisma.practiceAnswer.create({
      data: {
        sessionId,
        questionId,
        selectedOptionId,
        isCorrect,
        timeSpent: timeSpent || 0,
      },
    });

    // Soru istatistiğini güncelle
    await prisma.question.update({
      where: { id: questionId },
      data: {
        usageCount: { increment: 1 },
      },
    });

    // Sorunun açıklamasını getir
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      select: {
        explanation: true,
      },
    });

    return res.status(200).json({
      status: 'success',
      data: {
        isCorrect,
        correctOptionId: correctOption?.id,
        explanation: question?.explanation,
      },
    });
  } catch (error: any) {
    console.error('answerPracticeQuestion error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Cevap kaydedilirken hata oluştu.',
      error: error.message,
    });
  }
};

/**
 * Oturumu bitir ve sonuçları hesapla
 */
export const completePracticeSession = async (req: AuthRequest, res: Response) => {
  try {
    const { id: sessionId } = req.params;
    const studentId = req.user?.id;

    // Oturumu al
    const session = await prisma.practiceSession.findUnique({
      where: { id: sessionId },
      include: {
        answers: {
          include: {
            question: {
              include: {
                options: true,
              },
            },
            selectedOption: true,
          },
        },
      },
    });

    if (!session) {
      return res.status(404).json({
        status: 'error',
        message: 'Oturum bulunamadı.',
      });
    }

    if (session.studentId !== studentId) {
      return res.status(403).json({
        status: 'error',
        message: 'Bu oturuma erişim yetkiniz yok.',
      });
    }

    if (session.status === 'COMPLETED') {
      return res.status(400).json({
        status: 'error',
        message: 'Bu oturum zaten tamamlanmış.',
      });
    }

    // Sonuçları hesapla
    const correctCount = session.answers.filter(a => a.isCorrect).length;
    const wrongCount = session.answers.length - correctCount;
    const score = session.answers.length > 0 
      ? (correctCount / session.answers.length) * 100 
      : 0;

    // Oturumu güncelle
    const updatedSession = await prisma.practiceSession.update({
      where: { id: sessionId },
      data: {
        status: 'COMPLETED',
        correctCount,
        wrongCount,
        score,
        completedAt: new Date(),
      },
    });

    return res.status(200).json({
      status: 'success',
      message: 'Pratik çalışma tamamlandı!',
      data: {
        session: updatedSession,
        summary: {
          total: session.answers.length,
          correct: correctCount,
          wrong: wrongCount,
          score: score.toFixed(1),
        },
        answers: session.answers.map(a => ({
          questionId: a.questionId,
          questionText: a.question.questionText,
          selectedOptionId: a.selectedOptionId,
          selectedOptionText: a.selectedOption?.optionText,
          isCorrect: a.isCorrect,
          correctOptionId: a.question.options.find(opt => opt.isCorrect)?.id,
          correctOptionText: a.question.options.find(opt => opt.isCorrect)?.optionText,
          explanation: a.question.explanation,
          timeSpent: a.timeSpent,
        })),
      },
    });
  } catch (error: any) {
    console.error('completePracticeSession error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Oturum tamamlanırken hata oluştu.',
      error: error.message,
    });
  }
};

/**
 * Geçmiş oturumları listele
 */
export const getPracticeSessions = async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user?.id;
    const { subject, status, page = 1, limit = 20 } = req.query;

    const where: any = {
      studentId,
    };

    if (subject) where.subject = subject as string;
    if (status) where.status = status as string;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const [sessions, total] = await Promise.all([
      prisma.practiceSession.findMany({
        where,
        include: {
          answers: {
            select: {
              id: true,
            },
          },
        },
        orderBy: { startedAt: 'desc' },
        skip,
        take,
      }),
      prisma.practiceSession.count({ where }),
    ]);

    return res.status(200).json({
      status: 'success',
      data: {
        sessions,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error: any) {
    console.error('getPracticeSessions error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Oturumlar listelenirken hata oluştu.',
    });
  }
};

/**
 * Tek oturum detayı
 */
export const getPracticeSession = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const studentId = req.user?.id;

    const session = await prisma.practiceSession.findUnique({
      where: { id },
      include: {
        answers: {
          include: {
            question: {
              include: {
                options: true,
              },
            },
            selectedOption: true,
          },
        },
      },
    });

    if (!session) {
      return res.status(404).json({
        status: 'error',
        message: 'Oturum bulunamadı.',
      });
    }

    if (session.studentId !== studentId) {
      return res.status(403).json({
        status: 'error',
        message: 'Bu oturuma erişim yetkiniz yok.',
      });
    }

    // Cevapları işlenmiş haliyle döndür
    const processedSession = {
      ...session,
      answers: session.answers.map(a => ({
        questionId: a.questionId,
        questionText: a.question.questionText,
        selectedOptionId: a.selectedOptionId,
        selectedOptionText: a.selectedOption?.optionText,
        isCorrect: a.isCorrect,
        correctOptionId: a.question.options.find(opt => opt.isCorrect)?.id,
        correctOptionText: a.question.options.find(opt => opt.isCorrect)?.optionText,
        explanation: a.question.explanation,
        timeSpent: a.timeSpent,
      })),
    };

    return res.status(200).json({
      status: 'success',
      data: processedSession,
    });
  } catch (error: any) {
    console.error('getPracticeSession error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Oturum getirilirken hata oluştu.',
    });
  }
};

/**
 * İstatistikler
 */
export const getPracticeStats = async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user?.id;
    const { subject } = req.query;

    const where: any = {
      studentId,
      status: 'COMPLETED',
    };

    if (subject) where.subject = subject as string;

    // Tüm tamamlanmış oturumlar
    const sessions = await prisma.practiceSession.findMany({
      where,
      include: {
        answers: {
          include: {
            question: true,
          },
        },
      },
      orderBy: { completedAt: 'desc' },
    });

    // Genel istatistikler
    const totalSessions = sessions.length;
    const totalQuestions = sessions.reduce((sum, s) => sum + s.totalQuestions, 0);
    const totalCorrect = sessions.reduce((sum, s) => sum + (s.correctCount || 0), 0);
    const avgScore = totalSessions > 0
      ? sessions.reduce((sum, s) => sum + (s.score || 0), 0) / totalSessions
      : 0;

    // Ders bazlı başarı
    const subjectStats: any = {};
    sessions.forEach(session => {
      if (!subjectStats[session.subject]) {
        subjectStats[session.subject] = {
          count: 0,
          totalScore: 0,
          totalQuestions: 0,
          correctAnswers: 0,
          topicStats: {},
        };
      }
      subjectStats[session.subject].count++;
      subjectStats[session.subject].totalScore += session.score || 0;
      subjectStats[session.subject].totalQuestions += session.totalQuestions;
      subjectStats[session.subject].correctAnswers += session.correctCount || 0;

      // Konu bazlı
      const topicName = session.topic || 'Diğer';
      if (!subjectStats[session.subject].topicStats[topicName]) {
        subjectStats[session.subject].topicStats[topicName] = {
          count: 0,
          totalScore: 0,
          correctAnswers: 0,
          totalQuestions: 0,
        };
      }
      subjectStats[session.subject].topicStats[topicName].count++;
      subjectStats[session.subject].topicStats[topicName].totalScore += session.score || 0;
      subjectStats[session.subject].topicStats[topicName].correctAnswers += session.correctCount || 0;
      subjectStats[session.subject].topicStats[topicName].totalQuestions += session.totalQuestions;
    });

    // Ortalama hesapla
    Object.keys(subjectStats).forEach(subject => {
      const stats = subjectStats[subject];
      stats.avgScore = stats.totalScore / stats.count;
      stats.successRate = stats.totalQuestions > 0 
        ? (stats.correctAnswers / stats.totalQuestions) * 100 
        : 0;

      Object.keys(stats.topicStats).forEach(topic => {
        const topicStat = stats.topicStats[topic];
        topicStat.avgScore = topicStat.totalScore / topicStat.count;
        topicStat.successRate = topicStat.totalQuestions > 0
          ? (topicStat.correctAnswers / topicStat.totalQuestions) * 100
          : 0;
      });
    });

    return res.status(200).json({
      status: 'success',
      data: {
        overview: {
          totalSessions,
          totalQuestions,
          totalCorrect,
          avgScore: avgScore.toFixed(1),
          successRate: totalQuestions > 0 
            ? ((totalCorrect / totalQuestions) * 100).toFixed(1)
            : '0',
        },
        subjectStats,
        recentSessions: sessions.slice(0, 10).map(s => ({
          id: s.id,
          subject: s.subject,
          topic: s.topic,
          totalQuestions: s.totalQuestions,
          correctCount: s.correctCount,
          score: s.score,
          completedAt: s.completedAt,
        })),
      },
    });
  } catch (error: any) {
    console.error('getPracticeStats error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'İstatistikler yüklenirken hata oluştu.',
      error: error.message,
    });
  }
};

