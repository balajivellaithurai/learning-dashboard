import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useNavigate } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";

function StudentDashboard() {
  const [courses, setCourses] = useState([]);
  const [progressData, setProgressData] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async (user) => {
      // Load courses
      const snap = await getDocs(collection(db, "courses"));
      const courseList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setCourses(courseList);

      if (!user) return;

      // Load all chapters
      const chaptersSnap = await getDocs(collection(db, "chapters"));
      const chapterCounts = {};
      chaptersSnap.docs.forEach(d => {
        const data = d.data();
        if (data.courseId) {
          chapterCounts[data.courseId] = (chapterCounts[data.courseId] || 0) + 1;
        }
      });

      // Load progress
      const q = query(
        collection(db, "user_progress"),
        where("userId", "==", user.uid)
      );
      const progressSnap = await getDocs(q);
      
      const completedSet = new Set();
      const completedCounts = {};
      
      progressSnap.docs.forEach(d => {
        const data = d.data();
        if (data.courseId && data.chapterId) {
          const uniqueKey = `${data.courseId}_${data.chapterId}`;
          if (!completedSet.has(uniqueKey)) {
            completedSet.add(uniqueKey);
            completedCounts[data.courseId] = (completedCounts[data.courseId] || 0) + 1;
          }
        }
      });

      // Map progress globally
      const progressMap = {};
      courseList.forEach(c => {
        const total = chapterCounts[c.id] || 0;
        const completed = completedCounts[c.id] || 0;
        progressMap[c.id] = total === 0 ? 0 : Math.round((completed / total) * 100);
      });
      
      setProgressData(progressMap);
    };

    if (auth.currentUser) {
      fetchDashboardData(auth.currentUser);
    } else {
      const unsubscribe = auth.onAuthStateChanged(user => {
        fetchDashboardData(user);
      });
      return () => unsubscribe();
    }
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
              style={{ cursor: "pointer", display: "flex", flexDirection: "column" }}
              onClick={() => navigate(`/course/${course.id}`)}
            >
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: "1.5rem", fontWeight: "700", marginBottom: "0.5rem" }}>{course.title}</h2>
                <p style={{ fontWeight: "500", marginBottom: "1rem" }}>{course.description}</p>
                
                {progressData[course.id] !== undefined && (
                  <div style={{ marginBottom: "1rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontWeight: "bold", fontSize: "0.9rem" }}>
                      <span>Progress</span>
                      <span>{progressData[course.id]}%</span>
                    </div>
                    <div style={{
                      height: "10px",
                      background: "#ccc",
                      border: "2px solid var(--border-color)",
                      boxShadow: "2px 2px 0px var(--border-color)"
                    }}>
                      <div style={{
                        width: `${progressData[course.id]}%`,
                        height: "100%",
                        background: "#4caf50",
                        borderRight: progressData[course.id] > 0 && progressData[course.id] < 100 ? "2px solid var(--border-color)" : "none"
                      }} />
                    </div>
                  </div>
                )}

              </div>
              <button className="btn btn-secondary" style={{ width: "100%", padding: "0.5rem", pointerEvents: "none", marginTop: "auto" }}>View Course →</button>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

export default StudentDashboard;
