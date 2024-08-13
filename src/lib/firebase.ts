// Import the functions you need from the SDKs you need
// import admin from "firebase-admin";
import { getApps, initializeApp, getApp } from "firebase/app";
import { FirebaseOptions } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// import serviceAccount from "../../private/firebase-admin-sdk.json";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig: FirebaseOptions = {
    apiKey: process.env.FIREBASE_API_KEY!,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN!,
    projectId: process.env.FIREBASE_PROJECT_ID!,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET!,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID!,
    appId: process.env.FIREBASE_APP_ID!,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID!,
    databaseURL: process.env.FIREBASE_DATABASE_URL!,
};


// Initialize Firebase
// export const adminApp = admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
//     databaseURL: process.env.FIREBASE_DATABASE_URL!,
// });
export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
// export const analytics = getAnalytics(app);
export const db = getFirestore(app);


