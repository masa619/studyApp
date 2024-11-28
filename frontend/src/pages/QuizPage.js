import { jsx as _jsx } from "react/jsx-runtime";
import QuizContainer from '../components/QuizContainer';
import styles from '../styles/Quiz.module.css';
const QuizPage = () => (_jsx("div", { className: `min-h-screen ${styles.background}`, children: _jsx(QuizContainer, {}) }));
export default QuizPage;
