import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDdAnPHvkkThK3NSpndcXE00Sz35wZ3_t8",
  authDomain: "nexvault-9d2f1.firebaseapp.com",
  projectId: "nexvault-9d2f1",
  storageBucket: "nexvault-9d2f1.firebasestorage.app",
  messagingSenderId: "1:196693095742:web:c88a692cb570329819286f",
  appId: "G-X92JNJ3135"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
  prompt: 'select_account'
});