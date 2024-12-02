import { jsx as _jsx } from "react/jsx-runtime";
import QuizContainer from '@/components/features/learning/Quiz/QuizContainer';
import { colors } from '@/styles/colors';
const QuizPage = () => (_jsx("div", { className: `min-h-screen bg-[${colors.background.default}]`, children: _jsx(QuizContainer, {}) }));
export default QuizPage;
