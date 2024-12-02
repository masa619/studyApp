import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { Button } from "@mui/material";
import { colors } from '@/styles/colors';
const Header = ({ questionTime, isPaused, onPauseToggle, onExistsToggle }) => {
    return (_jsx("header", { className: "sticky top-0 w-full text-white z-50 shadow-md", style: { backgroundColor: colors.background.middleDark }, children: _jsxs("div", { className: "max-w-6xl mx-auto px-4 py-2 flex justify-between items-center", children: [_jsx("div", { children: _jsxs("p", { children: ["\u7D4C\u904E\u6642\u9593: ", questionTime, "\u79D2"] }) }), _jsxs("div", { className: "flex justify-end gap-4", children: [_jsx(Button, { onClick: onPauseToggle, variant: "contained", color: "secondary", sx: {
                                bgcolor: colors.secondary.main,
                                '&:hover': {
                                    bgcolor: colors.secondary.dark,
                                }
                            }, children: isPaused ? '再開' : '一時停止' }), _jsx(Button, { onClick: onExistsToggle, variant: "contained", color: "error", sx: {
                                bgcolor: colors.error.main,
                                '&:hover': {
                                    bgcolor: colors.error.dark,
                                }
                            }, children: "\u7D42\u4E86" })] })] }) }));
};
export default Header;
