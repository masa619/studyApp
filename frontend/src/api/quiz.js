import apiClient from './client';
export const createAnswerLog = async (payload) => {
    try {
        const response = await apiClient.post('/answer-log/', payload);
        return response.data;
    }
    catch (error) {
        console.error('Failed to create AnswerLog:', error);
        throw error; // 呼び出し元にエラーを伝播
    }
};
export default createAnswerLog;
