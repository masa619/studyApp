import { useState, useEffect } from 'react';
import apiClient from '../api/client';
// セッション切れフラグ（グローバルに管理）
let isSessionExpired = false;
const useQuiz = (questions) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [showResult, setShowResult] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [showExplanation, setShowExplanation] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [questionTime, setQuestionTime] = useState(0);
    useEffect(() => {
        let timer;
        if (!isPaused) {
            timer = setInterval(() => setQuestionTime((prev) => prev + 1), 1000);
        }
        return () => clearInterval(timer);
    }, [isPaused]);
    const handleAnswerSubmit = async (correctAnswerKey, questionId, examId) => {
        if (!selectedAnswer)
            return;
        const correct = selectedAnswer === correctAnswerKey;
        setIsCorrect(correct);
        setShowResult(true);
        setIsPaused(true);
        try {
            // 解答データを準備
            const payload = {
                question_id: questionId, // 質問ID
                selected_choice_id: selectedAnswer, // 選択された選択肢のキー
                exam: examId, // 試験ID
                response_time: questionTime, // 解答時間
            };
            console.log({ payload });
            // APIコールで回答データを送信
            const response = await apiClient.post('/answer-log/', payload);
            if (response.status === 201) {
                console.log('Answer log successfully submitted:', response.data);
            }
            else {
                console.error('Unexpected response:', response);
            }
        }
        catch (error) {
            console.error('Failed to submit answer log:', error);
        }
    };
    const handleNextQuestion = () => {
        setCurrentQuestionIndex((prev) => prev + 1);
        setSelectedAnswer(null);
        setShowResult(false);
        setShowExplanation(false);
        setQuestionTime(0);
        setIsPaused(false);
    };
    const handleSkipQuestion = () => {
        setCurrentQuestionIndex((prev) => prev + 1);
        setSelectedAnswer(null);
        setShowResult(false);
        setQuestionTime(0);
        setIsPaused(false);
    };
    const handleShowExplanation = () => setShowExplanation(true);
    const handlePauseToggle = () => setIsPaused((prev) => !prev);
    return {
        currentQuestionIndex,
        selectedAnswer,
        setSelectedAnswer,
        showResult,
        isCorrect,
        showExplanation,
        isPaused,
        questionTime,
        handleAnswerSubmit,
        handleNextQuestion,
        handleSkipQuestion,
        handleShowExplanation,
        handlePauseToggle,
    };
};
export default useQuiz;
