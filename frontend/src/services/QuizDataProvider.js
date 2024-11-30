import { jsx as _jsx } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import apiClient from '../api/client';
const QuizDataProvider = ({ examId, mode = 'normal', subMode = 'sequential', onDataLoaded }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        const fetchData = async () => {
            try {
                // クエリパラメータにexamId, mode, subModeを指定
                const response = await apiClient.get('/quiz/', {
                    params: {
                        examId,
                        mode,
                        subMode
                    }
                });
                if (response.status !== 200) {
                    if (response.status === 404) {
                        throw new Error('指定された条件に一致する問題が見つかりません。');
                    }
                    else if (response.status === 400) {
                        throw new Error('パラメータが無効です。');
                    }
                    else {
                        throw new Error(`HTTPエラー: ${response.status}`);
                    }
                }
                const data = await response.data;
                onDataLoaded(data);
            }
            catch (err) {
                setError(err.message || 'データの取得に失敗しました');
                console.error(err);
            }
            finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [examId, mode, subMode, onDataLoaded]);
    if (loading)
        return (_jsx("div", { className: "flex justify-center items-center h-screen", children: _jsx("p", { className: "text-lg", children: "\u30C7\u30FC\u30BF\u3092\u8AAD\u307F\u8FBC\u307F\u4E2D..." }) }));
    if (error)
        return (_jsx("div", { className: "flex justify-center items-center h-screen", children: _jsx("p", { className: "text-lg text-red-500", children: error }) }));
    return null;
};
export default QuizDataProvider;
