import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// frontend/src/features/QuizContainer.tsx
import { useState } from 'react';
import { FaForward, FaCheckCircle, FaQuestionCircle, FaPlay } from 'react-icons/fa';
import Header from './Header';
import QuestionCard from './QuestionCard';
import ProgressBar from './ProgressBar';
import ResultAlert from './ResultAlert';
import Explanation from './Explanation';
import QuizDataProvider from '../services/QuizDataProvider';
import { Button } from './ui/button';
import useQuiz from '../hooks/useQuiz';
import useModal from '../hooks/useModal';
import { useLocation, useNavigate } from 'react-router-dom';
import Modal from './Modal';
const QuizContainer = () => {
    const [questions, setQuestions] = useState(null);
    const location = useLocation();
    const navigate = useNavigate();
    const { currentQuestionIndex, selectedAnswer, setSelectedAnswer, showResult, isCorrect, showExplanation, isPaused, questionTime, handleAnswerSubmit, handleNextQuestion, handleSkipQuestion, handleShowExplanation, handlePauseToggle, } = useQuiz(questions);
    const { handleEndQuiz, isModalOpen, openModal, closeModal, } = useModal();
    const { examId, mode, subMode } = location.state || {};
    if (!questions) {
        if (!examId) {
            console.error('examIdが渡されていません。ホーム画面に戻ります。');
            navigate('/', { replace: true });
            return null;
        }
        return (_jsx(QuizDataProvider, { examId: examId, mode: mode, subMode: subMode, onDataLoaded: (data) => setQuestions(data) }));
    }
    const currentQuestion = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
    const handleSubmitClick = () => {
        if (!currentQuestion)
            return;
        // 必要なデータを handleAnswerSubmit に渡す
        handleAnswerSubmit(currentQuestion.answer_key, currentQuestion.id, location.state?.examId // examIdをlocation.stateから取得
        );
    };
    return (_jsxs("div", { className: "w-full min-h-screen flex flex-col bg-gray-100", children: [_jsx(Header, { questionTime: questionTime, isPaused: isPaused, onPauseToggle: handlePauseToggle, onExistsToggle: handleEndQuiz }), _jsx("main", { className: "flex-grow flex justify-center px-4 py-6", children: _jsxs("div", { className: "max-w-3xl w-full space-y-6", children: [_jsx(ProgressBar, { progress: progress, currentIndex: currentQuestionIndex, totalQuestions: questions.length }), showResult && (_jsx(ResultAlert, { isCorrect: isCorrect, correctAnswer: currentQuestion.answer_key || 'N/A', community_vote_distribution: currentQuestion.community_vote_distribution || '' })), showExplanation && (_jsx(Explanation, { explanation: currentQuestion.explanation_ja })), isModalOpen && (_jsx(Modal, { isOpen: isModalOpen, onClose: closeModal, onConfirm: () => {
                                closeModal();
                                navigate('/select'); // トップページに遷移
                            }, children: _jsx("p", { children: "\u672C\u5F53\u306B\u30AF\u30A4\u30BA\u3092\u7D42\u4E86\u3057\u307E\u3059\u304B\uFF1F" }) })), _jsx(QuestionCard, { question: currentQuestion, selectedAnswer: selectedAnswer, setSelectedAnswer: setSelectedAnswer }), _jsx("div", { className: "flex justify-end gap-4", children: !showResult ? (_jsxs(_Fragment, { children: [_jsxs(Button, { onClick: handleSkipQuestion, variant: "destructive", children: [_jsx(FaForward, { className: "mr-2" }), "\u30B9\u30AD\u30C3\u30D7"] }), _jsxs(Button, { onClick: handleSubmitClick, variant: "default", disabled: !selectedAnswer, children: [_jsx(FaCheckCircle, { className: "mr-2" }), "\u56DE\u7B54\u3059\u308B"] })] })) : (_jsxs(_Fragment, { children: [_jsxs(Button, { onClick: handleShowExplanation, variant: "outline", children: [_jsx(FaQuestionCircle, { className: "mr-2" }), "\u89E3\u8AAC\u3092\u898B\u308B"] }), _jsxs(Button, { onClick: handleNextQuestion, variant: "secondary", children: [_jsx(FaPlay, { className: "mr-2" }), "\u6B21\u306E\u554F\u984C\u3078"] })] })) })] }) })] }));
};
export default QuizContainer;
