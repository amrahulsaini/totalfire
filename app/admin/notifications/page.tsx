"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useMemo, useState } from "react";

type TournamentOption = {
  id: number;
  match_id: string;
  title: string;
  status: "upcoming" | "active" | "completed" | "cancelled";
  current_players: number;
};

type Banner = {
  type: "success" | "error";
  text: string;
};

type NotificationType = "tournament" | "system" | "wallet" | "withdrawal";

export default function AdminTournamentNotificationsPage() {
  const [token, setToken] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [banner, setBanner] = useState<Banner | null>(null);
  const [tournaments, setTournaments] = useState<TournamentOption[]>([]);
  const [form, setForm] = useState({
    target: "tournament" as "tournament" | "all",
    tournamentId: "",
    title: "",
    message: "",
    type: "tournament" as NotificationType,
  });

  useEffect(() => {
    const storedToken = window.localStorage.getItem("adminToken") ?? "";
    if (!storedToken) {
      window.location.href = "/admin/login";
      return;
    }
    setToken(storedToken);
  }, []);

  useEffect(() => {
    if (!token) return;

    async function loadTournaments() {
      setIsLoading(true);
      setBanner(null);

      try {
        const response = await fetch("/api/admin/tournaments", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 401 || response.status === 403) {
          window.localStorage.removeItem("adminToken");
          window.localStorage.removeItem("adminUser");
          window.location.href = "/admin/login";
          return;
        }

        const data = await response.json();
        if (!response.ok) {
          setBanner({ type: "error", text: data.error ?? "Failed to load tournaments" });
          setTournaments([]);
          return;
        }

        setTournaments((data.tournaments ?? []) as TournamentOption[]);
      } catch {
        setBanner({ type: "error", text: "Failed to load tournaments" });
      } finally {
        setIsLoading(false);
      }
    }

    void loadTournaments();
  }, [token]);

  const filteredTournaments = useMemo(
    () => tournaments.filter((item) => item.status !== "cancelled"),
    [tournaments]
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.title.trim() || !form.message.trim()) {
      setBanner({ type: "error", text: "Title and message are required" });
      return;
    }

    if (form.target === "tournament" && !form.tournamentId) {
      setBanner({ type: "error", text: "Select a tournament or switch target to all users" });
      return;
    }

    setIsSending(true);
    setBanner(null);

    try {
      const response = await fetch("/api/admin/notifications/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          target: form.target,
          tournamentId: Number(form.tournamentId),
          title: form.title.trim(),
          message: form.message.trim(),
          type: form.type,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setBanner({ type: "error", text: data.error ?? "Failed to send notification" });
        return;
      }

      setBanner({
        type: "success",
        text:
          form.target === "all"
            ? `Notification sent to ${Number(data.recipients ?? 0)} users.`
            : `Notification sent to ${Number(data.recipients ?? 0)} joined users.`,
      });
      setForm((current) => ({
        ...current,
        title: "",
        message: "",
      }));
    } catch {
      setBanner({ type: "error", text: "Failed to send notification" });
    } finally {
      setIsSending(false);
    }
  }

  return (
    <main className="min-h-screen p-6 md:p-8" style={{ background: "var(--bg-primary)" }}>
      <div className="mx-auto max-w-4xl space-y-5">
        <header className="rounded-2xl border bg-white px-6 py-5" style={{ borderColor: "var(--border-color)" }}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>
                Send Tournament Notifications
              </h1>
              <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                Send one message to every player who joined a selected tournament.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/admin" className="outline-btn !px-4 !py-2 !text-sm">
                Back To Admin
              </Link>
              <Link href="/admin/modes" className="outline-btn !px-4 !py-2 !text-sm">
                Edit Modes Portal
              </Link>
            </div>
          </div>
        </header>

        {banner && (
          <div
            className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
              banner.type === "success"
                ? "border-green-200 bg-green-50 text-green-700"
                : "border-orange-200 bg-orange-50 text-orange-800"
            }`}
          >
            {banner.text}
          </div>
        )}

        <section className="rounded-2xl border bg-white p-5 md:p-6" style={{ borderColor: "var(--border-color)" }}>
          {isLoading ? (
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Loading tournaments...
            </p>
          ) : filteredTournaments.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              No tournaments available right now.
            </p>
          ) : (
            <form className="grid gap-4" onSubmit={handleSubmit}>
              <label>
                <span className="mb-2 block text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  Send To
                </span>
                <select
                  className="admin-input"
                  value={form.target}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      target: event.target.value as "tournament" | "all",
                    }))
                  }
                >
                  <option value="tournament">Joined users of selected tournament</option>
                  <option value="all">All registered users</option>
                </select>
              </label>

              <label>
                <span className="mb-2 block text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  Tournament
                </span>
                <select
                  className="admin-input"
                  value={form.tournamentId}
                  disabled={form.target === "all"}
                  onChange={(event) => setForm((current) => ({ ...current, tournamentId: event.target.value }))}
                >
                  <option value="">Select a tournament</option>
                  {filteredTournaments.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.match_id} • {item.title} • {item.current_players} joined • {item.status}
                    </option>
                  ))}
                </select>
                {form.target === "all" ? (
                  <p className="mt-2 text-xs" style={{ color: "var(--text-secondary)" }}>
                    Tournament selection is not required in broadcast mode.
                  </p>
                ) : null}
              </label>

              <label>
                <span className="mb-2 block text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  Notification Type
                </span>
                <select
                  className="admin-input"
                  value={form.type}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      type: event.target.value as NotificationType,
                    }))
                  }
                >
                  <option value="tournament">Tournament</option>
                  <option value="system">System</option>
                  <option value="wallet">Wallet</option>
                  <option value="withdrawal">Withdrawal</option>
                </select>
              </label>

              <label>
                <span className="mb-2 block text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  Title
                </span>
                <input
                  className="admin-input"
                  maxLength={120}
                  value={form.title}
                  onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                  placeholder="Example: Match Starts in 10 Minutes"
                />
              </label>

              <label>
                <span className="mb-2 block text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  Message
                </span>
                <textarea
                  className="admin-input min-h-[120px]"
                  maxLength={500}
                  value={form.message}
                  onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
                  placeholder="Type the notification message players should receive."
                />
              </label>

              <div className="flex justify-end">
                <button type="submit" className="fire-btn" disabled={isSending}>
                  {isSending ? "Sending..." : "Send Notification"}
                </button>
              </div>
            </form>
          )}
        </section>
      </div>

      <style jsx global>{`
        .admin-input {
          width: 100%;
          border-radius: 16px;
          border: 1px solid var(--border-color);
          background: white;
          padding: 14px 16px;
          outline: none;
        }
      `}</style>
    </main>
  );
}
