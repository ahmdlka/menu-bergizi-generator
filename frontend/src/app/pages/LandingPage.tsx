import { Link, Navigate } from "react-router";
import { Sparkles, Zap, MessageSquare } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Brand } from "../components/Brand";
import { auth } from "../lib/auth";

export function LandingPage() {
  if (auth.isAuthed()) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-[var(--mbg-bg)] text-[var(--mbg-dark)]">
      <header className="h-16 px-6 md:px-10 flex items-center justify-between border-b border-[var(--mbg-border)] bg-white">
        <Brand size="sm" />
        <div className="flex items-center gap-2">
          <Link to="/login?mode=login">
            <Button variant="ghost" size="sm">Masuk</Button>
          </Link>
          <Link to="/login?mode=register">
            <Button size="sm">Daftar</Button>
          </Link>
        </div>
      </header>

      <main className="px-6 md:px-10 py-16 md:py-24">
        <div className="max-w-3xl mx-auto text-center flex flex-col gap-6 items-center">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--mbg-primary)]/10 text-[var(--mbg-primary)] text-xs">
            <Sparkles size={14} />
            Powered by AI nutrition assistant
          </span>
          <h1 className="text-4xl md:text-5xl leading-tight" style={{ fontWeight: 600 }}>
            Menu Bergizi Generator
          </h1>
          <p className="text-base md:text-lg text-[var(--mbg-muted)] max-w-2xl">
            Susun rencana makan sehat yang dipersonalisasi berdasarkan profil,
            kebutuhan gizi, alergi, dan budget kamu — semua dalam hitungan detik.
            Refine kapan saja lewat chat.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            <Link to="/login?mode=register">
              <Button size="lg">Mulai gratis</Button>
            </Link>
            <Link to="/login?mode=login">
              <Button size="lg" variant="secondary">Masuk ke akun</Button>
            </Link>
          </div>
        </div>

        <div className="max-w-4xl mx-auto mt-16 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Feature
            icon={<Zap size={18} />}
            title="Fast & Specific Mode"
            desc="Pilih cepat pakai data profil, atau isi 3 langkah untuk hasil paling presisi."
          />
          <Feature
            icon={<MessageSquare size={18} />}
            title="Refine via Chat"
            desc="Tidak suka satu menu? Tulis instruksi, AI ubah meal plan-mu langsung."
          />
          <Feature
            icon={<Sparkles size={18} />}
            title="Berbasis Gizi Indonesia"
            desc="Menu lokal, terjangkau, dan disesuaikan kondisi kesehatan kamu."
          />
        </div>
      </main>

      <footer className="text-center text-xs text-[var(--mbg-muted)] py-6">
        © 2026 MBG — Menu Bergizi Generator
      </footer>
    </div>
  );
}

function Feature({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <Card>
      <div className="p-5 flex flex-col gap-2">
        <div className="size-9 rounded-lg bg-[var(--mbg-primary)]/10 text-[var(--mbg-primary)] flex items-center justify-center">
          {icon}
        </div>
        <h3>{title}</h3>
        <p className="text-sm text-[var(--mbg-muted)]">{desc}</p>
      </div>
    </Card>
  );
}
