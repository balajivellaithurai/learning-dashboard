import { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";

function AssignmentUpload({ chapterId }) {

  const [text, setText] = useState("");

  const submit = async () => {

    if (!text) return alert("Enter your answer");

    await addDoc(collection(db, "assignment_submissions"), {
      userId: auth.currentUser.uid,
      chapterId,
      answer: text,
      remark: "",
      createdAt: serverTimestamp()
    });

    alert("Submitted!");
    setText("");
  };

  return (
    <div>
      <textarea
        placeholder="Write your answer..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        style={{ width: "100%", marginBottom: "10px" }}
      />
      <button onClick={submit}>Submit</button>
    </div>
  );
}

export default AssignmentUpload;