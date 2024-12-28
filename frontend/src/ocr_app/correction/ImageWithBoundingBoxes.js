import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/ocr_app/correction/ImageWithBoundingBoxes.tsx
import React, { useState, useEffect } from 'react';
import { Stage, Layer, Rect, Text } from 'react-konva';
const ImageWithBoundingBoxes = ({ imageUrl, boundingBoxes, width, height }) => {
    const [img, setImg] = useState(null);
    useEffect(() => {
        const loadImage = new window.Image();
        loadImage.src = imageUrl;
        loadImage.onload = () => setImg(loadImage);
    }, [imageUrl]);
    if (!img) {
        return _jsx("p", { children: "Loading image..." });
    }
    // オリジナル画像サイズと表示サイズの比率を計算
    const scaleX = width / img.width;
    const scaleY = height / img.height;
    return (_jsx(Stage, { width: width, height: height, style: { border: '1px solid #ccc' }, children: _jsxs(Layer, { children: [_jsx(Rect, { x: 0, y: 0, width: width, height: height, fillPatternImage: img, fillPatternScaleX: scaleX, fillPatternScaleY: scaleY }), boundingBoxes.map((box, i) => {
                    const x = box.x_min * scaleX;
                    const y = box.y_min * scaleY;
                    const w = (box.x_max - box.x_min) * scaleX;
                    const h = (box.y_max - box.y_min) * scaleY;
                    const color = box.confidence < 0.85 ? 'orange' : 'red';
                    return (_jsxs(React.Fragment, { children: [_jsx(Rect, { x: x, y: y, width: w, height: h, stroke: color, strokeWidth: 2 }), _jsx(Text, { x: x, y: y - 18, text: `(${box.confidence.toFixed(2)}) ${box.text}`, fontSize: 14, fill: color })] }, i));
                })] }) }));
};
export default ImageWithBoundingBoxes;
