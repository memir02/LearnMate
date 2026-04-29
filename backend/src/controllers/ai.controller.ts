import { Response } from 'express';
import OpenAI from 'openai';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': 'https://learnmate.app',
    'X-Title': 'LearnMate',
  },
});

const FREE_MODELS = [
  'inclusionai/ling-2.6-1t:free',
  'nvidia/nemotron-3-super-120b-a12b:free',
  'google/gemma-4-31b-it:free',
  'google/gemma-4-26b-a4b-it:free',
];

async function callAI(prompt: string, maxTokens: number): Promise<string> {
  for (const model of FREE_MODELS) {
    try {
      console.log(`🤖 Trying model: ${model}`);
      const completion = await openai.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: maxTokens,
      });
      const text = completion.choices[0]?.message?.content ?? '';
      if (text) {
        console.log(`✅ Model ${model} succeeded`);
        return text;
      }
    } catch (err: any) {
      console.error(`❌ Model ${model} failed:`, err?.error?.message ?? err?.message ?? err);
    }
  }
  throw new Error('Tüm modeller başarısız oldu.');
}

// Öğrencinin test sonuçlarını analiz et ve çalışma planı oluştur
export const getStudyPlan = async (req: AuthRequest, res: Response) => {
  try {
    const studentId = req.user?.id;

    const studentTests = await prisma.studentTest.findMany({
      where: {
        studentId,
        status: { in: ['SUBMITTED', 'GRADED'] },
      },
      include: {
        test: {
          select: {
            title: true,
            subject: true,
            topic: true,
            grade: true,
          },
        },
        answers: {
          include: {
            question: {
              select: {
                questionText: true,
                subject: true,
                topic: true,
                difficulty: true,
              },
            },
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
      take: 20,
    });

    if (studentTests.length === 0) {
      return res.status(200).json({
        status: 'success',
        data: {
          message: 'Henüz tamamlanmış test yok. Test çözdükten sonra kişisel çalışma planın oluşturulacak.',
          plan: null,
        },
      });
    }

    const subjectStats: Record<string, { total: number; correct: number; topics: Set<string> }> = {};

    studentTests.forEach((st) => {
      const subject = st.test.subject || 'Genel';
      if (!subjectStats[subject]) {
        subjectStats[subject] = { total: 0, correct: 0, topics: new Set() };
      }
      subjectStats[subject].total++;
      if (st.isPassed) subjectStats[subject].correct++;
      if (st.test.topic) subjectStats[subject].topics.add(st.test.topic);
    });

    const performanceSummary = Object.entries(subjectStats).map(([subject, data]) => ({
      ders: subject,
      toplamTest: data.total,
      gecenTest: data.correct,
      basariOrani: Math.round((data.correct / data.total) * 100),
      konular: Array.from(data.topics),
    }));

    const overallAvg = studentTests.length > 0
      ? Math.round(
          studentTests.reduce((sum, st) => sum + (st.percentage || 0), 0) / studentTests.length
        )
      : 0;

    const prompt = `Sen bir eğitim danışmanısın. Aşağıdaki öğrenci test sonuçlarını analiz et ve Türkçe olarak kişisel bir çalışma planı oluştur.

Öğrenci Performans Özeti:
- Toplam çözülen test: ${studentTests.length}
- Genel başarı ortalaması: %${overallAvg}

Ders Bazlı Performans:
${JSON.stringify(performanceSummary, null, 2)}

Lütfen aşağıdaki formatta JSON yanıt ver (başka hiçbir şey yazma, sadece JSON):
{
  "genelDurum": "Öğrencinin genel durumunu 2-3 cümleyle anlat",
  "gucluDersler": ["güçlü olduğu dersler listesi"],
  "eksikDersler": ["eksik olduğu dersler listesi"],
  "oncelikliKonular": [
    {
      "ders": "ders adı",
      "konu": "konu adı veya genel",
      "aciklama": "neden bu konuya odaklanmalı",
      "oneri": "somut çalışma önerisi"
    }
  ],
  "haftalikPlan": [
    { "gun": "Pazartesi", "aktivite": "ne çalışmalı" },
    { "gun": "Salı", "aktivite": "ne çalışmalı" },
    { "gun": "Çarşamba", "aktivite": "ne çalışmalı" },
    { "gun": "Perşembe", "aktivite": "ne çalışmalı" },
    { "gun": "Cuma", "aktivite": "ne çalışmalı" },
    { "gun": "Cumartesi", "aktivite": "ne çalışmalı" },
    { "gun": "Pazar", "aktivite": "dinlenme veya hafif tekrar" }
  ],
  "motivasyonMesaji": "Öğrenciye kısa bir motivasyon mesajı"
}`;

    const text = await callAI(prompt, 2048);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Geçerli JSON döndürülmedi');
    }
    const plan = JSON.parse(jsonMatch[0]);

    return res.status(200).json({
      status: 'success',
      data: {
        plan,
        overallAverage: overallAvg,
        totalTests: studentTests.length,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('AI study plan error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Çalışma planı oluşturulurken bir hata oluştu.',
    });
  }
};

// Belirli bir test sonrası anlık analiz
export const analyzeTestResult = async (req: AuthRequest, res: Response) => {
  try {
    const { studentTestId } = req.params;
    const studentId = req.user?.id;

    const studentTest = await prisma.studentTest.findFirst({
      where: { id: studentTestId, studentId },
      include: {
        test: { select: { title: true, subject: true, topic: true } },
        answers: {
          include: {
            question: {
              select: {
                questionText: true,
                topic: true,
                difficulty: true,
              },
            },
          },
        },
      },
    });

    if (!studentTest) {
      return res.status(404).json({ status: 'error', message: 'Test bulunamadı.' });
    }

    const wrongAnswers = studentTest.answers.filter((a) => !a.isCorrect);
    const correctAnswers = studentTest.answers.filter((a) => a.isCorrect);

    const prompt = `Sen bir eğitim danışmanısın. Öğrencinin test sonucunu analiz et ve Türkçe geri bildirim ver.

Test: ${studentTest.test.title}
Ders: ${studentTest.test.subject || 'Belirtilmemiş'}
Konu: ${studentTest.test.topic || 'Belirtilmemiş'}
Skor: %${Math.round(studentTest.percentage || 0)}
Doğru: ${correctAnswers.length}, Yanlış: ${wrongAnswers.length}

Yanlış yapılan sorular:
${wrongAnswers.slice(0, 5).map((a) => `- ${a.question.questionText} (Zorluk: ${a.question.difficulty}, Konu: ${a.question.topic || 'Belirtilmemiş'})`).join('\n')}

Lütfen aşağıdaki formatta JSON yanıt ver (sadece JSON):
{
  "ozet": "Test sonucunu 1-2 cümleyle değerlendir",
  "gucluYonler": "neyi iyi yaptığını anlat",
  "gelisimAlanlari": "hangi konulara odaklanması gerektiğini anlat",
  "onerimler": ["somut öneri 1", "somut öneri 2", "somut öneri 3"],
  "motivasyon": "kısa motivasyon mesajı"
}`;

    const text = await callAI(prompt, 1024);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Geçersiz yanıt');
    const analysis = JSON.parse(jsonMatch[0]);

    return res.status(200).json({ status: 'success', data: analysis });
  } catch (error: any) {
    console.error('AI analyze error:', error);
    return res.status(500).json({ status: 'error', message: 'Analiz oluşturulamadı.' });
  }
};
