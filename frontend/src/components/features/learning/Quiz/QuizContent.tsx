import { ResultAlert } from '@/components/features/learning/ResultAlert';
import { Explanation } from '@/components/features/learning/Explanation/Explanation';
import { QuestionCard } from '@/components/features/learning/Quiz/QuestionCard';
import { Question } from '@/types/question';

export const QuizContent: React.FC<{
  currentQuestion: Question;
  selectedAnswer: string | null;
  setSelectedAnswer: (answer: string) => void;
  showResult: boolean;
  isCorrect: boolean;
  showExplanation: boolean;
}> = ({ currentQuestion, selectedAnswer, setSelectedAnswer, showResult, isCorrect, showExplanation }) => (
  <>
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
    <QuestionCard
      question={currentQuestion}
      selectedAnswer={selectedAnswer}
      setSelectedAnswer={setSelectedAnswer}
      showResult={showResult}
    />
  </>
); 