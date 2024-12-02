import React from 'react';
import { Progress } from '@/components/ui/progress';

interface ProgressBarProps {
  progress: number;
  currentIndex: number;
  totalQuestions: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress, currentIndex, totalQuestions }) => (
  <div className="mb-8">
    <Progress value={progress} className="h-2" />
    <div>
      <p className="text-sm text-gray-600 mt-2">
        進捗: {Math.round(progress)}%  {currentIndex + 1}/{totalQuestions} 
      </p>
    </div>
  </div>
);

export default ProgressBar;