"use client";

import type { ReactNode } from "react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarClock,
  CircleDollarSign,
  Clock3,
  LogOut,
  RefreshCcw,
  Rocket,
  Save,
  Shield,
  Swords,
  Trophy,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";
import { allModes, type ModeConfig } from "@/lib/modes";

type Banner = {
  type: "success" | "error";
  text: string;
};

type TournamentRecord = {
  id: number;
  match_id: string;
  mode_id: number;
  title: string;
  mode_slug: string;
  category: "br" | "cs" | "lw";
  max_players: number;
  team_size: number;
  entry_fee: number;
  per_kill: number;
  win_prize: string | null;
  prize_pool: number;
  room_id: string | null;
  room_password: string | null;
  start_time: string;
  status: "upcoming" | "active" | "completed" | "cancelled";
  is_active: number;
  current_players: number;
};

type WalletUser = {
  id: number;
  full_name: string;
  username: string;
  email: string;
  balance: number;
};

type TournamentEntry = {
  username: string;
  full_name: string;
  slot_number: number;
  team_number: number | null;
};

type ResultRow = {
  username: string;
  fullName: string;
  slotNumber: number;
  teamNumber: number | null;
  kills: number;
  isWinner: boolean;
};

type CreateTournamentForm = {
  matchId: string;
  modeId: number;
  title: string;
  modeSlug: string;
  category: "br" | "cs" | "lw";
  maxPlayers: number;
  teamSize: number;
  entryFee: number;
  perKill: number;
  winPrize: string;
  prizePool: number;
  startTime: string;
};

type WalletForm = {
  username: string;
  amount: number;
  action: "set" | "add" | "deduct";
};

