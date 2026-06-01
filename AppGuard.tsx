import React, { useState, useEffect, ReactNode } from 'react';
import { adminDb, auth } from './firebase-admin-config';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export default function AppGuard({ children }: { children: ReactNode }) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [detectedEmail, setDetectedEmail] = useState('');
  const [inputPw, setInputPw] = useState('');
  const [correctPw, setCorrectPw] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Firebase Auth 상태 감시 (기존 로그인 세션 확인)
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email) {
        setDetectedEmail(user.email);
        if (user.email === 'aimaster1004@gmail.com') {
          setIsAuthorized(true);
          localStorage.setItem('app_access_token', 'true');
          localStorage.setItem('user_email', user.email);
        }
      }
    });

    const initGuard = async () => {
      try {
        // 2. 주소창 파라미터(?u=) 및 localStorage 확인
        const params = new URLSearchParams(window.location.search);
        const emailParam = params.get('u');
        const savedEmail = localStorage.getItem('user_email');
        const savedAuth = localStorage.getItem('app_access_token');

        const currentEmail = emailParam ? decodeURIComponent(emailParam).trim() : savedEmail;
        if (currentEmail) setDetectedEmail(currentEmail);

        // 3. 서버에서 마스터 비밀번호 로드 (관리자 수동 입장용 대비)
        try {
          const docRef = doc(adminDb, "config", "globalConfig");
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setCorrectPw(docSnap.data().currentPassword);
          }
        } catch (pwErr) {
          console.warn("비밀번호 로드 실패:", pwErr);
        }

        // 4. 자동 접속 로직
        if (currentEmail) {
          // 운영자 계정은 즉시 통과
          if (currentEmail === 'aimaster1004@gmail.com') {
            setIsAuthorized(true);
            localStorage.setItem('app_access_token', 'true');
            localStorage.setItem('user_email', currentEmail);
            setLoading(false);
            return;
          }

          // 일반 사용자는 DB 체크 (비번 없이 자동 접속 허용)
          try {
            const usersRef = collection(adminDb, "users");
            const q = query(usersRef, where("email", "==", currentEmail));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
              const userData = querySnapshot.docs[0].data();
              const now = new Date();
              const expiryDate = new Date(userData.subscriptionEndDate || "1970-01-01");

              // 이용 기간 내에 있거나 강제 관리자 모드인 경우 통과
              if (now <= expiryDate || userData.role === 'admin') {
                setIsAuthorized(true);
                localStorage.setItem('app_access_token', 'true');
                localStorage.setItem('user_email', currentEmail);
              }
            }
          } catch (dbErr) {
            console.error("DB 인증 조회 오류:", dbErr);
          }
        }
      } catch (e) {
        console.error("가드 초기화 오류:", e);
      } finally {
        setLoading(false);
      }
    };

    initGuard();
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    if (!detectedEmail) {
      alert("이메일 정보가 없습니다.");
      return;
    }

    // 운영자 직통 비번
    if (detectedEmail === 'aimaster1004@gmail.com') {
      setIsAuthorized(true);
      localStorage.setItem('app_access_token', 'true');
      localStorage.setItem('user_email', detectedEmail);
      return;
    }

    if (inputPw === correctPw && correctPw !== '') {
      setIsAuthorized(true);
      localStorage.setItem('app_access_token', 'true');
      localStorage.setItem('user_email', detectedEmail);
      return;
    }

    alert("인증 정보가 일치하지 않습니다.");
  };

  if (loading) return <div style={containerStyle}><div className="spinner"></div></div>;

  if (!isAuthorized) {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={{fontSize: '40px', marginBottom: '10px'}}>👤</div>
          <h2 style={titleStyle}>ACCESS DENIED</h2>
          <p style={subtitleStyle}>
            {detectedEmail ? (
              <>
                <strong>{detectedEmail}</strong><br/>
                가입 정보를 찾을 수 없거나 만료되었습니다.
              </>
            ) : "접속 정보가 없습니다."}
          </p>
         
          {detectedEmail ? (
            <>
              <input
                type="password"
                value={inputPw}
                onChange={(e) => setInputPw(e.target.value)}
                placeholder="마스터 비밀번호 입력 (필요시)"
                style={inputStyle}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
              <button onClick={handleLogin} style={buttonStyle}>수동 입장</button>
              <button 
                onClick={() => window.location.href = "https://bang-guseog.com"}
                style={{...buttonStyle, backgroundColor: '#333', marginTop: '10px'}}
              >
                본점에서 회원가입/갱신
              </button>
            </>
          ) : (
            <button
              onClick={() => window.location.href = "https://bang-guseog.com"}
              style={buttonStyle}
            >
              본점에서 로그인 후 다시 오기
            </button>
          )}
        </div>
        <style>{`
          .spinner { width: 40px; height: 40px; border: 4px solid #333; border-top: 4px solid #007bff; border-radius: 50%; animation: spin 1s linear infinite; }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  return <>{children}</>;
}

// 스타일 정의 (어두운 테마)
const containerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#121212', color: '#fff', fontFamily: 'sans-serif' };
const cardStyle: React.CSSProperties = { padding: '40px', backgroundColor: '#1e1e1e', borderRadius: '24px', textAlign: 'center', width: '90%', maxWidth: '380px', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' };
const titleStyle: React.CSSProperties = { fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' };
const subtitleStyle: React.CSSProperties = { fontSize: '15px', color: '#aaa', marginBottom: '30px' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #333', backgroundColor: '#2a2a2a', color: '#fff', fontSize: '16px', marginBottom: '15px', boxSizing: 'border-box', textAlign: 'center' };
const buttonStyle: React.CSSProperties = { width: '100%', padding: '14px', borderRadius: '12px', border: 'none', backgroundColor: '#007bff', color: '#fff', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' };
