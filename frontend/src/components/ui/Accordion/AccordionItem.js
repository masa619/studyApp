import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Accordion, AccordionSummary, AccordionDetails, Typography, } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
export const AccordionItem = ({ title, content, defaultExpanded = false, className, }) => (_jsxs(Accordion, { defaultExpanded: defaultExpanded, className: className, children: [_jsx(AccordionSummary, { expandIcon: _jsx(ExpandMoreIcon, {}), children: _jsx(Typography, { variant: "subtitle1", children: title }) }), _jsx(AccordionDetails, { children: typeof content === 'string' ? (_jsx(Typography, { children: content })) : (content) })] }));
