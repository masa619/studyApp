import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { Button } from '@/components/ui/button';
const Header = ({ questionTime, isPaused, onPauseToggle, onExistsToggle }) => {
    return (_jsx("header", { className: "sticky top-0 w-full bg-gray-800 text-white z-50 shadow-md", children: _jsxs("div", { className: "max-w-6xl mx-auto px-4 py-2 flex justify-between items-center", children: [_jsx("div", { children: _jsxs("p", { children: ["\u7D4C\u904E\u6642\u9593: ", questionTime, "\u79D2"] }) }), _jsxs("div", { className: "flex justify-end gap-4", children: [_jsx(Button, { onClick: onPauseToggle, variant: isPaused ? "default" : "secondary", children: isPaused ? '再開' : '一時停止' }), _jsx(Button, { onClick: onExistsToggle, variant: "destructive", children: "\u7D42\u4E86" })] })] }) }));
};
export default Header;
