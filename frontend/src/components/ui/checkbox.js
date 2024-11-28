import { jsx as _jsx } from "react/jsx-runtime";
import classNames from 'classnames';
export const Checkbox = ({ id, checked, onCheckedChange, className }) => {
    return (_jsx("input", { type: "checkbox", id: id, checked: checked, onChange: (e) => onCheckedChange(e.target.checked), className: classNames("w-5 h-5 border-gray-300 rounded", className) }));
};
