import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { ResultAlert } from '@/components/features/learning/ResultAlert';
import { Explanation } from '@/components/features/learning/Explanation/Explanation';
import { QuestionCard } from '@/components/features/learning/Quiz/QuestionCard';
export const QuizContent = ({ currentQuestion, selectedAnswer, setSelectedAnswer, showResult, isCorrect, showExplanation }) => (_jsxs(_Fragment, { children: [showResult && (_jsx(ResultAlert, { isCorrect: isCorrect, correctAnswer: currentQuestion.answer_key || 'N/A', community_vote_distribution: currentQuestion.community_vote_distribution || '' })), showExplanation && (_jsx(Explanation, { explanation: currentQuestion.explanation_ja })), _jsx(QuestionCard, { question: currentQuestion, selectedAnswer: selectedAnswer, setSelectedAnswer: setSelectedAnswer, showResult: showResult })] }));
