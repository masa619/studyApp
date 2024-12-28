// src/ocr_app/konva/hooks/useDragSelection.ts
import { useState, useCallback, useRef } from 'react';
export function useDragSelection() {
    const [rects, setRects] = useState([]);
    const [newRect, setNewRect] = useState(null);
    const [startPos, setStartPos] = useState(null);
    // ラベルの自動採番を ref で管理
    const labelCounterRef = useRef(1);
    // マウスダウン
    const handleMouseDown = useCallback((e) => {
        const stage = e.target.getStage();
        if (!stage)
            return;
        const pos = stage.getPointerPosition();
        setStartPos(pos);
        setNewRect(null);
    }, []);
    // マウスムーブ
    const handleMouseMove = useCallback((e) => {
        if (!startPos)
            return;
        const stage = e.target.getStage();
        if (!stage)
            return;
        const pos = stage.getPointerPosition();
        if (!pos)
            return;
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
            const labeledRect = {
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
    const removeRect = useCallback((index) => {
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
