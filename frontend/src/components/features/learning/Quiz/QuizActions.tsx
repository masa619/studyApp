import { Button } from "@mui/material";
import { FaForward, FaCheckCircle, FaQuestionCircle, FaPlay } from 'react-icons/fa';

// アクションボタン群
export const QuizActions: React.FC<{
  showResult: boolean;
  selectedAnswer: string | null;
  onSkip: () => void;
  onSubmit: () => void;
  onShowExplanation: () => void;
  onNext: () => void;
}> = ({ showResult, selectedAnswer, onSkip, onSubmit, onShowExplanation, onNext }) => (
  <div className="flex justify-end gap-4">
    {!showResult ? (
      <>
        <Button onClick={onSkip} variant="outlined" color="secondary">
          <FaForward className="mr-2" />
          スキップ
        </Button>
        <Button onClick={onSubmit} variant="contained" disabled={!selectedAnswer} color="success">
          <FaCheckCircle className="mr-2" />
          回答する
        </Button>
      </>
    ) : (
      <>
        <Button onClick={onShowExplanation} variant="outlined">
          <FaQuestionCircle className="mr-2" />
          解説を見る
        </Button>
        <Button onClick={onNext} variant="outlined" color="secondary">
          <FaPlay className="mr-2" />
          次の問題へ
        </Button>
      </>
    )}
  </div>
); 