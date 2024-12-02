import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import useQuiz from '@/hooks/useQuiz';
import useModal from '@/hooks/useModal';
import Header from '@/components/features/learning/Header';
import ProgressBar from '@/components/features/learning/ProgressBar';
import { QuizContent } from './QuizContent';
import { QuizActions } from './QuizActions';
import Modal from '@/components/features/learning/Modal';
import { QuizDataProvider } from '@/services/QuizDataProvider';
const QuizContainer = () => {
    const [questions, setQuestions] = useState(null);
    const location = useLocation();
    const navigate = useNavigate();
    const quiz = useQuiz(questions);
    const modal = useModal();
    // 初期化ロジック
    if (!questions) {
        if (!location.state?.examId) {
            navigate('/', { replace: true });
            return null;
        }
        return _jsx(QuizDataProvider, { ...location.state, onDataLoaded: setQuestions });
    }
    const currentQuestion = questions[quiz.currentQuestionIndex];
    const progress = ((quiz.currentQuestionIndex + 1) / questions.length) * 100;
    return (_jsxs("div", { className: "w-full min-h-screen flex flex-col bg-gray-100", children: [_jsx(Header, { questionTime: quiz.questionTime, isPaused: quiz.isPaused, onPauseToggle: quiz.handlePauseToggle, onExistsToggle: modal.handleEndQuiz }), _jsx("main", { className: "flex-grow flex justify-center px-4 py-6", children: _jsxs("div", { className: "max-w-3xl w-full space-y-6", children: [_jsx(ProgressBar, { progress: progress, currentIndex: quiz.currentQuestionIndex, totalQuestions: questions.length }), _jsx(QuizContent, { currentQuestion: currentQuestion, selectedAnswer: quiz.selectedAnswer, setSelectedAnswer: quiz.setSelectedAnswer, showResult: quiz.showResult, isCorrect: quiz.isCorrect, showExplanation: quiz.showExplanation }), _jsx(QuizActions, { showResult: quiz.showResult, selectedAnswer: quiz.selectedAnswer, onSkip: quiz.handleSkipQuestion, onSubmit: () => quiz.handleAnswerSubmit(currentQuestion.answer_key, currentQuestion.id, location.state?.examId), onShowExplanation: quiz.handleShowExplanation, onNext: quiz.handleNextQuestion }), _jsx(Modal, { isOpen: modal.isModalOpen, onClose: modal.closeModal, onConfirm: () => {
                                modal.closeModal();
                                navigate('/select');
                            }, children: _jsx("p", { children: "\u672C\u5F53\u306B\u30AF\u30A4\u30BA\u3092\u7D42\u4E86\u3057\u307E\u3059\u304B\uFF1F" }) })] }) })] }));
};
export default QuizContainer;
