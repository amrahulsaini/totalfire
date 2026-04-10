"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useMemo, useState } from "react";

type ModeCategory = "br" | "cs" | "lw" | "hs";

type RewardRow = {
  label: string;
  value: string;
};

type ModeRecord = {
  id: number;
  title: string;
  slug: string;
  image: string;
  appImage: string;
  category: ModeCategory;
  players: string;
  maxPlayers: number;
  teamSize: number;
  entryFee: number;
  perKill: number | null;
  prizePool: number | null;
  winPrize: string | null;
  fullDescription: string;
  rules: string[];
  rewardBreakdown: RewardRow[];
  sortOrder: number;
  isActive: boolean;
};

type Banner = {
  type: "success" | "error";
  text: string;
};

type ModeForm = {
  id: number;
  title: string;
  slug: string;
  image: string;
  appImage: string;
  category: ModeCategory;
  players: string;
  maxPlayers: number;
  teamSize: number;
  entryFee: number;
  perKill: string;
  prizePool: string;
  winPrize: string;
  fullDescription: string;
  rulesText: string;
  rewardText: string;
  sortOrder: number;
  isActive: boolean;
};

function modeToForm(mode: ModeRecord): ModeForm {
  return {
    id: mode.id,
    title: mode.title,
    slug: mode.slug,
    image: mode.image,
    appImage: mode.appImage,
    category: mode.category,
    players: mode.players,
    maxPlayers: mode.maxPlayers,
    teamSize: mode.teamSize,
    entryFee: mode.entryFee,
    perKill: mode.perKill == null ? "" : String(mode.perKill),
    prizePool: mode.prizePool == null ? "" : String(mode.prizePool),
    winPrize: mode.winPrize ?? "",
    fullDescription: mode.fullDescription,
    rulesText: mode.rules.join("\n"),
    rewardText: mode.rewardBreakdown.map((item) => `${item.label}|${item.value}`).join("\n"),
    sortOrder: mode.sortOrder,
    isActive: mode.isActive,
  };
}

