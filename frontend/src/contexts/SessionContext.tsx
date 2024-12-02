import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Session } from '../types/session'
import auth from '../api/auth';

const SessionContext = createContext<Session | undefined>(undefined);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSessionExpired, setSessionExpired] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleSessionExpired = () => {
      if (!isSessionExpired) {
        setSessionExpired(true);
        alert('セッションが期限切れです。再度ログインしてください。');
        navigate('/');
      }
    };

    // sessionExpiredイベントをリッスン
    const eventListener = () => handleSessionExpired();
    document.addEventListener('sessionExpired', eventListener);

    return () => {
      // クリーンアップ: イベントリスナーを解除
      document.removeEventListener('sessionExpired', eventListener);
    };
  }, [isSessionExpired, navigate]);

  return (
    <SessionContext.Provider value={{ isSessionExpired, setSessionExpired }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};