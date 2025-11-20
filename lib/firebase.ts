import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, enableMultiTabIndexedDbPersistence } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCmWXzxH0NBUPwCThios8d6fnO9kXC_WA0",
  authDomain: "login-fe7a9.firebaseapp.com",
  databaseURL: "https://login-fe7a9-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "login-fe7a9",
  storageBucket: "login-fe7a9.firebasestorage.app",
  messagingSenderId: "131964224567",
  appId: "1:131964224567:web:e24f7fd3518be836c86bb2",
  measurementId: "G-0WHCSSG03C"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

if (typeof window !== 'undefined') {
  enableMultiTabIndexedDbPersistence(db).catch((err) => {
    console.error('Persistence error:', err);
  });
}

export default app;
