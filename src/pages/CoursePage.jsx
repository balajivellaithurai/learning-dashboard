import { useEffect, useState, useRef } from "react";
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
import AssignmentUpload from "../components/AssignmentUpload";
import AssignmentReview from "../components/AssignmentReview";
import ThemeToggle from "../components/ThemeToggle";

function CoursePage() {

  const { courseId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [materials, setMaterials] = useState({});
  const [completedChapters, setCompletedChapters] = useState([]);
  const [newTitle, setNewTitle] = useState("");
  const [assignmentText, setAssignmentText] = useState("");
  const timerRef = useRef(null);

  const isInstructor =
    auth.currentUser?.email === course?.instructorEmail;

  // 🔥 ADDED: Progress calculation
  const progressPercent =
    chapters.length === 0
      ? 0
      : Math.round(
          (completedChapters.length / chapters.length) * 100
        );

  const loadCourse = async () => {
    const snap = await getDoc(doc(db, "courses", courseId));
    if (snap.exists()) setCourse(snap.data());
  };

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

  const loadMaterials = async () => {

    const snap = await getDocs(collection(db, "materials"));

    const grouped = {};

    snap.docs.forEach(d => {
      const data = d.data();

      if (!grouped[data.chapterId])
        grouped[data.chapterId] = [];

      grouped[data.chapterId].push({
        id: d.id,
        ...data
      });
    });

    setMaterials(grouped);
  };

  const loadProgress = async () => {

    if (!auth.currentUser) return;

    const q = query(
      collection(db, "user_progress"),
      where("userId", "==", auth.currentUser.uid),
      where("courseId", "==", courseId)
    );

    const snap = await getDocs(q);

    const list = [...new Set(snap.docs.map(d => d.data().chapterId))];

    setCompletedChapters(list);
  };

  useEffect(() => {
    loadCourse();
    loadChapters();
    loadMaterials();
    loadProgress();
  }, [courseId]);

  const startTimer = (chapterId) => {

    if (!auth.currentUser) return;
    if (isInstructor) return;
    if (completedChapters.includes(chapterId)) return;

    clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {

      await addDoc(
        collection(db, "user_progress"),
        {
          userId: auth.currentUser.uid,
          courseId,
          chapterId
        }
      );

      loadProgress();

    }, 60000);

  };

  const addChapter = async () => {

    if (!newTitle)
      return alert("Enter title");

   await addDoc(
      collection(db, "chapters"),
      {
        courseId,
        title: newTitle,
        order: chapters.length + 1,
        assignment: assignmentText || "No assignment"
      }
    );
    setAssignmentText("");

    setNewTitle("");
    loadChapters();
  };

  const deleteMaterial = async (id) => {
    await deleteDoc(doc(db, "materials", id));
    loadMaterials();
  };

  const deleteChapter = async (id) => {

    if (!window.confirm("Delete this day and all its materials?"))
      return;

    await deleteDoc(doc(db, "chapters", id));
    loadChapters();
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "pdf": return "📄";
      case "video": return "🎬";
      case "link": return "🔗";
      case "note": return "📝";
      default: return "📁";
    }
  };

  if (!course)
    return <h2>Loading Course...</h2>;

  return (

    <div className="dashboard-container">

      <div className="course-page-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          Back
        </button>
        <h1 style={{ margin: 0 }}>{course.title}</h1>
        <ThemeToggle />
      </div>

      {/* 🔥 ADDED: Progress UI */}
      <div style={{
        marginBottom: "20px",
        padding: "15px",
        border: "3px solid var(--border-color)",
        background: "var(--card-bg)"
      }}>
        <h3>📊 Progress: {progressPercent}%</h3>
        <div style={{
          height: "10px",
          background: "#ccc",
          marginTop: "10px"
        }}>
          <div style={{
            width: `${progressPercent}%`,
            height: "100%",
            background: "#4caf50"
          }} />
        </div>
      </div>

      {isInstructor && (
        <div className="add-day-form">
          <input
            className="form-input"
            placeholder="New day title..."
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
          />
          <input
  placeholder="Enter assignment question..."
  value={assignmentText}
  onChange={e => setAssignmentText(e.target.value)}
/>
          <button className="btn btn-primary" onClick={addChapter}>
            + Add Day
          </button>
        </div>
      )}

      <div className="course-timeline">
        {chapters.map((chapter, index) => {

          const unlocked =
            isInstructor ||
            index === 0 ||
            completedChapters.includes(
              chapters[index - 1]?.id
            );

          const completed =
            completedChapters.includes(chapter.id);

          return (
            <div
              key={chapter.id}
              className={`chapter-card ${!unlocked ? "locked" : ""} ${completed ? "completed" : ""}`}
              style={{ padding: 0 }}
            >
              <div className={`timeline-dot ${completed ? "dot-completed" : !unlocked ? "dot-locked" : "dot-active"}`}></div>
              <div className="chapter-header">
                <div className="chapter-title">
                  <span className="chapter-day-badge">Day {index + 1}</span>
                  {chapter.title}
                </div>
                <div className="chapter-status">
                  {completed ? (
                    <span className="status-completed">✓ Completed</span>
                  ) : !unlocked ? (
                    <span className="status-locked">🔒 Locked</span>
                  ) : null}
                </div>
              </div>

              {unlocked && (
                <div className="chapter-body">
                  <div className="materials-list">
                    {materials[chapter.id]?.map(mat => (
                      <div key={mat.id} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        <div className="material-item">
                          <div className="material-info">
                            <div className={`material-type-icon ${mat.type}`}>
                              {getTypeIcon(mat.type)}
                            </div>
                            <div className="material-title">{mat.title}</div>
                          </div>

                          <div className="material-actions">
                            {mat.type === "pdf" && (
                              <button
                                className="btn btn-sm btn-accent-blue"
                                onClick={() => {
                                  startTimer(chapter.id);
                                  navigate(`/pdf/${mat.id}`);
                                }}
                              >
                                Open PDF
                              </button>
                            )}

                            {mat.type === "link" && (
                              <a
                                className="btn btn-sm btn-accent-cyan"
                                href={mat.content}
                                target="_blank"
                                rel="noreferrer"
                                onClick={() => startTimer(chapter.id)}
                              >
                                Open Link
                              </a>
                            )}

                            {isInstructor && (
                              <button
                                className="btn btn-sm btn-danger"
                                onClick={() => deleteMaterial(mat.id)}
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </div>

                        {mat.type === "video" && (
                          <div className="video-container">
                            <iframe
                              src={mat.content}
                              width="100%"
                              height="100%"
                              onLoad={() => startTimer(chapter.id)}
                            />
                          </div>
                        )}

                        {mat.type === "note" && (
                          <div
                            className="note-content"
                            onClick={() => startTimer(chapter.id)}
                          >
                            {mat.content}
                          </div>
                        )}

                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: 20, marginBottom: 20, display: "flex", gap: "10px", alignItems: "center" }}>
                    {isInstructor && (
                      <button
                        className="btn btn-sm btn-accent-purple"
                        onClick={() => navigate(`/create-quiz/${chapter.id}`)}
                      >
                        🧪 Create Quiz
                      </button>
                    )}

                    {!isInstructor && (
                      <button
                        className="btn btn-sm btn-accent-yellow"
                        onClick={() => navigate(`/quiz/${chapter.id}`)}
                      >
                        🧪 Take Quiz
                      </button>
                    )}
                  </div>

                  {isInstructor && (
  <MaterialUploader
    chapterId={chapter.id}
    onUpload={loadMaterials}
  />
)}

{/* 🔥 ASSIGNMENT SECTION ADDED */}
<div style={{ marginTop: "20px" }}>
  <h4 style={{ marginBottom: "10px" }}>📄 Assignment</h4>
  <AssignmentUpload chapterId={chapter.id} />
</div>
                </div>
              )}

            </div>
          );
        })}

        {chapters.length === 0 && !isInstructor && (
          <div className="empty-state fade-in">
            <div className="empty-state-icon">🚧</div>
            <p>Course content is being prepared.</p>
          </div>
        )}

      </div>
    </div>
  );
}

export default CoursePage;