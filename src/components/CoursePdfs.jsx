import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

function CoursePdfs({ courseId }) {
    const [pdfs, setPdfs] = useState([]);

    useEffect(() => {
        const load = async () => {
            const snap = await getDocs(collection(db, "course_pdfs"));

            const filtered = snap.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .filter(p => p.courseId === courseId);

            setPdfs(filtered);
        };

        load();
    }, [courseId]);

    return (
        <div style={{ marginTop: "1rem", borderTop: "3px dashed var(--border-color)", paddingTop: "1rem" }}>
            <h3 style={{ fontSize: "1.2rem", fontWeight: "700", marginBottom: "1rem" }}>📄 Course Materials</h3>

            {pdfs.length === 0 && <p style={{ fontWeight: "500" }}>No PDFs uploaded yet. Check back soon!</p>}

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {pdfs.map(pdf => (
                    <div key={pdf.id} style={{ display: "flex" }}>
                        <a
                            href={pdf.content}
                            target="_blank"
                            className="btn"
                            style={{ background: "#fff", fontSize: "0.9rem", padding: "0.5rem 1rem", textTransform: "none" }}
                        >
                            📥 {pdf.title}
                        </a>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default CoursePdfs;