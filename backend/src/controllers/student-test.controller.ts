import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';

/**
 * Öğrenciye atanan testleri listele
 */
export const getMyAssignedTests = async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user?.id;
    const { status, page = 1, limit = 20 } = req.query;

    // Filtreler
    const where: any = {
      studentId,
    };

    if (status) where.status = status as string;

    // Sayfalama
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    // Sadece yayınlanmış testleri göster
    const whereWithPublished = {
      ...where,
      test: {
        isPublished: true,
      },
    };

    const [studentTests, total] = await Promise.all([
      prisma.studentTest.findMany({
        where: whereWithPublished,
        include: {
          test: {
            include: {
              classroom: {
                select: {
                  id: true,
                  name: true,
                },
              },
              teacher: {
                select: {
                  teacher: {
                    select: {
                      firstName: true,
                      lastName: true,
                    },
                  },
                },
              },
              testQuestions: {
                select: {
                  id: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.studentTest.count({ where: whereWithPublished }),
    ]);

    // Test bilgilerini düzenle
    const testsWithInfo = studentTests.map((st) => ({
        studentTestId: st.id,
        status: st.status,
        score: st.score,
        percentage: st.percentage,
        isPassed: st.isPassed,
        startedAt: st.startedAt,
        submittedAt: st.submittedAt,
        test: {
          id: st.test.id,
          title: st.test.title,
          description: st.test.description,
          subject: st.test.subject,
          topic: st.test.topic,
          grade: st.test.grade,
          durationMinutes: st.test.durationMinutes,
          totalPoints: st.test.totalPoints,
          passingScore: st.test.passingScore,
          startDate: st.test.startDate,
          endDate: st.test.endDate,
          questionCount: st.test.testQuestions.length,
          classroom: st.test.classroom,
          teacher: st.test.teacher.teacher,
        },
      }));

    return res.status(200).json({
      status: 'success',
      data: {
        tests: testsWithInfo,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error: any) {
    console.error('getMyAssignedTests error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Testler listelenirken bir hata oluştu.',
      error: error.message,
    });
  }
};

/**
 * Teste başla
 */
export const startTest = async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user?.id;
    const { testId } = req.params;

    // StudentTest kaydını bul
    const studentTest = await prisma.studentTest.findUnique({
      where: {
        testId_studentId: {
          testId,
          studentId: studentId!,
        },
      },
      include: {
        test: {
          include: {
            testQuestions: {
              include: {
                question: {
                  include: {
                    options: {
                      orderBy: { orderIndex: 'asc' },
                      select: {
                        id: true,
                        optionText: true,
                        orderIndex: true,
                        // isCorrect'i GÖNDERMİYORUZ!
                      },
                    },
                  },
                },
              },
              orderBy: { orderIndex: 'asc' },
            },
          },
        },
      },
    });

    if (!studentTest) {
      return res.status(404).json({
        status: 'error',
        message: 'Bu test size atanmamış.',
      });
    }

    // Test yayınlanmış mı kontrol et
    if (!studentTest.test.isPublished) {
      return res.status(403).json({
        status: 'error',
        message: 'Bu test henüz yayınlanmamış.',
      });
    }

    // Zaten tamamlanmış mı?
    if (studentTest.status === 'SUBMITTED' || studentTest.status === 'GRADED') {
      return res.status(400).json({
        status: 'error',
        message: 'Bu testi zaten tamamladınız.',
      });
    }

    // Test tarihleri kontrolü
    const now = new Date();
    if (studentTest.test.startDate && now < studentTest.test.startDate) {
      return res.status(400).json({
        status: 'error',
        message: 'Test henüz başlamamış.',
      });
    }

    if (studentTest.test.endDate && now > studentTest.test.endDate) {
      return res.status(400).json({
        status: 'error',
        message: 'Test süresi dolmuş.',
      });
    }

    // İlk kez başlıyorsa, durumu güncelle
    if (studentTest.status === 'ASSIGNED') {
      await prisma.studentTest.update({
        where: { id: studentTest.id },
        data: {
          status: 'STARTED',
          startedAt: new Date(),
        },
      });
    }

    // Soruları hazırla (doğru cevaplar olmadan)
    const questions = studentTest.test.testQuestions.map((tq) => ({
      questionId: tq.question.id,
      questionText: tq.question.questionText,
      questionType: tq.question.questionType,
      imageUrl: tq.question.imageUrl,
      points: tq.points,
      orderIndex: tq.orderIndex,
      options: tq.question.options, // isCorrect yok
    }));

    return res.status(200).json({
      status: 'success',
      message: 'Test başlatıldı.',
      data: {
        studentTestId: studentTest.id,
        test: {
          id: studentTest.test.id,
          title: studentTest.test.title,
          description: studentTest.test.description,
          subject: studentTest.test.subject,
          topic: studentTest.test.topic,
          grade: studentTest.test.grade,
          durationMinutes: studentTest.test.durationMinutes,
          totalPoints: studentTest.test.totalPoints,
          showResults: studentTest.test.showResults,
        },
        questions,
        startedAt: studentTest.startedAt || new Date(),
      },
    });
  } catch (error: any) {
    console.error('startTest error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Test başlatılırken bir hata oluştu.',
      error: error.message,
    });
  }
};

/**
 * Cevap gönder (tek soru)
 */
export const submitAnswer = async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user?.id;
    const { studentTestId } = req.params;
    const { questionId, selectedOptionId, answerText } = req.body;

    // StudentTest kontrolü
    const studentTest = await prisma.studentTest.findUnique({
      where: { id: studentTestId },
    });

    if (!studentTest || studentTest.studentId !== studentId) {
      return res.status(404).json({
        status: 'error',
        message: 'Test bulunamadı.',
      });
    }

    if (studentTest.status !== 'STARTED') {
      return res.status(400).json({
        status: 'error',
        message: 'Test başlatılmamış veya zaten tamamlanmış.',
      });
    }

    // Soruyu kontrol et
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        options: true,
      },
    });

    if (!question) {
      return res.status(404).json({
        status: 'error',
        message: 'Soru bulunamadı.',
      });
    }

    // Cevabı kontrol et
    let isCorrect = false;
    let pointsEarned = 0;

    if (question.questionType === 'MULTIPLE_CHOICE' && selectedOptionId) {
      const selectedOption = question.options.find((opt) => opt.id === selectedOptionId);
      if (selectedOption?.isCorrect) {
        isCorrect = true;
        pointsEarned = question.points;
      }
    }

    // Cevabı kaydet veya güncelle
    const existingAnswer = await prisma.studentAnswer.findFirst({
      where: {
        studentTestId,
        questionId,
      },
    });

    if (existingAnswer) {
      // Güncelle
      await prisma.studentAnswer.update({
        where: { id: existingAnswer.id },
        data: {
          selectedOptionId,
          answerText,
          isCorrect,
          pointsEarned,
        },
      });
    } else {
      // Yeni cevap
      await prisma.studentAnswer.create({
        data: {
          studentTestId,
          questionId,
          selectedOptionId,
          answerText,
          isCorrect,
          pointsEarned,
        },
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Cevap kaydedildi.',
    });
  } catch (error: any) {
    console.error('submitAnswer error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Cevap kaydedilirken bir hata oluştu.',
      error: error.message,
    });
  }
};

