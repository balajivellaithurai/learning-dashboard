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
        <div style={{
            maxWidth: "1400px",
            margin: "0 auto",
            padding: "3rem 2rem",
            fontFamily: "'Space Grotesk', sans-serif"
        }}>

            {/* Header */}
            <header className="fade-in" style={{
                background: "var(--card-bg)",
                border: "6px solid var(--border-color)",
                boxShadow: "10px 10px 0px var(--border-color)",
                padding: "2rem 3rem",
                marginBottom: "5rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                position: "relative",
                transition: "background 0.4s ease, border-color 0.4s ease"
            }}>

                <div style={{ position: "relative" }}>
                    <h1 style={{ display: "flex", alignItems: "center", margin: 0, gap: "10px", fontSize: "3.2rem", color: "var(--text-primary)" }}>
                        <span style={{ fontFamily: "Impact, 'Arial Black', sans-serif", letterSpacing: "1px" }}>INSTRUCTOR</span>
                        <span style={{
                            background: "#f772ff",
                            color: "#fff",
                            padding: "0px 16px",
                            border: "5px solid var(--border-color)",
                            boxShadow: "5px 5px 0px var(--border-color)",
                            transform: "rotate(-2deg)",
                            fontFamily: "Impact, 'Arial Black', sans-serif",
                            fontSize: "3.2rem"
                        }}>STUDIO</span>
                    </h1>

                    <div style={{
                        position: "absolute",
                        bottom: "-65px",
                        left: "10px",
                        background: "var(--card-bg)",
                        padding: "10px 20px",
                        border: "4px solid var(--border-color)",
                        boxShadow: "4px 4px 0 var(--border-color)",
                        fontWeight: "800",
                        fontSize: "1.1rem",
                        color: "var(--text-primary)"
                    }}>
                        Manage your curriculum and content.
                    </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
                    <ThemeToggle />
                    <button
                        className="btn-neo"
                        onClick={handleLogout}
                        style={{
                            background: "#ff3c00",
                            color: "#fff",
                            border: "5px solid var(--border-color)",
                            boxShadow: "5px 5px 0px var(--border-color)",
                            padding: "12px 28px",
                            fontWeight: "900",
                            fontSize: "1.1rem",
                            cursor: "pointer"
                        }}
                    >
                        LOGOUT
                    </button>
                </div>

            </header>


            {/* COURSES LIST */}

            <div style={{ marginTop: "5rem" }}>
                <h2 className="fade-in delay-2" style={{
                    fontSize: "2rem",
                    fontWeight: "900",
                    color: "var(--text-primary)",
                    marginBottom: "2rem"
                }}>
                    📚 Your Courses
                </h2>

                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))",
                    gap: "2rem"
                }}>

                    {courses.map(course => (

                        <div
                            key={course.id}
                            style={{
                                background: "var(--card-bg)",
                                border: "5px solid var(--border-color)",
                                padding: "2rem",
                                boxShadow: "8px 8px 0px var(--border-color)",
                                display: "flex",
                                flexDirection: "column",
                                gap: "1rem"
                            }}
                        >

                            <h3 style={{
                                fontSize: "1.5rem",
                                fontWeight: "900",
                                color: "var(--text-primary)",
                                margin: 0
                            }}>
                                {course.title}
                            </h3>

                            <p style={{
                                fontWeight: "600",
                                color: "var(--text-primary)",
                                flex: 1,
                                margin: 0
                            }}>
                                {course.description}
                            </p>

                            <button
                                style={{
                                    width: "100%",
                                    background: "transparent",
                                    border: "4px solid var(--border-color)",
                                    boxShadow: "4px 4px 0px var(--border-color)",
                                    padding: "12px",
                                    fontWeight: "900",
                                    color: "var(--text-primary)"
                                }}
                                onClick={() => navigate(`/course/${course.id}`)}
                            >
                                Manage Course →
                            </button>

                            <button
                                style={{
                                    width: "100%",
                                    background: "#ff3c00",
                                    border: "4px solid var(--border-color)",
                                    boxShadow: "4px 4px 0px var(--border-color)",
                                    padding: "12px",
                                    fontWeight: "900",
                                    color: "#fff"
                                }}
                                onClick={() => deleteCourse(course.id)}
                            >
                                Delete Course
                            </button>

                        </div>

                    ))}

                </div>

            </div>

        </div>
    );
}

export default InstructorDashboard;