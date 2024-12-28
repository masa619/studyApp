import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// src/ocr_app/konva/RectList.tsx
import React from 'react';
import { Rect, Text } from 'react-konva';
const RectList = ({ rects, fillColor = 'rgba(255,0,0,0.1)', strokeColor = 'red', onRectClick, }) => {
    return (_jsx(_Fragment, { children: rects.map((r, i) => (_jsxs(React.Fragment, { children: [_jsx(Rect, { x: r.x, y: r.y, width: r.width, height: r.height, fill: fillColor, stroke: strokeColor, strokeWidth: 2, onClick: () => onRectClick?.(i) }), r.label && (_jsx(Text, { x: r.x, y: r.y - 16, text: r.label, fontSize: 14, fill: "white", stroke: "black", strokeWidth: 0.5 }))] }, i))) }));
};
export default RectList;
