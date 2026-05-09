import { Link, NavLink, Outlet, useNavigate, useLocation } from "react-router";
import { useEffect, useState } from "react";
import { Brand } from "./Brand";
import { auth } from "../lib/auth";
import { userApi } from "../lib/api";
import { MOCK_ENABLED } from "../lib/mock";

export function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const [checkingProfile, setCheckingProfile] = useState(true);

  useEffect(() => {
    async function checkProfile() {
      try {
        const me = await userApi.me();
        // If profile is missing mandatory fields, redirect to completion page
        // except if we're already there.
        const isIncomplete = !me.profile || !me.profile.age || !me.profile.gender || !me.profile.weight_kg || !me.profile.height_cm;
        
        if (isIncomplete && location.pathname !== "/complete-profile") {
          navigate("/complete-profile", { replace: true });
        }
      } catch (err) {
        console.error("Failed to check profile", err);
      } finally {
        setCheckingProfile(false);
      }
    }

    checkProfile();
  }, [navigate, location.pathname]);

  function logout() {
    auth.clear();
    navigate("/", { replace: true });
  }

  const linkBase =
    "px-3 h-9 inline-flex items-center rounded-md text-sm transition-colors";
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `${linkBase} ${
      isActive
        ? "bg-[var(--mbg-dark)] text-white"
        : "text-[var(--mbg-dark)] hover:bg-[var(--mbg-bg)]"
    }`;

  if (checkingProfile && location.pathname !== "/complete-profile") {
    return (
      <div className="min-h-screen bg-[var(--mbg-bg)] flex items-center justify-center">
        <p className="text-sm text-[var(--mbg-muted)]">Memeriksa profil...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--mbg-bg)] text-[var(--mbg-dark)] flex flex-col">
      {MOCK_ENABLED && (
        <div className="h-8 bg-[var(--mbg-dark)] text-white text-xs flex items-center justify-center px-4">
          Demo mode aktif — semua data dari mock. Set <code className="mx-1 opacity-80">VITE_MOCK_API=false</code> untuk pakai backend asli.
        </div>
      )}
      <header className="h-14 bg-white border-b border-[var(--mbg-border)] px-6 flex items-center justify-between">
        <Link to="/dashboard">
          <Brand size="sm" />
        </Link>
        <nav className="flex items-center gap-1">
          <NavLink to="/dashboard" end className={linkClass}>
            Dashboard
          </NavLink>
          <NavLink to="/profile" className={linkClass}>
            Profile
          </NavLink>
          <button
            onClick={logout}
            className={`${linkBase} text-[var(--mbg-muted)] hover:text-[var(--mbg-dark)] hover:bg-[var(--mbg-bg)]`}
          >
            Logout
          </button>
        </nav>
      </header>
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}
