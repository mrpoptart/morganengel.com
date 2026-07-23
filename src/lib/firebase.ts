import { initializeApp, getApps } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";

// Local emulator mode: opt-in via NEXT_PUBLIC_FIREBASE_EMULATOR=1 (set only in
// dev and tests, never on Vercel). Runs against a demo-* project so it can
// never reach real Firebase. With the flag unset, everything below is the
// original production config, unchanged.
const useEmulator = process.env.NEXT_PUBLIC_FIREBASE_EMULATOR === "1";

const firebaseConfig = useEmulator
  ? {
      projectId: "demo-morganengelcom",
      apiKey: "demo-api-key",
      authDomain: "localhost",
      storageBucket: "demo-morganengelcom.appspot.com",
    }
  : {
      apiKey: "AIzaSyCfmiD99v8zMjSRHyXbnlmPNlFI36uiQEI",
      authDomain: "morganengelcom.firebaseapp.com",
      projectId: "morganengelcom",
      storageBucket: "morganengelcom.firebasestorage.app",
      messagingSenderId: "612418475876",
      appId: "1:612418475876:web:eb73c75a3813a58ab2cc71",
      measurementId: "G-KTFLW1TM3V",
    };

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

if (useEmulator) {
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectStorageEmulator(storage, "127.0.0.1", 9199);
}

let analyticsInstance: Analytics | null = null;
export const analytics = useEmulator
  ? Promise.resolve(null)
  : isSupported().then((supported) => {
      if (supported) {
        analyticsInstance = getAnalytics(app);
      }
      return analyticsInstance;
    });
