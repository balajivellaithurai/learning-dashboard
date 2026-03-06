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
import ThemeToggle from "../components/ThemeToggle";

function PdfViewer() {
  const { pdfId } = useParams(); // this is materialId now
  const navigate = useNavigate();

  const [material, setMaterial] = useState(null);
  const [completed, setCompleted] = useState(false);

  const timerRef = useRef(null);

  useEffect(() => {
    const loadMaterial = async () => {
      const snap = await getDoc(doc(db, "materials", pdfId));

      if (!snap.exists()) return;

      const data = snap.data();
      setMaterial(data);

      if (!auth.currentUser) return;

      // check progress by chapterId
      const q = query(
        collection(db, "user_progress"),
        where("userId", "==", auth.currentUser.uid),
        where("chapterId", "==", data.chapterId)
      );

      const progressSnap = await getDocs(q);

      if (!progressSnap.empty) {
        setCompleted(true);
        return;
      }

      // unlock after 1 min
      timerRef.current = setTimeout(async () => {
        await addDoc(collection(db, "user_progress"), {
          userId: auth.currentUser.uid,
          courseId: data.courseId,
          chapterId: data.chapterId,
          completedAt: serverTimestamp()
        });

        setCompleted(true);
      }, 60000);
    };

    loadMaterial();

    return () => clearTimeout(timerRef.current);
  }, [pdfId]);

  if (!material) {
    return (
      <div className="loading-container">
        <div className="loading-card">
          <h2><span className="spinner">⏳</span> Loading Material...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="viewer-container">

      {/* Header */}
      <div className="viewer-header fade-in">
        <button
          className="back-btn"
          onClick={() => navigate(-1)}
        >
          ← Back
        </button>

        <h2>{material.title}</h2>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {completed && (
            <span className="status-completed">✓ Completed</span>
          )}
          <ThemeToggle />
        </div>
      </div>

      {/* PDF */}
      {material.type === "pdf" && (
        <div className="viewer-frame fade-in delay-1">
          <iframe
            src={material.content}
            title={material.title}
          />
        </div>
      )}

      {/* VIDEO */}
      {material.type === "video" && (
        <div className="video-container fade-in delay-1" style={{ maxWidth: "900px", margin: "0 auto" }}>
          <iframe
            src={material.content}
            allowFullScreen
            title={material.title}
          />
        </div>
      )}

      {/* LINK */}
      {material.type === "link" && (
        <div className="fade-in delay-1" style={{ textAlign: "center", marginTop: "2rem" }}>
          <a
            href={material.content}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
            style={{ fontSize: "1.1rem", padding: "1rem 2rem" }}
          >
            Open Link ↗
          </a>
        </div>
      )}

      {/* NOTE */}
      {material.type === "note" && (
        <div className="note-content fade-in delay-1" style={{ maxWidth: "800px", margin: "0 auto", marginTop: "1rem" }}>
          {material.content}
        </div>
      )}

    </div>
  );
}

export default PdfViewer;