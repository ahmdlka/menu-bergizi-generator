import { Navigate } from "react-router";
import { auth } from "../lib/auth";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  if (!auth.isAuthed()) return <Navigate to="/" replace />;
  return <>{children}</>;
}
