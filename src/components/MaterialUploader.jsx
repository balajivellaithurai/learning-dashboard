import { useState, useRef } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebase";

function MaterialUploader({ chapterId, onUpload }) {
  const [type, setType] = useState("pdf");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);
  const fileRef = useRef(null);

  const convertToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
    });

  // 🔥 AUTO CONVERT YOUTUBE LINK TO EMBED FORMAT
  const convertYouTubeToEmbed = (url) => {
    try {
      if (url.includes("youtube.com/watch?v=")) {
        const videoId = url.split("v=")[1].split("&")[0];
        return `https://www.youtube.com/embed/${videoId}`;
      }

      if (url.includes("youtu.be/")) {
        const videoId = url.split("youtu.be/")[1].split("?")[0];
        return `https://www.youtube.com/embed/${videoId}`;
      }

      // If already embed format, return as is
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

    let finalContent = content;

    if (type === "pdf") {
      if (!file) return alert("Select a PDF");
      finalContent = await convertToBase64(file);
    }

    if (type === "video") {
      if (!content) return alert("Paste YouTube link");
      finalContent = convertYouTubeToEmbed(content);
    }

    await addDoc(collection(db, "materials"), {
      chapterId,
      type,
      title,
      content: finalContent
    });

    setTitle("");
    setContent("");
    setFile(null);
    if (fileRef.current) fileRef.current.value = "";

    if (onUpload) onUpload();
  };

  return (
    <div
      style={{
        marginTop: 15,
        borderTop: "1px dashed #ccc",
        paddingTop: 10
      }}
    >
      <select
        value={type}
        onChange={(e) => setType(e.target.value)}
      >
        <option value="pdf">PDF</option>
        <option value="link">Link</option>
        <option value="note">Note</option>
        <option value="video">YouTube Video</option>
      </select>

      <input
        placeholder="Material Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{ display: "block", marginTop: 8 }}
      />

      {type === "pdf" && (
        <input
          type="file"
          accept="application/pdf"
          ref={fileRef}
          onChange={(e) => setFile(e.target.files[0])}
          style={{ marginTop: 8 }}
        />
      )}

      {(type === "link" || type === "note" || type === "video") && (
        <textarea
          placeholder={
            type === "link"
              ? "Paste URL here"
              : type === "video"
              ? "Paste YouTube link here"
              : "Write notes here"
          }
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={{ marginTop: 8, width: "100%" }}
        />
      )}

      <button onClick={handleUpload} style={{ marginTop: 8 }}>
        Add Material
      </button>
    </div>
  );
}

export default MaterialUploader;