import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const Explanation = ({ explanation }) => {
    return (_jsxs("div", { className: "shadow-lg p-6 bg-white rounded", children: [_jsx("h3", { className: "text-lg font-bold", children: "\u89E3\u8AAC" }), explanation.length > 0 ? (explanation.map((item, index) => (_jsxs("div", { className: "mb-4", children: [_jsx("h4", { className: "font-semibold", children: "Situation Analysis:" }), _jsx("p", { children: item.situation_analysis }), _jsx("h4", { className: "font-semibold", children: "Answer and Key Points:" }), _jsx("p", { children: item.answer_and_key_points }), _jsx("h4", { className: "font-semibold", children: "Option Analysis:" }), _jsx("p", { children: item.option_analysis }), _jsx("h4", { className: "font-semibold", children: "Overall Assessment:" }), _jsx("p", { children: item.overall_assessment }), _jsx("h4", { className: "font-semibold", children: "Additional Knowledge:" }), _jsx("p", { children: item.additional_knowledge }), _jsx("h4", { className: "font-semibold", children: "Key Terminology:" }), _jsx("p", { children: item.key_terminology })] }, index)))) : (_jsx("p", { className: "text-base", children: "\u89E3\u8AAC\u306F\u3042\u308A\u307E\u305B\u3093\u3002" }))] }));
};
export default Explanation;