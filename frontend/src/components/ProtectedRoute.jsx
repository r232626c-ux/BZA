import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, allowedRoles }) {
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user) return <Navigate to="/" replace />;

  // Normalize role
  const normalizedRole = user.role.toLowerCase().replace(/_/g, "");

  if (!allowedRoles.includes(normalizedRole)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
