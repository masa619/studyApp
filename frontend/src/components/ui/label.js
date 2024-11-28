import { jsx as _jsx } from "react/jsx-runtime";
import classNames from 'classnames';
export const Label = ({ htmlFor, children, className }) => {
    return (_jsx("label", { htmlFor: htmlFor, className: classNames("text-sm font-medium text-gray-700", className), children: children }));
};
