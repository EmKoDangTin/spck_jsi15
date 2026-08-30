// Firebase config của project BookBlue
const firebaseConfig = {
  apiKey: "AIzaSyAp-MD7gzwgQV57FdWP6terxua8byJytEw",
  authDomain: "bookblue-1f467.firebaseapp.com",
  projectId: "bookblue-1f467",
  storageBucket: "bookblue-1f467.firebasestorage.app",
  messagingSenderId: "327017133760",
  appId: "1:327017133760:web:84a997f9afec87f9961f25",
  measurementId: "G-H41957XXWC"
};

// Khởi tạo Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    console.log("Firebase initialized successfully.");
}

// Firestore
const db = firebase.firestore();

// Authentication
const auth = firebase.auth();

// Storage
const storage = firebase.storage();