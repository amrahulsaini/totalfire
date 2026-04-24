import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";
import { compareVersions, isValidVersionString } from "@/lib/version-utils";

export const dynamic = "force-dynamic";

type UpdateRow = RowDataPacket & {
  latest_version: string;
  min_supported_version: string;
  force_update: number;
  title: string;
  message: string;
  download_url: string;
};

function normalize(row: UpdateRow) {
  return {
    latestVersion: String(row.latest_version ?? "1.0.0"),
    minSupportedVersion: String(row.min_supported_version ?? "1.0.0"),
    forceUpdate: Number(row.force_update ?? 0) === 1,
    title: String(row.title ?? "Update Required"),
    message: String(row.message ?? "A new version is available."),
    downloadUrl: String(row.download_url ?? "https://totalfire.in/downloads/totalfire-v1.0.2.apk"),
  };
}

async function getRow() {
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
      '1.0.2',
      '1.0.2',
      0,
      'Update Required',
      'A new version of TotalFire is available. Please update to continue.',
      'https://totalfire.in/downloads/totalfire-v1.0.2.apk'
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
  const row = await getRow();
  const policy = normalize(row);

  const url = new URL(request.url);
  const installedVersion = String(url.searchParams.get("version") ?? "").trim();
  const hasValidVersion = isValidVersionString(installedVersion);

  const shouldUpdate =
    hasValidVersion && compareVersions(installedVersion, policy.latestVersion) < 0;
  const requiresUpdate = !hasValidVersion
    ? false
    : policy.forceUpdate
      ? shouldUpdate
      : compareVersions(installedVersion, policy.minSupportedVersion) < 0;

  return NextResponse.json({
    ...policy,
    installedVersion: hasValidVersion ? installedVersion : null,
    shouldUpdate,
    requiresUpdate,
    generatedAt: new Date().toISOString(),
  });
}
