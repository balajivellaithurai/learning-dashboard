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

      if (!snap.empty) {
        const data = snap.docs[0].data();
        setQuiz(data);
        setAnswers(new Array(data.questions.length).fill(-1));
      }
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
    let weak = [];

    quiz.questions.forEach((q, i) => {

      if (answers[i] === q.correctIndex) {
        correct++;
      } else {
        weak.push(q.topic || "General");
      }

    });

    const percent = Math.round(
      (correct / quiz.questions.length) * 100
    );

    setScore(percent);
    setSubmitted(true);

    const uniqueWeak = [...new Set(weak)];
    setWeakTopics(uniqueWeak);

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

[
{
"question":"...",
"options":["A","B","C","D"],
"correctIndex":0,
"topic":"topic"
}
]
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

      if (!rawText) {
        alert("Empty AI response");
        return;
      }

      const parsed = extractJSON(rawText);

      if (!parsed) {
        alert("AI format error");
        return;
      }

      const clean = parsed.map(q => ({
        question: q.question || "Question",
        options: q.options || ["A", "B", "C", "D"],
        correctIndex: q.correctIndex ?? 0,
        topic: q.topic || weakTopics[0]
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

  if (!quiz) return <h2>Loading...</h2>;

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

      <div className="brutal-card fade-in" style={{ maxWidth: 800, margin: "0 auto", gap: "1.5rem" }}>
        
        {quiz.questions.map((q, i) => (
          <div key={i} style={{ marginBottom: "2.5rem" }}>
            <h3 style={{ fontSize: "1.3rem", fontWeight: "800", marginBottom: "1.2rem", color: "var(--text-primary)", borderLeft: "6px solid var(--primary-btn)", paddingLeft: "15px", lineHeight: "1.4" }}>
              {i + 1}. {q.question}
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              {q.options.map((opt, j) => {
                const isSelected = answers[i] === j;
                const isCorrect = submitted && q.correctIndex === j;
                const isWrong = submitted && isSelected && !isCorrect;

                let bg = "var(--card-bg-alt)";
                let border = "3px solid var(--border-color)";

                if (isSelected && !submitted) {
                  bg = "var(--accent-lime)";
                  border = "3px solid #000";
                } else if (submitted) {
                  if (isCorrect) {
                     bg = "var(--accent-green)";
                     border = "3px solid #000";
                  }
                  if (isWrong) {
                     bg = "#ff3c00";
                     border = "3px solid #000";
                  }
                }

                return (
                  <label key={j} style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "1rem",
                    border,
                    borderRadius: "8px",
                    background: bg,
                    color: isWrong ? "#fff" : "var(--text-primary)",
                    fontWeight: isSelected || isCorrect ? "800" : "600",
                    cursor: submitted ? "default" : "pointer",
                    boxShadow: isSelected && !submitted ? "4px 4px 0px #000" : (isCorrect ? "4px 4px 0px #000" : "none"),
                    transition: "all 0.2s ease"
                  }}>
                    <input
                      type="radio"
                      disabled={submitted}
                      checked={isSelected}
                      onChange={() => selectOption(i, j)}
                      style={{ width: "1.2rem", height: "1.2rem", accentColor: "var(--primary-btn)" }}
                    />
                    <span>
                      {opt}
                      {submitted && isCorrect && " ✅"}
                      {submitted && isWrong && " ❌"}
                    </span>
                  </label>
                )
              })}
            </div>
            
            {submitted && answers[i] !== q.correctIndex && (
              <div className="fade-in" style={{ marginTop: "1rem", padding: "1rem", background: "var(--accent-pink)", border: "3px solid var(--border-color)", fontWeight: "800", color: "#000", boxShadow: "3px 3px 0 var(--border-color)" }}>
                Correct Answer: {q.options[q.correctIndex]}
              </div>
            )}
          </div>
        ))}

        <hr style={{ borderTop: "4px dashed var(--border-color)", margin: "2rem 0" }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1.5rem" }}>
          <button 
            className={`btn ${submitted ? 'btn-accent-green' : 'btn-primary'}`} 
            onClick={submitQuiz} 
            disabled={submitted}
            style={{ fontSize: "1.2rem", padding: "1rem 2rem", boxShadow: "4px 4px 0 var(--border-color)" }}
          >
            {submitted ? "✅ Quiz Evaluated" : "🚀 Submit Quiz"}
          </button>

          {score !== null && (
            <h2 className="fade-in" style={{
              margin: 0,
              padding: "0.8rem 1.5rem",
              background: score >= (quiz.passMark || 60) ? "var(--accent-green)" : "var(--accent-pink)",
              border: "4px solid var(--border-color)",
              boxShadow: "5px 5px 0px var(--border-color)",
              color: "#000",
              fontWeight: "900"
            }}>
              Final Score: {score}%
            </h2>
          )}
        </div>
      </div>

      {/* 🔥 WEAK AREA & AI RETRY UI OVERHAUL */}
      {submitted && weakTopics.length > 0 && (
        <div className="brutal-card fade-in delay-2" style={{ maxWidth: 800, margin: "3rem auto", border: "5px solid #ff3c00", boxShadow: "10px 10px 0px #ff3c00", background: "var(--card-bg)" }}>
          
          <h2 style={{ fontSize: "2rem", borderBottom: "4px solid var(--border-color)", paddingBottom: "1rem", marginBottom: "2rem", display: "flex", alignItems: "center", gap: "12px", color: "var(--text-primary)" }}>
            <span>🎯</span> Recommended Focus Areas
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            {weakTopics.map((t, i) => (
              <div key={i} style={{ padding: "1.5rem", background: "var(--card-bg-alt)", border: "4px solid var(--border-color)", boxShadow: "5px 5px 0 var(--border-color)" }}>
                
                <h3 style={{ margin: "0 0 1.2rem 0", fontSize: "1.5rem", color: "#ff3c00", fontWeight: "900" }}>
                  ⚠ {t}
                </h3>
                
                <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
                  <a href={`https://www.google.com/search?q=${encodeURIComponent(t + " notes pdf")}`} target="_blank" rel="noreferrer" className="btn btn-accent-blue" style={{ textDecoration: "none", boxShadow: "3px 3px 0 var(--border-color)" }}>
                    📄 Extra Notes
                  </a>
                  <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(t + " tutorial")}`} target="_blank" rel="noreferrer" className="btn btn-accent-yellow" style={{ textDecoration: "none", boxShadow: "3px 3px 0 var(--border-color)" }}>
                    🎬 Watch Demo
                  </a>
                </div>

                <div style={{ background: "var(--bg-color)", padding: "1.5rem", border: "3px dashed var(--border-color)" }}>
                  <h4 style={{ marginTop: 0, fontWeight: "800", color: "var(--text-primary)" }}>Verify understanding:</h4>
                  <PracticeUpload topic={t} />
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: "3rem", display: "flex", justifyContent: "center" }}>
            <button 
              className="btn btn-accent-purple" 
              onClick={retryQuiz}
              disabled={loadingRetry}
              style={{ fontSize: "1.3rem", padding: "1rem 2.5rem", width: "100%", textAlign: "center", justifyContent: "center", boxShadow: "6px 6px 0 var(--border-color)" }}
            >
              {loadingRetry ? "🤖 Analyzing Context & Generating Test..." : "⚡ Generate Remedial Target Quiz"}
            </button>
          </div>

        </div>
      )}

    </div>
  );
}

export default QuizPage;