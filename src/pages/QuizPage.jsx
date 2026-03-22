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

  // ---------------- LOAD QUIZ ----------------
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

  // ---------------- SELECT ANSWER ----------------
  const selectOption = (qi, oi) => {
    const copy = [...answers];
    copy[qi] = oi;
    setAnswers(copy);
  };

  // ---------------- SUBMIT QUIZ ----------------
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

  // ---------------- SAFE JSON EXTRACTOR ----------------
  const extractJSON = (text) => {
    try {
      const match = text.match(/\[.*\]/s);
      if (!match) return null;
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  };

  // ---------------- RETRY QUIZ ----------------
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
        console.log(data);
        alert("Empty AI response");
        return;
      }

      const parsed = extractJSON(rawText);

      if (!parsed) {
        console.log("Bad AI response:", rawText);
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

  // ---------------- UI ----------------
  if (!quiz) return <h2>Loading...</h2>;

  return (
    <div className="dashboard-container">

      <h1>Quiz</h1>

      {quiz.questions.map((q, i) => (

        <div key={i} style={{ marginBottom: "20px" }}>

          <h3>{q.question}</h3>

          {q.options.map((opt, j) => (

            <div key={j}>
              <input
                type="radio"
                disabled={submitted}
                checked={answers[i] === j}
                onChange={() => selectOption(i, j)}
              />
              {opt}
            </div>

          ))}

        </div>

      ))}

      <button onClick={submitQuiz} disabled={submitted}>
        Submit
      </button>

      {score !== null && (
        <h2>Score: {score}%</h2>
      )}

      {/* ---------------- WEAK AREA ---------------- */}
      {submitted && weakTopics.length > 0 && (

        <div style={{
          border: "3px solid red",
          padding: "15px",
          marginTop: "20px"
        }}>

          <h3>⚠ Weak Areas</h3>

          {weakTopics.map((t, i) => (

            <div key={i} style={{ marginBottom: "15px" }}>

              <p style={{ fontWeight: "bold" }}>
                ❌ {t}
              </p>

              {/* 🔥 PDF LINK */}
              <a
                href={`https://www.google.com/search?q=${encodeURIComponent(t + " notes pdf")}`}
                target="_blank"
                rel="noreferrer"
              >
                📄 Read Notes
              </a>

              <br />

              {/* 🔥 YOUTUBE LINK */}
              <a
                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(t + " tutorial")}`}
                target="_blank"
                rel="noreferrer"
              >
                🎬 Watch Video
              </a>

            </div>

          ))}

          <hr />

          <button onClick={retryQuiz}>
            {loadingRetry ? "Generating..." : "🧪 Retry Quiz"}
          </button>

        </div>

      )}

    </div>
  );
}

export default QuizPage;