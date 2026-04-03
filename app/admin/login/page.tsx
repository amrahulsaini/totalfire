"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, LockKeyhole, UserRound, ArrowRight } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [login, setLogin] = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const storedToken = window.localStorage.getItem("adminToken");
    if (storedToken) {
      router.replace("/admin");
    }
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ login, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Login failed");
        return;
      }

      if (data.user?.role !== "admin") {
        setError("This account does not have admin access");
        return;
      }

      window.localStorage.setItem("adminToken", data.token);
      window.localStorage.setItem("adminUser", JSON.stringify(data.user));
      router.replace("/admin");
    } catch {
      setError("Unable to reach the server right now");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "var(--bg-primary)" }}>
      <div className="absolute inset-0 opacity-80" style={{ background: "radial-gradient(circle at top left, rgba(230,57,70,0.12), transparent 35%), radial-gradient(circle at bottom right, rgba(29,53,87,0.12), transparent 35%)" }} />
      <div className="relative min-h-screen flex items-center justify-center px-4 py-12">
        <div className="grid w-full max-w-6xl gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-[28px] p-8 md:p-10 text-white" style={{ background: "linear-gradient(135deg, #1d3557 0%, #274c77 55%, #e63946 100%)", boxShadow: "0 30px 70px rgba(29,53,87,0.24)" }}>
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold" style={{ background: "rgba(255,255,255,0.14)" }}>
              <Shield size={16} />
              TotalFire Admin Control Room
            </div>
            <h1 className="mt-8 text-4xl md:text-5xl font-black leading-tight">
              Launch matches, publish rooms, and settle rewards from one place.
            </h1>
            <p className="mt-5 max-w-2xl text-base md:text-lg text-white/80 leading-8">
              This panel is for tournament operations only. Create default matches, update room IDs five minutes before kickoff, manage wallet balances, and post kill-based results after each game.
            </p>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.12)" }}>
                <p className="text-sm text-white/70">Upcoming Control</p>
                <p className="mt-2 text-2xl font-extrabold">8 Modes</p>
                <p className="mt-1 text-sm text-white/70">Seeded and editable</p>
              </div>
              <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.12)" }}>
                <p className="text-sm text-white/70">Room Release</p>
                <p className="mt-2 text-2xl font-extrabold">T-5 Min</p>
                <p className="mt-1 text-sm text-white/70">Auto-hidden until needed</p>
              </div>
              <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.12)" }}>
                <p className="text-sm text-white/70">Reward Settlement</p>
                <p className="mt-2 text-2xl font-extrabold">Kills + Wins</p>
                <p className="mt-1 text-sm text-white/70">Wallet credited automatically</p>
              </div>
            </div>
          </section>

          <section className="glass-card p-8 md:p-10 self-center">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: "rgba(230,57,70,0.12)", color: "var(--accent-primary)" }}>
              <LockKeyhole size={26} />
            </div>
            <h2 className="mt-6 text-3xl font-black" style={{ color: "var(--text-primary)" }}>
              Admin Login
            </h2>
            <p className="mt-2 text-sm leading-6" style={{ color: "var(--text-secondary)" }}>
              Use the admin account configured in your database. Default username is admin if you seeded the schema that way.
            </p>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  Username or Email
                </span>
                <div className="relative">
                  <UserRound className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2" size={18} style={{ color: "var(--text-muted)" }} />
                  <input
                    className="w-full rounded-2xl border px-12 py-4 outline-none"
                    style={{ borderColor: "var(--border-color)", background: "white" }}
                    value={login}
                    onChange={(event) => setLogin(event.target.value)}
                    placeholder="admin"
                    autoComplete="username"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  Password
                </span>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2" size={18} style={{ color: "var(--text-muted)" }} />
                  <input
                    className="w-full rounded-2xl border px-12 py-4 outline-none"
                    style={{ borderColor: "var(--border-color)", background: "white" }}
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />
                </div>
              </label>

              {error ? (
                <div className="rounded-2xl border px-4 py-3 text-sm font-medium" style={{ borderColor: "rgba(230,57,70,0.24)", background: "rgba(230,57,70,0.08)", color: "var(--accent-primary)" }}>
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                className="fire-btn w-full justify-center text-base"
                disabled={isLoading}
              >
                {isLoading ? "Signing In..." : "Open Admin Panel"}
                <ArrowRight size={18} />
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
