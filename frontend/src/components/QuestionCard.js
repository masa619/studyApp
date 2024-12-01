import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { Button } from './ui/button';
const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};
const QuestionCard = ({ question, selectedAnswer, setSelectedAnswer, showResult, }) => {
    const [isJapanese, setIsJapanese] = useState(false);
    const [shuffledChoices, setShuffledChoices] = useState(question.choices);
    const toggleLanguage = () => {
        setIsJapanese(!isJapanese);
    };
    useEffect(() => {
        setShuffledChoices(shuffleArray([...question.choices]));
    }, [question]);
    return (_jsxs("div", { className: "shadow-lg p-6 bg-white rounded", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsxs("p", { className: "text-sm text-gray-500", children: ["\u554F\u984C ", question.no] }), _jsx(Button, { onClick: toggleLanguage, variant: "secondary", className: "text-sm", children: isJapanese ? 'En' : 'ja' })] }), _jsx("p", { className: "text-lg font-medium", children: isJapanese ? question.question_text_ja : question.question_text_en }), _jsx(RadioGroup, { value: selectedAnswer || '', onValueChange: setSelectedAnswer, className: "space-y-4 mt-4", children: shuffledChoices.map((choice) => (_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(RadioGroupItem, { value: choice.key, id: `choice-${choice.key}` }), _jsxs(Label, { htmlFor: `choice-${choice.key}`, className: "text-base cursor-pointer", children: [showResult && _jsxs("span", { className: "font-bold", children: [choice.key, ":"] }), " ", isJapanese ? choice.text_ja : choice.text_en] })] }, choice.key))) }), showResult && selectedAnswer && (_jsxs("p", { className: "mt-4 text-sm text-gray-600", children: ["\u9078\u629E\u3057\u305F\u30AD\u30FC: ", selectedAnswer] }))] }));
};
export default QuestionCard;
