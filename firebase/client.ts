// Import the functions you need from the SDKs you need
import { initializeApp,getApp,getApps } from "firebase/app";
import { getAuth } from 'firebase/auth';
import {getFirestore} from "firebase/firestore";
const firebaseConfig = {
  apiKey: "AIzaSyDtkn03jfpDUM-N8zT8C9INzKf392UWW_4",
  authDomain: "prepwise-acda0.firebaseapp.com",
  projectId: "prepwise-acda0",
  storageBucket: "prepwise-acda0.firebasestorage.app",
  messagingSenderId: "1057246062636",
  appId: "1:1057246062636:web:992f3b4b950178db9bc989",
  measurementId: "G-VHFS7SFDCF"
};

// Initialize Firebase
const app = !getApps.length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);