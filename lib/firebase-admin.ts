import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getMessaging, type Messaging } from "firebase-admin/messaging";
import { existsSync, readFileSync } from "fs";

interface FirebaseServiceAccount {
  project_id: string;
  client_email: string;
  private_key: string;
}

let cachedMessaging: Messaging | null | undefined;

function loadServiceAccountFromPath(): FirebaseServiceAccount | null {
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (!serviceAccountPath || !existsSync(serviceAccountPath)) {
    return null;
  }

  try {
    const raw = readFileSync(serviceAccountPath, "utf8");
    const parsed = JSON.parse(raw) as FirebaseServiceAccount;
    if (!parsed.project_id || !parsed.client_email || !parsed.private_key) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function loadServiceAccountFromEnv(): FirebaseServiceAccount | null {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }

  return {
    project_id: projectId,
    client_email: clientEmail,
    private_key: privateKey,
  };
}

export function getFirebaseMessaging(): Messaging | null {
  if (cachedMessaging !== undefined) {
    return cachedMessaging;
  }

  try {
    const serviceAccount =
      loadServiceAccountFromPath() ?? loadServiceAccountFromEnv();

    if (!serviceAccount) {
      cachedMessaging = null;
      return null;
    }

    if (getApps().length === 0) {
      initializeApp({
        credential: cert({
          projectId: serviceAccount.project_id,
          clientEmail: serviceAccount.client_email,
          privateKey: serviceAccount.private_key,
        }),
        ...(process.env.FIREBASE_STORAGE_BUCKET
          ? { storageBucket: process.env.FIREBASE_STORAGE_BUCKET }
          : {}),
      });
    }

    cachedMessaging = getMessaging();
    return cachedMessaging;
  } catch (error) {
    console.error("Firebase Admin init error:", error);
    cachedMessaging = null;
    return null;
  }
}
