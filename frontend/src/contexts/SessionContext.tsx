import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Session } from '../types/session'
import auth from '../api/auth';

const SessionContext = createContext<Session | undefined>(undefined);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSessionExpired, setSessionExpired] = useState(false);
  const [token, setToken] = useState<string | undefined>(undefined);
  const navigate = useNavigate();

  useEffect(() => {
    const handleSessionExpired = () => {
      if (!isSessionExpired) {
        setSessionExpired(true);
        alert('Your session has expired. Please log in again.');
        navigate('/'); // グローバルなリダイレクト処理
      }
    };

    // イベントトリガーの登録
    document.addEventListener('sessionExpired', handleSessionExpired);

    // 定期的なAPIチェック（セッション有効性検証をグローバルに一元化）
    const interval = setInterval(async () => {
      try {
        if (!isSessionExpired) {
          const response = await auth.verify()
          if (response.status === 401) {
            handleSessionExpired();
          }
        }
      } catch (error) {
        console.error('Session validation failed', error);
      }
    }, 5 * 60 * 1000); // 1分間隔でチェック

    return () => {
      document.removeEventListener('sessionExpired', handleSessionExpired);
      clearInterval(interval); // リソースクリーンアップ
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