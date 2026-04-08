import { useEffect, useState } from "react";
import {
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
    query,
    where,
    serverTimestamp
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import ThemeToggle from "../components/ThemeToggle";

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
        navigate("/");
    };


    // -------- DELETE COURSE + ALL RELATED DATA --------

    const deleteCourse = async (courseId) => {

        if (!window.confirm("Delete this course and all its content?"))
            return;

        try {

            const chapterQuery = query(
                collection(db, "chapters"),
                where("courseId", "==", courseId)
            );

            const chapterSnap = await getDocs(chapterQuery);

            const chapterIds = chapterSnap.docs.map(d => d.id);

            for (const chapter of chapterSnap.docs) {
                await deleteDoc(doc(db, "chapters", chapter.id));
            }

            const materialsSnap = await getDocs(collection(db, "materials"));

            for (const m of materialsSnap.docs) {

                if (chapterIds.includes(m.data().chapterId)) {

                    await deleteDoc(doc(db, "materials", m.id));

                }

            }

            const quizzesSnap = await getDocs(collection(db, "quizzes"));

            for (const q of quizzesSnap.docs) {

                if (chapterIds.includes(q.data().chapterId)) {

                    await deleteDoc(doc(db, "quizzes", q.id));

                }

            }

            const attemptsSnap = await getDocs(collection(db, "quiz_attempts"));

            for (const a of attemptsSnap.docs) {

                if (a.data().courseId === courseId) {

                    await deleteDoc(doc(db, "quiz_attempts", a.id));

                }

            }

            const progressSnap = await getDocs(collection(db, "user_progress"));

            for (const p of progressSnap.docs) {

                if (p.data().courseId === courseId) {

                    await deleteDoc(doc(db, "user_progress", p.id));

                }

            }

            await deleteDoc(doc(db, "courses", courseId));

            fetchCourses();

        } catch (err) {

            console.error(err);
            alert("Error deleting course");

        }

    };

    return (
        <div className="dashboard-container max-w-[1400px]">

            {/* Header */}
            <header className="nav-header fade-in">
                <div>
                    <h1 className="title text-5xl m-0" style={{ 
                        background: "linear-gradient(to right, #4f46e5, #ec4899)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                        color: "transparent"
                    }}>
                        INSTRUCTOR STUDIO
                    </h1>

                    <div className="subtitle" style={{marginTop: "1.2rem", marginBottom: 0}}>
                        Manage your curriculum and content.
                    </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
                    <ThemeToggle />
                    <button
                        className="btn btn-logout"
                        onClick={handleLogout}
                    >
                        LOGOUT
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                {/* CREATE COURSE FORM */}
                <div className="lg:col-span-1">
                    <form onSubmit={createCourse} className="brutal-card fade-in delay-1 h-full flex flex-col justify-center gap-6">
                        <div>
                            <h2 className="section-title m-0">
                                🚀 Create Course
                            </h2>
                            <p className="text-sm font-medium mt-2" style={{color: "var(--text-secondary)"}}>
                                Launch a new learning journey.
                            </p>
                        </div>
                        
                        <div className="flex flex-col gap-4">
                            <div>
                                <input
                                    className="form-input"
                                    type="text"
                                    placeholder="Course Title"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <textarea
                                    className="form-input form-textarea"
                                    placeholder="Course Description"
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    required
                                    rows="4"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                        >
                            {loading ? "CREATING..." : "CREATE COURSE"}
                        </button>
                    </form>
                </div>

                {/* COURSES LIST */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <h2 className="section-title fade-in delay-2 m-0 bg-transparent border-none shadow-none">
                        <div style={{ position: "relative", width: "24px", height: "24px" }}>
                            <div style={{ position: "absolute", top: 0, left: 0, width: "16px", height: "16px", background: "#34d399", borderRadius: "4px", opacity: 0.9 }}></div>
                            <div style={{ position: "absolute", top: "4px", left: "4px", width: "16px", height: "16px", background: "#f472b6", borderRadius: "4px", opacity: 0.9 }}></div>
                            <div style={{ position: "absolute", top: "8px", left: "8px", width: "16px", height: "16px", background: "#60a5fa", borderRadius: "4px", opacity: 0.9 }}></div>
                        </div>
                        Your Courses
                    </h2>

                    {courses.length === 0 ? (
                        <div className="brutal-card empty-state text-center py-16">
                            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🛠</div>
                            <p className="text-xl" style={{ fontWeight: "600", color: "var(--text-secondary)" }}>
                                You have not created any courses yet.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {courses.map(course => (
                                <div
                                    key={course.id}
                                    className="brutal-card cursor-pointer"
                                >
                                    <div className="flex-1">
                                        <h3 className="title text-2xl" style={{ fontSize: "1.4rem", marginBottom: "0.5rem" }}>
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

                                    <div style={{ marginTop: "2rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                        <button
                                            className="btn btn-secondary w-full"
                                            onClick={() => navigate(`/course/${course.id}`)}
                                        >
                                            Manage Course →
                                        </button>
                                        <button
                                            className="btn btn-logout w-full"
                                            onClick={() => deleteCourse(course.id)}
                                        >
                                            Delete Course
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default InstructorDashboard;
