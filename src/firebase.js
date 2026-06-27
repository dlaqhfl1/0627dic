import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// 웹페이지의 파이어베이스 설정 (비밀 금고에서 가져옵니다)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// 파이어베이스를 우리 앱과 연결합니다.
const app = initializeApp(firebaseConfig);

// 데이터베이스(Firestore) 창고를 쓸 수 있게 준비합니다.
export const db = getFirestore(app);
