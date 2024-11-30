import axios from 'axios';
// エラーメッセージの定義
const errorMessages = {
    400: 'Bad request. Please check your input.',
    401: 'Unauthorized. Please log in again.',
    403: 'You do not have permission to perform this action.',
    404: 'Resource not found.',
    500: 'Internal server error. Please try again later.',
    503: 'Service unavailable. Please try again later.',
};
const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});
// セッション切れ通知用イベント
const sessionExpiredEvent = new Event('sessionExpired');
// リクエストインターセプター
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
});
// レスポンスインターセプター
apiClient.interceptors.response.use((response) => response, // 正常なレスポンスはそのまま返す
async (error) => {
    const status = error.response?.status;
    const originalRequest = error.config;
    if (status && errorMessages[status]) {
        // 標準エラーメッセージを追加
        error.response.data.message = errorMessages[status];
    }
    // 401エラー: トークン更新処理
    if (status === 401 && !originalRequest._retry) {
        console.warn(`AccessToken has expired: ${status}`, error.response?.data);
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
            try {
                console.info('Attempting token refresh...');
                originalRequest._retry = true; // 再試行フラグを設定
                const response = await axios.post(`${apiClient.defaults.baseURL}/token/refresh/`, {
                    refresh: refreshToken,
                });
                // アクセストークン更新
                localStorage.setItem('accessToken', response.data.access);
                originalRequest.headers['Authorization'] = `Bearer ${response.data.access}`;
                return apiClient(originalRequest); // 再リクエスト
            }
            catch (refreshError) {
                if (axios.isAxiosError(refreshError)) {
                    console.error('Token refresh failed:', refreshError.response?.data || refreshError.message);
                }
                else {
                    console.error('An unexpected error occurred during token refresh:', refreshError);
                }
            }
        }
        // リフレッシュトークンも失敗した場合
        console.warn('Session expired. Logging out...');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        document.dispatchEvent(sessionExpiredEvent);
    }
    // 不明なエラーまたは他のエラーの処理
    return Promise.reject(error.response?.data?.message || 'An unexpected error occurred.');
});
export default apiClient;
