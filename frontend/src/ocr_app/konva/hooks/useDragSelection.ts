// src/ocr_app/konva/hooks/useDragSelection.ts

import { useState, useCallback, useRef } from 'react';
import { KonvaEventObject } from 'konva/lib/Node';

export type DrawnRect = {
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string; // ラベルを付ける
};

export function useDragSelection() {
  const [rects, setRects] = useState<DrawnRect[]>([]);
  const [newRect, setNewRect] = useState<DrawnRect | null>(null);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);

  // ラベルの自動採番を ref で管理
  const labelCounterRef = useRef<number>(1);

  // マウスダウン
  const handleMouseDown = useCallback((e: KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return;
    const pos = stage.getPointerPosition();
    setStartPos(pos);
    setNewRect(null);
  }, []);

  // マウスムーブ
  const handleMouseMove = useCallback((e: KonvaEventObject<MouseEvent>) => {
    if (!startPos) return;
    const stage = e.target.getStage();
    if (!stage) return;

    const pos = stage.getPointerPosition();
    if (!pos) return;

    const x = Math.min(startPos.x, pos.x);
    const y = Math.min(startPos.y, pos.y);
    const width = Math.abs(pos.x - startPos.x);
    const height = Math.abs(pos.y - startPos.y);

    setNewRect({ x, y, width, height });
  }, [startPos]);

  // マウスアップ → 矩形確定（ラベル付与）
  const handleMouseUp = useCallback(() => {
    if (newRect) {
      const labelIndex = labelCounterRef.current;
      const labeledRect: DrawnRect = {
        ...newRect,
        label: `image_${labelIndex}`,
      };
      // カウンタを進める
      if (labelCounterRef.current < 99) {
        labelCounterRef.current += 1;
      }
      setRects((prev) => [...prev, labeledRect]);
    }
    setStartPos(null);
    setNewRect(null);
  }, [newRect]);

  // Rect削除（クリックで削除など）
  const removeRect = useCallback((index: number) => {
    setRects((prev) => prev.filter((_, i) => i !== index));
  }, []);

  return {
    rects,
    newRect,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    removeRect,
    setRects,
  };
}