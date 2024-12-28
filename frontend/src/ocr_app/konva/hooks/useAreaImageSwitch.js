// src/ocr_app/konva/hooks/useAreaImageSwitch.ts
import { useCallback } from 'react';
/**
 * area_image_path へ切り替える処理を外部フックとして分離
 *
 * @param currentUrl - 現在の画像URL
 * @param areaPath   - area_image_path (切り替え先)
 * @returns { switchToAreaImage } - 呼び出すと area_image_path に切り替えるコールバック
 */
export function useAreaImageSwitch(currentUrl, areaPath) {
    const switchToAreaImage = useCallback(() => {
        if (!areaPath) {
            console.warn('No area_image_path specified');
            // areaPath が未定義なら現在のURLを返す
            return currentUrl;
        }
        return areaPath;
    }, [areaPath, currentUrl]);
    return { switchToAreaImage };
}
