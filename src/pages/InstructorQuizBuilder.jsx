import { useState } from "react";
import { useParams } from "react-router-dom";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
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

  // 🔥 GEMINI AI GENERATION (FULL FIXED)
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

      // 🔥 FORCE topic if missing
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

  const saveQuiz = async () => {

    if (questions.length === 0)
      return alert("Add questions first");

    await addDoc(collection(db, "quizzes"), {
      chapterId,
      passMark: 60,
      questions,
      createdAt: serverTimestamp()
    });

    alert("Quiz Created!");
  };

  return (
    <div className="dashboard-container">

      <div className="course-page-header">
        <button onClick={() => window.history.back()}>
          ← Back
        </button>
        <h1>Create Quiz</h1>
      </div>

      <div className="brutal-card">

        <button
          className="btn btn-accent-purple"
          onClick={generateQuizAI}
        >
          {loading ? "Generating..." : "🤖 Generate Quiz With AI"}
        </button>

        <div className="input-group">
          <label>Question</label>
          <input
            value={question}
            onChange={e => setQuestion(e.target.value)}
          />
        </div>

        {options.map((opt, i) => (
          <div key={i}>
            <input
              type="radio"
              checked={correctIndex === i}
              onChange={() => setCorrectIndex(i)}
            />
            <input
              value={opt}
              onChange={e => updateOption(i, e.target.value)}
            />
          </div>
        ))}

        <button onClick={addQuestion}>
          ➕ Add Question
        </button>

        <h3>Questions: {questions.length}</h3>

        <button onClick={saveQuiz}>
          💾 Save Quiz
        </button>

      </div>
    </div>
  );
}

export default InstructorQuizBuilder;