import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: "bratcode.firebaseapp.com",
    projectId: "bratcode",
    storageBucket: "bratcode.firebasestorage.app",
    messagingSenderId: "845221617038",
    appId: "1:845221617038:web:dc0770df6495547b52d8df",
    measurementId: "G-5NHTMM4MQN",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
