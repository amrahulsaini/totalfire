"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";

type Banner = {
  type: "success" | "error";
  text: string;
};

type UpdateSettings = {
  latestVersion: string;
  minSupportedVersion: string;
  forceUpdate: boolean;
  title: string;
  message: string;
  downloadUrl: string;
};

function buildVersionedApkFileName(version: string) {
  const normalized = version.trim();
  return /^\d+(\.\d+){1,3}$/.test(normalized)
    ? `totalfire-v${normalized}.apk`
    : "";
}

function buildVersionedApkUrl(version: string) {
  const fileName = buildVersionedApkFileName(version);
  return fileName ? `https://totalfire.in/downloads/${fileName}` : "";
}

function getFileNameFromUrl(url: string) {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split("/").filter(Boolean);
    return parts[parts.length - 1] ?? "";
  } catch {
    return "";
  }
}

const DEFAULT_SETTINGS: UpdateSettings = {
  latestVersion: "1.0.2",
  minSupportedVersion: "1.0.2",
  forceUpdate: false,
  title: "Update Required",
  message: "A new version of TotalFire is available. Please update to continue.",
  downloadUrl: "https://totalfire.in/downloads/totalfire-v1.0.2.apk",
};

export default function AdminAppUpdatePage() {
  const [token, setToken] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [banner, setBanner] = useState<Banner | null>(null);
  const [form, setForm] = useState<UpdateSettings>(DEFAULT_SETTINGS);

  const suggestedDownloadUrl = buildVersionedApkUrl(form.latestVersion);
  const suggestedDownloadFileName = buildVersionedApkFileName(form.latestVersion);
  const currentDownloadFileName = getFileNameFromUrl(form.downloadUrl);

  useEffect(() => {
    const storedToken = window.localStorage.getItem("adminToken") ?? "";
    if (!storedToken) {
      window.location.href = "/admin/login";
      return;
    }
    setToken(storedToken);
  }, []);

  useEffect(() => {
    if (!token) {
      return;
    }

    async function loadSettings() {
      setIsLoading(true);
      setBanner(null);

      try {
        const response = await fetch("/api/admin/app-update", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 401 || response.status === 403) {
          window.localStorage.removeItem("adminToken");
          window.localStorage.removeItem("adminUser");
          window.location.href = "/admin/login";
          return;
        }

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          setBanner({ type: "error", text: data.error ?? "Failed to load update settings" });
          return;
        }

        const settings = (data.settings ?? {}) as Partial<UpdateSettings>;
        setForm({
          latestVersion: settings.latestVersion ?? DEFAULT_SETTINGS.latestVersion,
          minSupportedVersion:
            settings.minSupportedVersion ?? DEFAULT_SETTINGS.minSupportedVersion,
          forceUpdate: Boolean(settings.forceUpdate),
          title: settings.title ?? DEFAULT_SETTINGS.title,
          message: settings.message ?? DEFAULT_SETTINGS.message,
          downloadUrl: settings.downloadUrl ?? DEFAULT_SETTINGS.downloadUrl,
        });
      } catch {
        setBanner({ type: "error", text: "Failed to load update settings" });
      } finally {
        setIsLoading(false);
      }
    }

    void loadSettings();
  }, [token]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setBanner(null);

    try {
      const response = await fetch("/api/admin/app-update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setBanner({ type: "error", text: data.error ?? "Failed to save update settings" });
        return;
      }

      const settings = (data.settings ?? {}) as Partial<UpdateSettings>;
      setForm({
        latestVersion: settings.latestVersion ?? form.latestVersion,
        minSupportedVersion: settings.minSupportedVersion ?? form.minSupportedVersion,
        forceUpdate: Boolean(settings.forceUpdate),
        title: settings.title ?? form.title,
        message: settings.message ?? form.message,
        downloadUrl: settings.downloadUrl ?? form.downloadUrl,
      });

      setBanner({ type: "success", text: "Update policy saved successfully" });
    } catch {
      setBanner({ type: "error", text: "Failed to save update settings" });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="min-h-screen p-6 md:p-8" style={{ background: "var(--bg-primary)" }}>
      <div className="mx-auto max-w-4xl space-y-5">
        <header className="rounded-2xl border bg-white px-6 py-5" style={{ borderColor: "var(--border-color)" }}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>
                App Update Portal
              </h1>
              <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                Control minimum supported app version and block old builds instantly.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/admin" className="outline-btn !px-4 !py-2 !text-sm">
                Back To Admin
              </Link>
              <Link href="/admin/notifications" className="outline-btn !px-4 !py-2 !text-sm">
                Notifications
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
              Loading app update settings...
            </p>
          ) : (
            <form className="grid gap-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <label>
                  <span className="mb-2 block text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    Latest Version
                  </span>
                  <input
                    className="admin-input"
                    value={form.latestVersion}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, latestVersion: event.target.value }))
                    }
                    placeholder="1.0.0"
                  />
                </label>

                <label>
                  <span className="mb-2 block text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    Minimum Supported Version
                  </span>
                  <input
                    className="admin-input"
                    value={form.minSupportedVersion}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        minSupportedVersion: event.target.value,
                      }))
                    }
                    placeholder="1.0.0"
                  />
                </label>
              </div>

              <label className="flex items-start gap-3 rounded-xl border p-4" style={{ borderColor: "var(--border-color)" }}>
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={form.forceUpdate}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, forceUpdate: event.target.checked }))
                  }
                />
                <span>
                  <span className="block text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                    Force update for all users below latest version
                  </span>
                  <span className="block text-xs" style={{ color: "var(--text-secondary)" }}>
                    If enabled, every app below Latest Version is blocked. If disabled, only apps below Minimum Supported Version are blocked.
                  </span>
                </span>
              </label>

              <label>
                <span className="mb-2 block text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  Update Title
                </span>
                <input
                  className="admin-input"
                  maxLength={120}
                  value={form.title}
                  onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                  placeholder="Update Required"
                />
              </label>

              <label>
                <span className="mb-2 block text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  Update Message
                </span>
                <textarea
                  className="admin-input min-h-[120px]"
                  maxLength={500}
                  value={form.message}
                  onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
                  placeholder="Please update to continue using TotalFire."
                />
              </label>

              <label>
                <span className="mb-2 block text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  Download URL
                </span>
                <input
                  className="admin-input"
                  value={form.downloadUrl}
                  onChange={(event) => setForm((current) => ({ ...current, downloadUrl: event.target.value }))}
                  placeholder="https://totalfire.in/downloads/totalfire-v1.0.2.apk"
                />
              </label>

              <div className="rounded-xl border p-4" style={{ borderColor: "var(--border-color)" }}>
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>
                  APK Naming Info
                </p>
                <p className="mt-2 text-sm" style={{ color: "var(--text-primary)" }}>
                  Current website APK file: <strong>{currentDownloadFileName || "Not detected"}</strong>
                </p>
                <p className="mt-1 text-sm" style={{ color: "var(--text-primary)" }}>
                  Suggested for latest version: <strong>{suggestedDownloadFileName || "Enter valid latest version"}</strong>
                </p>
                {suggestedDownloadUrl ? (
                  <button
                    type="button"
                    className="outline-btn !mt-3 !px-4 !py-2 !text-sm"
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        downloadUrl: suggestedDownloadUrl,
                      }))
                    }
                  >
                    Use Suggested Versioned URL
                  </button>
                ) : null}
              </div>

              <div className="rounded-xl border p-4" style={{ borderColor: "var(--border-color)" }}>
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>
                  Runtime behavior preview
                </p>
                <ul className="mt-2 space-y-1 text-sm" style={{ color: "var(--text-primary)" }}>
                  <li>Latest version: {form.latestVersion}</li>
                  <li>Minimum supported: {form.minSupportedVersion}</li>
                  <li>APK file shown to users: {currentDownloadFileName || "Not detected"}</li>
                  <li>
                    Policy mode: {form.forceUpdate ? "Strict (block below latest)" : "Flexible (block below minimum supported)"}
                  </li>
                </ul>
              </div>

              <div className="flex justify-end">
                <button type="submit" className="fire-btn" disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Update Policy"}
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
