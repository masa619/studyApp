import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle } from 'lucide-react';

interface ResultAlertProps {
  isCorrect: boolean;
  correctAnswer: string;
  community_vote_distribution: string;
}

export const ResultAlert: React.FC<ResultAlertProps> = ({ isCorrect, correctAnswer, community_vote_distribution }) => (
  <Alert className={`mt-6 ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
    <div className="flex items-center gap-2">
      {isCorrect ? (
        <CheckCircle className="h-5 w-5 text-green-500" />
      ) : (
        <XCircle className="h-5 w-5 text-red-500" />
      )}
      <AlertDescription className={isCorrect ? 'text-green-700' : 'text-red-700'}>
        { isCorrect ? '正解です！' : `不正解です。 正解は: ${correctAnswer}`}
        <br/>
        <span>community vote distribution: {community_vote_distribution}</span>
        
      </AlertDescription>
    </div>
  </Alert>
);

export default ResultAlert;