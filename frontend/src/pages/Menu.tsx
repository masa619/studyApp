'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, Brain, Clock, GraduationCap, LineChart, LogIn, LogOut } from 'lucide-react'
import { Button } from '../components/ui/button'
import { useSession } from '../contexts/SessionContext'
import auth from '../api/auth';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';

interface StudyMode {
  id: string
  title: string
  options?: {
    id: string
    title: string
    path: string
  }[]
  path?: string
}

interface Exam {
  id: number;
  name: string;
}

export default function LearningMenu() {
  const [activeExam, setActiveExam] = useState<number | null>(null)
  const [activeModeId, setActiveModeId] = useState<string | null>(null)
  const { isSessionExpired, setSessionExpired } = useSession()
  const navigate = useNavigate();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

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

  const handleAuthClick = () => {
    if (isSessionExpired) {
      window.location.href = '/login'
    } else {
      handleLogout();
    }
  }

  const handleLogout = async () => {
    await auth.logout();
    setSessionExpired(true);
    navigate('/');
  };

  const handleModeSelect = (mode: StudyMode, option?: { path: string }) => {
    if (!activeExam) return;
    
    if (mode.path) {
      navigate(mode.path, { state: { examId: activeExam, mode: mode.id } });
    } else if (option?.path) {
      navigate(option.path, { state: { examId: activeExam, mode: mode.id } });
    }
  };

  const studyModes: StudyMode[] = [
    {
      id: 'normal',
      title: '通常学習モード',
      options: [
        { id: 'sequential', title: '順番通り', path: '/quiz' },
        { id: 'ai', title: 'AIおすすめ', path: '/study/normal/ai' }
      ]
    },
    {
      id: 'unanswered',
      title: '未解答問題モード',
      options: [
        { id: 'sequential', title: '順番通り', path: '/quiz' },
        { id: 'ai', title: 'AIおすすめ', path: '/study/unanswered/ai' }
      ]
    },
    {
      id: 'exam',
      title: '模擬試験モード',
      path: '/study/exam'
    },
    {
      id: 'progress',
      title: '学習状況',
      path: '/study/progress'
    }
  ]

  const getModeIcon = (modeId: string) => {
    switch (modeId) {
      case 'normal':
        return Brain
      case 'unanswered':
        return Clock
      case 'exam':
        return GraduationCap
      case 'progress':
        return LineChart
      default:
        return ChevronRight
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex justify-center items-center">
        <p>試験データを読み込んでいます...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Auth Button */}
      <div className="fixed top-4 left-4 z-50">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAuthClick}
            className="flex items-center gap-2 hover:bg-gray-800"
          >
            {isSessionExpired ? (
              <>
                <LogIn className="w-4 h-4" />
                ログイン
              </>
            ) : (
              <>
                <LogOut className="w-4 h-4" />
                ログアウト
              </>
            )}
          </Button>
        </motion.div>
      </div>

      <div className="flex items-center justify-center p-4">
        <motion.div 
          className="w-full max-w-6xl"
          initial={false}
          animate={{ 
            width: activeExam ? '100%' : 'auto',
            transition: { duration: 0.5, ease: 'easeInOut' }
          }}
        >
          <h1 className="text-3xl font-bold mb-12 text-center">Shipro is always watching you.</h1>
          
          <motion.div 
            className="grid gap-8"
            animate={{ 
              gridTemplateColumns: activeExam ? '1fr auto 1fr' : '1fr',
              transition: { duration: 0.5, ease: 'easeInOut' }
            }}
          >
            {/* Exam Selection */}
            <motion.div 
              className="space-y-4"
              animate={{ 
                width: activeExam ? '100%' : 'auto',
                alignSelf: activeExam ? 'start' : 'center',
                transition: { duration: 0.5, ease: 'easeInOut' }
              }}
              style={{ maxWidth: '550px' }}
            >
              <h2 className="text-xl font-semibold mb-6">試験を選択</h2>
              {exams.map((exam) => (
                <motion.div
                  key={exam.id}
                  className={`p-4 rounded-lg cursor-pointer relative overflow-hidden ${
                    activeExam === exam.id ? 'bg-gray-800' : 'bg-gray-900'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setActiveExam(exam.id)}
                >
                  <div className="flex items-center justify-between">
                    <span>{exam.name}</span>
                    <ChevronRight className="w-5 h-5" />
                  </div>
                  <AnimatePresence>
                    {activeExam === exam.id && (
                      <motion.div
                        className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-orange-500 to-purple-500"
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        exit={{ width: 0 }}
                        transition={{ duration: 0.3 }}
                      />
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </motion.div>

            {/* Divider */}
            <AnimatePresence mode="wait">
              {activeExam && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: '100%' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ 
                    duration: 0.5, 
                    ease: 'easeInOut',
                    opacity: { duration: 0.3 }
                  }}
                  className="hidden md:block w-0.5 bg-gradient-to-b from-orange-500 to-purple-500 self-stretch"
                />
              )}
            </AnimatePresence>

            {/* Study Modes */}
            <AnimatePresence>
              {activeExam && (
                <motion.div
                  className="space-y-4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.5, ease: 'easeInOut' }}
                >
                  <h2 className="text-xl font-semibold mb-6">モードを選択</h2>
                  {studyModes.map((mode) => {
                    const Icon = getModeIcon(mode.id)
                    return (
                      <motion.div
                        key={mode.id}
                        className={`p-4 rounded-lg cursor-pointer relative ${
                          activeModeId === mode.id ? 'bg-gray-800' : 'bg-gray-900'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => setActiveModeId(mode.id)}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-5 h-5" />
                          <span>{mode.title}</span>
                        </div>
                        
                        <AnimatePresence>
                          {activeModeId === mode.id && mode.options && (
                            <motion.div
                              className="mt-4 ml-8 space-y-2"
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              {mode.options.map((option) => (
                                <motion.div
                                  key={option.id}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: -10 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <Button
                                    variant="ghost"
                                    className="w-full justify-start"
                                    onClick={() => handleModeSelect(mode, option)}
                                  >
                                    {option.title}
                                  </Button>
                                </motion.div>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

