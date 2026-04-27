import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAyr6MPBtIQhFCJWVulm7h0v4kbGTy7qVY",
  authDomain: "job-tracker-pro-5a980.firebaseapp.com",
  projectId: "job-tracker-pro-5a980",
  storageBucket: "job-tracker-pro-5a980.firebasestorage.app",
  messagingSenderId: "289812594705",
  appId: "1:289812594705:web:702e90bd1c5e0bd85031b0"
};

// Initialize Firebase only if it hasn't been initialized already
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
