import { useState, useRef } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebase";

function MaterialUploader({ chapterId, onUpload }) {
  const [type, setType] = useState("pdf");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const fileRef = useRef(null);

  // convert file → base64
  const convertToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
    });

  // convert youtube link → embed
  const convertYouTubeToEmbed = (url) => {
    try {
      if (!url) return url;

      if (url.includes("youtube.com/watch?v=")) {
        const id = url.split("v=")[1].split("&")[0];
        return `https://www.youtube.com/embed/${id}`;
      }

      if (url.includes("youtu.be/")) {
        const id = url.split("youtu.be/")[1].split("?")[0];
        return `https://www.youtube.com/embed/${id}`;
      }

      if (url.includes("youtube.com/embed/")) {
        return url;
      }

      return url;
    } catch {
      return url;
    }
  };

  const handleUpload = async () => {
    if (!title) return alert("Enter title");

    setUploading(true);

    try {
      let finalContent = content;

      // PDF
      if (type === "pdf") {
        if (!file) { setUploading(false); return alert("Select PDF"); }
        finalContent = await convertToBase64(file);
      }

      // VIDEO
      if (type === "video") {
        if (!content) { setUploading(false); return alert("Paste YouTube link"); }
        finalContent = convertYouTubeToEmbed(content);
      }

      // LINK / NOTE just use text

      await addDoc(collection(db, "materials"), {
        chapterId,
        type,
        title,
        content: finalContent,
      });

      // reset
      setTitle("");
      setContent("");
      setFile(null);
      setType("pdf");

      if (fileRef.current) fileRef.current.value = "";

      if (onUpload) onUpload();
    } finally {
      setUploading(false);
    }
  };

  const getPlaceholderIcon = () => {
    switch (type) {
      case "pdf": return "📄";
      case "video": return "🎬";
      case "link": return "🔗";
      case "note": return "📝";
      default: return "📁";
    }
  };

  return (
    <div className="uploader-section">

      <div className="uploader-header">
        <h4>{getPlaceholderIcon()} Add Material</h4>
      </div>

      <div className="uploader-form">

        {/* TYPE + TITLE */}
        <div className="uploader-row">
          <select
            className="uploader-select"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="pdf">📄 PDF</option>
            <option value="video">🎬 YouTube Video</option>
            <option value="link">🔗 Link</option>
            <option value="note">📝 Note</option>
          </select>

          <input
            className="uploader-input"
            placeholder="Material title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* PDF FILE */}
        {type === "pdf" && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <input
              type="file"
              accept="application/pdf"
              ref={fileRef}
              onChange={(e) => setFile(e.target.files[0])}
              style={{ display: "none" }}
            />
            <button
              type="button"
              className="file-input-label"
              onClick={() => fileRef.current?.click()}
            >
              📎 Choose File
            </button>
            <span className="file-name">
              {file ? file.name : "No file chosen"}
            </span>
          </div>
        )}

        {/* TEXT / LINK / VIDEO */}
        {type !== "pdf" && (
          <textarea
            className="uploader-textarea"
            placeholder={
              type === "video"
                ? "Paste YouTube link (e.g. https://youtube.com/watch?v=...)"
                : type === "link"
                  ? "Paste URL (e.g. https://example.com)"
                  : "Write your notes here..."
            }
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        )}

        <button
          className="btn btn-accent-green"
          onClick={handleUpload}
          disabled={uploading}
          style={{ alignSelf: "flex-start" }}
        >
          {uploading ? "⏳ Uploading..." : "➕ Add Material"}
        </button>
      </div>
    </div>
  );
}

export default MaterialUploader;