import { Button } from "@mui/material";
import { FaForward, FaCheckCircle, FaQuestionCircle, FaPlay } from 'react-icons/fa';
import { colors } from '@/styles/colors';

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
        <Button 
          onClick={onSkip} 
          variant="outlined" 
          className="border-secondary-main text-secondary-dark hover:bg-secondary-light/10"
        >
          <FaForward className="mr-2" />
          スキップ
        </Button>
        <Button 
          onClick={onSubmit} 
          variant="contained" 
          disabled={!selectedAnswer}
          className="bg-success-main hover:bg-success-dark disabled:bg-gray-400 text-white"
        >
          <FaCheckCircle className="mr-2" />
          回答する
        </Button>
      </>
    ) : (
      <>
        <Button 
          onClick={onShowExplanation} 
          variant="outlined"
          className="border-primary-main text-primary-dark hover:bg-primary-light/10"
        >
          <FaQuestionCircle className="mr-2" />
          解説を見る
        </Button>
        <Button 
          onClick={onNext} 
          variant="outlined" 
          className="border-secondary-main text-secondary-dark hover:bg-secondary-light/10"
        >
          <FaPlay className="mr-2" />
          次の問題へ
        </Button>
      </>
    )}
  </div>
); 