/**
 * Testi tamamla ve sonuçları hesapla
 */
export const submitTest = async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user?.id;
    const { studentTestId } = req.params;

    // StudentTest kontrolü
    const studentTest = await prisma.studentTest.findUnique({
      where: { id: studentTestId },
      include: {
        test: {
          include: {
            testQuestions: true,
          },
        },
        answers: true,
      },
    });

    if (!studentTest || studentTest.studentId !== studentId) {
      return res.status(404).json({
        status: 'error',
        message: 'Test bulunamadı.',
      });
    }

    if (studentTest.status !== 'STARTED') {
      return res.status(400).json({
        status: 'error',
        message: 'Test zaten tamamlanmış.',
      });
    }

    // Toplam puan hesapla
    const totalScore = studentTest.answers.reduce((sum, answer) => sum + answer.pointsEarned, 0);
    const percentage = (totalScore / studentTest.test.totalPoints) * 100;
    const isPassed = studentTest.test.passingScore ? percentage >= studentTest.test.passingScore : null;

    // StudentTest'i güncelle
    await prisma.studentTest.update({
      where: { id: studentTestId },
      data: {
        status: 'SUBMITTED',
        score: totalScore,
        percentage,
        isPassed,
        submittedAt: new Date(),
      },
    });

    return res.status(200).json({
      status: 'success',
      message: 'Test başarıyla tamamlandı.',
      data: {
        score: totalScore,
        totalPoints: studentTest.test.totalPoints,
        percentage: Math.round(percentage * 10) / 10,
        isPassed,
      },
    });
  } catch (error: any) {
    console.error('submitTest error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Test tamamlanırken bir hata oluştu.',
      error: error.message,
    });
  }
};

