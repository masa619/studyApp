import { jsx as _jsx } from "react/jsx-runtime";
import { TextField } from '@mui/material';
const MarkdownEditor = ({ value, onChange }) => {
    return (_jsx("div", { style: { marginBottom: '1rem' }, children: _jsx(TextField, { label: "Markdown Text", multiline: true, rows: 10, variant: "outlined", fullWidth: true, value: value, onChange: onChange }) }));
};
export default MarkdownEditor;
