// src/ocr_app/correction/ImageWithBoundingBoxes.tsx

import React, { useState, useEffect } from 'react';
import { Stage, Layer, Rect, Text } from 'react-konva';

interface BoundingBox {
  x_min: number;
  y_min: number;
  x_max: number;
  y_max: number;
  text: string;
  confidence: number;
}

interface Props {
  imageUrl: string;      // 画像URL (HTTPパスなど)
  boundingBoxes: BoundingBox[];
  width: number;
  height: number;
}

const ImageWithBoundingBoxes: React.FC<Props> = ({
  imageUrl,
  boundingBoxes,
  width,
  height
}) => {
  const [img, setImg] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const loadImage = new window.Image();
    loadImage.src = imageUrl;
    loadImage.onload = () => setImg(loadImage);
  }, [imageUrl]);

  if (!img) {
    return <p>Loading image...</p>;
  }

  // オリジナル画像サイズと表示サイズの比率を計算
  const scaleX = width / img.width;
  const scaleY = height / img.height;

  return (
    <Stage width={width} height={height} style={{ border: '1px solid #ccc' }}>
      <Layer>
        {/* 背景画像 */}
        <Rect
          x={0}
          y={0}
          width={width}
          height={height}
          fillPatternImage={img}
          fillPatternScaleX={scaleX}
          fillPatternScaleY={scaleY}
        />
        {/* バウンディングボックス表示 */}
        {boundingBoxes.map((box, i) => {
          const x = box.x_min * scaleX;
          const y = box.y_min * scaleY;
          const w = (box.x_max - box.x_min) * scaleX;
          const h = (box.y_max - box.y_min) * scaleY;
          const color = box.confidence < 0.85 ? 'orange' : 'red';

          return (
            <React.Fragment key={i}>
              <Rect
                x={x}
                y={y}
                width={w}
                height={h}
                stroke={color}
                strokeWidth={2}
              />
              <Text
                x={x}
                y={y - 18}
                text={`(${box.confidence.toFixed(2)}) ${box.text}`}
                fontSize={14}
                fill={color}
              />
            </React.Fragment>
          );
        })}
      </Layer>
    </Stage>
  );
};

export default ImageWithBoundingBoxes;