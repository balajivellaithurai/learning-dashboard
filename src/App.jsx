import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import StudentDashboard from "./pages/StudentDashboard";
import InstructorDashboard from "./pages/InstructorDashboard";
import PdfViewer from "./pages/PdfViewer";
import CoursePage from "./pages/CoursePage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/student" element={<StudentDashboard />} />
      <Route path="/instructor" element={<InstructorDashboard />} />
      <Route path="/course/:courseId" element={<CoursePage />} />
      <Route path="/pdf/:pdfId" element={<PdfViewer />} />
    </Routes>
  );
}

export default App;