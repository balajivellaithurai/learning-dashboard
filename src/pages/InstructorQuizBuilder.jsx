import { useState } from "react";
import { useParams } from "react-router-dom";
import { addDoc, collection } from "firebase/firestore";
import { db } from "../firebase";

function InstructorQuizBuilder() {

  const { chapterId } = useParams();

  const [questions, setQuestions] = useState([]);

  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctIndex, setCorrectIndex] = useState(0);

  const updateOption = (i, value) => {
    const copy = [...options];
    copy[i] = value;
    setOptions(copy);
  };

  const addQuestion = () => {

    if (!question) return alert("Enter question");

    const q = {
      question,
      options,
      correctIndex
    };

    setQuestions([...questions, q]);

    setQuestion("");
    setOptions(["", "", "", ""]);
    setCorrectIndex(0);
  };

  const saveQuiz = async () => {

    if (questions.length === 0)
      return alert("Add questions first");

    await addDoc(collection(db, "quizzes"), {
      chapterId,
      passMark: 60,
      questions
    });

    alert("Quiz Created!");

  };

  return (
    <div className="dashboard-container">
      <div className="course-page-header">
        <button className="back-btn" onClick={() => window.history.back()}>← Back</button>
        <h1>Create Quiz</h1>
      </div>

      <div className="brutal-card" style={{ maxWidth: 800, margin: "0 auto", gap: "1.5rem" }}>
        <div className="input-group">
          <label className="input-label">Question</label>
          <input
            className="form-input"
            placeholder="Type your question here..."
            value={question}
            onChange={e => setQuestion(e.target.value)}
          />
        </div>

        <div className="grid-layout" style={{ gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          {options.map((opt, i) => (
            <div key={i} className="input-group" style={{ marginBottom: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "5px" }}>
                <input
                  type="radio"
                  name="correct"
                  id={`opt-${i}`}
                  checked={correctIndex === i}
                  onChange={() => setCorrectIndex(i)}
                  style={{ width: "1.2rem", height: "1.2rem", cursor: "pointer", accentColor: "var(--primary-btn)" }}
                />
                <label htmlFor={`opt-${i}`} style={{ fontWeight: 600, cursor: "pointer", color: correctIndex === i ? "var(--primary-btn)" : "inherit" }}>
                  Option {i + 1} {correctIndex === i && "(Correct)"}
                </label>
              </div>
              <input
                className="form-input"
                placeholder={`Option ${i + 1} text`}
                value={opt}
                onChange={e => updateOption(i, e.target.value)}
              />
            </div>
          ))}
        </div>

        <button className="btn btn-accent-blue" onClick={addQuestion} style={{ alignSelf: "flex-start", marginTop: "1rem" }}>
          ➕ Add Question
        </button>

        <hr style={{ borderTop: "3px dashed var(--border-color)", margin: "1rem 0" }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 className="section-title" style={{ marginBottom: 0 }}>Questions Added: {questions.length}</h3>
          <button className="btn btn-accent-green" onClick={saveQuiz}>
            💾 Save Quiz
          </button>
        </div>
      </div>
    </div>
  );
}

export default InstructorQuizBuilder;