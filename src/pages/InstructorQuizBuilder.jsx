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

    if (options.some((opt) => !opt.trim())) {
      return alert("Please fill all 4 options");
    }

    const q = {
      question: question.trim(),
      options: options.map((opt) => opt.trim()),
      correctIndex: Number(correctIndex)
    };

    setQuestions((prev) => [...prev, q]);

    setQuestion("");
    setOptions(["", "", "", ""]);
    setCorrectIndex(0);
  };

  const normalizeQuestions = (raw) => {
    if (!Array.isArray(raw)) {
      throw new Error("AI did not return an array");
    }

    const normalized = raw
      .map((item) => {
        const safeQuestion =
          typeof item?.question === "string" ? item.question.trim() : "";

        const safeOptions = Array.isArray(item?.options)
          ? item.options.map((opt) => String(opt).trim()).slice(0, 4)
          : [];

        const safeCorrectIndex = Number(item?.correctIndex);

        if (
          !safeQuestion ||
          safeOptions.length !== 4 ||
          safeOptions.some((opt) => !opt) ||
          !Number.isInteger(safeCorrectIndex) ||
          safeCorrectIndex < 0 ||
          safeCorrectIndex > 3
        ) {
          return null;
        }

        return {
          question: safeQuestion,
          options: safeOptions,
          correctIndex: safeCorrectIndex
        };
      })
      .filter(Boolean);

    if (normalized.length === 0) {
      throw new Error("No valid questions found in AI response");
    }

    return normalized;
  };

  // ---------------- AI QUIZ GENERATION ----------------
  const generateQuizAI = async () => {
    const topic = prompt("Enter topic for quiz");
    if (!topic || !topic.trim()) return;

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
Generate exactly 5 multiple choice questions about "${topic}".

Rules:
- Return ONLY a JSON array
- Each object must have:
  - question (string)
  - options (array of exactly 4 strings)
  - correctIndex (number: 0 to 3)
- No markdown
- No explanation
- No extra text

Example:
[
  {
    "question": "What is React?",
    "options": ["Library", "Database", "Language", "Compiler"],
    "correctIndex": 0
  }
]
`
                  }
                ]
              }
            ],
            generationConfig: {
              response_mime_type: "application/json",
              response_schema: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    question: { type: "STRING" },
                    options: {
                      type: "ARRAY",
                      items: { type: "STRING" }
                    },
                    correctIndex: { type: "INTEGER" }
                  },
                  required: ["question", "options", "correctIndex"]
                }
              }
            }
          })
        }
      );

      const data = await response.json();
      console.log("Gemini RAW Response:", data);

      if (!response.ok) {
        console.error("Gemini API error:", data);
        throw new Error(data?.error?.message || "Gemini request failed");
      }

      const text =
        data?.candidates?.[0]?.content?.parts
          ?.map((p) => p.text || "")
          .join("")
          .trim();

      if (!text) {
        alert("AI returned empty response");
        return;
      }

      const cleaned = text
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();

      const parsed = JSON.parse(cleaned);
      const validQuestions = normalizeQuestions(parsed);

      setQuestions(validQuestions);
      alert("Quiz generated successfully!");
    } catch (err) {
      console.error("AI generation error:", err);
      alert(err.message || "AI generation failed");
    } finally {
      setLoading(false);
    }
  };

  // ---------------- SAVE QUIZ ----------------
  const saveQuiz = async () => {
    try {
      if (questions.length === 0) {
        return alert("Add questions first");
      }

      await addDoc(collection(db, "quizzes"), {
        chapterId,
        passMark: 60,
        questions,
        createdAt: serverTimestamp()
      });

      alert("Quiz Created!");
    } catch (err) {
      console.error("Save quiz error:", err);
      alert("Failed to save quiz");
    }
  };

  return (
    <div className="dashboard-container">
      <div className="course-page-header">
        <button className="back-btn" onClick={() => window.history.back()}>
          ← Back
        </button>

        <h1>Create Quiz</h1>
      </div>

      <div
        className="brutal-card"
        style={{
          maxWidth: 800,
          margin: "0 auto",
          gap: "1.5rem"
        }}
      >
        <button
          className="btn btn-accent-purple"
          onClick={generateQuizAI}
          disabled={loading}
        >
          {loading ? "Generating..." : "🤖 Generate Quiz With AI"}
        </button>

        <div className="input-group">
          <label className="input-label">Question</label>
          <input
            className="form-input"
            placeholder="Type your question here..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
        </div>

        <div
          className="grid-layout"
          style={{
            gridTemplateColumns: "1fr 1fr",
            gap: "1rem"
          }}
        >
          {options.map((opt, i) => (
            <div
              key={i}
              className="input-group"
              style={{ marginBottom: 0 }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "5px"
                }}
              >
                <input
                  type="radio"
                  name="correct"
                  checked={correctIndex === i}
                  onChange={() => setCorrectIndex(i)}
                />

                <label>Option {i + 1}</label>
              </div>

              <input
                className="form-input"
                placeholder={`Option ${i + 1}`}
                value={opt}
                onChange={(e) => updateOption(i, e.target.value)}
              />
            </div>
          ))}
        </div>

        <button className="btn btn-accent-blue" onClick={addQuestion}>
          ➕ Add Question
        </button>

        <hr />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <h3>Questions Added: {questions.length}</h3>

          <button
            className="btn btn-accent-green"
            onClick={saveQuiz}
            disabled={loading}
          >
            💾 Save Quiz
          </button>
        </div>
      </div>
    </div>
  );
}

export default InstructorQuizBuilder;