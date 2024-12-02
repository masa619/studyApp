import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, Brain, Clock, GraduationCap, LineChart } from 'lucide-react'

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

export default function LearningMenu() {
  const [activeExam, setActiveExam] = useState<string | null>(null)
  const [activeModeId, setActiveModeId] = useState<string | null>(null)

  const exams = [
    "AWS Solutions Architect - Professional",
    "AWS Developer - Associate",
    "AWS SysOps Administrator"
  ]

  const studyModes: StudyMode[] = [
    {
      id: 'normal',
      title: '通常学習モード',
      options: [
        { id: 'sequential', title: '順番通り', path: '/study/normal/sequential' },
        { id: 'ai', title: 'AIおすすめ', path: '/study/normal/ai' }
      ]
    },
    {
      id: 'unanswered',
      title: '未解答問題モード',
      options: [
        { id: 'sequential', title: '順番通り', path: '/study/unanswered/sequential' },
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

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-12 text-center">Shipro is always watching you.</h1>
        
        <div className="grid md:grid-cols-[1fr,2px,1fr] gap-8">
          {/* Left Column - Exam Selection */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-6">試験を選択</h2>
            {exams.map((exam) => (
              <motion.div
                key={exam}
                className={`p-4 rounded-lg cursor-pointer relative overflow-hidden ${
                  activeExam === exam ? 'bg-gray-800' : 'bg-gray-900'
                }`}
                whileHover={{ scale: 1.02 }}
                onClick={() => setActiveExam(exam)}
              >
                <div className="flex items-center justify-between">
                  <span>{exam}</span>
                  <ChevronRight className="w-5 h-5" />
                </div>
                {activeExam === exam && (
                  <motion.div
                    className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-orange-500 to-purple-500"
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 0.3 }}
                  />
                )}
              </motion.div>
            ))}
          </div>

          {/* Divider */}
          <div className="hidden md:block w-0.5 bg-gradient-to-b from-orange-500 to-purple-500" />

          {/* Right Column - Study Modes */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-6">モードを選択</h2>
            <AnimatePresence mode="wait">
              {activeExam && (
                <motion.div
                  className="space-y-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
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
                            >
                              {mode.options.map((option) => (
                                <motion.a
                                  key={option.id}
                                  href={option.path}
                                  className="block p-2 rounded hover:bg-gray-700 transition-colors"
                                  whileHover={{ x: 4 }}
                                >
                                  {option.title}
                                </motion.a>
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
          </div>
        </div>
      </div>
    </div>
  )
}

