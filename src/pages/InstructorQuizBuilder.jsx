import { useState } from "react";
import { useParams } from "react-router-dom";
import { setDoc, doc, serverTimestamp } from "firebase/firestore"; // 🔥 FIXED
import { db } from "../firebase";

function InstructorQuizBuilder() {

  const { chapterId } = useParams();

  const [questions, setQuestions] = useState([]);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

  const updateOption = (i, value) => {
    const copy = [...options];
    copy[i] = value;
    setOptions(copy);
  };

  const addQuestion = () => {

    if (!question.trim()) return alert("Enter question");

    if (options.some(opt => !opt.trim()))
      return alert("Fill all options");

    const q = {
      question: question.trim(),
      options: options.map(o => o.trim()),
      correctIndex,
      topic: "Manual"
    };

    setQuestions(prev => [...prev, q]);

    setQuestion("");
    setOptions(["", "", "", ""]);
    setCorrectIndex(0);
  };

  // 🔥 GEMINI AI GENERATION (UNCHANGED)
  const generateQuizAI = async () => {

    const topic = prompt("Enter topic for quiz");
    if (!topic) return;

    try {

      setLoading(true);

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
Generate 5 MCQ questions about "${topic}".

STRICT RULES:
- Return ONLY JSON
- No explanation
- No markdown
- Each question MUST include topic

FORMAT:

[
{
"question":"...",
"options":["A","B","C","D"],
"correctIndex":0,
"topic":"Specific concept name"
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

      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        alert("AI returned empty");
        return;
      }

      const cleaned = text.replace(/```/g, "").trim();

      let parsed = JSON.parse(cleaned);

      parsed = parsed.map(q => ({
        question: q.question || "No question",
        options: q.options || ["A", "B", "C", "D"],
        correctIndex: q.correctIndex ?? 0,
        topic: q.topic || topic
      }));

      setQuestions(parsed);

      alert("Quiz Generated!");

    } catch (err) {
      console.error(err);
      alert("AI generation failed");
    } finally {
      setLoading(false);
    }
  };

  // 🔥 FIXED SAVE FUNCTION
  const saveQuiz = async () => {

    if (questions.length === 0)
      return alert("Add questions first");

    await setDoc(
      doc(db, "quizzes", chapterId),
      {
        chapterId,
        passMark: 60,
        questions,
        createdAt: serverTimestamp()
      }
    );

    alert("Quiz Created!");
  };

  return (
    <div className="dashboard-container">

      <header className="nav-header fade-in">
        <div>
          <h1 className="title">Quiz <span className="text-gradient">Builder</span></h1>
          <p className="subtitle" style={{ marginBottom: 0 }}>Create a new quiz or generate it with AI.</p>
        </div>
        <div className="nav-actions">
          <button className="btn btn-secondary" onClick={() => window.history.back()}>
            ← Back to Course
          </button>
        </div>
      </header>

      <div className="grid-layout fade-in delay-1">

        <section className="brutal-card" style={{ gap: "1.5rem" }}>
          <h2 className="section-title">
            <span style={{ fontSize: "1.2rem" }}>➕</span> Add New Question
          </h2>

          <button
            className="btn btn-accent-purple"
            onClick={generateQuizAI}
            style={{ width: "100%", padding: "1rem", fontSize: "1.1rem" }}
            disabled={loading}
          >
            {loading ? "Generating..." : "🤖 Generate Quiz With AI"}
          </button>

          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label">Question Text</label>
            <input
              className="form-input"
              placeholder="e.g. What is the capital of France?"
              value={question}
              onChange={e => setQuestion(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <label className="input-label" style={{ width: "max-content", background: "var(--accent-cyan)" }}>Options</label>
            {options.map((opt, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <input
                  type="radio"
                  name="correctOption"
                  checked={correctIndex === i}
                  onChange={() => setCorrectIndex(i)}
                  style={{ width: "24px", height: "24px", accentColor: "var(--accent-green)", cursor: "pointer" }}
                />
                <input
                  className="form-input"
                  style={{ flex: 1 }}
                  placeholder={`Option ${i + 1}`}
                  value={opt}
                  onChange={e => updateOption(i, e.target.value)}
                />
              </div>
            ))}
          </div>

          <button className="btn btn-accent-yellow" onClick={addQuestion}>
            ➕ Add Question to Quiz
          </button>
        </section>

        <section className="brutal-card" style={{ gap: "1.5rem" }}>
          <h2 className="section-title">📋 Quiz Preview</h2>

          {questions.map((q, idx) => (
            <div key={idx}>
              <p>{idx + 1}. {q.question}</p>
            </div>
          ))}

          <button className="btn btn-primary" onClick={saveQuiz}>
            💾 Save Quiz & Publish
          </button>
        </section>

      </div>
    </div>
  );
}

export default InstructorQuizBuilder;