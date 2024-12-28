// src/hooks/useImageController.ts
import { useState, useEffect } from 'react';
export function useImageController(img, initialBaseWidth = 600) {
    // 実画像サイズ
    const [naturalWidth, setNaturalWidth] = useState(0);
    const [naturalHeight, setNaturalHeight] = useState(0);
    // ベース表示サイズ (アスペクト比維持した初期値)
    const [baseWidth, setBaseWidth] = useState(initialBaseWidth);
    const [baseHeight, setBaseHeight] = useState(initialBaseWidth);
    // スライダーで可変な拡大率
    const [scale, setScale] = useState(1.0);
    // 画像読み込みが完了していたら、naturalWidth/Height を取得
    useEffect(() => {
        if (img && img.naturalWidth && img.naturalHeight) {
            const w = img.naturalWidth;
            const h = img.naturalHeight;
            setNaturalWidth(w);
            setNaturalHeight(h);
            // アスペクト比
            const aspect = w / h;
            // baseWidth を使い、baseHeight を計算
            const newHeight = Math.round(initialBaseWidth / aspect);
            setBaseWidth(initialBaseWidth);
            setBaseHeight(newHeight);
            setScale(1.0); // 画像切り替え時などにリセット
        }
    }, [img, initialBaseWidth]);
    // 拡大率をもとに実際の描画サイズを算出
    const scaledWidth = Math.round(baseWidth * scale);
    const scaledHeight = Math.round(baseHeight * scale);
    return {
        naturalWidth,
        naturalHeight,
        baseWidth,
        baseHeight,
        scale,
        setScale,
        scaledWidth,
        scaledHeight,
    };
}
