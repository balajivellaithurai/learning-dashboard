const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { GoogleGenAI } = require("@google/genai");
const { z } = require("zod");
const { zodToJsonSchema } = require("zod-to-json-schema");

admin.initializeApp();
const db = admin.firestore();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const QuestionSchema = z.object({
  question: z.string().min(5),
  options: z.array(z.string().min(1)).length(4),
  correctIndex: z.number().int().min(0).max(3),
  explanation: z.string().optional(),
});

const QuizSchema = z.object({
  title: z.string(),
  questions: z.array(QuestionSchema).min(1).max(20),
});

exports.generateQuizAI = onCall(async (request) => {
  const { topic, count = 5, difficulty = "medium" } = request.data || {};

  if (!topic || !topic.trim()) {
    throw new HttpsError("invalid-argument", "Topic is required");
  }

  try {
    const prompt = `
Create a quiz on the topic: "${topic}".

Rules:
- Difficulty: ${difficulty}
- Number of questions: ${count}
- Each question must have exactly 4 options
- Only one correct answer
- Keep questions clear and suitable for learning
- Add a short explanation for the correct answer

Return valid JSON only.
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: zodToJsonSchema(QuizSchema),
        temperature: 0.4,
      },
    });

    const parsed = QuizSchema.parse(JSON.parse(response.text));

    return {
      success: true,
      quiz: parsed,
    };
  } catch (error) {
    console.error("generateQuizAI error:", error);
    throw new HttpsError("internal", "Failed to generate quiz");
  }
});

exports.createQuiz = onCall(async (request) => {
  const { chapterId, title, questions, passMark = 60 } = request.data || {};

  if (!chapterId) {
    throw new HttpsError("invalid-argument", "chapterId is required");
  }

  if (!questions || !Array.isArray(questions) || questions.length === 0) {
    throw new HttpsError("invalid-argument", "questions are required");
  }

  // Validate all incoming questions
  const validatedQuestions = z.array(QuestionSchema).parse(questions);

  const quizRef = db.collection("quizzes").doc();
  const answerKeyRef = db.collection("quizAnswerKeys").doc(quizRef.id);

  const publicQuestions = validatedQuestions.map((q, index) => ({
    questionNo: index + 1,
    question: q.question,
    options: q.options,
  }));

  const privateAnswers = validatedQuestions.map((q, index) => ({
    questionNo: index + 1,
    correctIndex: q.correctIndex,
    explanation: q.explanation || "",
  }));

  await db.runTransaction(async (tx) => {
    tx.set(quizRef, {
      chapterId,
      title: title || "Generated Quiz",
      passMark,
      totalQuestions: publicQuestions.length,
      questions: publicQuestions,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    tx.set(answerKeyRef, {
      quizId: quizRef.id,
      answers: privateAnswers,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

  return {
    success: true,
    quizId: quizRef.id,
  };
});

exports.submitQuizAttempt = onCall(async (request) => {
  const { quizId, answers, userId = null } = request.data || {};

  if (!quizId) {
    throw new HttpsError("invalid-argument", "quizId is required");
  }

  if (!Array.isArray(answers)) {
    throw new HttpsError("invalid-argument", "answers must be an array");
  }

  const [quizSnap, keySnap] = await Promise.all([
    db.collection("quizzes").doc(quizId).get(),
    db.collection("quizAnswerKeys").doc(quizId).get(),
  ]);

  if (!quizSnap.exists || !keySnap.exists) {
    throw new HttpsError("not-found", "Quiz not found");
  }

  const quizData = quizSnap.data();
  const keyData = keySnap.data();

  const answerKey = keyData.answers || [];

  let correct = 0;

  const results = answerKey.map((item, index) => {
    const selectedIndex =
      Number.isInteger(answers[index]) ? answers[index] : -1;

    const isCorrect = selectedIndex === item.correctIndex;
    if (isCorrect) correct++;

    return {
      questionNo: index + 1,
      selectedIndex,
      correctIndex: item.correctIndex,
      isCorrect,
      explanation: isCorrect ? "" : item.explanation || "",
    };
  });

  const total = answerKey.length;
  const percentage = total === 0 ? 0 : Math.round((correct / total) * 100);
  const passed = percentage >= (quizData.passMark || 60);

  const attemptRef = db.collection("quizAttempts").doc();
  await attemptRef.set({
    quizId,
    userId,
    answers,
    correct,
    total,
    percentage,
    passed,
    results,
    submittedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return {
    success: true,
    correct,
    total,
    percentage,
    passed,
    results,
  };
});