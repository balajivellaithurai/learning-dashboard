import { useState } from "react";

function PracticeUpload({ topic }) {

  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");

  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

  const toBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.onerror = reject;
    });

  const checkPractice = async () => {

    if (!file) return alert("Upload image first");

    try {

      setLoading(true);

      const base64 = await toBase64(file);

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
                parts: [
                  {
                    text: `
Evaluate this student's answer for topic: ${topic}

Give:
- Correct or Wrong
- What is missing
- Short improvement tip
`
                  },
                  {
                    inline_data: {
                      mime_type: "image/jpeg",
                      data: base64
                    }
                  }
                ]
              }
            ]
          })
        }
      );

      const data = await response.json();

      const text =
        data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        console.log(data);
        alert("AI failed");
        return;
      }

      setFeedback(text);

    } catch (err) {
      console.error(err);
      alert("Error analyzing image");
    } finally {
      setLoading(false);
    }

  };

  return (
    <div style={{ marginTop: "10px" }}>

      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files[0])}
      />

      <br /><br />

      <button onClick={checkPractice}>
        {loading ? "Checking..." : "Check Answer"}
      </button>

      {feedback && (
        <div style={{
          marginTop: "10px",
          border: "2px solid green",
          padding: "10px"
        }}>
          <strong>AI Feedback:</strong>
          <p>{feedback}</p>
        </div>
      )}

    </div>
  );
}

export default PracticeUpload;