import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc
} from "firebase/firestore";
import { auth, db } from "../firebase";

function QuizPage() {

  const { chapterId } = useParams();

  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [score, setScore] = useState(null);

  useEffect(() => {

    const loadQuiz = async () => {

      const q = query(
        collection(db, "quizzes"),
        where("chapterId", "==", chapterId)
      );

      const snap = await getDocs(q);

      if (!snap.empty) {
        setQuiz(snap.docs[0].data());
      }

    };

    loadQuiz();

  }, [chapterId]);

  const selectAnswer = (qIndex, optionIndex) => {

    const copy = [...answers];
    copy[qIndex] = optionIndex;
    setAnswers(copy);

  };

  const submitQuiz = async () => {

    let correct = 0;

    quiz.questions.forEach((q, i) => {
      if (answers[i] === q.correctIndex)
        correct++;
    });

    const percent = Math.round(
      (correct / quiz.questions.length) * 100
    );

    setScore(percent);

    const passed = percent >= quiz.passMark;

    await addDoc(collection(db, "quiz_attempts"), {
      userId: auth.currentUser.uid,
      chapterId,
      score: percent,
      passed
    });

    if (passed) {

      await addDoc(collection(db, "user_progress"), {
        userId: auth.currentUser.uid,
        chapterId
      });

    }

  };

  if (!quiz) return <h2>No Quiz Available</h2>;

  <div className="dashboard-container">
    <div className="course-page-header">
      <button className="back-btn" onClick={() => window.history.back()}>← Back</button>
      <h1>Quiz Time!</h1>
    </div>

    <div className="brutal-card" style={{ maxWidth: 800, margin: "0 auto", gap: "1.5rem" }}>
      {quiz.questions.map((q, i) => (
        <div key={i} style={{ marginBottom: "1.5rem" }}>
          <h3 className="section-title" style={{ fontSize: "1.2rem", marginBottom: "1rem" }}>
            {i + 1}. {q.question}
          </h3>

          <div className="grid-layout" style={{ gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            {q.options.map((opt, j) => (
              <label
                key={j}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "0.8rem 1rem",
                  border: "3px solid var(--border-color)",
                  borderRadius: "10px",
                  cursor: "pointer",
                  background: answers[i] === j ? "var(--accent-lime)" : "var(--card-bg-alt)",
                  fontWeight: answers[i] === j ? "700" : "500",
                  transition: "all 0.2s"
                }}
              >
                <input
                  type="radio"
                  name={`q${i}`}
                  checked={answers[i] === j}
                  onChange={() => selectAnswer(i, j)}
                  style={{ width: "1.2rem", height: "1.2rem", cursor: "pointer", accentColor: "var(--primary-btn)" }}
                />
                {opt}
              </label>
            ))}
          </div>
        </div>
      ))}

      <hr style={{ borderTop: "3px dashed var(--border-color)", margin: "1rem 0" }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button className="btn btn-primary" onClick={submitQuiz} style={{ fontSize: "1.1rem" }}>
          🚀 Submit Quiz
        </button>

        {score !== null && (
          <h2 style={{
            background: score >= quiz.passMark ? "var(--accent-green)" : "var(--danger-btn)",
            color: score >= quiz.passMark ? "#1a1a2e" : "#fff",
            padding: "0.5rem 1rem",
            border: "3px solid var(--border-color)",
            borderRadius: "10px",
            boxShadow: "4px 4px 0px var(--border-color)",
            margin: 0
          }}>
            Your Score: {score}% {score >= quiz.passMark ? "🎉" : "😢"}
          </h2>
        )}
      </div>
    </div>
  </div>

}

export default QuizPage;