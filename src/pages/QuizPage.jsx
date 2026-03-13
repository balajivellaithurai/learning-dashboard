import { useEffect, useState } from "react";
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
  const [passed, setPassed] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAnswers, setShowAnswers] = useState(false);

  useEffect(() => {
    const loadQuiz = async () => {
      try {
        setLoading(true);

        const q = query(
          collection(db, "quizzes"),
          where("chapterId", "==", chapterId)
        );

        const snap = await getDocs(q);

        if (!snap.empty) {
          const quizData = snap.docs[0].data();
          setQuiz(quizData);
          setAnswers(new Array(quizData.questions.length).fill(-1));
        } else {
          setQuiz(null);
        }
      } catch (error) {
        console.error("Error loading quiz:", error);
        alert("Failed to load quiz");
      } finally {
        setLoading(false);
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
    try {
      if (!quiz) return;

      if (!auth.currentUser) {
        alert("Please login first");
        return;
      }

      let correct = 0;

      quiz.questions.forEach((q, i) => {
        if (answers[i] === q.correctIndex) {
          correct++;
        }
      });

      const percent = Math.round((correct / quiz.questions.length) * 100);
      const isPassed = percent >= quiz.passMark;

      setScore(percent);
      setPassed(isPassed);
      setSubmitted(true);
      setShowAnswers(false);

      await addDoc(collection(db, "quiz_attempts"), {
        userId: auth.currentUser.uid,
        chapterId,
        score: percent,
        passed: isPassed,
        totalQuestions: quiz.questions.length,
        correctAnswers: correct,
        answers,
        createdAt: serverTimestamp()
      });

      if (isPassed) {
        await addDoc(collection(db, "user_progress"), {
          userId: auth.currentUser.uid,
          chapterId,
          createdAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error("Error submitting quiz:", error);
      alert("Failed to submit quiz");
    }
  };

  if (loading) return <h2>Loading Quiz...</h2>;
  if (!quiz) return <h2>No Quiz Available</h2>;

  return (
    <div className="dashboard-container">
      <div className="course-page-header">
        <button
          className="back-btn"
          onClick={() => window.history.back()}
        >
          ← Back
        </button>
        <h1>Quiz Time!</h1>
      </div>

      <div
        className="brutal-card"
        style={{
          maxWidth: 800,
          margin: "0 auto",
          gap: "1.5rem"
        }}
      >
        {quiz.questions.map((q, i) => (
          <div key={i} style={{ marginBottom: "1.5rem" }}>
            <h3
              className="section-title"
              style={{
                fontSize: "1.2rem",
                marginBottom: "1rem"
              }}
            >
              {i + 1}. {q.question}
            </h3>

            <div
              className="grid-layout"
              style={{
                gridTemplateColumns: "1fr 1fr",
                gap: "1rem"
              }}
            >
              {q.options.map((opt, j) => {
                const isSelected = answers[i] === j;
                const isCorrect = q.correctIndex === j;

                let bg = "var(--card-bg-alt)";
                let border = "3px solid var(--border-color)";

                if (!showAnswers) {
                  if (isSelected) {
                    bg = "var(--accent-lime)";
                  }
                } else {
                  if (isCorrect) {
                    bg = "var(--accent-green)";
                  } else if (isSelected && !isCorrect) {
                    bg = "var(--danger-btn)";
                  }
                }

                return (
                  <label
                    key={j}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "0.8rem 1rem",
                      border,
                      borderRadius: "10px",
                      cursor: submitted ? "default" : "pointer",
                      background: bg,
                      color: showAnswers && isSelected && !isCorrect ? "#fff" : "inherit",
                      fontWeight: isSelected || (showAnswers && isCorrect) ? "700" : "500",
                      transition: "all 0.2s",
                      opacity: submitted ? 0.95 : 1
                    }}
                  >
                    <input
                      type="radio"
                      name={`q${i}`}
                      checked={answers[i] === j}
                      onChange={() => selectAnswer(i, j)}
                      disabled={submitted}
                      style={{
                        width: "1.2rem",
                        height: "1.2rem",
                        cursor: submitted ? "default" : "pointer",
                        accentColor: "var(--primary-btn)"
                      }}
                    />
                    <span>
                      {opt}
                      {showAnswers && isCorrect && " ✅"}
                      {showAnswers && isSelected && !isCorrect && " ❌"}
                    </span>
                  </label>
                );
              })}
            </div>

            {showAnswers && (
              <div
                style={{
                  marginTop: "0.8rem",
                  padding: "0.8rem 1rem",
                  border: "2px dashed var(--border-color)",
                  borderRadius: "10px",
                  background: "var(--card-bg-alt)"
                }}
              >
                <strong>Correct Answer:</strong> {q.options[q.correctIndex]}
              </div>
            )}
          </div>
        ))}

        <hr
          style={{
            borderTop: "3px dashed var(--border-color)",
            margin: "1rem 0"
          }}
        />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "1rem",
            flexWrap: "wrap"
          }}
        >
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <button
              className="btn btn-primary"
              onClick={submitQuiz}
              disabled={submitted}
              style={{ fontSize: "1.1rem" }}
            >
              {submitted ? "✅ Quiz Submitted" : "🚀 Submit Quiz"}
            </button>

            {submitted && (
              <button
                className="btn btn-accent-blue"
                onClick={() => setShowAnswers(!showAnswers)}
                style={{ fontSize: "1.1rem" }}
              >
                {showAnswers ? "🙈 Hide Answers" : "📘 Show Answers"}
              </button>
            )}
          </div>

          {score !== null && (
            <h2
              style={{
                background: passed
                  ? "var(--accent-green)"
                  : "var(--danger-btn)",
                color: passed ? "#1a1a2e" : "#fff",
                padding: "0.5rem 1rem",
                border: "3px solid var(--border-color)",
                borderRadius: "10px",
                boxShadow: "4px 4px 0px var(--border-color)",
                margin: 0
              }}
            >
              Your Score: {score}% {passed ? "🎉" : "😢"}
            </h2>
          )}
        </div>

        {submitted && (
          <div
            className="brutal-card"
            style={{
              marginTop: "1rem",
              background: "var(--card-bg-alt)"
            }}
          >
            <h2 style={{ marginBottom: "1rem" }}>Result Summary</h2>
            <p>
              <strong>Total Questions:</strong> {quiz.questions.length}
            </p>
            <p>
              <strong>Correct Answers:</strong>{" "}
              {Math.round((score * quiz.questions.length) / 100)}
            </p>
            <p>
              <strong>Pass Mark:</strong> {quiz.passMark}%
            </p>
            <p>
              <strong>Status:</strong> {passed ? "Passed ✅" : "Failed ❌"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default QuizPage;