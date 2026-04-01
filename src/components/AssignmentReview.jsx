import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc
} from "firebase/firestore";
import { db } from "../firebase";

function AssignmentReview({ chapterId }) {

  const [subs, setSubs] = useState([]);

  const load = async () => {
    const q = query(
      collection(db, "assignment_submissions"),
      where("chapterId", "==", chapterId)
    );

    const snap = await getDocs(q);

    setSubs(snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    })));
  };

  useEffect(() => {
    load();
  }, []);

  const giveRemark = async (id, remark) => {
    await updateDoc(doc(db, "assignment_submissions", id), {
      remark
    });
    load();
  };

  return (
    <div style={{ marginTop: "15px" }}>
      <h4>📊 Submissions</h4>

      {subs.map(s => (
        <div key={s.id} style={{ marginBottom: "15px" }}>
          <p><b>Answer:</b> {s.answer}</p>
          <p><b>Remark:</b> {s.remark || "Pending"}</p>

          <input
            placeholder="Enter remark"
            onBlur={(e) => giveRemark(s.id, e.target.value)}
          />
        </div>
      ))}
    </div>
  );
}

export default AssignmentReview;