function toDatetimeLocalInput(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function toSqlDatetime(value: string) {
  return `${value.replace("T", " ")}:00`;
}

function buildCreateForm(mode: ModeConfig): CreateTournamentForm {
  return {
    matchId: `TF-${mode.id}-${Date.now().toString().slice(-6)}`,
    modeId: mode.id,
    title: mode.title,
    modeSlug: mode.slug,
    category: mode.category,
    maxPlayers: mode.maxPlayers,
    teamSize: mode.teamSize,
    entryFee: mode.entryFee,
    perKill: mode.perKill ?? 0,
    winPrize: mode.winPrize ?? "",
    prizePool: mode.prizePool ?? 0,
    startTime: toDatetimeLocalInput(new Date(Date.now() + 2 * 60 * 60 * 1000)),
  };
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [adminName, setAdminName] = useState("Admin");
  const [banner, setBanner] = useState<Banner | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [selectedModeSlug, setSelectedModeSlug] = useState(allModes[0].slug);
  const [createForm, setCreateForm] = useState<CreateTournamentForm>(() =>
    buildCreateForm(allModes[0])
  );
  const [walletForm, setWalletForm] = useState<WalletForm>({
    username: "",
    amount: 0,
    action: "add",
  });
  const [tournaments, setTournaments] = useState<TournamentRecord[]>([]);
  const [users, setUsers] = useState<WalletUser[]>([]);
  const [selectedResultTournamentId, setSelectedResultTournamentId] = useState("");
  const [resultRows, setResultRows] = useState<ResultRow[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    function tick() {
      const now = new Date();
      const opts: Intl.DateTimeFormatOptions = {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      };
      setCurrentTime(now.toLocaleString("en-IN", opts));
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const storedToken = window.localStorage.getItem("adminToken") ?? "";
    const storedUser = window.localStorage.getItem("adminUser");

    if (!storedToken) {
      router.replace("/admin/login");
      return;
    }

    setToken(storedToken);
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser) as { fullName?: string; username?: string };
        setAdminName(parsed.fullName ?? parsed.username ?? "Admin");
      } catch {
        setAdminName("Admin");
      }
    }

    setIsReady(true);
  }, [router]);

  useEffect(() => {
    const mode = allModes.find((item) => item.slug === selectedModeSlug);
    if (!mode) {
      return;
    }
    setCreateForm(buildCreateForm(mode));
  }, [selectedModeSlug]);

  const summary = useMemo(() => {
    const upcoming = tournaments.filter((item) => item.status === "upcoming").length;
    const active = tournaments.filter((item) => item.status === "active").length;
    const completed = tournaments.filter((item) => item.status === "completed").length;
    return { upcoming, active, completed };
  }, [tournaments]);

  const authorizedFetch = useCallback(async (url: string, init?: RequestInit) => {
    const response = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(init?.headers ?? {}),
      },
    });

    const data = await response.json().catch(() => ({}));
    return { response, data };
  }, [token]);

  const loadDashboard = useCallback(async (authToken: string) => {
    setIsBusy(true);
    try {
      const [tournamentResponse, walletResponse] = await Promise.all([
        fetch("/api/admin/tournaments", {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
        fetch("/api/admin/wallet", {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
      ]);

      if (tournamentResponse.status === 403 || walletResponse.status === 401) {
        window.localStorage.removeItem("adminToken");
        window.localStorage.removeItem("adminUser");
        router.replace("/admin/login");
        return;
      }

      const tournamentData = await tournamentResponse.json();
      const walletData = await walletResponse.json();

      setTournaments(tournamentData.tournaments ?? []);
      setUsers(walletData.users ?? []);
    } catch {
      setBanner({ type: "error", text: "Failed to load the admin dashboard" });
    } finally {
      setIsBusy(false);
    }
  }, [router]);

  useEffect(() => {
    if (!isReady || !token) {
      return;
    }

    void loadDashboard(token);
  }, [isReady, loadDashboard, token]);

  async function handleSeedDefaults() {
    setIsBusy(true);
    const { response, data } = await authorizedFetch("/api/admin/seed-defaults", {
      method: "POST",
    });
    setIsBusy(false);

    if (!response.ok) {
      setBanner({ type: "error", text: data.error ?? "Default seeding failed" });
      return;
    }

    setBanner({
      type: "success",
      text: `Default tournaments processed: ${data.created} created, ${data.skipped} skipped`,
    });
    await loadDashboard(token);
  }

  async function handleCreateTournament(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsBusy(true);

    const payload = {
      ...createForm,
      startTime: toSqlDatetime(createForm.startTime),
      winPrize: createForm.winPrize || null,
    };

    const { response, data } = await authorizedFetch("/api/admin/tournaments", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    setIsBusy(false);

    if (!response.ok) {
      setBanner({ type: "error", text: data.error ?? "Could not create tournament" });
      return;
    }

    setBanner({ type: "success", text: "Tournament created successfully" });
    const currentMode = allModes.find((item) => item.slug === selectedModeSlug) ?? allModes[0];
    setCreateForm(buildCreateForm(currentMode));
    await loadDashboard(token);
  }

  async function handleWalletSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsBusy(true);

    const { response, data } = await authorizedFetch("/api/admin/wallet", {
      method: "POST",
      body: JSON.stringify(walletForm),
    });

    setIsBusy(false);

    if (!response.ok) {
      setBanner({ type: "error", text: data.error ?? "Wallet update failed" });
      return;
    }

    setBanner({
      type: "success",
      text: `${walletForm.username} wallet updated. Current balance ₹${data.balance}`,
    });
    setWalletForm({ username: "", amount: 0, action: "add" });
    await loadDashboard(token);
  }

  const loadResultEntries = useCallback(async (tournamentId: string) => {
    if (!tournamentId) {
      setResultRows([]);
      return;
    }

    setLoadingResults(true);
    try {
      const { response, data } = await authorizedFetch(`/api/tournaments/${tournamentId}`);
      if (!response.ok) {
        setBanner({ type: "error", text: data.error ?? "Failed to load tournament entries" });
        setResultRows([]);
        return;
      }

      const entries = (data.entries ?? []) as TournamentEntry[];
      const resultsByUsername = new Map<string, { kills: number; is_winner: number }>(
        (data.results ?? []).map((row: { username: string; kills: number; is_winner: number }) => [
          row.username,
          { kills: row.kills, is_winner: row.is_winner },
        ])
      );

      setResultRows(
        entries.map((entry) => ({
          username: entry.username,
          fullName: entry.full_name,
          slotNumber: entry.slot_number,
          teamNumber: entry.team_number,
          kills: resultsByUsername.get(entry.username)?.kills ?? 0,
          isWinner: Boolean(resultsByUsername.get(entry.username)?.is_winner),
        }))
      );
    } finally {
      setLoadingResults(false);
    }
  }, [authorizedFetch]);

  useEffect(() => {
    if (!selectedResultTournamentId || !token) {
      return;
    }

    void loadResultEntries(selectedResultTournamentId);
  }, [loadResultEntries, selectedResultTournamentId, token]);

  async function handleSubmitResults(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedResultTournamentId) {
      setBanner({ type: "error", text: "Select a tournament before submitting results" });
      return;
    }

    setIsBusy(true);
    const { response, data } = await authorizedFetch("/api/admin/results", {
      method: "POST",
      body: JSON.stringify({
        tournamentId: Number(selectedResultTournamentId),
        results: resultRows.map((row) => ({
          username: row.username,
          kills: Number(row.kills),
          isWinner: row.isWinner,
        })),
      }),
    });
    setIsBusy(false);

    if (!response.ok) {
      setBanner({ type: "error", text: data.error ?? "Result submission failed" });
      return;
    }

    setBanner({ type: "success", text: data.message ?? "Results submitted" });
    await loadDashboard(token);
    await loadResultEntries(selectedResultTournamentId);
  }

  function handleLogout() {
    window.localStorage.removeItem("adminToken");
    window.localStorage.removeItem("adminUser");
    router.replace("/admin/login");
  }

  if (!isReady) {
    return <div className="min-h-screen" style={{ background: "var(--bg-primary)" }} />;
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <header className="rounded-[28px] p-6 md:p-8 text-white" style={{ background: "linear-gradient(135deg, #1d3557 0%, #274c77 50%, #e63946 100%)", boxShadow: "0 30px 70px rgba(29,53,87,0.22)" }}>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold" style={{ background: "rgba(255,255,255,0.14)" }}>
                <Shield size={16} />
                Tournament Operations Panel
              </div>
              <h1 className="mt-5 text-3xl md:text-5xl font-black leading-tight">
                Control matches, rooms, wallets, and rewards.
              </h1>
              <p className="mt-4 max-w-3xl text-sm md:text-base text-white/80 leading-7">
                Logged in as {adminName}. Create tournaments from the predefined TotalFire modes, update room access just before kickoff, credit wallets, and submit post-match kill results.
              </p>
              {currentTime && (
                <div className="mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold" style={{ background: "rgba(255,255,255,0.18)" }}>
                  <Clock3 size={15} />
                  IST: {currentTime}
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              <button className="outline-btn !border-white/50 !text-white hover:!bg-white hover:!text-[var(--accent-blue)]" onClick={() => void loadDashboard(token)}>
                <RefreshCcw size={16} /> Refresh
              </button>
              <button className="fire-btn" onClick={() => void handleSeedDefaults()} disabled={isBusy}>
                <Rocket size={16} /> Seed Defaults
              </button>
              <button className="outline-btn !border-white/50 !text-white hover:!bg-white hover:!text-[var(--accent-blue)]" onClick={handleLogout}>
                <LogOut size={16} /> Logout
              </button>
            </div>
          </div>
        </header>

        {banner ? (
          <div className="rounded-2xl px-5 py-4 text-sm font-semibold" style={{
            background: banner.type === "success" ? "rgba(42,157,143,0.12)" : "rgba(230,57,70,0.1)",
            color: banner.type === "success" ? "var(--accent-green)" : "var(--accent-primary)",
            border: `1px solid ${banner.type === "success" ? "rgba(42,157,143,0.2)" : "rgba(230,57,70,0.2)"}`,
          }}>
            {banner.text}
          </div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={CalendarClock} label="Upcoming" value={String(summary.upcoming)} accent="var(--accent-primary)" />
          <StatCard icon={Clock3} label="Active" value={String(summary.active)} accent="var(--accent-blue)" />
          <StatCard icon={Trophy} label="Completed" value={String(summary.completed)} accent="var(--accent-purple)" />
          <StatCard icon={Users} label="Players" value={String(users.length)} accent="var(--accent-green)" />
        </section>

        <section className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="glass-card p-6 md:p-7">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: "rgba(230,57,70,0.1)", color: "var(--accent-primary)" }}>
                <Swords size={22} />
              </div>
              <div>
                <h2 className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>Create Tournament</h2>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Mode defaults are filled automatically, then you can override any field.</p>
              </div>
            </div>

            <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleCreateTournament}>
              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Mode Template</span>
                <select
                  className="w-full rounded-2xl border bg-white px-4 py-4 outline-none"
                  style={{ borderColor: "var(--border-color)" }}
                  value={selectedModeSlug}
                  onChange={(event) => setSelectedModeSlug(event.target.value)}
                >
                  {allModes.map((mode) => (
                    <option key={mode.slug} value={mode.slug}>{mode.title}</option>
                  ))}
                </select>
              </label>

              <Field label="Match ID">
                <input className="admin-input" value={createForm.matchId} onChange={(event) => setCreateForm((current) => ({ ...current, matchId: event.target.value }))} />
              </Field>
              <Field label="Title">
                <input className="admin-input" value={createForm.title} onChange={(event) => setCreateForm((current) => ({ ...current, title: event.target.value }))} />
              </Field>
              <Field label="Entry Fee">
                <input className="admin-input" type="number" min="0" value={createForm.entryFee} onChange={(event) => setCreateForm((current) => ({ ...current, entryFee: Number(event.target.value) }))} />
              </Field>
              <Field label="Per Kill Reward">
                <input className="admin-input" type="number" min="0" value={createForm.perKill} onChange={(event) => setCreateForm((current) => ({ ...current, perKill: Number(event.target.value) }))} />
              </Field>
              <Field label="Prize Pool">
                <input className="admin-input" type="number" min="0" value={createForm.prizePool} onChange={(event) => setCreateForm((current) => ({ ...current, prizePool: Number(event.target.value) }))} />
              </Field>
              <Field label="Winner Prize Text">
                <input className="admin-input" value={createForm.winPrize} onChange={(event) => setCreateForm((current) => ({ ...current, winPrize: event.target.value }))} placeholder="Optional for BR" />
              </Field>
              <Field label="Max Players">
                <input className="admin-input" type="number" min="1" value={createForm.maxPlayers} onChange={(event) => setCreateForm((current) => ({ ...current, maxPlayers: Number(event.target.value) }))} />
              </Field>
              <Field label="Team Size">
                <input className="admin-input" type="number" min="1" value={createForm.teamSize} onChange={(event) => setCreateForm((current) => ({ ...current, teamSize: Number(event.target.value) }))} />
              </Field>
              <Field label="Start Time" className="md:col-span-2">
                <input className="admin-input" type="datetime-local" value={createForm.startTime} onChange={(event) => setCreateForm((current) => ({ ...current, startTime: event.target.value }))} />
              </Field>

              <div className="md:col-span-2 flex justify-end">
                <button type="submit" className="fire-btn" disabled={isBusy}>
                  <Rocket size={16} /> Create Tournament
                </button>
              </div>
            </form>
          </div>

          <div className="glass-card p-6 md:p-7">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: "rgba(42,157,143,0.12)", color: "var(--accent-green)" }}>
                <Wallet size={22} />
              </div>
              <div>
                <h2 className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>Wallet Control</h2>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Temporary manual wallet management until payment gateway integration is added.</p>
              </div>
            </div>

            <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleWalletSubmit}>
              <Field label="Username" className="md:col-span-2">
                <input className="admin-input" value={walletForm.username} onChange={(event) => setWalletForm((current) => ({ ...current, username: event.target.value }))} placeholder="Enter username" />
              </Field>
              <Field label="Action">
                <select className="admin-input" value={walletForm.action} onChange={(event) => setWalletForm((current) => ({ ...current, action: event.target.value as WalletForm["action"] }))}>
                  <option value="add">Add</option>
                  <option value="set">Set Exact Balance</option>
                  <option value="deduct">Deduct</option>
                </select>
              </Field>
              <Field label="Amount">
                <input className="admin-input" type="number" min="0" value={walletForm.amount} onChange={(event) => setWalletForm((current) => ({ ...current, amount: Number(event.target.value) }))} />
              </Field>
              <div className="md:col-span-2 flex justify-end">
                <button type="submit" className="fire-btn" disabled={isBusy}>
                  <CircleDollarSign size={16} /> Update Wallet
                </button>
              </div>
            </form>

            <div className="mt-6 max-h-[360px] overflow-auto rounded-2xl border" style={{ borderColor: "var(--border-color)" }}>
              <table className="w-full text-left text-sm">
                <thead style={{ background: "rgba(29,53,87,0.05)", color: "var(--text-primary)" }}>
                  <tr>
                    <th className="px-4 py-3 font-semibold">Player</th>
                    <th className="px-4 py-3 font-semibold">Username</th>
                    <th className="px-4 py-3 font-semibold">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-t" style={{ borderColor: "var(--border-color)" }}>
                      <td className="px-4 py-3">{user.full_name}</td>
                      <td className="px-4 py-3">@{user.username}</td>
                      <td className="px-4 py-3 font-bold" style={{ color: "var(--accent-blue)" }}>₹{Number(user.balance).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="glass-card p-6 md:p-7">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: "rgba(29,53,87,0.08)", color: "var(--accent-blue)" }}>
              <CalendarClock size={22} />
            </div>
            <div>
              <h2 className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>Tournament Management</h2>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Edit timings, room credentials, payout values, and lifecycle status for every created match.</p>
            </div>
          </div>

          <div className="mt-6 grid gap-5 xl:grid-cols-2">
            {tournaments.map((tournament) => (
              <TournamentEditorCard
                key={tournament.id}
                token={token}
                tournament={tournament}
                onChanged={() => void loadDashboard(token)}
                onBanner={setBanner}
              />
            ))}
          </div>
        </section>

        <section className="glass-card p-6 md:p-7">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: "rgba(108,71,160,0.08)", color: "var(--accent-purple)" }}>
              <Trophy size={22} />
            </div>
            <div>
              <h2 className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>Results & Reward Settlement</h2>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Select a tournament, enter kills and winners, then credit wallets automatically from the admin side.</p>
            </div>
          </div>

          <div className="mt-6">
            <label className="block max-w-xl">
              <span className="mb-2 block text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Tournament</span>
              <select
                className="admin-input"
                value={selectedResultTournamentId}
                onChange={(event) => setSelectedResultTournamentId(event.target.value)}
              >
                <option value="">Select tournament</option>
                {tournaments.filter((item) => item.status !== "cancelled").map((tournament) => (
                  <option key={tournament.id} value={String(tournament.id)}>
                    {tournament.match_id} • {tournament.title}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <form className="mt-6" onSubmit={handleSubmitResults}>
            {loadingResults ? (
              <div className="rounded-2xl px-5 py-8 text-sm" style={{ background: "rgba(29,53,87,0.05)", color: "var(--text-secondary)" }}>
                Loading tournament entries...
              </div>
            ) : resultRows.length === 0 ? (
              <div className="rounded-2xl px-5 py-8 text-sm" style={{ background: "rgba(29,53,87,0.05)", color: "var(--text-secondary)" }}>
                Select a tournament with joined players to enter results.
              </div>
            ) : (
              <div className="overflow-auto rounded-2xl border" style={{ borderColor: "var(--border-color)" }}>
                <table className="w-full text-left text-sm">
                  <thead style={{ background: "rgba(108,71,160,0.06)", color: "var(--text-primary)" }}>
                    <tr>
                      <th className="px-4 py-3 font-semibold">Player</th>
                      <th className="px-4 py-3 font-semibold">Slot</th>
                      <th className="px-4 py-3 font-semibold">Team</th>
                      <th className="px-4 py-3 font-semibold">Kills</th>
                      <th className="px-4 py-3 font-semibold">Winner</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultRows.map((row, index) => (
                      <tr key={row.username} className="border-t" style={{ borderColor: "var(--border-color)" }}>
                        <td className="px-4 py-3">
                          <div className="font-semibold" style={{ color: "var(--text-primary)" }}>{row.fullName}</div>
                          <div style={{ color: "var(--text-muted)" }}>@{row.username}</div>
                        </td>
                        <td className="px-4 py-3">#{row.slotNumber}</td>
                        <td className="px-4 py-3">{row.teamNumber ? `Team ${row.teamNumber}` : "Solo"}</td>
                        <td className="px-4 py-3">
                          <input
                            className="admin-input max-w-28"
                            type="number"
                            min="0"
                            value={row.kills}
                            onChange={(event) => setResultRows((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, kills: Number(event.target.value) } : item))}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <label className="inline-flex items-center gap-2 font-medium" style={{ color: "var(--text-primary)" }}>
                            <input
                              type="checkbox"
                              checked={row.isWinner}
                              onChange={(event) => setResultRows((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, isWinner: event.target.checked } : item))}
                            />
                            Winner
                          </label>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-5 flex justify-end">
              <button type="submit" className="fire-btn" disabled={isBusy || resultRows.length === 0}>
                <Save size={16} /> Save Results & Credit Wallets
              </button>
            </div>
          </form>
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
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof CalendarClock;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>{label}</p>
          <p className="mt-2 text-3xl font-black" style={{ color: "var(--text-primary)" }}>{value}</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: `${accent}15`, color: accent }}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={className}>
      <span className="mb-2 block text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{label}</span>
      {children}
    </label>
  );
}

function TournamentEditorCard({
  token,
  tournament,
  onChanged,
  onBanner,
}: {
  token: string;
  tournament: TournamentRecord;
  onChanged: () => void;
  onBanner: (banner: Banner | null) => void;
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    title: tournament.title,
    entryFee: String(tournament.entry_fee),
    perKill: String(tournament.per_kill),
    winPrize: tournament.win_prize ?? "",
    prizePool: String(tournament.prize_pool),
    roomId: tournament.room_id ?? "",
    roomPassword: tournament.room_password ?? "",
    status: tournament.status,
    startTime: toDatetimeLocalInput(tournament.start_time),
    maxPlayers: String(tournament.max_players),
    teamSize: String(tournament.team_size),
  });

  async function request(url: string, init: RequestInit) {
    const response = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await response.json().catch(() => ({}));
    return { response, data };
  }

  async function handleSave() {
    setIsSaving(true);
    const { response, data } = await request("/api/admin/tournaments", {
      method: "PUT",
      body: JSON.stringify({
        id: tournament.id,
        title: form.title,
        entryFee: Number(form.entryFee),
        perKill: Number(form.perKill),
        winPrize: form.winPrize || null,
        prizePool: Number(form.prizePool),
        roomId: form.roomId || null,
        roomPassword: form.roomPassword || null,
        status: form.status,
        startTime: toSqlDatetime(form.startTime),
        maxPlayers: Number(form.maxPlayers),
        teamSize: Number(form.teamSize),
      }),
    });
    setIsSaving(false);

    if (!response.ok) {
      onBanner({ type: "error", text: data.error ?? `Failed to update ${tournament.match_id}` });
      return;
    }

    onBanner({ type: "success", text: `${tournament.match_id} updated successfully` });
    onChanged();
  }

  async function handleDeactivate() {
    setIsSaving(true);
    const { response, data } = await request(`/api/admin/tournaments?id=${tournament.id}`, {
      method: "DELETE",
    });
    setIsSaving(false);

    if (!response.ok) {
      onBanner({ type: "error", text: data.error ?? `Failed to deactivate ${tournament.match_id}` });
      return;
    }

    onBanner({ type: "success", text: `${tournament.match_id} deactivated` });
    onChanged();
  }

  return (
    <article className="rounded-[24px] border p-5" style={{ borderColor: "var(--border-color)", background: "rgba(255,255,255,0.82)" }}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold" style={{
            background: tournament.status === "completed" ? "rgba(42,157,143,0.12)" : tournament.status === "active" ? "rgba(29,53,87,0.12)" : tournament.status === "cancelled" ? "rgba(230,57,70,0.12)" : "rgba(244,132,95,0.14)",
            color: tournament.status === "completed" ? "var(--accent-green)" : tournament.status === "active" ? "var(--accent-blue)" : tournament.status === "cancelled" ? "var(--accent-primary)" : "var(--accent-secondary)",
          }}>
            {tournament.status.toUpperCase()}
          </div>
          <h3 className="mt-3 text-xl font-black" style={{ color: "var(--text-primary)" }}>{tournament.match_id}</h3>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{tournament.title}</p>
          <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
            {tournament.current_players}/{tournament.max_players} joined • {tournament.mode_slug}
          </p>
        </div>
        <div className="grid gap-1 text-right text-sm" style={{ color: "var(--text-secondary)" }}>
          <span>Entry ₹{tournament.entry_fee}</span>
          <span>{tournament.team_size > 1 ? `${tournament.team_size} / team` : "Solo slots"}</span>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <input className="admin-input" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Title" />
        <input className="admin-input" type="datetime-local" value={form.startTime} onChange={(event) => setForm((current) => ({ ...current, startTime: event.target.value }))} />
        <input className="admin-input" type="number" min="0" value={form.entryFee} onChange={(event) => setForm((current) => ({ ...current, entryFee: event.target.value }))} placeholder="Entry fee" />
        <input className="admin-input" type="number" min="0" value={form.perKill} onChange={(event) => setForm((current) => ({ ...current, perKill: event.target.value }))} placeholder="Per kill" />
        <input className="admin-input" value={form.winPrize} onChange={(event) => setForm((current) => ({ ...current, winPrize: event.target.value }))} placeholder="Winner prize text" />
        <input className="admin-input" type="number" min="0" value={form.prizePool} onChange={(event) => setForm((current) => ({ ...current, prizePool: event.target.value }))} placeholder="Prize pool" />
        <input className="admin-input" value={form.roomId} onChange={(event) => setForm((current) => ({ ...current, roomId: event.target.value }))} placeholder="Room ID" />
        <input className="admin-input" value={form.roomPassword} onChange={(event) => setForm((current) => ({ ...current, roomPassword: event.target.value }))} placeholder="Room password" />
        <select className="admin-input" value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as TournamentRecord["status"] }))}>
          <option value="upcoming">Upcoming</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <div className="grid grid-cols-2 gap-3">
          <input className="admin-input" type="number" min="1" value={form.maxPlayers} onChange={(event) => setForm((current) => ({ ...current, maxPlayers: event.target.value }))} placeholder="Max players" />
          <input className="admin-input" type="number" min="1" value={form.teamSize} onChange={(event) => setForm((current) => ({ ...current, teamSize: event.target.value }))} placeholder="Team size" />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap justify-end gap-3">
        <button className="outline-btn !px-4 !py-3" onClick={handleDeactivate} disabled={isSaving}>
          <XCircle size={16} /> Deactivate
        </button>
        <button className="fire-btn !px-4 !py-3" onClick={handleSave} disabled={isSaving}>
          <Save size={16} /> Save Changes
        </button>
      </div>
    </article>
  );
}
