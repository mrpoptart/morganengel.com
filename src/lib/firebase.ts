import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCfmiD99v8zMjSRHyXbnlmPNlFI36uiQEI",
  authDomain: "morganengelcom.firebaseapp.com",
  projectId: "morganengelcom",
  storageBucket: "morganengelcom.firebasestorage.app",
  messagingSenderId: "612418475876",
  appId: "1:612418475876:web:eb73c75a3813a58ab2cc71",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const db = getFirestore(app);
export const auth = getAuth(app);
