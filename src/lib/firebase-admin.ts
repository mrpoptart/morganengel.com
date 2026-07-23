import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";

// Local emulator mode: opt-in via FIREBASE_EMULATOR=1 (dev/tests only, never on
// Vercel). The Admin SDK auto-routes to the emulators when FIRESTORE_EMULATOR_HOST
// / FIREBASE_AUTH_EMULATOR_HOST / FIREBASE_STORAGE_EMULATOR_HOST are set, and
// needs no real service-account credentials. With the flag unset, this is the
// original production initialization, unchanged.
const useEmulator = process.env.FIREBASE_EMULATOR === "1";

if (getApps().length === 0) {
  if (useEmulator) {
    initializeApp({
      projectId: "demo-morganengelcom",
      storageBucket: "demo-morganengelcom.appspot.com",
    });
  } else {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!serviceAccount) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT env var is not set");
    }
    initializeApp({
      credential: cert(JSON.parse(serviceAccount)),
      storageBucket: "morganengelcom.firebasestorage.app",
    });
  }
}

export const adminDb = getFirestore();
export const adminAuth = getAuth();
export const adminBucket = getStorage().bucket();
