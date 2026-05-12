import React from "react";
import { Navigate, Outlet } from "react-router-dom";

// ── Decode JWT payload ────────────────────────────────────────────
const getUser = () => {
  try {
    const token = sessionStorage.getItem("token");
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      sessionStorage.clear();
      return null;
    }
    return payload;
  } catch {
    return null;
  }
};

export default function ProtectedRoute({ children, allowedRoles }) {
  const token = sessionStorage.getItem("token");
  const user  = getUser();

  // ── Not logged in ─────────────────────────────────────────────
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // ── Block pending staff ───────────────────────────────────────
  if (user.status === "pending" || (user.isStaff && user.approved === false)) {
    sessionStorage.clear();
    return (
      <Navigate
        to="/login"
        replace
        state={{
          error: "⏳ Your account is pending admin approval. You will be notified once approved.",
        }}
      />
    );
  }

  // ── Block rejected staff ──────────────────────────────────────
  if (user.status === "rejected") {
    sessionStorage.clear();
    return (
      <Navigate
        to="/login"
        replace
        state={{
          error: "❌ Your staff application was not approved. Please contact the admin.",
        }}
      />
    );
  }

  // ── Block suspended accounts ──────────────────────────────────
  if (user.status === "suspended") {
    sessionStorage.clear();
    return (
      <Navigate
        to="/login"
        replace
        state={{
          error: "⛔ Your account has been suspended. Please contact the administrator.",
        }}
      />
    );
  }

  // ── Role-based access control ─────────────────────────────────
  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(user.role)) {
      if (user.role === "customer") {
        return <Navigate to="/shop" replace />;
      }
      sessionStorage.clear();
      return (
        <Navigate
          to="/login"
          replace
          state={{ error: "🚫 You don't have permission to access that page." }}
        />
      );
    }
  }

  return children ? children : <Outlet />;
}