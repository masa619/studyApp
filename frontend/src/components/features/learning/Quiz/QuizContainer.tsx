import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import useQuiz from '@/hooks/useQuiz';
import useModal from '@/hooks/useModal';
import Header from '@/components/features/learning/Header';
import ProgressBar from '@/components/features/learning/ProgressBar';
import { QuizContent } from './QuizContent';
import { QuizActions } from './QuizActions';
import Modal from '@/components/features/learning/Modal';
import { QuizDataProvider } from '@/services/QuizDataProvider';
import { Question } from '@/types/question';

const QuizContainer = () => {
  const [questions, setQuestions] = useState<Question[] | null>(null);
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
    return <QuizDataProvider {...location.state} onDataLoaded={setQuestions} />;
  }

  const currentQuestion = questions[quiz.currentQuestionIndex];
  const progress = ((quiz.currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="w-full min-h-screen flex flex-col bg-gray-100">
      <Header
        questionTime={quiz.questionTime}
        isPaused={quiz.isPaused}
        onPauseToggle={quiz.handlePauseToggle}
        onExistsToggle={modal.handleEndQuiz}
      />
      <main className="flex-grow flex justify-center px-4 py-6">
        <div className="max-w-3xl w-full space-y-6">
          <ProgressBar
            progress={progress}
            currentIndex={quiz.currentQuestionIndex}
            totalQuestions={questions.length}
          />
          <QuizContent
            currentQuestion={currentQuestion}
            selectedAnswer={quiz.selectedAnswer}
            setSelectedAnswer={quiz.setSelectedAnswer}
            showResult={quiz.showResult}
            isCorrect={quiz.isCorrect}
            showExplanation={quiz.showExplanation}
          />
          <QuizActions
            showResult={quiz.showResult}
            selectedAnswer={quiz.selectedAnswer}
            onSkip={quiz.handleSkipQuestion}
            onSubmit={() => quiz.handleAnswerSubmit(
              currentQuestion.answer_key,
              currentQuestion.id,
              location.state?.examId
            )}
            onShowExplanation={quiz.handleShowExplanation}
            onNext={quiz.handleNextQuestion}
          />
          <Modal
            isOpen={modal.isModalOpen}
            onClose={modal.closeModal}
            onConfirm={() => {
              modal.closeModal();
              navigate('/select');
            }}
          >
            <p>本当にクイズを終了しますか？</p>
          </Modal>
        </div>
      </main>
    </div>
  );
};

export default QuizContainer; 