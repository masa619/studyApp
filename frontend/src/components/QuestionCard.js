import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState } from 'react';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { Button } from './ui/button';
const QuestionCard = ({ question, selectedAnswer, setSelectedAnswer, }) => {
    const [isJapanese, setIsJapanese] = useState(false);
    const toggleLanguage = () => {
        setIsJapanese(!isJapanese);
    };
    return (_jsxs("div", { className: "shadow-lg p-6 bg-white rounded", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsxs("p", { className: "text-sm text-gray-500", children: ["\u554F\u984C ", question.no] }), _jsx(Button, { onClick: toggleLanguage, variant: "secondary", className: "text-sm", children: isJapanese ? 'En' : 'ja' })] }), _jsx("p", { className: "text-lg font-medium", children: isJapanese ? question.question_text_ja : question.question_text_en }), _jsx(RadioGroup, { value: selectedAnswer || '', onValueChange: setSelectedAnswer, className: "space-y-4 mt-4", children: question.choices.map((choice) => (_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(RadioGroupItem, { value: choice.key, id: `choice-${choice.key}` }), _jsx(Label, { htmlFor: `choice-${choice.key}`, className: "text-base cursor-pointer", children: isJapanese ? choice.text_ja : choice.text_en })] }, choice.key))) })] }));
};
export default QuestionCard;
