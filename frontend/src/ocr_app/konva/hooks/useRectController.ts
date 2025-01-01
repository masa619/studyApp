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
  expandMargin: number = 50,
) {
  const { selectedJsonId, setSelectedJsonData } = useContext(JsonDataContext);

  // ---- State & Refs ----
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [newRect, setNewRect] = useState<DrawnRect | null>(null);
  const [rects, setRects] = useState<DrawnRect[]>([]);
  const [croppedImages, setCroppedImages] = useState<CroppedImage[]>([]);

  // “今のArea.No” を記憶しておいて、Area or ImageType が切り替わったらリセット
  const currentAreaNoRef = useRef<string | undefined>(undefined);
  const prevSelectedImageTypeRef = useRef<'Question' | 'Options' | undefined>(undefined);

  // 「未アップロードでも一度付与したファイル名」を保持するリファレンス
  // これがないと、JSON未保存の状態で同じファイル名が再度割り当たる可能性がある
  const usedFilenamesRef = useRef<string[]>([]);

  // イロハニ管理（Options用）
  const irohaKeys = ['イ', 'ロ', 'ハ', 'ニ'];
  const irohaIndexRef = useRef<number>(0);

  // =========================================================================
  // (A) 切り替え時にリセット
  // =========================================================================
  useEffect(() => {
    const newAreaNo = currentArea?.No?.toString();
    const newType = selectedImageType;
    if (
      currentAreaNoRef.current === newAreaNo &&
      prevSelectedImageTypeRef.current === newType
    ) {
      // 同じエリア・タイプなら何もしない
      return;
    }
    // 異なるエリア or イメージ種別 => 状態をリセット
    setRects([]);
    setCroppedImages([]);
    usedFilenamesRef.current = [];
    irohaIndexRef.current = 0;

    currentAreaNoRef.current = newAreaNo;
    prevSelectedImageTypeRef.current = newType;
  }, [currentArea, selectedImageType]);

  // =========================================================================
  // (B) JSONに存在するファイル名 + これまで割り当てたファイル名 をまとめて返す
  // =========================================================================
  const getExistingFilenames = useCallback((): string[] => {
    if (!currentArea) return [];

    let fromJson: string[] = [];
    const areaNo = currentArea.No?.toString().padStart(1, '0') || '1';

    if (selectedImageType === 'Question') {
      // question_element.image_paths[]
      fromJson = (currentArea.question_element?.image_paths || []).map((p) => {
        const fname = p.split('/').pop() || '';
        // no_1_question_image_1.png から image_1 を抽出
        const match = fname.match(/no_\d+_question_image_(\d+)\.png$/);
        return match ? `image_${match[1]}` : '';
      }).filter(Boolean);
    } else {
      // Options => 全option_dictの image_paths を集約
      const dict = currentArea.options_element?.options_dict || {};
      const allPaths: string[] = [];
      Object.values(dict).forEach((opt: any) => {
        (opt.image_paths || []).forEach((pp: string) => {
          const fname = pp.split('/').pop() || '';
          // no_1_options_image_1.png から image_1 を抽出
          const match = fname.match(/no_\d+_options_image_(\d+)\.png$/);
          if (match) allPaths.push(`image_${match[1]}`);
        });
      });
      fromJson = allPaths;
    }

    console.log('Existing filenames:', fromJson); // デバッグログ
    // JSON上にあるファイル名 + ローカルセッション中に割り当てたファイル名
    return [...fromJson, ...usedFilenamesRef.current];
  }, [currentArea, selectedImageType]);

  // =========================================================================
  // (C) 次のファイル名: “image_番号” の最大 + 1
  // =========================================================================
  const getNextFilename = useCallback(
    (existingFilenames: string[]): string => {
      // 例: "image_2" => match[1] = "2"
      const regex = /^image_(\d+)$/;
      let maxNum = 0;
      for (const fn of existingFilenames) {
        const m = fn.match(regex);
        if (m) {
          const num = parseInt(m[1], 10);
          if (num > maxNum) {
            maxNum = num;
          }
        }
      }
      return `image_${maxNum + 1}`;
    },
    []
  );

  // =========================================================================
  // (1) handleMouseDown
  // =========================================================================
  const handleMouseDown = useCallback((e: KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return;
    const pos = stage.getPointerPosition();
    if (!pos) return;

    setStartPos(pos);
    setNewRect(null);
  }, []);

  // =========================================================================
  // (2) handleMouseMove
  // =========================================================================
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

  // =========================================================================
  // (3) handleMouseUp => 矩形確定 + 連番ラベル
  // =========================================================================
  const handleMouseUp = useCallback(() => {
    if (newRect) {
      // 既存ファイル名 + まだサーバー未保存の usedFilenamesRef を合算
      const existing = getExistingFilenames();
      // 新しい番号
      const nextFilename = getNextFilename(existing);

      // 一時管理にも加えておく
      usedFilenamesRef.current.push(nextFilename);

      const labeledRect: DrawnRect = {
        ...newRect,
        label: nextFilename,  // 例: "image_3"
        isCropped: false,
      };
      setRects((prev) => [...prev, labeledRect]);
    }
    setStartPos(null);
    setNewRect(null);
  }, [newRect, getExistingFilenames, getNextFilename]);

  // =========================================================================
  // (4) removeRect
  // =========================================================================
  const removeRect = useCallback((index: number) => {
    setRects((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // =========================================================================
  // (5) updateRectLabel => 手動でラベルを変えたい場合
  // =========================================================================
  const updateRectLabel = useCallback((index: number, newLabel: string) => {
    setRects((prev) =>
      prev.map((item, i) => (i === index ? { ...item, label: newLabel } : item))
    );
  }, []);

  // =========================================================================
  // (6) handleCropRect => ローカルで切り抜き
  // =========================================================================
  const irohaKeysRef = useRef<string[]>(irohaKeys);

  const convertToRelativePath = useCallback((fullPath: string): string => {
    // 例: CREATE_DATA2 ディレクトリ以下を取得する独自ロジック
    const match = fullPath.match(/CREATE_DATA2\/(.*)/);
    return match ? match[1] : fullPath;
  }, []);

  const handleCropRect = useCallback(async (index: number) => {
    if (!image) return;
    if (!currentArea) return;
    const r = rects[index];
    if (!r) return;

    // スケール補正
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

    const dataUrl = offCanvas.toDataURL('image/png');
    const base64str = dataUrl.replace(/^data:image\/(png|jpeg);base64,/, '');

    // Options の場合だけ イロハを順番に割り当て
    let assignedKey = '';
    if (selectedImageType === 'Options') {
      assignedKey = irohaKeysRef.current[irohaIndexRef.current];
      irohaIndexRef.current += 1;
      if (irohaIndexRef.current >= irohaKeysRef.current.length) {
        irohaIndexRef.current = irohaKeysRef.current.length - 1; // or ループ
      }
    }

    // (任意) サーバーでバウンディングボックス検出
    let boundingBoxesFromServer: BoundingBox[] = [];
    let serverBase64 = '';
    try {
      const resp = await axios.post('/ocr_app/api/detect_bounding_box/', {
        image_base64: base64str,
        margin: 20,
        return_base64: true,
        expand_uniformly: true,
        expand_margin: expandMargin,
      });
      boundingBoxesFromServer = resp.data?.bounding_box_result?.bounding_boxes || [];
      serverBase64 = resp.data?.bounding_box_result?.final_img_base64;
    } catch (error) {
      console.error('detect_bounding_box_api error:', error);
    }

    // 元々Rectに付いてた label をそのまま流用
    const rectLabel = r.label || 'image_1';

    // ファイルパス例
    const baseImagePath =
      selectedImageType === 'Question' ? questionImageFullPath || '' : optionsImageFullPath || '';
    const relativeBase = convertToRelativePath(baseImagePath).replace(/[^/]+$/, '');

    const No = currentArea.No?.toString().padStart(1, '0') || '1';
    const imageType = selectedImageType?.toLowerCase() || 'question';
    const finalPath = `${relativeBase}no_${No}_${imageType}_${rectLabel}.png`;

    // croppedImages に登録
    const newCropItem: CroppedImage = {
      label: rectLabel,
      dataUrl,
      boundingBoxes: boundingBoxesFromServer,
      serverCroppedBase64: serverBase64,
      expandMargin: 20,
      selectedIrohaKey: assignedKey,
      serverSavedPath: finalPath,
    };
    setCroppedImages((prev) => [...prev, newCropItem]);

    // rect に isCropped = true を付与
    setRects((prev) =>
      prev.map((obj, i) => (i === index ? { ...obj, isCropped: true } : obj))
    );

    return assignedKey;
  }, [
    image,
    rects,
    currentArea,
    scaledWidth,
    scaledHeight,
    naturalWidth,
    naturalHeight,
    selectedImageType,
    questionImageFullPath,
    optionsImageFullPath,
    convertToRelativePath
  ]);

  // =========================================================================
  // (7) handleSaveRect => サーバーへアップロードして JSON更新
  // =========================================================================
  const handleSaveRect = useCallback(
    async (croppedIndex: number) => {
      const cropItem = croppedImages[croppedIndex];
      if (!cropItem) return;
      if (!currentArea) {
        alert('currentAreaがありません');
        return;
      }
      // originalPathの決定
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
      originalPath = convertToRelativePath(originalPath);

      // base64整形
      const rawBase64 = cropItem.serverCroppedBase64
        ? `data:image/png;base64,${cropItem.serverCroppedBase64}`
        : cropItem.dataUrl;
      const base64str = rawBase64.replace(/^data:image\/(png|jpeg);base64,/, '');

      // labelをそのまま使う
      const labelName = cropItem.label || 'image_1';
      const jsonId = (selectedJsonId || 1).toString();

      try {
        // サーバーAPI
        const { saved_path, updated_json_data } = await uploadCroppedImage({
          originalImagePath: originalPath,
          selectedImageType: (selectedImageType || 'Question').toLowerCase(),
          jsonId,
          No: currentArea.No,           // 例: "4"
          labelName,                    // "image_3" など
          base64: base64str,
          selectedIrohaKey:
            selectedImageType === 'Options' ? cropItem.selectedIrohaKey ?? '' : '',
        });
        console.log('Uploaded =>', saved_path);

        // 成功 => croppedImages を更新（サーバー保存パスを付加）
        setCroppedImages((prev) =>
          prev.map((ci, idx2) => (idx2 === croppedIndex ? { ...ci, serverSavedPath: saved_path } : ci))
        );

        // Context更新 => 最新JSONに置き換える
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

        // 保存後: Rect/CroppedImage を除去する例
        setRects((prev) => prev.filter((r) => !r.isCropped));
        setCroppedImages((prev) => prev.filter((_, idx2) => idx2 !== croppedIndex));
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
      convertToRelativePath
    ]
  );

  // =========================================================================
  // (8) handlePreviewRect
  // =========================================================================
  const handlePreviewRect = useCallback(
    (index: number) => {
      if (!image) return;
      const r = rects[index];
      if (!r) return;

      const offCanvas = document.createElement('canvas');
      offCanvas.width = r.width;
      offCanvas.height = r.height;

      const ctx = offCanvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(image, r.x, r.y, r.width, r.height, 0, 0, r.width, r.height);

      const newTab = window.open('', '_blank');
      if (newTab) {
        newTab.document.write(
          `<img src="${offCanvas.toDataURL('image/png')}" />`
        );
      }
    },
    [rects, image]
  );

  // =========================================================================
  // (9) resetRectsAndCrops
  // =========================================================================
  const resetRectsAndCrops = useCallback(() => {
    setRects([]);
    setCroppedImages([]);
    usedFilenamesRef.current = [];
    irohaIndexRef.current = 0;
  }, []);

  // =========================================================================
  // (10) return API
  // =========================================================================
  return {
    rects,
    newRect,
    croppedImages,
    setCroppedImages,

    handleMouseDown,
    handleMouseMove,
    handleMouseUp,

    removeRect,
    handlePreviewRect,
    handleCropRect,
    handleSaveRect,

    resetRectsAndCrops,
    updateRectLabel,
  };
}