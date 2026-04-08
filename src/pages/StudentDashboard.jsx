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
    <div className="dashboard-container max-w-[1400px]">

      {/* Header */}
      <header className="nav-header fade-in border-none">
          <div>
              <h1 className="title text-5xl m-0" style={{ 
                  background: "linear-gradient(to right, #4f46e5, #ec4899)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  color: "transparent"
              }}>
                  STUDENT DASHBOARD
              </h1>

              <div className="subtitle" style={{marginTop: "1.2rem", marginBottom: 0}}>
                  Choose a course to continue learning
              </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
              <ThemeToggle />
              <button
                  className="btn btn-logout"
                  onClick={async () => { await auth.signOut(); navigate("/"); }}
              >
                  LOGOUT
              </button>
          </div>
      </header>

      {courses.length === 0 ? (
        <div className="brutal-card empty-state fade-in delay-1 text-center py-16">
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📚</div>
          <p className="text-xl" style={{ fontWeight: "600", color: "var(--text-secondary)" }}>
              No courses available right now. Please check back later.
          </p>
        </div>
      ) : (
        <div className="fade-in delay-1">
            <h2 className="section-title">
                <div style={{ position: "relative", width: "24px", height: "24px" }}>
                    <div style={{ position: "absolute", top: 0, left: 0, width: "16px", height: "16px", background: "#34d399", borderRadius: "4px", opacity: 0.9 }}></div>
                    <div style={{ position: "absolute", top: "4px", left: "4px", width: "16px", height: "16px", background: "#f472b6", borderRadius: "4px", opacity: 0.9 }}></div>
                    <div style={{ position: "absolute", top: "8px", left: "8px", width: "16px", height: "16px", background: "#60a5fa", borderRadius: "4px", opacity: 0.9 }}></div>
                </div>
                Available Courses
            </h2>

            <div className="grid-layout">
              {courses.map(course => (
                <div
                  key={course.id}
                  className="brutal-card cursor-pointer"
                  onClick={() => navigate(`/course/${course.id}`)}
                >
                  <div className="flex-1">
                    <h3 className="title" style={{ fontSize: "1.6rem", marginBottom: "0.5rem" }}>
                        {course.title}
                    </h3>

                    <p style={{
                        fontWeight: "500",
                        color: "var(--text-secondary)",
                        margin: 0,
                        fontSize: "0.95rem",
                        lineHeight: "1.5"
                    }}>
                        {course.description}
                    </p>
                  </div>
                  
                  {progressData[course.id] !== undefined && (
                    <div style={{ marginTop: "1.5rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontWeight: "600", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                        <span>Course Progress</span>
                        <span style={{ color: "var(--text-primary)", fontWeight: "700" }}>{progressData[course.id]}%</span>
                      </div>
                      <div style={{
                        height: "8px",
                        background: "var(--input-bg)",
                        borderRadius: "9999px",
                        overflow: "hidden"
                      }}>
                        <div style={{
                          width: `${progressData[course.id]}%`,
                          height: "100%",
                          background: "linear-gradient(to right, #4f46e5, #ec4899)",
                          borderRadius: "9999px",
                          transition: "width 0.5s ease-out"
                        }} />
                      </div>
                    </div>
                  )}

                  <div style={{ marginTop: "2rem" }}>
                      <button className="btn btn-secondary" style={{ width: "100%", pointerEvents: "none" }}>
                          View Course →
                      </button>
                  </div>
                </div>
              ))}
            </div>
        </div>
      )}

    </div>
  );
}

export default StudentDashboard;
