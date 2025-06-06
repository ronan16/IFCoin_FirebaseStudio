// src/lib/firebase/firebase.ts
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, serverTimestamp } from "firebase/firestore";
// Firebase Storage is no longer actively used by the forms, but SDK is part of 'firebase' package.
// import { getStorage } from "firebase/storage"; 

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAMyEMbkvu3tbUR92R7ed2Z5pGoofEqIoI",
  authDomain: "ifcoins-digital.firebaseapp.com",
  projectId: "ifcoins-digital",
  storageBucket: "ifcoins-digital.appspot.com",
  messagingSenderId: "108334824506",
  appId: "1:108334824506:web:a6e637d677ee3000c18903",
  // databaseURL: "https://ifcoins-digital-default-rtdb.firebaseio.com" // Optional
};

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth = getAuth(app);
const db = getFirestore(app);
// const storage = getStorage(app); // Storage initialized but not actively exported for direct form use.

export { app, auth, db, serverTimestamp }; // Removed storage from exports
