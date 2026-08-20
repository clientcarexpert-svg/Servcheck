import { useAuth } from "@/lib/AuthContext";
import { Navigate } from "react-router-dom";

/**
 * RoleGuard — enforces role-based access at the route level.
 * allowed: array of roles permitted (e.g. ['user'], ['mechanic'], ['dealer'])
 * Admins always pass through.
 * If user's role is not in allowed, they are redirected to their correct portal.
 */

export function getHomeForRole(role) {
  if (role === "mechanic" || role === "mobile_mechanic") return "/mechanic-portal";
  if (role === "admin") return "/admin";
  return "/";
}

export default function RoleGuard({ allowed, children }) {
  const { user, isLoadingAuth } = useAuth();

  if (isLoadingAuth) return null;
  // Guests (not logged in) get sent to home where they can sign up
  if (!user) return <Navigate to="/" replace />;

  const role = user.role || "user";

  // Admins bypass all restrictions
  if (role === "admin") return children;

  if (!allowed.includes(role)) {
    return <Navigate to={getHomeForRole(role)} replace />;
  }

  return children;
}