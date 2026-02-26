import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  addDoc,
  deleteDoc
} from "firebase/firestore";
import { auth, db } from "../firebase";
import MaterialUploader from "../components/MaterialUploader";

function CoursePage() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [materials, setMaterials] = useState({});
  const [newTitle, setNewTitle] = useState("");

  const isInstructor = auth.currentUser?.email === course?.instructorEmail;

  // Load course
  const loadCourse = async () => {
    const snap = await getDoc(doc(db, "courses", courseId));
    if (snap.exists()) setCourse(snap.data());
  };

  // Load chapters
  const loadChapters = async () => {
    const q = query(
      collection(db, "chapters"),
      where("courseId", "==", courseId)
    );

    const snap = await getDocs(q);

    const sorted = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => a.order - b.order);

    setChapters(sorted);
  };

  // Load materials
  const loadMaterials = async () => {
    const snap = await getDocs(collection(db, "materials"));

    const grouped = {};

    snap.docs.forEach(d => {
      const data = d.data();
      if (!grouped[data.chapterId]) grouped[data.chapterId] = [];
      grouped[data.chapterId].push({ id: d.id, ...data });
    });

    setMaterials(grouped);
  };

  useEffect(() => {
    loadCourse();
    loadChapters();
    loadMaterials();
  }, [courseId]);

  const addChapter = async () => {
    if (!newTitle) return alert("Enter chapter title");

    await addDoc(collection(db, "chapters"), {
      courseId,
      title: newTitle,
      order: chapters.length + 1
    });

    setNewTitle("");
    loadChapters();
  };

  const deleteMaterial = async (id) => {
    await deleteDoc(doc(db, "materials", id));
    loadMaterials();
  };

  if (!course)
    return (
      <div className="login-container">
        <div className="login-card fade-in" style={{ padding: "2rem" }}>
          <h2 className="title" style={{ fontSize: "2rem", margin: 0 }}>
            LOADING...
          </h2>
        </div>
      </div>
    );

  return (
    <div className="dashboard-container">
      <header className="nav-header fade-in">
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <button
            className="btn btn-secondary"
            onClick={() => navigate(-1)}
            style={{ width: "fit-content", padding: "0.5rem 1rem" }}
          >
            ⬅ Back
          </button>
          <h1 className="title" style={{ fontSize: "2.5rem", marginTop: "1rem" }}>
            {course.title}
          </h1>
          <div className="subtitle" style={{ marginBottom: 0 }}>
            Course Outline & Materials
          </div>
        </div>
      </header>

      {/* Instructor Add Chapter */}
      {isInstructor && (
        <div
          className="brutal-card fade-in delay-1"
          style={{
            marginBottom: "2rem",
            background: "var(--accent-green)",
            flexDirection: "row",
            alignItems: "flex-end",
            gap: "1rem"
          }}
        >
          <div className="input-group" style={{ marginBottom: 0, flex: 1 }}>
            <label
              className="input-label"
              style={{ background: "#fff" }}
            >
              Add New Day / Section
            </label>
            <input
              className="form-input"
              placeholder="e.g. Day 1: Introduction"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={addChapter}>
            Add Day ➕
          </button>
        </div>
      )}

      {/* Chapters */}
      <div
        className="fade-in delay-2"
        style={{ display: "flex", flexDirection: "column", gap: "2rem" }}
      >
        {chapters.length === 0 ? (
          <div className="empty-state">
            <p>No chapters available yet.</p>
          </div>
        ) : (
          chapters.map((chapter, index) => (
            <div
              key={chapter.id}
              className="brutal-card"
              style={{ background: "#fff", padding: "2rem" }}
            >
              <h3 className="section-title">
                <span
                  className="badge"
                  style={{
                    background: "var(--accent-yellow)",
                    marginRight: "1rem",
                    boxShadow: "none",
                    transform: "none"
                  }}
                >
                  {index + 1}
                </span>
                {chapter.title}
              </h3>

              {/* Materials */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                  marginTop: "1.5rem"
                }}
              >
                {!materials[chapter.id] ||
                materials[chapter.id].length === 0 ? (
                  <p
                    style={{
                      fontStyle: "italic",
                      opacity: 0.7
                    }}
                  >
                    No materials added yet.
                  </p>
                ) : (
                  materials[chapter.id].map((mat) => (
                    <div
                      key={mat.id}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "1rem",
                        background: "var(--bg-color)",
                        border: "3px solid var(--border-color)",
                        padding: "1rem",
                        boxShadow: "4px 4px 0px var(--border-color)"
                      }}
                    >
                      {/* Header */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center"
                        }}
                      >
                        <div
                          style={{
                            fontWeight: "700",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem"
                          }}
                        >
                          <span style={{ fontSize: "1.5rem" }}>
                            {mat.type === "pdf" && "📄"}
                            {mat.type === "link" && "🔗"}
                            {mat.type === "note" && "📝"}
                            {mat.type === "video" && "🎥"}
                          </span>
                          {mat.title}
                        </div>

                        {isInstructor && (
                          <button
                            className="btn btn-logout"
                            style={{ padding: "0.5rem 1rem" }}
                            onClick={() => deleteMaterial(mat.id)}
                          >
                            Delete
                          </button>
                        )}
                      </div>

                      {/* Content */}
                      {mat.type === "pdf" && (
                        <button
                          className="btn btn-primary"
                          style={{ width: "fit-content" }}
                          onClick={() => navigate(`/pdf/${mat.id}`)}
                        >
                          Open PDF
                        </button>
                      )}

                      {mat.type === "link" && (
                        <a
                          href={mat.content}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-primary"
                          style={{
                            width: "fit-content",
                            textDecoration: "none"
                          }}
                        >
                          Visit Link
                        </a>
                      )}

                      {mat.type === "note" && (
                        <div
                          style={{
                            padding: "1rem",
                            background: "#fff",
                            border: "2px dashed var(--border-color)"
                          }}
                        >
                          {mat.content}
                        </div>
                      )}

                      {mat.type === "video" && (
                        <div
                          style={{
                            position: "relative",
                            paddingBottom: "56.25%",
                            height: 0,
                            overflow: "hidden",
                            border: "3px solid var(--border-color)"
                          }}
                        >
                          <iframe
                            src={mat.content}
                            title="Video"
                            allowFullScreen
                            style={{
                              position: "absolute",
                              top: 0,
                              left: 0,
                              width: "100%",
                              height: "100%",
                              border: "none"
                            }}
                          />
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Add Material */}
              {isInstructor && (
                <MaterialUploader
                  chapterId={chapter.id}
                  onUpload={loadMaterials}
                />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default CoursePage;