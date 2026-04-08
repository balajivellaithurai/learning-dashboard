import { auth } from "../firebase";
import ThemeToggle from "../components/ThemeToggle";
import { useNavigate } from "react-router-dom";

function AdminDashboard() {
    const navigate = useNavigate();

    const handleLogout = async () => {
        await auth.signOut();
        navigate("/");
    };

    return (
        <div className="dashboard-container">
            <header className="nav-header fade-in">
                <div>
                    <h1 className="title">Platform <span className="text-gradient">Admin</span></h1>
                    <p className="subtitle" style={{ marginBottom: 0 }}>System overview and access control.</p>
                </div>
                <div className="nav-actions">
                    <ThemeToggle />
                    <button onClick={handleLogout} className="btn btn-logout">Logout</button>
                </div>
            </header>

            <div className="grid-layout">
                {/* Quick Actions Panel */}
                <section className="brutal-card fade-in delay-1">
                    <h2 className="section-title">
                        <span style={{ fontSize: "1.2rem" }}>⚡</span> Quick Actions
                    </h2>
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        <button className="btn btn-primary">
                            ➕ Add Instructor
                        </button>
                        <button className="btn btn-secondary">
                            👥 View Users Directory
                        </button>
                        <button className="btn btn-secondary">
                            📈 Platform Analytics
                        </button>
                    </div>
                </section>

                {/* System Status Panel */}
                <section className="brutal-card fade-in delay-2">
                    <h2 className="section-title">
                        <span style={{ fontSize: "1.2rem" }}>🟢</span> System Status
                    </h2>
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "1rem", borderBottom: "1px solid var(--border-color)" }}>
                            <div>
                                <p style={{ fontWeight: 700, color: "var(--text-primary)", margin: 0, fontSize: "1.1rem" }}>Database Connection</p>
                                <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", margin: 0, fontWeight: 500 }}>Firebase Firestore</p>
                            </div>
                            <span className="badge">Healthy</span>
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "1rem", borderBottom: "1px solid var(--border-color)" }}>
                            <div>
                                <p style={{ fontWeight: 700, color: "var(--text-primary)", margin: 0, fontSize: "1.1rem" }}>Authentication</p>
                                <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", margin: 0, fontWeight: 500 }}>Firebase Auth (Google)</p>
                            </div>
                            <span className="badge">Online</span>
                        </div>

                        <div className="empty-state" style={{ padding: "1.5rem", marginTop: "1rem" }}>
                            <p style={{ margin: 0, fontSize: "1rem", fontWeight: "700" }}>More administrative features (role management, course approvals) are coming in v2.0.</p>
                        </div>

                    </div>
                </section>
            </div>
        </div>
    );
}

export default AdminDashboard;
