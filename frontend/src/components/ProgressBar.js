import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Progress } from './ui/progress';
const ProgressBar = ({ progress, currentIndex, totalQuestions }) => (_jsxs("div", { className: "mb-8", children: [_jsx(Progress, { value: progress, className: "h-2" }), _jsx("div", { children: _jsxs("p", { className: "text-sm text-gray-600 mt-2", children: ["\u9032\u6357: ", Math.round(progress), "%  ", currentIndex + 1, "/", totalQuestions] }) })] }));
export default ProgressBar;
