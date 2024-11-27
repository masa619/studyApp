import React from 'react';
import QuizContainer from '../components/QuizContainer';
import styles from '../styles/Quiz.module.css';

const QuizPage = () => (
  <div className={`min-h-screen ${styles.background}`}>
    <QuizContainer />
  </div>
);

export default QuizPage;