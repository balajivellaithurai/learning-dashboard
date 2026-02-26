import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  doc,
  getDoc,
  addDoc,
  collection,
  serverTimestamp,
  query,
  where,
  getDocs
} from "firebase/firestore";
import { auth, db } from "../firebase";

function PdfViewer() {
  const { pdfId } = useParams();
  const navigate = useNavigate();

  const [pdf, setPdf] = useState(null);
  const [completed, setCompleted] = useState(false);

  const timerRef = useRef(null);

  useEffect(() => {
    const loadPdf = async () => {
      const snap = await getDoc(doc(db, "course_pdfs", pdfId));
      if (!snap.exists()) return;

      const data = snap.data();
      setPdf(data);

      if (!auth.currentUser) return;

      // ✅ Check if already completed
      const q = query(
        collection(db, "user_progress"),
        where("userId", "==", auth.currentUser.uid),
        where("pdfId", "==", pdfId)
      );

      const progressSnap = await getDocs(q);

      if (!progressSnap.empty) {
        setCompleted(true);
        return;
      }

      // ⏱ Unlock after 1 minute in document
      timerRef.current = setTimeout(async () => {
        await addDoc(collection(db, "user_progress"), {
          userId: auth.currentUser.uid,
          courseId: data.courseId,
          pdfId: pdfId,

          // ✅ MUST MATCH CoursePage
          orderCompleted: data.order,

          completedAt: serverTimestamp()
        });

        setCompleted(true);
      }, 60000); // 60 seconds
    };

    loadPdf();

    return () => clearTimeout(timerRef.current);
  }, [pdfId]);

  if (!pdf) {
    return (
      <div className="login-container">
        <div className="login-card fade-in" style={{ padding: "3rem" }}>
          <h2 className="title" style={{ fontSize: "2rem", margin: 0 }}>⏳ Loading document...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ height: "100vh", display: "flex", flexDirection: "column", background: "var(--bg-color)" }}>

      {/* Top bar */}
      <div style={{
        padding: "1.5rem 2rem",
        background: "var(--accent-yellow)",
        borderBottom: "5px solid var(--border-color)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        boxShadow: "0px 8px 0px var(--border-color)",
        position: "relative",
        zIndex: 10
      }}>
        <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
          <button onClick={() => navigate(-1)} className="btn btn-secondary" style={{ padding: "0.5rem 1rem" }}>
            ⬅ Back
          </button>

          <h1 className="title" style={{ fontSize: "2rem", margin: 0, textShadow: "2px 2px 0px var(--border-color)" }}>{pdf.title}</h1>
        </div>

        {completed && (
          <span className="badge" style={{ background: "var(--accent-green)", fontSize: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span>✓</span> Completed
          </span>
        )}
      </div>

      {/* PDF Viewer */}
      <div style={{ flex: 1, padding: "2rem", display: "flex", justifyContent: "center" }}>
        <div className="brutal-card delay-1" style={{ width: "100%", maxWidth: "1200px", padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ background: "var(--border-color)", color: "#fff", padding: "0.5rem 1rem", fontWeight: "700", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>{pdf.title}</span>
            <span style={{ fontSize: "0.8rem", opacity: 0.8 }}>PDF Document</span>
          </div>
          <iframe
            src={pdf.content}
            title="PDF Viewer"
            style={{
              width: "100%",
              flex: 1,
              border: "none",
              background: "#eee"
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default PdfViewer;