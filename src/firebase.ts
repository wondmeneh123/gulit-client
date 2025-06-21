// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBzD0dl_IJIuRbE3B-YQ1sTLxH3ZlRqi4M",
  authDomain: "kefira-7e219.firebaseapp.com",
  projectId: "kefira-7e219",
  storageBucket: "kefira-7e219.firebasestorage.app",
  messagingSenderId: "67101442168",
  appId: "1:67101442168:web:45ef5f0b028a037ddfed8d",
  measurementId: "G-QCPD3LH7PT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getFirestore(app)
const auth = getAuth(app)

export {database, auth}