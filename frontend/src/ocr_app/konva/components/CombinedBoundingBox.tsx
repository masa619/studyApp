// CombinedBoundingBox.tsx
import React from 'react';
import { Rect } from 'react-konva';

// 既存の矩形データの型 (ご使用中のものに合わせてください)
interface DrawnRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CombinedBoundingBoxProps {
  // 複数の矩形
  rects: DrawnRect[];
  // 余白 (ピクセル)
  margin?: number;
  // 線色
  strokeColor?: string;
  // 塗り色
  fillColor?: string;
}

/**
 * 複数の矩形の最小/最大座標を求め、
 * マージン込みで描画する Rect を1つ返す。
 */
const CombinedBoundingBox: React.FC<CombinedBoundingBoxProps> = ({
  rects,
  margin = 10,
  strokeColor = 'blue',
  fillColor = 'rgba(0,0,255,0.1)',
}) => {
  if (rects.length === 0) return null; // 矩形がない場合は何も描画しない

  // minX, minY, maxX, maxY を求める
  const minX = Math.min(...rects.map((r) => r.x));
  const minY = Math.min(...rects.map((r) => r.y));
  const maxX = Math.max(...rects.map((r) => r.x + r.width));
  const maxY = Math.max(...rects.map((r) => r.y + r.height));

  // 余白を考慮
  const boundingRect = {
    x: minX - margin,
    y: minY - margin,
    width: (maxX - minX) + margin * 2,
    height: (maxY - minY) + margin * 2,
  };

  return (
    <Rect
      x={boundingRect.x}
      y={boundingRect.y}
      width={boundingRect.width}
      height={boundingRect.height}
      stroke={strokeColor}
      strokeWidth={2}
      fill={fillColor}
      // 例えば点線で表示したい場合
      // dash={[4, 4]}
    />
  );
};

export default CombinedBoundingBox;