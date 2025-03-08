// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY, 
  authDomain: "blog-website-cb38f.firebaseapp.com",
  projectId: "blog-website-cb38f",
  storageBucket: "blog-website-cb38f.appspot.com",
  messagingSenderId: "476536488251",
  appId: "1:476536488251:web:279b7c863ed53977ac371e"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);