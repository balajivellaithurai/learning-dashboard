import { useEffect, useState } from "react";
import {
    collection,
    addDoc,
    getDocs,
    serverTimestamp
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";

function InstructorDashboard() {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const fetchCourses = async () => {
        const snap = await getDocs(collection(db, "courses"));

        const mine = snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter(c => c.instructorEmail === auth.currentUser?.email);

        setCourses(mine);
    };

    useEffect(() => {
        fetchCourses();
    }, []);

    const createCourse = async (e) => {
        e.preventDefault();
        setLoading(true);

        await addDoc(collection(db, "courses"), {
            title,
            description,
            instructorEmail: auth.currentUser.email,
            createdAt: serverTimestamp()
        });

        setTitle("");
        setDescription("");
        await fetchCourses();
        setLoading(false);
    };

    const handleLogout = async () => {
        await signOut(auth);
    };

    return (
        <div className="dashboard-container">

            <div className="nav-header">
                <h1 className="title">Instructor Dashboard</h1>
                <button className="btn btn-logout" onClick={handleLogout}>
                    Logout
                </button>
            </div>

            <div className="brutal-card" style={{ marginBottom: "3rem" }}>
                <h2 className="section-title">✨ Create New Course</h2>

                <form
                    onSubmit={createCourse}
                    style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
                >
                    <input
                        className="form-input"
                        placeholder="Course Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />

                    <textarea
                        className="form-input"
                        placeholder="Course Description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                    />

                    <button className="btn btn-primary" disabled={loading}>
                        {loading ? "Publishing..." : "Publish Course 🚀"}
                    </button>
                </form>
            </div>

            <h2 className="section-title">📚 Your Courses</h2>

            {courses.length === 0 && (
                <div className="empty-state">
                    <p>No courses yet. Create one above 👆</p>
                </div>
            )}

            <div className="grid-layout">
                {courses.map(course => (
                    <div key={course.id} className="brutal-card">
                        <h3>{course.title}</h3>
                        <p>{course.description}</p>

                        <button
                            className="btn btn-secondary"
                            onClick={() => navigate(`/course/${course.id}`)}
                        >
                            Manage Course →
                        </button>
                    </div>
                ))}
            </div>

        </div>
    );
}

export default InstructorDashboard;