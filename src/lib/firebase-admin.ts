import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

if (getApps().length === 0) {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccount) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT env var is not set");
  }
  initializeApp({
    credential: cert(JSON.parse(serviceAccount)),
  });
}

export const adminDb = getFirestore();
