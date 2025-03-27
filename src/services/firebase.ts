// Import Firebase modules
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA3Synno8cnUkfREqfNfgFHcXMpSoKpsT4",
  authDomain: "vet-emr-react.firebaseapp.com",
  projectId: "vet-emr-react",
  storageBucket: "vet-emr-react.firebasestorage.app",
  messagingSenderId: "65377194607",
  appId: "1:65377194607:web:bd4dfce9a56db5357bf39a",
  measurementId: "G-9VZ89VK3WR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize analytics
const analytics = getAnalytics(app);

// Initialize Firebase authentication
const auth = getAuth(app);

// Initialize Firestore
const db = getFirestore(app);

export { app, analytics, auth, db }; 