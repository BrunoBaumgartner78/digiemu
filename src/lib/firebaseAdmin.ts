// src/lib/firebaseAdmin.ts
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import type { Bucket } from "@google-cloud/storage";

let _bucket: Bucket | null = null;

function isCi() {
  return process.env.CI === "true" || process.env.GITHUB_ACTIONS === "true";
}

function getBucketName(): string | null {
  return (
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    process.env.FIREBASE_STORAGE_BUCKET ||
    null
  );
}

function canInit() {
  const needed = [
    "FIREBASE_ADMIN_PROJECT_ID",
    "FIREBASE_ADMIN_CLIENT_EMAIL",
    "FIREBASE_ADMIN_PRIVATE_KEY",
  ];
  return needed.every((k) => !!process.env[k]) && !!getBucketName();
}

function makeLazyErrorBucket(message: string): Bucket {
  // Bucket wird im Build/CI nicht wirklich benutzt,
  // aber Next kann Module importieren → wir dürfen hier nicht crashen.
  return new Proxy({} as Bucket, {
    get() {
      throw new Error(message);
    },
  });
}

export function getAdminBucket(): Bucket {
  if (_bucket) return _bucket;

  // ✅ CI: nicht crashen — nur “lazy error” zurückgeben
  if (isCi() && !canInit()) {
    _bucket = makeLazyErrorBucket(
      "Firebase Admin not configured (CI). Missing FIREBASE_ADMIN_* or FIREBASE_STORAGE_BUCKET."
    );
    return _bucket;
  }

  // ✅ Runtime: hier darf es hart fehlschlagen (weil Feature wirklich genutzt wird)
  const bucketName = getBucketName();
  if (!bucketName) {
    throw new Error("Missing NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET (or FIREBASE_STORAGE_BUCKET).");
  }

  if (!process.env.FIREBASE_ADMIN_PROJECT_ID) {
    throw new Error("Missing FIREBASE_ADMIN_PROJECT_ID");
  }
  if (!process.env.FIREBASE_ADMIN_CLIENT_EMAIL) {
    throw new Error("Missing FIREBASE_ADMIN_CLIENT_EMAIL");
  }
  if (!process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
    throw new Error("Missing FIREBASE_ADMIN_PRIVATE_KEY");
  }

  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n"),
      }),
      // ✅ setzt Default-Bucket sauber (optional, aber gut)
      storageBucket: bucketName,
    });
  }

  // ✅ FIX: Bucketname explizit
  _bucket = getStorage().bucket(bucketName);
  return _bucket;
}

// for compatibility:
export const adminBucket = new Proxy({} as Bucket, {
  get(_t, prop) {
    return (getAdminBucket() as any)[prop];
  },
});
