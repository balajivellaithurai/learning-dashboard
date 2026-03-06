import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

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
        <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#fae1de", // Exact light peach/pink extracted from the provided image
            backgroundImage: "radial-gradient(#000 1.5px, transparent 1.5px)",
            backgroundSize: "32px 32px",
            backgroundPosition: "0 0",
            fontFamily: "system-ui, -apple-system, sans-serif",
            zIndex: 99999
        }}>
            <div style={{
                backgroundColor: "#ffd147", // Exact matching yellow extracted from the provided image
                border: "6px solid #000",
                boxShadow: "16px 16px 0px #000",
                padding: "0px 40px",
                width: "480px",
                height: "460px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                boxSizing: "border-box"
            }}>
                <div style={{ marginBottom: "20px" }}>
                    <img
                        src="https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Graduation%20cap/3D/graduation_cap_3d.png"
                        alt="Graduation Cap"
                        style={{ width: "65px", height: "65px", filter: "drop-shadow(3px 3px 0px rgba(0,0,0,0.8))" }}
                    />
                </div>

                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    marginBottom: "25px"
                }}>
                    <span style={{
                        fontFamily: "Impact, 'Arial Black', sans-serif",
                        fontSize: "3rem",
                        color: "#000",
                        letterSpacing: "1px"
                    }}>
                        LEARNING
                    </span>
                    <span style={{
                        backgroundColor: "#e880ff", // Matching precise pink/violet
                        padding: "0px 6px",
                        border: "5px solid #000",
                        boxShadow: "4px 4px 0px #000",
                        transform: "rotate(-3deg)",
                        color: "#fff",
                        fontFamily: "Impact, 'Arial Black', sans-serif",
                        fontSize: "3rem",
                        letterSpacing: "2px",
                        lineHeight: "1.1",
                        marginTop: "8px"
                    }}>
                        PATH
                    </span>
                </div>

                <div style={{
                    backgroundColor: "#fff",
                    border: "4px solid #000",
                    boxShadow: "5px 5px 0px #000",
                    padding: "10px 24px",
                    fontWeight: "700",
                    fontSize: "1.05rem",
                    color: "#000",
                    marginBottom: "35px"
                }}>
                    Welcome back.
                </div>

                <button
                    onClick={loginWithGoogle}
                    disabled={loading}
                    style={{
                        width: "100%",
                        maxWidth: "360px",
                        backgroundColor: "#fff",
                        border: "4px solid #000",
                        boxShadow: "6px 6px 0px #000",
                        padding: "14px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "12px",
                        fontWeight: "800",
                        fontSize: "1.1rem",
                        cursor: "pointer",
                        color: "#000",
                        transition: "transform 0.1s, box-shadow 0.1s",
                        opacity: loading ? 0.7 : 1
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.transform = "translate(2px, 2px)"; e.currentTarget.style.boxShadow = "4px 4px 0px #111"; }}
                    onMouseOut={(e) => { e.currentTarget.style.transform = "translate(0px, 0px)"; e.currentTarget.style.boxShadow = "6px 6px 0px #111"; }}
                >
                    {loading ? (
                        <span>⏳ Loading...</span>
                    ) : (
                        <>
                            <svg viewBox="0 0 24 24" style={{ width: "22px", height: "22px" }}>
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            CONTINUE WITH GOOGLE
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}

export default Login;