import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import ThemeToggle from "../components/ThemeToggle";

function Login() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const loginWithGoogle = async () => {
        try {
            setLoading(true);
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);

            const email = result.user.email;

            // Fetch roles from Firestore
            const adminDoc = await getDoc(doc(db, "roles", "admins"));
            const instructorDoc = await getDoc(doc(db, "roles", "instructors"));

            const adminEmails = adminDoc.exists() ? adminDoc.data().emails : [];
            const instructorEmails = instructorDoc.exists() ? instructorDoc.data().emails : [];

            if (adminEmails.includes(email)) {
                navigate("/admin");
            }
            else if (instructorEmails.includes(email)) {
                navigate("/instructor");
            }
            else {
                navigate("/student");
            }
        } catch (error) {
            console.error("Login Error:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-split-layout">
            <div className="split-bg-grid"></div>

            {/* LEFT PANEL: Frosted Glass Login Area */}
            <div className="split-screen-left">
                <div style={{ position: "absolute", top: "2rem", left: "2rem" }}>
                    <ThemeToggle />
                </div>

                <div style={{
                    width: "85px", height: "85px",
                    background: "linear-gradient(135deg, var(--accent-blue), var(--accent-pink))",
                    borderRadius: "24px", display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 10px 30px rgba(79, 70, 229, 0.4)", marginBottom: "3rem"
                }}>
                    <span style={{ fontSize: "2.8rem" }}>🎓</span>
                </div>

                <h1 style={{ fontSize: "4.5rem", fontWeight: "900", lineHeight: "1.05", marginBottom: "1.5rem", letterSpacing: "-1.5px" }}>
                    Welcome to <br />
                    <span className="gradient-text">Learning Path</span>
                </h1>
                
                <p style={{ fontSize: "1.25rem", color: "var(--text-secondary)", marginBottom: "4rem", maxWidth: "450px", lineHeight: "1.6" }}>
                    The next-generation dashboard for unlocking and accelerating your educational journey.
                </p>

                <button
                    onClick={loginWithGoogle} disabled={loading}
                    className="btn btn-primary"
                    style={{
                        display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem",
                        width: "100%", maxWidth: "420px", padding: "1.2rem", fontSize: "1.15rem",
                        fontWeight: "700"
                    }}
                >
                    {loading ? "⏳ Authenticating System..." : (
                        <>
                            <div style={{ background: "#fff", padding: "6px", borderRadius: "50%", display: "flex" }}>
                                <svg viewBox="0 0 24 24" style={{ width: "24px", height: "24px" }}>
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                            </div>
                            Continue with Google
                        </>
                    )}
                </button>
            </div>

            {/* RIGHT PANEL: Splash Graphics */}
            <div className="split-screen-right">
                {/* Floating 3D Graphic */}
                <div className="split-graphic-box">
                    <div style={{ fontSize: "12rem", filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.4))" }}>🚀</div>
                </div>

                {/* Floating Notification */}
                <div className="split-floating-badge">
                    <span style={{ fontSize: "1.5rem", color: "#facc15" }}>★★★★★</span>
                    <span style={{ color: "var(--text-primary)", fontWeight: "600", letterSpacing: "0.5px" }}>Rated Best Platform 2026</span>
                </div>
            </div>
        </div>
    );
}

export default Login;