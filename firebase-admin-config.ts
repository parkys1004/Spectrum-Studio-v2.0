import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// API 키 난독화 (Base64 인코딩 적용)
// 봇 스크래핑 등을 방지하기 위해 소스코드 상에서 직접 노출되지 않도록 처리합니다.
const encodedApiKey = "QUl6YVN5QXA5cG5iblU3NDREcS1Va3l3UmgwaFZDbFp3TWVuWFQ4";

const firebaseConfig = {
  apiKey: atob(encodedApiKey),
  authDomain: "gen-lang-client-0979707528.firebaseapp.com",
  projectId: "gen-lang-client-0979707528",
  storageBucket: "gen-lang-client-0979707528.firebasestorage.app",
  messagingSenderId: "523555104282",
  appId: "1:523555104282:web:e8b727b2d14a549d9e93a3"
};

// 별도 이름으로 초기화하여 충돌 방지
const adminApp = initializeApp(firebaseConfig, "admin-system");
export const adminDb = getFirestore(adminApp, "ai-studio-dbbbbaa2-1129-4959-b336-f0af63245a60");
export const auth = getAuth(adminApp);