// src/ocr_app/konva/hooks/useRectController.ts

import { useState, useCallback, useRef, useEffect, useContext } from 'react';
import { KonvaEventObject } from 'konva/lib/Node';
import axios from 'axios';  // ★ detect_bounding_box_api 呼び出しに使用

import { Area } from '../../types';
import { JsonDataContext } from '../../Context/JsonDataContext';
import { uploadCroppedImage } from '../services/uploadService';

// ---------------------- 型定義 ----------------------
export interface DrawnRect {
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
  isCropped?: boolean;  // Crop済みフラグ
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
  label?: string;
}

export interface CroppedImage {
  label: string;
  dataUrl: string;               // フロントで切り抜いたベース画像(base64)
  boundingBoxes?: BoundingBox[]; // サーバー解析などで得られる情報
  serverCroppedBase64?: string;  // サーバー側でさらに処理された画像(任意)
  serverSavedPath?: string;      // サーバー保存先のパス
  expandMargin?: number;         // UI表示上のマージン
}

export function useRectController(
  image: HTMLImageElement | null,
  naturalWidth: number,
  naturalHeight: number,
  scaledWidth: number,
  scaledHeight: number,
  questionImageFullPath?: string,
  optionsImageFullPath?: string,
  selectedImageType?: 'Question' | 'Options',
  currentArea?: Area,
) {
  // ---- (1) Context から JSON管理機能を取得 ----
  const { selectedJsonId, setSelectedJsonData } = useContext(JsonDataContext);

  // ---- (2) State群 ----
  // A) ドラッグ開始位置
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);

  // B) ドラッグ中の一時Rect
  const [newRect, setNewRect] = useState<DrawnRect | null>(null);

  // C) 確定したRectリスト
  const [rects, setRects] = useState<DrawnRect[]>([]);

  // D) クロップ結果リスト(フロントで切り抜いた画像情報)
  const [croppedImages, setCroppedImages] = useState<CroppedImage[]>([]);

  // E) ラベル用カウンタ
  const labelCounterRef = useRef<number>(1);

  // ---- (3) currentArea が変わったら 初期化 ----
  useEffect(() => {
    if (!currentArea) return;
    // setRects([]);
    // setCroppedImages([]);
    // labelCounterRef.current = 1;
  }, [currentArea]);

  // ---- (4) マウスイベント処理 ----
  // 4.1) MouseDown
  const handleMouseDown = useCallback((e: KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return;
    const pos = stage.getPointerPosition();
    if (!pos) return;

    setStartPos(pos);
    setNewRect(null);
  }, []);

  // 4.2) MouseMove
  const handleMouseMove = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
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
    },
    [startPos]
  );

  // 4.3) MouseUp => 矩形確定
  const handleMouseUp = useCallback(() => {
    if (newRect) {
      const labeledRect: DrawnRect = {
        ...newRect,
        label: `image_${labelCounterRef.current}`,
        isCropped: false,
      };
      labelCounterRef.current += 1;
      setRects((prev) => [...prev, labeledRect]);
    }
    setStartPos(null);
    setNewRect(null);
  }, [newRect]);

  // ---- (5) Rect 削除 ----
  const removeRect = useCallback((index: number) => {
    setRects((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // =========================================================================
  // (★) ここからが「CROP時に detect_bounding_box_api を呼び出し、マージンを追加する」修正
  // =========================================================================
  /**
   * handleCropRect:
   *  1) ローカルCanvasで切り抜き (既存処理)
   *  2) 切り抜いたbase64をサーバー /ocr_app/api/detect_bounding_box/ に送信
   *  3) boundingBoxes とともにマージンを適用した結果を受け取る（expand_margin指定など）
   *  4) boundingBoxes を newCropItem に格納
   */
  const handleCropRect = useCallback(
    async (index: number) => {
      console.log('handleCropRect:', index);
      if (!image) return;
      const r = rects[index];
      if (!r) return;

      // スケール補正(実サイズに対して)
      const scaleX = naturalWidth / scaledWidth;
      const scaleY = naturalHeight / scaledHeight;

      // (a) ローカル切り抜き
      const sx = r.x * scaleX;
      const sy = r.y * scaleY;
      const sw = r.width * scaleX;
      const sh = r.height * scaleY;

      const offCanvas = document.createElement('canvas');
      offCanvas.width = sw;
      offCanvas.height = sh;
      const ctx = offCanvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(image, sx, sy, sw, sh, 0, 0, sw, sh);
      const dataUrl = offCanvas.toDataURL('image/png');

      // (b) detect_bounding_box_api を呼び出し
      const base64str = dataUrl.replace(/^data:image\/(png|jpeg);base64,/, '');
      let boundingBoxesFromServer: BoundingBox[] = [];
      try {
        // margin=10, expand_margin=20 は例示。適宜変更/パラメータ化可能
        const resp = await axios.post('/ocr_app/api/detect_bounding_box/', {
          image_base64: base64str,
          margin: 10,
          return_base64: true,
          expand_uniformly: true,
          expand_margin: 50,
        });
        console.log('resp:', resp.data);

        boundingBoxesFromServer = resp.data?.bounding_box_result?.bounding_boxes || [];
        const serverBase64 = resp.data?.bounding_box_result?.final_img_base64;
        // (c) croppedImages に追加
        const newCropItem: CroppedImage = {
          label: r.label || `image_${index}`,
          dataUrl,
          boundingBoxes: boundingBoxesFromServer,
          serverCroppedBase64: serverBase64,
          expandMargin: 20, // UIで描画するときに箱をoffsetしたい場合
        };
        console.log('newCropItem:', newCropItem);
        setCroppedImages((prev) => [...prev, newCropItem]);
      } catch (error) {
        console.error('detect_bounding_box_api error:', error);
      }

      // (d) Rectリスト更新(isCropped フラグ)
      setRects((prev) =>
        prev.map((item, idx2) => (idx2 === index ? { ...item, isCropped: true } : item))
      );
    },
    [image, rects, naturalWidth, naturalHeight, scaledWidth, scaledHeight]
  );

  // ---- (7) Save ボタン => サーバーに実ファイル登録 ----
  const handleSaveRect = useCallback(
    async (index: number) => {
      const cropItem = croppedImages[index];
      if (!cropItem) {
        console.warn('No croppedImage found at index:', index);
        return;
      }

      if (!currentArea) {
        alert('currentAreaがありません');
        return;
      }

      // originalImagePath の決定
      let originalPath = '';
      if (selectedImageType === 'Question') {
        originalPath = questionImageFullPath || '';
      } else {
        originalPath = optionsImageFullPath || '';
      }
      if (!originalPath) {
        alert('originalImagePathが不明です');
        return;
      }

      // labelName
      const rawLabel = cropItem.label || 'image_1';
      const labelName = rawLabel.split('_')[1] || '1';
      const noNumber = currentArea.No?.toString() || '1';
      const areaId = currentArea.area_id?.toString() || '1';
      const jsonId = selectedJsonId?.toString() || '1';

      // serverCroppedBase64 があれば使う (なければ fallback で dataUrl)
      const rawBase64 = cropItem.serverCroppedBase64
        ? `data:image/png;base64,${cropItem.serverCroppedBase64}`
        : cropItem.dataUrl;
      const base64str = rawBase64.replace(/^data:image\/(png|jpeg);base64,/, '');

      try {
        const { saved_path, updated_json_data } = await uploadCroppedImage({
          originalImagePath: originalPath,
          selectedImageType: (selectedImageType || 'Question').toLowerCase(),
          jsonId,
          areaId,
          labelName,
          noNumber,
          base64: base64str,
        });
        console.log('Uploaded =>', saved_path);

        // 成功したら croppedImages[index] を更新
        setCroppedImages((prev) =>
          prev.map((ci, idx2) =>
            idx2 === index ? { ...ci, serverSavedPath: saved_path } : ci
          )
        );

        // Context更新 => 最新の JSON データに置き換える
        if (setSelectedJsonData) {
          setSelectedJsonData((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              json_data: updated_json_data,
            };
          });
        }

        alert(`Saved to: ${saved_path}`);
      } catch (error) {
        console.error(error);
        alert('Error while uploading cropped image');
      }
    },
    [
      croppedImages,
      currentArea,
      questionImageFullPath,
      optionsImageFullPath,
      selectedImageType,
      selectedJsonId,
      setSelectedJsonData,
    ]
  );

  // ---- (8) PreviewRect => (任意プレビュー) ----
  const handlePreviewRect = useCallback(
    (index: number) => {
      const r = rects[index];
      if (!r || !image) return;

      // 簡易的に別タブでプレビュー
      const offCanvas = document.createElement('canvas');
      offCanvas.width = r.width;
      offCanvas.height = r.height;
      const ctx = offCanvas.getContext('2d');
      if (!ctx) return;

      // 画面上スケールのみ参照(厳密でないサンプル)
      ctx.drawImage(image, r.x, r.y, r.width, r.height, 0, 0, r.width, r.height);
      const newTab = window.open('', '_blank');
      if (newTab) {
        newTab.document.write(`<img src="${offCanvas.toDataURL('image/png')}" />`);
      }
    },
    [rects, image]
  );

  // ---- (9) 全リセット ----
  const resetRectsAndCrops = useCallback(() => {
    setRects([]);
    setCroppedImages([]);
    labelCounterRef.current = 1;
  }, []);

  // ---- (10) 返却 ----
  return {
    rects,
    newRect,
    croppedImages,

    handleMouseDown,
    handleMouseMove,
    handleMouseUp,

    removeRect,
    handlePreviewRect,
    handleCropRect,
    handleSaveRect,

    resetRectsAndCrops,
  };
}