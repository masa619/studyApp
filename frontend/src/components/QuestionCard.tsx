import React, { useState } from 'react';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Question } from '../types/question';

interface QuestionCardProps {
  question: Question;
  selectedAnswer: string | null;
  setSelectedAnswer: (answer: string) => void;
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  selectedAnswer,
  setSelectedAnswer,
}) => {
  const [isJapanese, setIsJapanese] = useState(false);

  const toggleLanguage = () => {
    setIsJapanese(!isJapanese);
  };

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
        {question.choices.map((choice) => (
          <div key={choice.key} className="flex items-center space-x-2">
            <RadioGroupItem value={choice.key} id={`choice-${choice.key}`} />
            <Label htmlFor={`choice-${choice.key}`} className="text-base cursor-pointer">
              {isJapanese ? choice.text_ja : choice.text_en}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
};

export default QuestionCard;