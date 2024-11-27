// frontend/src/features/QuizContainer.tsx
import React, { useState } from 'react';
import { FaForward, FaCheckCircle, FaQuestionCircle, FaPlay } from 'react-icons/fa';
import Header from './Header';
import QuestionCard from './QuestionCard';
import ProgressBar from './ProgressBar';
import ResultAlert from './ResultAlert';
import Explanation from './Explanation';
import QuizDataProvider from '../services/QuizDataProvider';
import { Question } from '../types/question';
import { Button } from './ui/button';
import useQuiz from '../hooks/useQuiz';
import useModal from '../hooks/useModal';
import { useLocation, useNavigate } from 'react-router-dom';
import Modal from './Modal';

const QuizContainer = () => {
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const {
    currentQuestionIndex,
    selectedAnswer,
    setSelectedAnswer,
    showResult,
    isCorrect,
    showExplanation,
    isPaused,
    questionTime,
    handleAnswerSubmit,
    handleNextQuestion,
    handleSkipQuestion,
    handleShowExplanation,
    handlePauseToggle,
  } = useQuiz(questions);
  const {
    handleEndQuiz,
    isModalOpen,
    openModal,
    closeModal,
  } = useModal();

  const { examId, mode, subMode } = location.state || {};

  if (!questions) {
    if (!examId) {
      console.error('examIdが渡されていません。ホーム画面に戻ります。');
      navigate('/', { replace: true });
      return null;
    }
    return (
      <QuizDataProvider 
        examId={examId}
        mode={mode}
        subMode={subMode}
        onDataLoaded={(data) => setQuestions(data)} 
      />
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const handleSubmitClick = () => {
    if (!currentQuestion) return;

    // 必要なデータを handleAnswerSubmit に渡す
    handleAnswerSubmit(
      currentQuestion.answer_key,
      currentQuestion.id,
      location.state?.examId // examIdをlocation.stateから取得
    );
  };

  return (
    <div className="w-full min-h-screen flex flex-col bg-gray-100">
      <Header
        questionTime={questionTime}
        isPaused={isPaused}
        onPauseToggle={handlePauseToggle}
        onExistsToggle={handleEndQuiz}
      />
      <main className="flex-grow flex justify-center px-4 py-6">
        <div className="max-w-3xl w-full space-y-6">
          <ProgressBar
            progress={progress}
            currentIndex={currentQuestionIndex}
            totalQuestions={questions.length}
          />
          {showResult && (
            <ResultAlert
              isCorrect={isCorrect}
              correctAnswer={currentQuestion.answer_key || 'N/A'}
              community_vote_distribution={currentQuestion.community_vote_distribution || ''}
            />
          )}
          {showExplanation && (
            <Explanation explanation={currentQuestion.explanation_ja} />
          )}
          {/* モーダル表示 */}
          {isModalOpen && (
            <Modal
              isOpen={isModalOpen}
              onClose={closeModal}
              onConfirm={() => {
                closeModal();
                navigate('/select'); // トップページに遷移
              }}
            >
              <p>本当にクイズを終了しますか？</p>
            </Modal>
          )}
          <QuestionCard
            question={currentQuestion}
            selectedAnswer={selectedAnswer}
            setSelectedAnswer={setSelectedAnswer}
          />
          <div className="flex justify-end gap-4">
            {!showResult ? (
              <>
                <Button onClick={handleSkipQuestion} variant="destructive">
                  <FaForward className="mr-2" />
                  スキップ
                </Button>
                <Button
                  onClick={handleSubmitClick}
                  variant="default"
                  disabled={!selectedAnswer}
                >
                  <FaCheckCircle className="mr-2" />
                  回答する
                </Button>
              </>
            ) : (
              <>
                <Button onClick={handleShowExplanation} variant="outline">
                  <FaQuestionCircle className="mr-2" />
                  解説を見る
                </Button>
                <Button onClick={handleNextQuestion} variant="secondary">
                  <FaPlay className="mr-2" />
                  次の問題へ
                </Button>
              </>
            )}
          </div>
          
        </div>
      </main>
    </div>
  );
};

export default QuizContainer;