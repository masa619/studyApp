// src/ocr_app/konva/hooks/useRectController.ts

import { useState, useCallback, useRef, useEffect, useContext } from 'react';
import { KonvaEventObject } from 'konva/lib/Node';
import axios from 'axios';

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
  selectedIrohaKey?: string;     // 選択肢のキー (例: "イ", "ロ", "ハ", "ニ")
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
  const { selectedJsonId, setSelectedJsonData } = useContext(JsonDataContext);

  // ---- State & Refs ----
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [newRect, setNewRect] = useState<DrawnRect | null>(null);
  const [rects, setRects] = useState<DrawnRect[]>([]);
  const [croppedImages, setCroppedImages] = useState<CroppedImage[]>([]);

  // ラベル用
  const labelCounterRef = useRef<number>(1);

  // イロハニ管理
  const irohaKeys = ['イ', 'ロ', 'ハ', 'ニ'];
  const irohaIndexRef = useRef<number>(0);

  // ---- (1) currentArea が変わったら必要に応じて初期化 ----
  useEffect(() => {
    if (!currentArea) return;
    // 必要なら初期化処理
    // setRects([]);
    // setCroppedImages([]);
    // labelCounterRef.current = 1;
    // irohaIndexRef.current = 0;
  }, [currentArea]);

  // ---- (2) MouseDown ----
  const handleMouseDown = useCallback((e: KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return;
    const pos = stage.getPointerPosition();
    if (!pos) return;

    setStartPos(pos);
    setNewRect(null);
  }, []);

  // ---- (3) MouseMove ----
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

  // ---- (4) MouseUp => 矩形確定 ----
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

  // ---- (5) Rect削除 ----
  const removeRect = useCallback((index: number) => {
    setRects((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // =========================================================================
  // (6) handleCropRect
  //   - ローカルCanvasで切り抜く
  //   - イロハニキーを必要なら(Options時のみ)自動割り当て
  //   - bounding_box API呼び出し (オプション)
  // =========================================================================
  const handleCropRect = useCallback(
    async (index: number) => {
      if (!image) return;
      const r = rects[index];
      if (!r) return;

      // (a) スケール補正
      const scaleX = naturalWidth / scaledWidth;
      const scaleY = naturalHeight / scaledHeight;

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

      // dataUrl
      const dataUrl = offCanvas.toDataURL('image/png');

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
        
        // (d) Rectリスト更新(isCropped)
        setRects((prev) =>
          prev.map((item, idx2) => (idx2 === index ? { ...item, isCropped: true } : item))
        );
      } catch (error) {
        console.error('detect_bounding_box_api error:', error);
      }
      // ★★★ Options のみイロハニキーを割り当てる ★★★
      let assignedKey = '';
      if (selectedImageType === 'Options') {
        assignedKey = irohaKeys[irohaIndexRef.current];
        irohaIndexRef.current += 1;
        if (irohaIndexRef.current >= irohaKeys.length) {
          // 4枚目以降は最後の "ニ" のまま or ループにする
          irohaIndexRef.current = irohaKeys.length - 1;
        }
      }
      console.log('handleCropRect => assignedKey:', assignedKey);
      // もし handleCropRect の呼び出し元で assignedKey を使いたいなら return してもOK
      return assignedKey;
    },
    [
      image,
      rects,
      naturalWidth,
      naturalHeight,
      scaledWidth,
      scaledHeight,
      selectedImageType,
    ]
  );

  // =========================================================================
  // (7) handleSaveRect => サーバーにファイル保存
  // =========================================================================
  const handleSaveRect = useCallback(
    async (croppedIndex: number) => {
      const cropItem = croppedImages[croppedIndex];
      if (!cropItem) {
        console.warn('No croppedImage found at index:', croppedIndex);
        return;
      }

      if (!currentArea) {
        alert('currentArea がありません');
        return;
      }

      // (a) originalImagePath の決定
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

      // (b) labelName
      const rawLabel = cropItem.label || 'image_1';
      const labelName = rawLabel.split('_')[1] || '1';
      const noNumber = currentArea.No?.toString() || '1';
      const areaId = currentArea.area_id?.toString() || '1';
      const jsonId = selectedJsonId?.toString() || '1';

      // (c) base64
      const rawBase64 = cropItem.serverCroppedBase64
        ? `data:image/png;base64,${cropItem.serverCroppedBase64}`
        : cropItem.dataUrl;
      const base64str = rawBase64.replace(/^data:image\/(png|jpeg);base64,/, '');

      try {
        // (d) APIコール
        const { saved_path, updated_json_data } = await uploadCroppedImage({
          originalImagePath: originalPath,
          selectedImageType: (selectedImageType || 'Question').toLowerCase(), 
          jsonId,
          areaId,
          labelName,
          noNumber,
          base64: base64str,
          // ★ Options の時だけキーを送信してもOK
          selectedIrohaKey: selectedImageType === 'Options'
            ? (cropItem.selectedIrohaKey ?? '')
            : '',
        });
        console.log('Uploaded =>', saved_path);

        // (e) 成功したら croppedImages を更新
        setCroppedImages((prev) =>
          prev.map((ci, idx2) =>
            idx2 === croppedIndex ? { ...ci, serverSavedPath: saved_path } : ci
          )
        );

        // (f) Context更新 => 最新JSONに置き換え
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
      selectedImageType,
      questionImageFullPath,
      optionsImageFullPath,
      selectedJsonId,
      setSelectedJsonData,
    ]
  );

  // =========================================================================
  // (8) PreviewRect (任意)
  // =========================================================================
  const handlePreviewRect = useCallback(
    (index: number) => {
      const r = rects[index];
      if (!r || !image) return;

      // 簡易プレビュー
      const offCanvas = document.createElement('canvas');
      offCanvas.width = r.width;
      offCanvas.height = r.height;
      const ctx = offCanvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(image, r.x, r.y, r.width, r.height, 0, 0, r.width, r.height);
      const newTab = window.open('', '_blank');
      if (newTab) {
        newTab.document.write(`<img src="${offCanvas.toDataURL('image/png')}" />`);
      }
    },
    [rects, image]
  );

  // =========================================================================
  // (9) 全リセット
  // =========================================================================
  const resetRectsAndCrops = useCallback(() => {
    setRects([]);
    setCroppedImages([]);
    labelCounterRef.current = 1;
    irohaIndexRef.current = 0; // イロハニの割り当てもリセット
  }, []);

  // =========================================================================
  // (10) return
  // =========================================================================
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