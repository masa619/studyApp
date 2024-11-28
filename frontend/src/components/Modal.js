import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import styles from "../styles/Quiz.module.css"; // Quiz.module.cssをインポート
const Modal = ({ isOpen, onClose, onConfirm, children }) => {
    if (!isOpen)
        return null;
    return (_jsx("div", { className: styles["modal-overlay"], children: _jsxs("div", { className: styles.modal, children: [children, _jsxs("div", { className: styles["modal-buttons"], children: [_jsx("button", { onClick: onClose, className: styles["fixed-width-button"], children: "\u30AD\u30E3\u30F3\u30BB\u30EB" }), _jsx("button", { onClick: onConfirm, className: styles["fixed-width-button"], children: "\u78BA\u8A8D" })] })] }) }));
};
export default Modal;
