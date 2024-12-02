import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from '@/components/ui/button';
const Modal = ({ isOpen, onClose, onConfirm, children }) => {
    if (!isOpen)
        return null;
    return (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50", children: _jsxs("div", { className: "bg-white p-6 rounded-lg shadow-xl", children: [children, _jsxs("div", { className: "flex justify-end gap-4 mt-4", children: [_jsx(Button, { onClick: onClose, variant: "outline", children: "\u30AD\u30E3\u30F3\u30BB\u30EB" }), _jsx(Button, { onClick: onConfirm, variant: "destructive", children: "\u78BA\u8A8D" })] })] }) }));
};
export default Modal;
