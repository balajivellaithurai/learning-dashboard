import { useEffect, useState } from "react";
import PracticeUpload from "../components/PracticeUpload";
import { useParams } from "react-router-dom";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp
} from "firebase/firestore";
import { auth, db } from "../firebase";

function QuizPage() {

  const { chapterId } = useParams();

  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [score, setScore] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [weakTopics, setWeakTopics] = useState([]);
  const [loadingRetry, setLoadingRetry] = useState(false);

  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

  useEffect(() => {

    const loadQuiz = async () => {

      const q = query(
        collection(db, "quizzes"),
        where("chapterId", "==", chapterId)
      );

      const snap = await getDocs(q);

      if (snap.empty) {
        console.log("No quiz found");
        return;
      }

      const data = snap.docs[0].data();

      setQuiz(data);
      setAnswers(new Array(data.questions.length).fill(-1));
    };

    loadQuiz();

  }, [chapterId]);

  const selectOption = (qi, oi) => {
    const copy = [...answers];
    copy[qi] = oi;
    setAnswers(copy);
  };

  const submitQuiz = async () => {

    let correct = 0;
    let weakCount = {};

    quiz.questions.forEach((q, i) => {

      const topic = q.topic || "General";

      if (answers[i] === q.correctIndex) {
        correct++;
      } else {
        weakCount[topic] = (weakCount[topic] || 0) + 1;
      }

    });

    const percent = Math.round(
      (correct / quiz.questions.length) * 100
    );

    setScore(percent);
    setSubmitted(true);

    const sortedWeak = Object.entries(weakCount)
      .sort((a, b) => b[1] - a[1])
      .map(item => item[0]);

    setWeakTopics(sortedWeak);

    await addDoc(collection(db, "quiz_attempts"), {
      userId: auth.currentUser.uid,
      chapterId,
      score: percent,
      createdAt: serverTimestamp()
    });

  };

  const extractJSON = (text) => {
    try {
      const match = text.match(/\[.*\]/s);
      if (!match) return null;
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  };

  const retryQuiz = async () => {

    if (weakTopics.length === 0) {
      alert("No weak topics found");
      return;
    }

    try {

      setLoadingRetry(true);

      const topicString = weakTopics.join(", ");

      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": API_KEY
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: `
Generate 5 MCQ questions ONLY from:

${topicString}

Return ONLY JSON array.
`
                  }
                ]
              }
            ]
          })
        }
      );

      const data = await response.json();

      const rawText =
        data?.candidates?.[0]?.content?.parts?.[0]?.text;

      const parsed = extractJSON(rawText);

      if (!parsed) {
        alert("AI format error");
        return;
      }

      const clean = parsed.map(q => ({
        question: q.question,
        options: q.options,
        correctIndex: q.correctIndex,
        topic: q.topic
      }));

      setQuiz({
        ...quiz,
        questions: clean
      });

      setAnswers(new Array(clean.length).fill(-1));
      setSubmitted(false);
      setScore(null);
      setWeakTopics([]);

      alert("Retry Quiz Ready!");

    } catch (err) {
      console.error(err);
      alert("Retry failed");
    } finally {
      setLoadingRetry(false);
    }
  };

  if (!quiz) return (
    <div className="dashboard-container flex justify-center items-center min-h-[50vh]">
      <h2 className="title text-3xl animate-pulse">Loading Quiz...</h2>
    </div>
  );

  return (
    <div className="dashboard-container max-w-4xl mx-auto pb-16">

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h1 className="title text-5xl m-0 mb-2" style={{
            background: "linear-gradient(to right, #4f46e5, #ec4899)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            color: "transparent"
          }}>Quiz Time</h1>
          <div className="subtitle m-0 inline-block text-sm">Test your knowledge</div>
        </div>
        {score !== null && (
          <div className="brutal-card py-4 px-8 transform rounded-2xl flex items-center justify-center">
            <h2 className="text-3xl font-black m-0" style={{
              background: "linear-gradient(to right, #4f46e5, #ec4899)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              color: "transparent"
            }}>Score: {score}%</h2>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-10 mb-12 mt-4">
        {quiz.questions.map((q, i) => {
          const badgeColors = [
            'var(--accent-blue)',
            'var(--accent-pink)',
            'var(--accent-orange)',
            'var(--accent-purple)',
            'var(--accent-green)'
          ];
          const badgeColor = badgeColors[i % badgeColors.length];

          return (
            <div key={i} className="brutal-card group relative pt-12 pb-10 px-6 md:px-12 mt-8 transition-transform">
              <span
                className="absolute -top-5 -left-4 md:-left-5 badge flex items-center justify-center text-xl font-bold text-white shadow-sm transition-transform duration-300 w-12 h-12 rounded-2xl"
                style={{ background: badgeColor, border: 'none' }}
              >
                Q{i + 1}
              </span>

              <h3 className="text-2xl md:text-3xl font-bold mb-6 mt-2 leading-relaxed text-[var(--text-primary)]">
                {q.question}
              </h3>

              <div className="flex flex-col gap-4 mt-8">
                {q.options.map((opt, j) => {
                  const isSelected = answers[i] === j;
                  const isCorrect = submitted && q.correctIndex === j;
                  const isWrong = submitted && isSelected && q.correctIndex !== j;

                  let optionClass = "flex items-center gap-5 p-5 md:p-6 transition-all duration-200 border rounded-xl ";
                  let inlineStyle = {
                    background: 'var(--input-bg)',
                    color: 'var(--text-primary)',
                    borderColor: 'var(--border-color)',
                  };

                  if (isCorrect) {
                    inlineStyle.background = 'rgba(52, 211, 153, 0.1)';
                    inlineStyle.borderColor = 'rgba(52, 211, 153, 0.5)';
                    optionClass += " font-bold ";
                  } else if (isWrong) {
                    inlineStyle.background = 'rgba(244, 114, 182, 0.1)';
                    inlineStyle.borderColor = 'rgba(244, 114, 182, 0.5)';
                    optionClass += " font-bold ";
                  } else if (isSelected) {
                    inlineStyle.background = 'rgba(79, 70, 229, 0.08)';
                    inlineStyle.borderColor = 'rgba(79, 70, 229, 0.5)';
                    optionClass += " font-bold ";
                  }

                  if (!submitted) {
                    optionClass += " cursor-pointer hover:-translate-y-1 hover:shadow-md ";
                  } else {
                    optionClass += " cursor-not-allowed opacity-90 ";
                  }

                  return (
                    <label key={j} className={optionClass} style={inlineStyle}>
                      <div className="relative flex items-center justify-center w-6 h-6 shrink-0 mt-0.5 self-start">
                        <input
                          type="radio"
                          className="peer opacity-0 absolute w-full h-full cursor-pointer"
                          disabled={submitted}
                          checked={isSelected}
                          onChange={() => selectOption(i, j)}
                        />
                        <div className="w-full h-full border border-[var(--border-color)] rounded-full flex items-center justify-center bg-[var(--card-bg)] transition-all peer-checked:bg-[var(--primary-btn)] peer-checked:border-transparent">
                          {isSelected && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}
                        </div>
                      </div>
                      <span className="text-xl flex-1 leading-snug">
                        {opt}
                      </span>
                      {submitted && (isCorrect || isWrong) && (
                        <div className="ml-auto text-2xl shrink-0">
                          {isCorrect ? '✅' : '❌'}
                        </div>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {!submitted && (
        <div className="flex justify-center mt-8 mb-16">
          <button
            className="btn btn-primary text-xl px-12 py-5 transform transition-all shadow-md rounded-xl"
            onClick={submitQuiz}
            disabled={submitted || answers.includes(-1)}
            style={answers.includes(-1) ? { opacity: 0.6, cursor: 'not-allowed', filter: 'grayscale(1)' } : {}}
          >
            {answers.includes(-1) ? 'Answer All Questions' : '🚀 Submit Answers'}
          </button>
        </div>
      )}

      {submitted && weakTopics.length > 0 && (
        <div className="brutal-card p-8 md:p-10 mt-16 mb-16 relative overflow-hidden" style={{ background: 'rgba(244, 114, 182, 0.05)', borderColor: 'rgba(244, 114, 182, 0.2)' }}>
          <div className="absolute -top-4 -right-2 text-6xl md:text-8xl opacity-30 transform rotate-12">
            💡
          </div>
          <h3 className="text-2xl mb-8 font-bold inline-flex items-center gap-3">
            <span className="text-3xl">⚠</span> Areas to Review
          </h3>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mt-4">
            {weakTopics.map((t, i) => (
              <div key={i} className="brutal-card p-6 flex flex-col gap-5" style={{ background: 'var(--card-bg)' }}>
                <h4 className="text-xl font-bold flex items-center gap-3 m-0 border-b border-dashed border-[var(--border-color)] pb-4 text-[var(--text-primary)]">
                  <span className="text-2xl">🎯</span> {t}
                </h4>

                <div className="flex flex-col gap-4">
                  <a
                    href={`https://www.google.com/search?q=${encodeURIComponent(t + " pdf")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary text-lg transition-all no-underline flex justify-center py-3 rounded-xl"
                  >
                    📄 Read Notes
                  </a>
                  <a
                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(t)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-danger text-lg transition-all no-underline flex justify-center py-3 rounded-xl"
                  >
                    🎬 Watch Video
                  </a>
                  <div className="mt-4 pt-4 border-t border-[var(--border-color)] border-dashed">
                    <PracticeUpload topic={t} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 flex justify-center z-10 relative">
            <button
              className="btn btn-primary text-xl px-10 py-5 transform hover:-translate-y-1 transition-all flex items-center gap-4 rounded-xl shadow-md"
              onClick={retryQuiz}
              disabled={loadingRetry}
            >
              {loadingRetry ? (
                <span className="animate-pulse">⏳ Generating New Quiz...</span>
              ) : (
                <>
                  <span className="text-3xl">🔄</span> Generate Practice Quiz
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {submitted && weakTopics.length === 0 && (
        <div className="brutal-card p-10 mt-16 text-center" style={{ background: 'rgba(52, 211, 153, 0.1)', borderColor: 'rgba(52, 211, 153, 0.3)' }}>
          <div className="text-8xl mb-6 animate-bounce">🏆</div>
          <h2 className="title text-5xl mb-4 m-0" style={{
              background: "linear-gradient(to right, #10b981, #3b82f6)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent"
          }}>Perfect Score!</h2>
          <p className="text-xl font-bold m-0 text-[var(--text-secondary)] mt-4">You've mastered all topics in this chapter.</p>
        </div>
      )}

    </div>
  );
}

export default QuizPage;