export default function AdminModesPage() {
  const [token, setToken] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [banner, setBanner] = useState<Banner | null>(null);
  const [modes, setModes] = useState<ModeRecord[]>([]);
  const [selectedId, setSelectedId] = useState(0);
  const [form, setForm] = useState<ModeForm | null>(null);

  useEffect(() => {
    const storedToken = window.localStorage.getItem("adminToken") ?? "";
    if (!storedToken) {
      window.location.href = "/admin/login";
      return;
    }
    setToken(storedToken);
  }, []);

  async function loadModes(authToken: string, preferredId?: number) {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/modes", {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (response.status === 401 || response.status === 403) {
        window.localStorage.removeItem("adminToken");
        window.localStorage.removeItem("adminUser");
        window.location.href = "/admin/login";
        return;
      }

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setBanner({ type: "error", text: data.error ?? "Failed to load modes" });
        setModes([]);
        return;
      }

      const list = (data.modes ?? []) as ModeRecord[];
      setModes(list);

      const modeToSelect =
        list.find((item) => item.id === preferredId) ??
        list.find((item) => item.id === selectedId) ??
        list[0];

      if (modeToSelect) {
        setSelectedId(modeToSelect.id);
        setForm(modeToForm(modeToSelect));
      } else {
        setSelectedId(0);
        setForm(null);
      }
    } catch {
      setBanner({ type: "error", text: "Failed to load modes" });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!token) return;
    void loadModes(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const selectedMode = useMemo(
    () => modes.find((mode) => mode.id === selectedId) ?? null,
    [modes, selectedId]
  );

  function handleSelectMode(id: number) {
    const mode = modes.find((item) => item.id === id);
    if (!mode) return;
    setSelectedId(id);
    setForm(modeToForm(mode));
    setBanner(null);
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form) return;

    const rules = form.rulesText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const rewardBreakdown = form.rewardText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const pipeIndex = line.indexOf("|");
        if (pipeIndex < 1) {
          return null;
        }
        const label = line.slice(0, pipeIndex).trim();
        const value = line.slice(pipeIndex + 1).trim();
        if (!label || !value) {
          return null;
        }
        return { label, value };
      })
      .filter((item): item is RewardRow => Boolean(item));

    if (rules.length === 0) {
      setBanner({ type: "error", text: "Rules are required. Add one rule per line." });
      return;
    }
    if (rewardBreakdown.length === 0) {
      setBanner({
        type: "error",
        text: "Reward breakdown is required. Use format: Label|Value on each line.",
      });
      return;
    }

    setIsSaving(true);
    setBanner(null);

    try {
      const response = await fetch("/api/admin/modes", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: form.id,
          title: form.title,
          slug: form.slug,
          image: form.image,
          appImage: form.appImage,
          category: form.category,
          players: form.players,
          maxPlayers: Number(form.maxPlayers),
          teamSize: Number(form.teamSize),
          entryFee: Number(form.entryFee),
          perKill: form.perKill.trim() === "" ? null : Number(form.perKill),
          prizePool: form.prizePool.trim() === "" ? null : Number(form.prizePool),
          winPrize: form.winPrize.trim() === "" ? null : form.winPrize.trim(),
          fullDescription: form.fullDescription,
          rules,
          rewardBreakdown,
          sortOrder: Number(form.sortOrder),
          isActive: form.isActive,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setBanner({ type: "error", text: data.error ?? "Failed to update mode" });
        return;
      }

      setBanner({ type: "success", text: "Mode updated successfully" });
      await loadModes(token, form.id);
    } catch {
      setBanner({ type: "error", text: "Failed to update mode" });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="min-h-screen p-6 md:p-8" style={{ background: "var(--bg-primary)" }}>
      <div className="mx-auto max-w-6xl space-y-5">
        <header className="rounded-2xl border bg-white px-6 py-5" style={{ borderColor: "var(--border-color)" }}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>
                Edit Modes Portal
              </h1>
              <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                Edit mode titles, fees, images, rewards, rules, and status from one place.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/admin" className="outline-btn !px-4 !py-2 !text-sm">
                Back To Admin
              </Link>
              <Link href="/admin/app-update" className="outline-btn !px-4 !py-2 !text-sm">
                App Update Portal
              </Link>
              <Link href="/admin/notifications" className="outline-btn !px-4 !py-2 !text-sm">
                Send Notifications
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
              Loading modes...
            </p>
          ) : modes.length === 0 || form == null ? (
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              No modes found.
            </p>
          ) : (
            <form className="grid gap-4" onSubmit={handleSave}>
              <label>
                <span className="mb-2 block text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  Select Mode
                </span>
                <select
                  className="admin-input"
                  value={selectedId}
                  onChange={(event) => handleSelectMode(Number(event.target.value))}
                >
                  {modes.map((mode) => (
                    <option key={mode.id} value={mode.id}>
                      #{mode.id} • {mode.title} ({mode.slug})
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label>
                  <span className="mb-2 block text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    Title
                  </span>
                  <input
                    className="admin-input"
                    value={form.title}
                    onChange={(event) => setForm((current) => current ? { ...current, title: event.target.value } : current)}
                  />
                </label>

                <label>
                  <span className="mb-2 block text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    Slug
                  </span>
                  <input
                    className="admin-input"
                    value={form.slug}
                    onChange={(event) => setForm((current) => current ? { ...current, slug: event.target.value } : current)}
                  />
                </label>

                <label>
                  <span className="mb-2 block text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    Category
                  </span>
                  <select
                    className="admin-input"
                    value={form.category}
                    onChange={(event) =>
                      setForm((current) =>
                        current ? { ...current, category: event.target.value as ModeCategory } : current
                      )
                    }
                  >
                    <option value="br">Battle Royale</option>
                    <option value="cs">Clash Squad</option>
                    <option value="lw">Lone Wolf</option>
                    <option value="hs">Headshot</option>
                  </select>
                </label>

                <label>
                  <span className="mb-2 block text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    Players Label
                  </span>
                  <input
                    className="admin-input"
                    value={form.players}
                    onChange={(event) => setForm((current) => current ? { ...current, players: event.target.value } : current)}
                  />
                </label>

                <label>
                  <span className="mb-2 block text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    Card Image Path
                  </span>
                  <input
                    className="admin-input"
                    value={form.image}
                    onChange={(event) => setForm((current) => current ? { ...current, image: event.target.value } : current)}
                  />
                </label>

                <label>
                  <span className="mb-2 block text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    App Inside Image Path
                  </span>
                  <input
                    className="admin-input"
                    value={form.appImage}
                    onChange={(event) => setForm((current) => current ? { ...current, appImage: event.target.value } : current)}
                  />
                </label>

                <label>
                  <span className="mb-2 block text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    Max Players
                  </span>
                  <input
                    className="admin-input"
                    type="number"
                    min="1"
                    value={form.maxPlayers}
                    onChange={(event) =>
                      setForm((current) =>
                        current ? { ...current, maxPlayers: Number(event.target.value) } : current
                      )
                    }
                  />
                </label>

                <label>
                  <span className="mb-2 block text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    Team Size
                  </span>
                  <input
                    className="admin-input"
                    type="number"
                    min="1"
                    value={form.teamSize}
                    onChange={(event) =>
                      setForm((current) =>
                        current ? { ...current, teamSize: Number(event.target.value) } : current
                      )
                    }
                  />
                </label>

                <label>
                  <span className="mb-2 block text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    Entry Fee
                  </span>
                  <input
                    className="admin-input"
                    type="number"
                    min="0"
                    value={form.entryFee}
                    onChange={(event) =>
                      setForm((current) =>
                        current ? { ...current, entryFee: Number(event.target.value) } : current
                      )
                    }
                  />
                </label>

                <label>
                  <span className="mb-2 block text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    Per Kill (blank for none)
                  </span>
                  <input
                    className="admin-input"
                    type="number"
                    min="0"
                    value={form.perKill}
                    onChange={(event) =>
                      setForm((current) => current ? { ...current, perKill: event.target.value } : current)
                    }
                  />
                </label>

                <label>
                  <span className="mb-2 block text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    Prize Pool (blank for none)
                  </span>
                  <input
                    className="admin-input"
                    type="number"
                    min="0"
                    value={form.prizePool}
                    onChange={(event) =>
                      setForm((current) => current ? { ...current, prizePool: event.target.value } : current)
                    }
                  />
                </label>

                <label>
                  <span className="mb-2 block text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    Winner Prize Text
                  </span>
                  <input
                    className="admin-input"
                    value={form.winPrize}
                    onChange={(event) => setForm((current) => current ? { ...current, winPrize: event.target.value } : current)}
                  />
                </label>

                <label>
                  <span className="mb-2 block text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    Sort Order
                  </span>
                  <input
                    className="admin-input"
                    type="number"
                    min="1"
                    value={form.sortOrder}
                    onChange={(event) =>
                      setForm((current) =>
                        current ? { ...current, sortOrder: Number(event.target.value) } : current
                      )
                    }
                  />
                </label>
              </div>

              <label>
                <span className="mb-2 block text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  Full Description
                </span>
                <textarea
                  className="admin-input min-h-[100px]"
                  value={form.fullDescription}
                  onChange={(event) =>
                    setForm((current) =>
                      current ? { ...current, fullDescription: event.target.value } : current
                    )
                  }
                />
              </label>

              <label>
                <span className="mb-2 block text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  Rules (one per line)
                </span>
                <textarea
                  className="admin-input min-h-[120px]"
                  value={form.rulesText}
                  onChange={(event) =>
                    setForm((current) => current ? { ...current, rulesText: event.target.value } : current)
                  }
                />
              </label>

              <label>
                <span className="mb-2 block text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  Reward Breakdown (Label|Value per line)
                </span>
                <textarea
                  className="admin-input min-h-[120px]"
                  value={form.rewardText}
                  onChange={(event) =>
                    setForm((current) => current ? { ...current, rewardText: event.target.value } : current)
                  }
                />
              </label>

              <label className="flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) =>
                    setForm((current) => current ? { ...current, isActive: event.target.checked } : current)
                  }
                />
                Mode Active
              </label>

              <div className="flex justify-end">
                <button type="submit" className="fire-btn" disabled={isSaving || selectedMode == null}>
                  {isSaving ? "Saving..." : `Save Mode #${selectedMode?.id ?? ""}`}
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
