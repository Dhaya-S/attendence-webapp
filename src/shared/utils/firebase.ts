import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBnzd38x3CF2f2ccntI6iHLjSGoq4IyqRE",
  authDomain: "attendence-a56dd.firebaseapp.com",
  projectId: "attendence-a56dd",
  storageBucket: "attendence-a56dd.firebasestorage.app",
  messagingSenderId: "128720778231",
  appId: "1:128720778231:web:1b2b550516dc30e5ebf4f2",
  measurementId: "G-SHEWTL71B7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;
const auth = getAuth(app);
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

export { app, analytics, auth, db };
