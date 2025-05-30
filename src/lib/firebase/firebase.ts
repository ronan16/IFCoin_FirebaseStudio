// src/lib/firebase/firebase.ts
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAMyEMbkvu3tbUR92R7ed2Z5pGoofEqIoI",
  authDomain: "ifcoins-digital.firebaseapp.com",
  projectId: "ifcoins-digital",
  storageBucket: "ifcoins-digital.appspot.com", // Corrected from firebasestorage.app
  messagingSenderId: "108334824506",
  appId: "1:108334824506:web:a6e637d677ee3000c18903",
  // databaseURL: "https://ifcoins-digital-default-rtdb.firebaseio.com" // Optional: Add if you need to specify RTDB region, otherwise it's derived.
};

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth = getAuth(app);
const database = getDatabase(app); // If you are using Realtime Database

export { app, auth, database };

// Note: Environment variables for Firebase config are generally recommended for security
// and different environments (dev, prod). For this update, I've used the direct values.
// If you want to switch back to using .env.local variables, you can update this file accordingly.
