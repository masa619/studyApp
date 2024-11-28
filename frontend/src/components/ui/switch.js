import { jsx as _jsx } from "react/jsx-runtime";
import classNames from 'classnames';
export const Switch = ({ id, checked, onCheckedChange, className }) => {
    return (_jsx("button", { id: id, role: "switch", "aria-checked": checked, onClick: () => onCheckedChange(!checked), className: classNames("relative inline-flex items-center h-6 rounded-full w-11", className, checked ? "bg-blue-600" : "bg-gray-200"), children: _jsx("span", { className: classNames("inline-block w-4 h-4 transform bg-white rounded-full transition", checked ? "translate-x-6" : "translate-x-1") }) }));
};
