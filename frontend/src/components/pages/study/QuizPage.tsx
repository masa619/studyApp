import React from 'react';
import QuizContainer from '@/components/features/learning/Quiz/QuizContainer';
import styles from '@/styles/Quiz.module.css';
import { colors } from '@/styles/colors';

const QuizPage = () => (
  <div className={`min-h-screen bg-[${colors.background.default}]`}>
    <QuizContainer />
  </div>
);

export default QuizPage;