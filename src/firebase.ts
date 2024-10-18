import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: "AIzaSyBp9clxULCRv8vvJ0WpxLDhTMDtNtM-wLc",
  authDomain: "clkkappns.firebaseapp.com",
  projectId: "clkkappns",
  storageBucket: "clkkappns.appspot.com",
  messagingSenderId: "869149807740",
  appId: "1:869149807740:web:b7e191ab40e62c40eee5f9",
  measurementId: "G-30QCBNYLZ6"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);

// Add error handling for Firebase initialization
auth.onAuthStateChanged((user) => {
  if (user) {
    console.log('User is signed in');
  } else {
    console.log('No user is signed in');
  }
}, (error) => {
  console.error('Auth state change error:', error);
});