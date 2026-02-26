import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useNavigate } from "react-router-dom";

function StudentDashboard() {
  const [courses, setCourses] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const loadCourses = async () => {
      const snap = await getDocs(collection(db, "courses"));
      setCourses(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    loadCourses();
  }, []);

  return (
    <div className="dashboard-container">

      <header className="nav-header fade-in">
        <div>
          <h1 className="title">Student <span className="text-gradient">Dashboard</span></h1>
          <div className="subtitle" style={{ marginBottom: 0 }}>Choose a course to continue learning</div>
        </div>
        <button className="btn btn-logout" onClick={() => auth.signOut()}>Logout</button>
      </header>

      {courses.length === 0 ? (
        <div className="empty-state fade-in delay-1">
          <div className="empty-state-icon">📚</div>
          <p>No courses available right now. Please check back later.</p>
        </div>
      ) : (
        <div className="grid-layout fade-in delay-1">
          {courses.map(course => (
            <div
              key={course.id}
              className="brutal-card"
              style={{ cursor: "pointer", display: "flex", flexDirection: "column", justifyContent: "space-between" }}
              onClick={() => navigate(`/course/${course.id}`)}
              onMouseDown={(e) => { e.currentTarget.style.transform = "translate(4px, 4px)"; e.currentTarget.style.boxShadow = "2px 2px 0px var(--border-color)"; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
            >
              <div>
                <h2 style={{ fontSize: "1.5rem", fontWeight: "700", marginBottom: "0.5rem" }}>{course.title}</h2>
                <p style={{ fontWeight: "500", marginBottom: "1rem" }}>{course.description}</p>
              </div>
              <button className="btn btn-secondary" style={{ width: "100%", padding: "0.5rem", pointerEvents: "none" }}>View Course →</button>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

export default StudentDashboard;