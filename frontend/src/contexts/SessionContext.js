import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
const SessionContext = createContext(undefined);
export const SessionProvider = ({ children }) => {
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
    return (_jsx(SessionContext.Provider, { value: { isSessionExpired, setSessionExpired }, children: children }));
};
export const useSession = () => {
    const context = useContext(SessionContext);
    if (!context) {
        throw new Error('useSession must be used within a SessionProvider');
    }
    return context;
};
