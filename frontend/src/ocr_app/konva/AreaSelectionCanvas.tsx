// src/ocr_app/konva/AreaSelectionCanvas.tsx

import React, { useState, useEffect, useContext, useRef } from 'react';
import { Stage, Layer, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';
import { Button, Select, MenuItem, FormControl, InputLabel } from '@mui/material';

import { JsonDataContext } from '../Context/JsonDataContext';
import { convertToMediaUrl } from '../utils/convertToMediaUrl';
import ImageSelector from '../correction/ImageSelector';

import { useRectController } from './hooks/useRectController';
import ScaleSlider from './components/ScaleSlider';
import RectList from './components/RectList';
import RectRow from './components/RectRow';
import SingleCroppedImagePreview from './components/SingleCroppedImagePreview';
import { deleteCroppedImage } from './services/uploadService'; // 削除API

const DEFAULT_BASE_WIDTH = 600;

const AreaSelectionCanvas: React.FC = () => {
  // ========== 1) Context & State ==========
  const { selectedJsonId, selectedJsonData, setSelectedJsonData, selectedAreaIndex, setSelectedAreaIndex } = useContext(JsonDataContext);
  const areaList = selectedJsonData?.json_data?.areas || [];
  const currentArea = areaList[selectedAreaIndex || 0];

  // "Question" / "Options" 切り替え
  const [selectedImageType, setSelectedImageType] =
    useState<'Question' | 'Options'>('Question');

  // ========== 2) 既存画像を配列で参照 ==========
  const questionImagePaths = currentArea?.question_element?.image_paths || [];
  const optionsImagePaths = (() => {
    const od = currentArea?.options_element?.options_dict;
    if (!od) return [];
    // 例: {"イ": { text: "1", image_paths: [...] }, "ロ": {...}, ...}
    return Object.values(od).flatMap((v: any) => v?.image_paths || []);
  })();
  // 選択タイプに応じて表示用の配列を切り替える
  const existingImages =
    selectedImageType === 'Question' ? questionImagePaths : optionsImagePaths;

  // ========== 3) 表示する画像URLを決める ==========
  // question_image_fullPath / options_image_fullPath (単数キー) もあり得ますが、
  // とりあえず最初に表示するのは "Question" を初期とする例
  const questionImageFullPath = convertToMediaUrl(currentArea?.question_image_path || '');
  const optionsImageFullPath = convertToMediaUrl(currentArea?.options_image_path || '');
  const areaImageFullPath = convertToMediaUrl(currentArea?.area_image_path || '');

  // selectedImageType により Canvas の表示対象を切り替え
  const [imageUrl, setImageUrl] = useState<string>(questionImageFullPath);
  const [image, status] = useImage(imageUrl, 'anonymous');

  useEffect(() => {
    if (selectedImageType === 'Question') {
      setImageUrl(questionImageFullPath);
    } else {
      setImageUrl(optionsImageFullPath);
    }
  }, [selectedImageType, questionImageFullPath, optionsImageFullPath]);

  // ========== 4) Canvasスケール管理 ==========
  const [scale, setScale] = useState(1.0);
  const [naturalWidth, setNaturalWidth] = useState(0);
  const [naturalHeight, setNaturalHeight] = useState(0);
  const [expandMargin, setExpandMargin] = useState(50);  // デフォルト値50

  useEffect(() => {
    if (status === 'loaded' && image) {
      console.log('image loaded: ', image.naturalWidth, image.naturalHeight);
      setNaturalWidth(image.naturalWidth);
      setNaturalHeight(image.naturalHeight);
    }
  }, [status, image]);

  const scaledWidth = naturalWidth > 0 ? naturalWidth * scale : 0;
  const scaledHeight = naturalHeight > 0 ? naturalHeight * scale : 0;

  // ========== 5) 矩形管理フック ==========
  const {
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
  } = useRectController(
    image || null,
    naturalWidth,
    naturalHeight,
    scaledWidth,
    scaledHeight,
    questionImageFullPath,
    optionsImageFullPath,
    selectedImageType,
    currentArea,
    expandMargin  // expandMarginを渡す
  );

  // ========== 6) 既存画像の削除 ==========
  const handleDeleteRegisteredImage = async (filePath: string) => {
    if (!currentArea) return;
    if (!selectedJsonData) return;

    const jsonId = selectedJsonData?.id?.toString() || '1';
    const No = currentArea?.No?.toString() || '1';

    try {
      const resp = await deleteCroppedImage({
        selectedImageType: selectedImageType.toLowerCase(),
        jsonId,
        No,
        filePath,
      });

      // Context更新 => 最新JSONに置き換える
      if (setSelectedJsonData) {
        setSelectedJsonData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            json_data: resp.updated_json_data,
          };
        });
        alert('Deleted successfully');
      }
    } catch (error) {
      console.error('handleDeleteRegisteredImage error:', error);
      alert('Error while deleting image');
    }
  };

  // ========== 7) エリア画像を表示する ==========
  const handleUseAreaImagePath = () => {
    if (areaImageFullPath) {
      setImageUrl(areaImageFullPath);
    } else {
      alert('area_image_path がありません');
    }
  };

  // リセット
  const handleReset = () => {
    resetRectsAndCrops();
  };

  // ========== 8) レンダリング ==========
  return (
    <div style={{ border: '1px solid #ccc', padding: '1rem', display: 'flex', gap: '1rem' }}>
      {/* ========== (左ペイン) ========== */}
      <div style={{ width: 220, borderRight: '1px solid #ccc', marginRight: '1rem' }}>
        {/* Area選択 UI (例: ImageSelector) */}
        <ImageSelector
          areaList={areaList}
          selectedAreaIndex={selectedAreaIndex || 0}
          onSelectArea={setSelectedAreaIndex}
        />

        {/* 既存画像一覧 (複数) + Deleteボタン */}
        {existingImages.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <h4>Registered Images</h4>
            {existingImages.map((imgPath: string, idx: number) => (
              <div key={idx} style={{ marginBottom: '0.5rem' }}>
                <img
                  src={convertToMediaUrl(imgPath)}
                  alt={`registered_${idx}`}
                  style={{ maxWidth: '100%', display: 'block', marginBottom: '0.25rem' }}
                />
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => handleDeleteRegisteredImage(imgPath)}
                >
                  DELETE
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========== (右ペイン) ========== */}

      <div style={{ flex: 1 }}>
        <h3>Area Selection (Canvas)</h3>
        {/* ImageType切り替え */}
        <div style={{ marginTop: '1rem' }}>
          <FormControl size="small" style={{ marginBottom: '1rem', marginRight: '1rem' }}>
            <InputLabel id="image-type-label">Image Type</InputLabel>
            <Select
              labelId="image-type-label"
              value={selectedImageType}
              label="Image Type"
              onChange={(e) => setSelectedImageType(e.target.value as 'Question' | 'Options')}
              style={{ width: 120 }}
            >
              <MenuItem value="Question">Question</MenuItem>
              <MenuItem value="Options">Options</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" style={{ marginBottom: '1rem' }}>
            <InputLabel id="expand-margin-label">Expand Margin</InputLabel>
            <Select
              labelId="expand-margin-label"
              value={expandMargin}
              label="Expand Margin"
              onChange={(e) => setExpandMargin(Number(e.target.value))}
              style={{ width: 120 }}
            >
              <MenuItem value={2}>2px</MenuItem>
              <MenuItem value={5}>5px</MenuItem>
              <MenuItem value={10}>10px</MenuItem>
              <MenuItem value={20}>20px</MenuItem>
              <MenuItem value={30}>30px</MenuItem>
              <MenuItem value={40}>40px</MenuItem>
              <MenuItem value={50}>50px (Default)</MenuItem>
              <MenuItem value={60}>60px</MenuItem>
              <MenuItem value={70}>70px</MenuItem>
            </Select>
          </FormControl>
        </div>
        <ScaleSlider scale={scale} setScale={setScale} />

        <p>
          scaledWidth: {scaledWidth}, scaledHeight: {scaledHeight} <br />
          naturalWidth: {naturalWidth}, naturalHeight: {naturalHeight}
        </p>

        {/* Konva Stage */}
        <div
          style={{
            width: scaledWidth,
            height: scaledHeight,
            border: '1px solid gray',
            overflow: 'hidden',
          }}
        >
          <Stage
            width={scaledWidth}
            height={scaledHeight}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            style={{ backgroundColor: '#fefefe' }}
          >
            <Layer>
              {/* 背景画像 */}
              {image && (
                <KonvaImage
                  image={image}
                  x={0}
                  y={0}
                  width={scaledWidth}
                  height={scaledHeight}
                />
              )}
              {/* 確定済みRect */}
              <RectList
                rects={rects}
                strokeColor="red"
                fillColor="rgba(255,0,0,0.1)"
                onRectClick={(i) => removeRect(i)}
              />
              {/* ドラッグ中Rect */}
              {newRect && (
                <RectList
                  rects={[newRect]}
                  strokeColor="blue"
                  fillColor="rgba(0,0,255,0.1)"
                />
              )}
            </Layer>
          </Stage>
        </div>

        {/* Drawn Rectangles (各Rectの操作UI) */}
        <div style={{ marginTop: '1rem' }}>
          <h4>Drawn Rectangles</h4>
          {rects.length === 0 ? (
            <p>None</p>
          ) : (
            rects.map((r, i) => (
              <RectRow
                key={i}
                index={i}
                rect={r}
                onPreview={handlePreviewRect}
                onCrop={handleCropRect}
                onSave={handleSaveRect}
                onRemove={removeRect}
              />
            ))
          )}
        </div>

        {/* Cropped Images */}
        {croppedImages.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <h4>Cropped Images</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
              {croppedImages.map((ci, idx) => (
                <SingleCroppedImagePreview 
                  key={idx} 
                  cropItem={ci} 
                  scale={1.0} 
                  onLabelChange={(newLabel: string) => {
                    // croppedImagesの更新
                    const newCroppedImages = [...croppedImages];
                    newCroppedImages[idx] = { ...newCroppedImages[idx], label: newLabel };
                    setCroppedImages(newCroppedImages);
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* ボタン */}
        <div style={{ marginTop: '1rem' }}>
          <Button
            variant="contained"
            color="primary"
            style={{ marginRight: '0.5rem' }}
            onClick={handleUseAreaImagePath}
          >
            USE AREA_IMAGE_PATH
          </Button>
          <Button variant="contained" color="secondary" onClick={handleReset}>
            RESET
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AreaSelectionCanvas;