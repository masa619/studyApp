import { useEffect, useState } from 'react';
import apiClient from '../api/client';
const useAuth = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('accessToken');
            if (token) {
                try {
                    // トークン検証APIを呼び出し
                    await apiClient.post('/token/verify/', { token });
                    setIsAuthenticated(true);
                }
                catch (error) {
                    console.error('Token validation failed', error);
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    setIsAuthenticated(false);
                }
            }
            setLoading(false);
        };
        checkAuth();
        console.log('isAuthenticated:', isAuthenticated, 'loading:', loading);
    }, []);
    return { isAuthenticated, loading };
};
export default useAuth;
