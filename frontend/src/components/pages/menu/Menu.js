'use client';
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Brain, Clock, GraduationCap, LineChart, LogIn, LogOut } from 'lucide-react';
import { Button } from '../../ui/button';
import { useSession } from '../../../contexts/SessionContext';
import auth from '../../../api/auth';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../../api/client';
export default function LearningMenu() {
    const [activeExam, setActiveExam] = useState(null);
    const [activeModeId, setActiveModeId] = useState(null);
    const { isSessionExpired, setSessionExpired } = useSession();
    const navigate = useNavigate();
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
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
    const handleAuthClick = async () => {
        if (isSessionExpired) {
            navigate('/');
        }
        else {
            await auth.logout();
            setSessionExpired(true);
        }
    };
    const handleModeSelect = (mode, option) => {
        if (!activeExam)
            return;
        if (mode.path) {
            navigate(mode.path, { state: { examId: activeExam, mode: mode.id } });
        }
        else if (option?.path) {
            navigate(option.path, { state: { examId: activeExam, mode: mode.id } });
        }
    };
    const studyModes = [
        {
            id: 'normal',
            title: '通常学習モード',
            options: [
                { id: 'sequential', title: '順番通り', path: '/quiz' },
                { id: 'ai', title: 'AIおすすめ', path: '/study/normal/ai' }
            ]
        },
        {
            id: 'unanswered',
            title: '未解答問題モード',
            options: [
                { id: 'sequential', title: '順番通り', path: '/quiz' },
                { id: 'ai', title: 'AIおすすめ', path: '/study/unanswered/ai' }
            ]
        },
        {
            id: 'exam',
            title: '模擬試験モード',
            path: '/study/exam'
        },
        {
            id: 'progress',
            title: '学習状況',
            path: '/study/progress'
        }
    ];
    const getModeIcon = (modeId) => {
        switch (modeId) {
            case 'normal':
                return Brain;
            case 'unanswered':
                return Clock;
            case 'exam':
                return GraduationCap;
            case 'progress':
                return LineChart;
            default:
                return ChevronRight;
        }
    };
    if (loading) {
        return (_jsx("div", { className: "min-h-screen bg-black text-white flex justify-center items-center", children: _jsx("p", { children: "\u8A66\u9A13\u30C7\u30FC\u30BF\u3092\u8AAD\u307F\u8FBC\u3093\u3067\u3044\u307E\u3059..." }) }));
    }
    return (_jsxs("div", { className: "min-h-screen bg-black text-white", children: [_jsx("div", { className: "fixed top-4 left-4 z-50", children: _jsx(motion.div, { initial: { opacity: 0, y: -20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 }, children: _jsx(Button, { variant: "ghost", size: "small", onClick: handleAuthClick, className: "flex items-center gap-2 hover:bg-gray-800", children: isSessionExpired ? (_jsxs(_Fragment, { children: [_jsx(LogIn, { className: "w-4 h-4" }), "\u30ED\u30B0\u30A4\u30F3"] })) : (_jsxs(_Fragment, { children: [_jsx(LogOut, { className: "w-4 h-4" }), "\u30ED\u30B0\u30A2\u30A6\u30C8"] })) }) }) }), _jsx("div", { className: "flex items-center justify-center p-4", children: _jsxs(motion.div, { className: "w-full max-w-6xl", initial: false, animate: {
                        width: activeExam ? '100%' : 'auto',
                        transition: { duration: 0.5, ease: 'easeInOut' }
                    }, children: [_jsx("h1", { className: "text-3xl font-bold mb-12 text-center", children: "Shipro is always watching you." }), _jsxs(motion.div, { className: "grid gap-8", animate: {
                                gridTemplateColumns: activeExam ? '1fr auto 1fr' : '1fr',
                                transition: { duration: 0.5, ease: 'easeInOut' }
                            }, children: [_jsxs(motion.div, { className: "space-y-4", animate: {
                                        width: activeExam ? '100%' : 'auto',
                                        alignSelf: activeExam ? 'start' : 'center',
                                        transition: { duration: 0.5, ease: 'easeInOut' }
                                    }, style: { maxWidth: '550px' }, children: [_jsx("h2", { className: "text-xl font-semibold mb-6", children: "\u8A66\u9A13\u3092\u9078\u629E" }), exams.map((exam) => (_jsxs(motion.div, { className: `p-4 rounded-lg cursor-pointer relative overflow-hidden ${activeExam === exam.id ? 'bg-gray-800' : 'bg-gray-900'}`, whileHover: { scale: 1.02 }, onClick: () => setActiveExam(exam.id), children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { children: exam.name }), _jsx(ChevronRight, { className: "w-5 h-5" })] }), _jsx(AnimatePresence, { children: activeExam === exam.id && (_jsx(motion.div, { className: "absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-orange-500 to-purple-500", initial: { width: 0 }, animate: { width: '100%' }, exit: { width: 0 }, transition: { duration: 0.3 } })) })] }, exam.id)))] }), _jsx(AnimatePresence, { mode: "wait", children: activeExam && (_jsx(motion.div, { initial: { opacity: 0, height: 0 }, animate: { opacity: 1, height: '100%' }, exit: { opacity: 0, height: 0 }, transition: {
                                            duration: 0.5,
                                            ease: 'easeInOut',
                                            opacity: { duration: 0.3 }
                                        }, className: "hidden md:block w-0.5 bg-gradient-to-b from-orange-500 to-purple-500 self-stretch" })) }), _jsx(AnimatePresence, { children: activeExam && (_jsxs(motion.div, { className: "space-y-4", initial: { opacity: 0, x: 20 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: 20 }, transition: { duration: 0.5, ease: 'easeInOut' }, children: [_jsx("h2", { className: "text-xl font-semibold mb-6", children: "\u30E2\u30FC\u30C9\u3092\u9078\u629E" }), studyModes.map((mode) => {
                                                const Icon = getModeIcon(mode.id);
                                                return (_jsxs(motion.div, { className: `p-4 rounded-lg cursor-pointer relative ${activeModeId === mode.id ? 'bg-gray-800' : 'bg-gray-900'}`, whileHover: { scale: 1.02 }, onClick: () => setActiveModeId(mode.id), children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Icon, { className: "w-5 h-5" }), _jsx("span", { children: mode.title })] }), _jsx(AnimatePresence, { children: activeModeId === mode.id && mode.options && (_jsx(motion.div, { className: "mt-4 ml-8 space-y-2", initial: { opacity: 0, height: 0 }, animate: { opacity: 1, height: 'auto' }, exit: { opacity: 0, height: 0 }, transition: { duration: 0.3 }, children: mode.options.map((option) => (_jsx(motion.div, { initial: { opacity: 0, x: -10 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -10 }, transition: { duration: 0.2 }, children: _jsx(Button, { variant: "ghost", className: "w-full justify-start", onClick: () => handleModeSelect(mode, option), children: option.title }) }, option.id))) })) })] }, mode.id));
                                            })] })) })] })] }) })] }));
}
