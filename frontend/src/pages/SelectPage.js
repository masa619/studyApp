import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Label } from '../components/ui/label';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../contexts/SessionContext';
import auth from '../api/auth';
import apiClient from '../api/client';
const ExamSelection = () => {
    const [exams, setExams] = useState([]);
    const [selectedExam, setSelectedExam] = useState(null); // Exam型を定義するなら、ここで適用
    const [selectedMode, setSelectedMode] = useState('all');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { setSessionExpired } = useSession();
    useEffect(() => {
        const fetchExams = async () => {
            try {
                const response = await apiClient.get('/exams/');
                setExams(response.data);
                setLoading(false);
            }
            catch (error) {
                console.error('試験データの取得に失敗しました:', error);
                setLoading(false);
            }
        };
        fetchExams();
    }, []);
    const handleStart = () => {
        if (!selectedExam) {
            alert('試験を選択してください');
            return;
        }
        navigate(`/quiz`, { state: { examId: selectedExam.id } });
    };
    const handleLogout = async () => {
        await auth.logout();
        setSessionExpired(true);
        navigate('/');
    };
    if (loading) {
        return (_jsx("div", { className: "min-h-screen flex justify-center items-center", children: _jsx("p", { children: "\u8A66\u9A13\u30C7\u30FC\u30BF\u3092\u8AAD\u307F\u8FBC\u3093\u3067\u3044\u307E\u3059..." }) }));
    }
    return (_jsx("div", { className: "min-h-screen bg-gray-50 py-12 px-4", children: _jsxs("div", { className: "max-w-3xl mx-auto", children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900 mb-8 text-center", children: "Shipro is always watching you." }), _jsxs("div", { className: "space-y-6", children: [_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "\u8A66\u9A13\u3092\u9078\u629E" }) }), _jsx(CardContent, { children: _jsx("div", { className: "grid gap-4", children: exams.map((exam) => (_jsx("div", { className: `p-4 rounded-lg border cursor-pointer transition-colors
                      ${selectedExam?.id === exam.id
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-200 hover:border-blue-300'}`, onClick: () => setSelectedExam(exam), children: _jsx("h3", { className: "font-medium text-gray-900", children: exam.name }) }, exam.id))) }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "\u30E2\u30FC\u30C9\u3092\u9078\u629E" }) }), _jsx(CardContent, { children: _jsx(RadioGroup, { defaultValue: "all", onValueChange: setSelectedMode, className: "space-y-4", children: _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(RadioGroupItem, { value: "all", id: "all" }), _jsx(Label, { htmlFor: "all", className: "font-medium", children: "\u5168\u554F\u30E2\u30FC\u30C9" })] }) }) })] }), _jsxs("div", { className: "flex justify-center space-x-4", children: [_jsx(Button, { onClick: handleStart, className: "px-8 py-3 text-lg bg-blue-600 text-white hover:bg-blue-500 rounded-lg shadow-lg \n                        transition-colors duration-200 focus:ring-2 focus:ring-blue-400 focus:ring-offset-2", disabled: !selectedExam, children: "\u5B66\u7FD2\u3092\u958B\u59CB" }), _jsx(Button, { onClick: handleLogout, className: "px-8 py-3 text-lg bg-red-600 text-white hover:bg-red-500 rounded-lg shadow-lg \n                        transition-colors duration-200 focus:ring-2 focus:ring-red-400 focus:ring-offset-2", children: "\u30ED\u30B0\u30A2\u30A6\u30C8" })] })] })] }) }));
};
export default ExamSelection;
