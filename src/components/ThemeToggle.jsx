import { useState, useEffect } from "react";

function ThemeToggle() {
    const [dark, setDark] = useState(() => {
        const saved = localStorage.getItem("theme");
        if (saved) return saved === "dark";
        return window.matchMedia("(prefers-color-scheme: dark)").matches;
    });

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
        localStorage.setItem("theme", dark ? "dark" : "light");
    }, [dark]);

    return (
        <button
            className="theme-toggle"
            onClick={() => setDark(!dark)}
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            title={dark ? "Light mode" : "Dark mode"}
        >
            <div className={`toggle-track ${dark ? "is-dark" : ""}`}>
                <div className="toggle-thumb">
                    <span className="toggle-icon">{dark ? "🌙" : "☀️"}</span>
                </div>
                <div className="toggle-stars">
                    <span className="star star-1">✦</span>
                    <span className="star star-2">✦</span>
                    <span className="star star-3">✧</span>
                </div>
            </div>
        </button>
    );
}

export default ThemeToggle;
