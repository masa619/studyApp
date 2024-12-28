// src/ocr_app/konva/RectList.tsx
import React from 'react';
import { Rect, Text } from 'react-konva';
import { DrawnRect } from '../hooks/useDragSelection';

interface RectListProps {
  rects: DrawnRect[];
  fillColor?: string;
  strokeColor?: string;
  onRectClick?: (index: number) => void;
}

const RectList: React.FC<RectListProps> = ({
  rects,
  fillColor = 'rgba(255,0,0,0.1)',
  strokeColor = 'red',
  onRectClick,
}) => {
  return (
    <>
      {rects.map((r, i) => (
        <React.Fragment key={i}>
          <Rect
            x={r.x}
            y={r.y}
            width={r.width}
            height={r.height}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={2}
            onClick={() => onRectClick?.(i)}
          />
          {r.label && (
            <Text
              x={r.x}
              y={r.y - 16}
              text={r.label}
              fontSize={14}
              fill="white"
              stroke="black"
              strokeWidth={0.5}
            />
          )}
        </React.Fragment>
      ))}
    </>
  );
};

export default RectList;