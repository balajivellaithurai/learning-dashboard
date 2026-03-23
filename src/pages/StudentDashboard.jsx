import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useNavigate } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";

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
        <div className="nav-actions">
          <ThemeToggle />
          <button className="btn btn-logout" onClick={async () => { await auth.signOut(); navigate("/"); }}>Logout</button>
        </div>
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
              style={{ cursor: "pointer" }}
              onClick={() => navigate(`/course/${course.id}`)}
            >
              <div style={{ flex: 1 }}>
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