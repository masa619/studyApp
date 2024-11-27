import apiClient from './client';

const auth = {
    login: async (username: string, password: string) => {
        const response = await apiClient.post('/token/', { username, password });
        localStorage.setItem('accessToken', response.data.access);
        localStorage.setItem('refreshToken', response.data.refresh);
        return response.data;
    },
    googleLogin: async (googleToken: string) => {
        const response = await apiClient.post('/google-login/', { token: googleToken });
        return response.data;
    },
    logout: async () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
    },
    verify: async () => {
        try {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                throw new Error('Access token is missing.');
            }

            // トークンの検証
            const response = await apiClient.post('/token/verify/', { token });
            return response.data; // トークンが有効ならば正常レスポンス
        } catch (error) {
            // トークンが無効な場合やエラー時
            console.error('Token verification failed:', error);
            throw new Error('Session is invalid or expired.');
        }
    },
};

export default auth;