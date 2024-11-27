import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Label } from '../components/ui/label';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../contexts/SessionContext';
import auth from '../api/auth';
import apiClient from '../api/client';

const ExamSelection: React.FC = () => {
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState<any>(null); // Exam型を定義するなら、ここで適用
  const [selectedMode, setSelectedMode] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();
  const { setSessionExpired } = useSession();

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const response = await apiClient.get('/exams/');
        setExams(response.data);
        setLoading(false);
      } catch (error) {
        console.error('試験データの取得に失敗しました:', error);
        setLoading(false);
      }
    };

    fetchExams();
  }, []);

  const handleStart = () => {
    if (!selectedExam) {
      alert('試験を選択してください');
      return;
    }
    navigate(`/quiz`, { state: { examId: selectedExam.id } });
  };

  const handleLogout = async () => {
    await auth.logout();
    setSessionExpired(true);
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <p>試験データを読み込んでいます...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Shipro is always watching you.
        </h1>

        <div className="space-y-6">
          {/* 試験選択 */}
          <Card>
            <CardHeader>
              <CardTitle>試験を選択</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {exams.map((exam: any) => (
                  <div
                    key={exam.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors
                      ${
                        selectedExam?.id === exam.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    onClick={() => setSelectedExam(exam)}
                  >
                    <h3 className="font-medium text-gray-900">{exam.name}</h3>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* モード選択 */}
          <Card>
            <CardHeader>
              <CardTitle>モードを選択</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                defaultValue="all"
                onValueChange={setSelectedMode}
                className="space-y-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="all" />
                  <Label htmlFor="all" className="font-medium">
                    全問モード
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* 開始ボタンとログアウトボタン */}
          <div className="flex justify-center space-x-4">
            <Button
              onClick={handleStart}
              className="px-8 py-3 text-lg bg-blue-600 text-white hover:bg-blue-500 rounded-lg shadow-lg 
                        transition-colors duration-200 focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
              disabled={!selectedExam}
            >
              学習を開始
            </Button>
            <Button
              onClick={handleLogout}
              className="px-8 py-3 text-lg bg-red-600 text-white hover:bg-red-500 rounded-lg shadow-lg 
                        transition-colors duration-200 focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
            >
              ログアウト
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamSelection;