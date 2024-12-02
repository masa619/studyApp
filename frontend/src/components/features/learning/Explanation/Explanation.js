import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Paper, Typography, Box } from '@mui/material';
import { AccordionItem } from '../../../ui/Accordion/AccordionItem';
const ACCORDION_ITEMS = [
    {
        key: 'situation_analysis',
        title: '状況分析',
        defaultExpanded: true,
    },
    {
        key: 'answer_and_key_points',
        title: '回答とポイント',
        defaultExpanded: true,
    },
    {
        key: 'option_analysis',
        title: '選択肢分析',
    },
    {
        key: 'overall_assessment',
        title: '総合評価',
    },
    {
        key: 'additional_knowledge',
        title: '追加知識',
    },
    {
        key: 'key_terminology',
        title: '重要用語',
    },
];
export const Explanation = ({ explanation }) => {
    return (_jsxs(Paper, { elevation: 3, sx: { p: 3 }, children: [_jsx(Typography, { variant: "h5", component: "h3", gutterBottom: true, children: "\u89E3\u8AAC" }), explanation.length > 0 ? (explanation.map((item, index) => (_jsx(Box, { sx: { mb: 2 }, children: ACCORDION_ITEMS.map(({ key, title, defaultExpanded }) => (_jsx(AccordionItem, { title: title, content: item[key], defaultExpanded: defaultExpanded }, key))) }, index)))) : (_jsx(Typography, { children: "\u89E3\u8AAC\u306F\u3042\u308A\u307E\u305B\u3093\u3002" }))] }));
};
