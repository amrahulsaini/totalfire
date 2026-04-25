import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { verifyAdmin } from "@/lib/auth";
import { compareVersions, isValidVersionString } from "@/lib/version-utils";

type UpdateRow = RowDataPacket & {
  latest_version: string;
  min_supported_version: string;
  force_update: number;
  title: string;
  message: string;
  download_url: string;
};

function normalizeRow(row: UpdateRow) {
  return {
    latestVersion: String(row.latest_version ?? "1.0.0"),
    minSupportedVersion: String(row.min_supported_version ?? "1.0.0"),
    forceUpdate: Number(row.force_update ?? 0) === 1,
    title: String(row.title ?? "Update Required"),
    message: String(row.message ?? "A new version is available."),
    downloadUrl: String(row.download_url ?? "https://totalfire.in/downloads/totalfire-v1.0.3.apk"),
  };
}

async function getSettingsRow() {
  const [rows] = await pool.query<UpdateRow[]>(
    `SELECT latest_version, min_supported_version, force_update, title, message, download_url
     FROM app_update_settings
     WHERE id = 1
     LIMIT 1`
  );

  if (rows.length > 0) {
    return rows[0];
  }

  await pool.query(
    `INSERT INTO app_update_settings (
      id, latest_version, min_supported_version, force_update, title, message, download_url
    ) VALUES (
      1,
      '1.0.3',
      '1.0.3',
      0,
      'Update Required',
      'A new version of TotalFire is available. Please update to continue.',
      'https://totalfire.in/downloads/totalfire-v1.0.3.apk'
    )
    ON DUPLICATE KEY UPDATE id = id`
  );

  const [retryRows] = await pool.query<UpdateRow[]>(
    `SELECT latest_version, min_supported_version, force_update, title, message, download_url
     FROM app_update_settings
     WHERE id = 1
     LIMIT 1`
  );

  return retryRows[0];
}

export async function GET(request: Request) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const row = await getSettingsRow();
  return NextResponse.json({ settings: normalizeRow(row) });
}

export async function PUT(request: Request) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const payload = await request.json().catch(() => ({}));
  const latestVersion = String(payload.latestVersion ?? "").trim();
  const minSupportedVersion = String(payload.minSupportedVersion ?? "").trim();
  const forceUpdate = Boolean(payload.forceUpdate);
  const title = String(payload.title ?? "").trim().slice(0, 120);
  const message = String(payload.message ?? "").trim().slice(0, 500);
  const downloadUrl = String(payload.downloadUrl ?? "").trim().slice(0, 255);

  if (!isValidVersionString(latestVersion) || !isValidVersionString(minSupportedVersion)) {
    return NextResponse.json(
      { error: "Version must be numeric format like 1.0.0" },
      { status: 400 }
    );
  }

  if (compareVersions(minSupportedVersion, latestVersion) > 0) {
    return NextResponse.json(
      { error: "Minimum supported version cannot be higher than latest version" },
      { status: 400 }
    );
  }

  if (!title || !message) {
    return NextResponse.json(
      { error: "Title and message are required" },
      { status: 400 }
    );
  }

  if (!downloadUrl.startsWith("http://") && !downloadUrl.startsWith("https://")) {
    return NextResponse.json(
      { error: "Download URL must start with http:// or https://" },
      { status: 400 }
    );
  }

  await pool.query(
    `UPDATE app_update_settings
     SET latest_version = ?,
         min_supported_version = ?,
         force_update = ?,
         title = ?,
         message = ?,
         download_url = ?
     WHERE id = 1`,
    [
      latestVersion,
      minSupportedVersion,
      forceUpdate ? 1 : 0,
      title,
      message,
      downloadUrl,
    ]
  );

  const updated = await getSettingsRow();
  return NextResponse.json({
    success: true,
    settings: normalizeRow(updated),
  });
}
