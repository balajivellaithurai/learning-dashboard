import { Navigate } from "react-router-dom";

function ProtectedRoute({ userRole, allowedRole, children }) {
  if (userRole !== allowedRole) {
    return <Navigate to="/" />;
  }

  return children;
}

export default ProtectedRoute;