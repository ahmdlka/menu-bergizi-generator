import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router";
import { Button } from "../components/ui/Button";
import { Card, CardBody } from "../components/ui/Card";
import { Input, Field } from "../components/ui/Input";
import { Brand } from "../components/Brand";
import { authApi } from "../lib/api";
import { auth } from "../lib/auth";

type Mode = "login" | "register";

export function AuthPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initialMode: Mode = params.get("mode") === "register" ? "register" : "login";
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res =
        mode === "login"
          ? await authApi.login(email, password)
          : await authApi.register(name, email, password);
      auth.set(res.token);
      
      if (mode === "register") {
        navigate("/complete-profile", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (err: any) {
      setError(err.message ?? "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  const isLogin = mode === "login";

  return (
    <div className="min-h-screen bg-[var(--mbg-bg)] flex items-center justify-center px-4">
      <div className="w-full max-w-md flex flex-col gap-6">
        <div className="flex justify-center">
          <Link to="/"><Brand /></Link>
        </div>

        <Card>
          <CardBody className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <h2>{isLogin ? "Masuk ke akun" : "Buat akun baru"}</h2>
              <p className="text-sm text-[var(--mbg-muted)]">
                {isLogin
                  ? "Lanjutkan menyusun meal plan kamu."
                  : "Mulai susun meal plan personal dalam hitungan detik."}
              </p>
            </div>

            <div className="flex p-1 bg-[var(--mbg-bg)] rounded-lg">
              {(["login", "register"] as Mode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`flex-1 h-8 rounded-md text-sm transition-colors ${
                    mode === m
                      ? "bg-white text-[var(--mbg-dark)] shadow-sm"
                      : "text-[var(--mbg-muted)]"
                  }`}
                >
                  {m === "login" ? "Login" : "Register"}
                </button>
              ))}
            </div>

            <form onSubmit={onSubmit} className="flex flex-col gap-4">
              {!isLogin && (
                <Field label="Nama">
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nama lengkap"
                    required
                  />
                </Field>
              )}
              <Field label="Email">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </Field>
              <Field
                label="Password"
                hint={!isLogin ? "Minimal 8 karakter" : undefined}
              >
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={isLogin ? undefined : 8}
                  required
                />
              </Field>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
                  {error}
                </div>
              )}

              <Button type="submit" disabled={loading}>
                {loading
                  ? "Memproses..."
                  : isLogin
                  ? "Masuk"
                  : "Daftar"}
              </Button>
            </form>

            <div className="text-center text-sm text-[var(--mbg-muted)]">
              {isLogin ? "Belum punya akun?" : "Sudah punya akun?"}{" "}
              <button
                type="button"
                onClick={() => setMode(isLogin ? "register" : "login")}
                className="text-[var(--mbg-primary)] hover:underline"
                style={{ fontWeight: 500 }}
              >
                {isLogin ? "Daftar di sini" : "Masuk"}
              </button>
            </div>
          </CardBody>
        </Card>

        <p className="text-center text-xs text-[var(--mbg-muted)]">
          © 2026 MBG — Makan Bergizi Generator
        </p>
      </div>
    </div>
  );
}
