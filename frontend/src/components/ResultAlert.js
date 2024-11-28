import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Alert, AlertDescription } from './ui/alert';
import { CheckCircle, XCircle } from 'lucide-react';
const ResultAlert = ({ isCorrect, correctAnswer, community_vote_distribution }) => (_jsx(Alert, { className: `mt-6 ${isCorrect ? 'bg-green-50' : 'bg-red-50'}`, children: _jsxs("div", { className: "flex items-center gap-2", children: [isCorrect ? (_jsx(CheckCircle, { className: "h-5 w-5 text-green-500" })) : (_jsx(XCircle, { className: "h-5 w-5 text-red-500" })), _jsxs(AlertDescription, { className: isCorrect ? 'text-green-700' : 'text-red-700', children: [isCorrect ? '正解です！' : `不正解です。 正解は: ${correctAnswer}`, _jsx("br", {}), _jsxs("span", { children: ["community vote distribution: ", community_vote_distribution] })] })] }) }));
export default ResultAlert;