/**
 * Test sonuçlarını görüntüle (hangi sorular doğru/yanlış)
 */
export const getTestResults = async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user?.id;
    const { studentTestId } = req.params;

    // StudentTest kontrolü
    const studentTest = await prisma.studentTest.findUnique({
      where: { id: studentTestId },
      include: {
        test: {
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
          },
        },
        answers: {
          include: {
            selectedOption: true,
          },
        },
      },
    });

    if (!studentTest || studentTest.studentId !== studentId) {
      return res.status(404).json({
        status: 'error',
        message: 'Test bulunamadı.',
      });
    }

    // Test tamamlanmamışsa sonuç gösterme
    if (studentTest.status !== 'SUBMITTED' && studentTest.status !== 'GRADED') {
      return res.status(400).json({
        status: 'error',
        message: 'Test henüz tamamlanmamış.',
      });
    }

    // Sonuç gösterme izni var mı?
    if (!studentTest.test.showResults) {
      return res.status(403).json({
        status: 'error',
        message: 'Bu testin sonuçları gösterilmiyor.',
      });
    }

    // Her soru için detaylı sonuç
    const questionsWithAnswers = studentTest.test.testQuestions.map((tq) => {
      const studentAnswer = studentTest.answers.find((ans) => ans.questionId === tq.question.id);
      const correctOption = tq.question.options.find((opt) => opt.isCorrect);

      return {
        questionId: tq.question.id,
        questionText: tq.question.questionText,
        imageUrl: tq.question.imageUrl,
        explanation: tq.question.explanation,
        points: tq.points,
        options: tq.question.options.map((opt) => ({
          id: opt.id,
          optionText: opt.optionText,
          isCorrect: opt.isCorrect, // Şimdi gösterebiliriz
          isSelected: studentAnswer?.selectedOptionId === opt.id,
        })),
        studentAnswer: {
          selectedOptionId: studentAnswer?.selectedOptionId,
          isCorrect: studentAnswer?.isCorrect,
          pointsEarned: studentAnswer?.pointsEarned,
        },
        correctOptionId: correctOption?.id,
      };
    });

    return res.status(200).json({
      status: 'success',
      data: {
        studentTestId: studentTest.id,
        test: {
          id: studentTest.test.id,
          title: studentTest.test.title,
          subject: studentTest.test.subject,
          topic: studentTest.test.topic,
          grade: studentTest.test.grade,
          totalPoints: studentTest.test.totalPoints,
          passingScore: studentTest.test.passingScore,
        },
        result: {
          score: studentTest.score,
          percentage: studentTest.percentage,
          isPassed: studentTest.isPassed,
          submittedAt: studentTest.submittedAt,
        },
        questions: questionsWithAnswers,
      },
    });
  } catch (error: any) {
    console.error('getTestResults error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Sonuçlar getirilirken bir hata oluştu.',
      error: error.message,
    });
  }
};







