import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { Button } from './ui/button';
import styles from '../styles/Quiz.module.css'; // スタイルをインポート
const Header = ({ questionTime, isPaused, onPauseToggle, onExistsToggle }) => {
    return (_jsx("header", { className: styles.header, children: _jsxs("div", { className: styles['header-content'], children: [_jsx("div", { children: _jsxs("p", { children: ["\u7D4C\u904E\u6642\u9593: ", questionTime, "\u79D2"] }) }), _jsxs("div", { className: "flex justify-end gap-4", children: [_jsx("button", { onClick: onPauseToggle, className: `${styles.button} ${isPaused ? styles['button-primary'] : styles['button-secondary']} fixed-width-button`, children: isPaused ? '再開' : '一時停止' }), _jsx(Button, { onClick: onExistsToggle, variant: "secondary", children: "\u7D42\u4E86" })] })] }) }));
};
export default Header;
