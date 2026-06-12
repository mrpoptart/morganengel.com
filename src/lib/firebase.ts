import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";

const firebaseConfig = {
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

let analyticsInstance: Analytics | null = null;
export const analytics = isSupported().then((supported) => {
  if (supported) {
    analyticsInstance = getAnalytics(app);
  }
  return analyticsInstance;
});
