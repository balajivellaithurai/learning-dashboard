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

                    {/* Overlapping subtitle box */}
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
                        color: "var(--text-primary)",
                        transition: "background 0.4s ease, border-color 0.4s ease"
                    }}>
                        Manage your curriculum and content.
                    </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
                    <ThemeToggle />
                    <button
                        className="btn-neo"
                        onClick={handleLogout}
                        style={{ background: "#ff3c00", color: "#fff", border: "5px solid var(--border-color)", boxShadow: "5px 5px 0px var(--border-color)", padding: "12px 28px", fontWeight: "900", fontSize: "1.1rem", cursor: "pointer", transition: "transform 0.1s, box-shadow 0.1s" }}
                        onMouseOver={(e) => { e.currentTarget.style.transform = "translate(3px, 3px)"; e.currentTarget.style.boxShadow = "2px 2px 0px var(--border-color)"; }}
                        onMouseOut={(e) => { e.currentTarget.style.transform = "translate(0px, 0px)"; e.currentTarget.style.boxShadow = "5px 5px 0px var(--border-color)"; }}
                    >
                        LOGOUT
                    </button>
                </div>
            </header>

            <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: "3rem", alignItems: "start" }}>

                {/* Left Box: Create Course */}
                <div className="fade-in delay-1" style={{
                    position: "relative",
                    background: "var(--card-bg)",
                    border: "6px solid var(--border-color)",
                    boxShadow: "10px 10px 0px var(--border-color)",
                    padding: "4rem 2.5rem 2.5rem 2.5rem",
                    marginTop: "20px",
                    transition: "background 0.4s ease, border-color 0.4s ease"
                }}>
                    {/* Overlapping Title */}
                    <div style={{
                        position: "absolute",
                        top: "-25px",
                        left: "20px",
                        background: "var(--card-bg)",
                        border: "5px solid var(--border-color)",
                        boxShadow: "5px 5px 0px var(--border-color)",
                        padding: "12px 24px",
                        fontWeight: "900",
                        fontSize: "1.5rem",
                        transform: "rotate(-1deg)",
                        color: "var(--text-primary)",
                        transition: "background 0.4s ease, border-color 0.4s ease"
                    }}>
                        ✨ Create Course
                    </div>

                    <form onSubmit={createCourse} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                            <label style={{ background: "#fcd53f", border: "3px solid var(--border-color)", padding: "4px 12px", fontWeight: "900", fontSize: "0.95rem", color: "#000", zIndex: 2, marginBottom: "-12px", marginLeft: "10px" }}>
                                Course Title
                            </label>
                            <input
                                placeholder="e.g. Advanced AI Development"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                                style={{ width: "100%", padding: "16px 16px 16px 20px", background: "var(--card-bg)", border: "5px solid var(--border-color)", color: "var(--text-primary)", fontWeight: "600", fontSize: "1.05rem", outline: "none", transition: "background 0.4s ease, border-color 0.4s ease, color 0.4s ease" }}
                            />
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                            <label style={{ background: "#fcd53f", border: "3px solid var(--border-color)", padding: "4px 12px", fontWeight: "900", fontSize: "0.95rem", color: "#000", zIndex: 2, marginBottom: "-12px", marginLeft: "10px" }}>
                                Course Description
                            </label>
                            <textarea
                                placeholder="What will your students learn in this course?"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                required
                                style={{ width: "100%", padding: "16px 16px 16px 20px", background: "var(--card-bg)", border: "5px solid var(--border-color)", color: "var(--text-primary)", fontWeight: "600", fontSize: "1.05rem", minHeight: "130px", outline: "none", resize: "vertical", transition: "background 0.4s ease, border-color 0.4s ease, color 0.4s ease" }}
                            />
                        </div>

                        <button disabled={loading} style={{ background: "#3a76f0", color: "#fff", border: "5px solid var(--border-color)", boxShadow: "5px 5px 0px var(--border-color)", padding: "16px", fontWeight: "900", fontSize: "1.1rem", marginTop: "10px", cursor: "pointer", opacity: loading ? 0.7 : 1, transition: "transform 0.1s, box-shadow 0.1s" }} onMouseOver={(e) => { e.currentTarget.style.transform = "translate(3px, 3px)"; e.currentTarget.style.boxShadow = "2px 2px 0px var(--border-color)"; }} onMouseOut={(e) => { e.currentTarget.style.transform = "translate(0px, 0px)"; e.currentTarget.style.boxShadow = "5px 5px 0px var(--border-color)"; }}>
                            {loading ? "⏳ PUBLISHING..." : "PUBLISH SETUP"}
                        </button>
                    </form>
                </div>

                {/* Right Box: Quick Stats */}
                <div className="fade-in delay-2" style={{
                    position: "relative",
                    background: "#829df8",
                    border: "6px solid var(--border-color)",
                    boxShadow: "10px 10px 0px var(--border-color)",
                    padding: "4rem 2.5rem 2.5rem 2.5rem",
                    marginTop: "20px"
                }}>
                    {/* Overlapping Title */}
                    <div style={{
                        position: "absolute",
                        top: "-25px",
                        left: "20px",
                        background: "var(--card-bg)",
                        border: "5px solid var(--border-color)",
                        boxShadow: "5px 5px 0px var(--border-color)",
                        padding: "10px 24px",
                        fontWeight: "900",
                        fontSize: "1.4rem",
                        transform: "rotate(-1deg)",
                        color: "var(--text-primary)",
                        transition: "background 0.4s ease, border-color 0.4s ease"
                    }}>
                        📊 Quick Stats
                    </div>

                    <div style={{
                        border: "5px solid var(--border-color)",
                        background: "#829df8",
                        padding: "5rem 2rem",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        textAlign: "center",
                        gap: "1.5rem",
                        height: "100%"
                    }}>
                        <div style={{ fontSize: "3rem", animation: "float 3s ease-in-out infinite", transform: "rotate(45deg)", marginBottom: "0.5rem" }}>🚀</div>
                        <h3 style={{ fontSize: "1.6rem", fontWeight: "900", color: "#000" }}>READY TO TEACH?</h3>
                        <p style={{ fontWeight: "800", fontSize: "1rem", color: "#000", lineHeight: "1.6" }}>
                            Publish your first course to start seeing learner analytics and engagement metrics right here.
                        </p>
                    </div>
                </div>
            </div>

            <div style={{ marginTop: "5rem" }}>
                <h2 className="fade-in delay-2" style={{ fontSize: "2rem", fontWeight: "900", color: "var(--text-primary)", marginBottom: "2rem" }}>📚 Your Courses</h2>

                {courses.length === 0 && (
                    <div className="fade-in delay-2" style={{ background: "var(--card-bg)", border: "5px solid var(--border-color)", padding: "3rem", textAlign: "center", boxShadow: "8px 8px 0px var(--border-color)" }}>
                        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📖</div>
                        <p style={{ fontWeight: "800", fontSize: "1.2rem", color: "var(--text-primary)" }}>No courses yet. Create one above 👆</p>
                    </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))", gap: "2rem" }} className="fade-in delay-2">
                    {courses.map(course => (
                        <div
                            key={course.id}
                            style={{
                                background: "var(--card-bg)",
                                border: "5px solid var(--border-color)",
                                padding: "2rem",
                                boxShadow: "8px 8px 0px var(--border-color)",
                                cursor: "pointer",
                                display: "flex",
                                flexDirection: "column",
                                gap: "1rem",
                                transition: "transform 0.2s, box-shadow 0.2s, background 0.4s ease"
                            }}
                            onClick={() => navigate(`/course/${course.id}`)}
                            onMouseOver={(e) => { e.currentTarget.style.transform = "translate(-5px, -5px)"; e.currentTarget.style.boxShadow = "13px 13px 0px var(--border-color)"; }}
                            onMouseOut={(e) => { e.currentTarget.style.transform = "translate(0px, 0px)"; e.currentTarget.style.boxShadow = "8px 8px 0px var(--border-color)"; }}
                        >
                            <h3 style={{ fontSize: "1.5rem", fontWeight: "900", color: "var(--text-primary)", margin: 0 }}>{course.title}</h3>
                            <p style={{ fontWeight: "600", color: "var(--text-primary)", flex: 1, margin: 0 }}>{course.description}</p>

                            <button
                                style={{ width: "100%", background: "transparent", border: "4px solid var(--border-color)", boxShadow: "4px 4px 0px var(--border-color)", padding: "12px", fontWeight: "900", color: "var(--text-primary)", marginTop: "1rem", pointerEvents: "none" }}
                            >
                                Manage Course →
                            </button>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
}

export default InstructorDashboard;