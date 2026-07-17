import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";

if (getApps().length === 0) {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccount) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT env var is not set");
  }
  initializeApp({
    credential: cert(JSON.parse(serviceAccount)),
    storageBucket: "morganengelcom.firebasestorage.app",
  });
}

export const adminDb = getFirestore();
export const adminAuth = getAuth();
export const adminBucket = getStorage().bucket();
