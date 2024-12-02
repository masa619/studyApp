import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Brain, Clock, GraduationCap, LineChart } from 'lucide-react';
export default function LearningMenu() {
    const [activeExam, setActiveExam] = useState(null);
    const [activeModeId, setActiveModeId] = useState(null);
    const exams = [
        "AWS Solutions Architect - Professional",
        "AWS Developer - Associate",
        "AWS SysOps Administrator"
    ];
    const studyModes = [
        {
            id: 'normal',
            title: '通常学習モード',
            options: [
                { id: 'sequential', title: '順番通り', path: '/study/normal/sequential' },
                { id: 'ai', title: 'AIおすすめ', path: '/study/normal/ai' }
            ]
        },
        {
            id: 'unanswered',
            title: '未解答問題モード',
            options: [
                { id: 'sequential', title: '順番通り', path: '/study/unanswered/sequential' },
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
    return (_jsx("div", { className: "min-h-screen bg-black text-white", children: _jsxs("div", { className: "max-w-6xl mx-auto p-8", children: [_jsx("h1", { className: "text-3xl font-bold mb-12 text-center", children: "Shipro is always watching you." }), _jsxs("div", { className: "grid md:grid-cols-[1fr,2px,1fr] gap-8", children: [_jsxs("div", { className: "space-y-4", children: [_jsx("h2", { className: "text-xl font-semibold mb-6", children: "\u8A66\u9A13\u3092\u9078\u629E" }), exams.map((exam) => (_jsxs(motion.div, { className: `p-4 rounded-lg cursor-pointer relative overflow-hidden ${activeExam === exam ? 'bg-gray-800' : 'bg-gray-900'}`, whileHover: { scale: 1.02 }, onClick: () => setActiveExam(exam), children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { children: exam }), _jsx(ChevronRight, { className: "w-5 h-5" })] }), activeExam === exam && (_jsx(motion.div, { className: "absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-orange-500 to-purple-500", initial: { width: 0 }, animate: { width: '100%' }, transition: { duration: 0.3 } }))] }, exam)))] }), _jsx("div", { className: "hidden md:block w-0.5 bg-gradient-to-b from-orange-500 to-purple-500" }), _jsxs("div", { className: "space-y-4", children: [_jsx("h2", { className: "text-xl font-semibold mb-6", children: "\u30E2\u30FC\u30C9\u3092\u9078\u629E" }), _jsx(AnimatePresence, { mode: "wait", children: activeExam && (_jsx(motion.div, { className: "space-y-4", initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -20 }, children: studyModes.map((mode) => {
                                            const Icon = getModeIcon(mode.id);
                                            return (_jsxs(motion.div, { className: `p-4 rounded-lg cursor-pointer relative ${activeModeId === mode.id ? 'bg-gray-800' : 'bg-gray-900'}`, whileHover: { scale: 1.02 }, onClick: () => setActiveModeId(mode.id), children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Icon, { className: "w-5 h-5" }), _jsx("span", { children: mode.title })] }), _jsx(AnimatePresence, { children: activeModeId === mode.id && mode.options && (_jsx(motion.div, { className: "mt-4 ml-8 space-y-2", initial: { opacity: 0, height: 0 }, animate: { opacity: 1, height: 'auto' }, exit: { opacity: 0, height: 0 }, children: mode.options.map((option) => (_jsx(motion.a, { href: option.path, className: "block p-2 rounded hover:bg-gray-700 transition-colors", whileHover: { x: 4 }, children: option.title }, option.id))) })) })] }, mode.id));
                                        }) })) })] })] })] }) }));
}
