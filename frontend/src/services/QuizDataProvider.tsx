import React, { useState, useEffect } from 'react';
import { Question } from '../types/question';
import apiClient from '../api/client';

interface QuizDataProviderProps {
  examId: number;
  mode?: string;    // 'normal' | 'unanswered' | 'exam' | 'progress'
  subMode?: string; // 'sequential' | 'ai'
  onDataLoaded: (data: Question[]) => void;
}

export const QuizDataProvider: React.FC<QuizDataProviderProps> = ({ 
  examId, 
  mode = 'normal',
  subMode = 'sequential',
  onDataLoaded 
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // クエリパラメータにexamId, mode, subModeを指定
        const response = await apiClient.get('/quiz/', {
          params: {
            examId,
            mode,
            subMode
          }
        });

        if (response.status !== 200) {
          if (response.status === 404) {
            throw new Error('指定された条件に一致する問題が見つかりません。');
          } else if (response.status === 400) {
            throw new Error('パラメータが無効です。');
          } else {
            throw new Error(`HTTPエラー: ${response.status}`);
          }
        }

        const data: Question[] = await response.data;
        onDataLoaded(data);
      } catch (err: any) {
        setError(err.message || 'データの取得に失敗しました');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [examId, mode, subMode, onDataLoaded]);

  if (loading) return (
    <div className="flex justify-center items-center h-screen">
      <p className="text-lg">データを読み込み中...</p>
    </div>
  );
  
  if (error) return (
    <div className="flex justify-center items-center h-screen">
      <p className="text-lg text-red-500">{error}</p>
    </div>
  );
  
  return null;
};

export default QuizDataProvider;