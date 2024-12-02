import React, { useState, useEffect } from 'react';
import { RadioGroup, RadioGroupItem } from '../../../ui/radio-group';
import { Label } from '../../../ui/label';
import { Button } from '../../../ui/button';
import { Question } from '../../../../types/question';

interface QuestionCardProps {
  question: Question;
  selectedAnswer: string | null;
  setSelectedAnswer: (answer: string) => void;
  showResult: boolean;
}

const shuffleArray = (array: any[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  selectedAnswer,
  setSelectedAnswer,
  showResult,
}) => {
  const [isJapanese, setIsJapanese] = useState(false);
  const [shuffledChoices, setShuffledChoices] = useState(question.choices);

  const toggleLanguage = () => {
    setIsJapanese(!isJapanese);
  };

  useEffect(() => {
    setShuffledChoices(shuffleArray([...question.choices]));
  }, [question]);

  return (
    <div className="shadow-lg p-6 bg-white rounded">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-gray-500">問題 {question.no}</p>
        <Button
          onClick={toggleLanguage}
          variant="secondary"
          className="text-sm"
        >
          {isJapanese ? 'En' : 'ja'}
        </Button>
      </div>
      <p className="text-lg font-medium">
        {isJapanese ? question.question_text_ja : question.question_text_en}
      </p>
      <RadioGroup
        value={selectedAnswer || ''}
        onValueChange={setSelectedAnswer}
        className="space-y-4 mt-4"
      >
        {shuffledChoices.map((choice) => (
          <div key={choice.key} className="flex items-center space-x-2">
            <RadioGroupItem value={choice.key} id={`choice-${choice.key}`} />
            <Label htmlFor={`choice-${choice.key}`} className="text-base cursor-pointer">
              {showResult && <span className="font-bold">{choice.key}:</span>} {isJapanese ? choice.text_ja : choice.text_en}
            </Label>
          </div>
        ))}
      </RadioGroup>
      {showResult && selectedAnswer && (
        <p className="mt-4 text-sm text-gray-600">
          選択したキー: {selectedAnswer}
        </p>
      )}
    </div>
  );
};

export default QuestionCard;