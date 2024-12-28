import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from '@mui/material';
const RectRow = ({ index, rect, onPreview, onCrop, onSave, onRemove, }) => {
    const { x, y, width, height, label, isCropped } = rect;
    return (_jsxs("div", { style: { marginBottom: '0.5rem' }, children: [_jsxs("span", { children: ["#", index + 1, " ", _jsx("strong", { children: label || 'image_unknown' }), ` (x:${Math.round(x)}, y:${Math.round(y)}, w:${Math.round(width)}, h:${Math.round(height)})`] }), _jsx(Button, { variant: "outlined", size: "small", style: { marginLeft: '0.5rem' }, onClick: () => onPreview(index), children: "Preview" }), !isCropped && (_jsx(Button, { variant: "contained", size: "small", color: "primary", style: { marginLeft: '0.5rem' }, onClick: () => onCrop(index), children: "Crop" })), isCropped && (_jsx(Button, { variant: "contained", size: "small", color: "success", style: { marginLeft: '0.5rem' }, onClick: () => onSave(index), children: "Save" })), _jsx(Button, { variant: "outlined", size: "small", color: "error", style: { marginLeft: '0.5rem' }, onClick: () => onRemove(index), children: "Remove" })] }));
};
export default RectRow;
