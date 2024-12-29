// src/ocr_app/konva/components/SingleCroppedImagePreview.tsx

import React, { useState, useRef, useCallback, useEffect } from 'react';

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
  dataUrl: string;
  boundingBoxes?: BoundingBox[];
  serverCroppedBase64?: string;
  serverSavedPath?: string;
  expandMargin?: number;
  selectedIrohaKey?: string;
}

interface ToggledBoundingBox extends BoundingBox {
  isVisible: boolean; // 表示/非表示フラグ
}

interface Props {
  cropItem: CroppedImage;
  scale?: number;
  children?: React.ReactNode; // Saveボタン等を子要素で受け取る用
}

const SingleCroppedImagePreview: React.FC<Props> = ({ cropItem, scale = 1, children }) => {
  // 「サーバーで処理後の画像」があればそれを優先、それが無ければフロントのdataUrlを使う
  const finalSrc = cropItem.serverCroppedBase64
    ? `data:image/png;base64,${cropItem.serverCroppedBase64}`
    : cropItem.dataUrl;
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });

  const [selectedKey, setSelectedKey] = useState<string>(cropItem.selectedIrohaKey || '');

  // serverSavedPathなども表示するなら拡張可能
  const filteredBoxes = (cropItem.boundingBoxes || []).filter(
    (bb) => bb.label !== 'final_box'
  );

  const [boxStates, setBoxStates] = useState<ToggledBoundingBox[]>(() =>
    filteredBoxes.map((bb) => ({ ...bb, isVisible: true }))
  );

  useEffect(() => {
    setSelectedKey(cropItem.selectedIrohaKey || '');
  }, [cropItem.selectedIrohaKey]);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newKey = e.target.value;    // "イ" "ロ" "ハ" "ニ" または空
    setSelectedKey(newKey);
    // CroppedImage側にも反映しておき、後で handleSaveRect で送信できるようにする
    cropItem.selectedIrohaKey = newKey;
  };

  const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    setNaturalSize({ width: naturalWidth, height: naturalHeight });
  }, []);

  const toggleBoxVisibility = useCallback((index: number) => {
    setBoxStates((prev) =>
      prev.map((box, i) => {
        if (i === index) {
          return { ...box, isVisible: !box.isVisible };
        }
        return box;
      })
    );
  }, []);

  // boundingBoxes が変われば再初期化
  useEffect(() => {
    setBoxStates(filteredBoxes.map((bb) => ({ ...bb, isVisible: true })));
  }, [cropItem.boundingBoxes]);

  const expandMargin = cropItem.expandMargin ?? 0;

  return (
    <div style={{ border: '1px solid #ccc', padding: '0.5rem', display: 'inline-block' }}>
      <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
        {cropItem.label}
      </div>

      {/* イロハニのSelect UI */}
      <div style={{ marginBottom: '0.5rem' }}>
        <label>選択キー: </label>
        <select value={selectedKey} onChange={handleSelectChange} style={{ marginLeft: '4px' }}>
          <option value="">(選択なし)</option>
          <option value="イ">イ</option>
          <option value="ロ">ロ</option>
          <option value="ハ">ハ</option>
          <option value="ニ">ニ</option>
        </select>
      </div>

      {/* ボックスごとの Show/Hide */}
      {boxStates.length > 0 && (
        <div style={{ marginBottom: '0.5rem' }}>
          {boxStates.map((box, idx) => (
            <button
              key={idx}
              onClick={() => toggleBoxVisibility(idx)}
              style={{
                marginRight: '0.5rem',
                cursor: 'pointer',
                backgroundColor: box.isVisible ? '#e0f7fa' : '#ffe0e0',
              }}
            >
              {box.isVisible ? 'Hide' : 'Show'} [{box.label || 'box'}]
            </button>
          ))}
        </div>
      )}

      {/* 画像表示 */}
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <img
          ref={imgRef}
          src={finalSrc}
          alt={cropItem.label}
          onLoad={handleImageLoad}
          style={{
            display: 'block',
            width: naturalSize.width > 0 ? naturalSize.width * scale : 'auto',
            height: 'auto',
            outline: '2px solid #888',
            outlineOffset: '-2px',
          }}
        />
        {/* boundingBoxes */}
        {boxStates.map((bb, bIndex) => {
          if (!bb.isVisible) return null;
          const offsetX = expandMargin;
          const offsetY = expandMargin;

          const styleBox: React.CSSProperties = {
            position: 'absolute',
            border: `3px solid ${bb.color || 'blue'}`,
            pointerEvents: 'none',
            left: (bb.x + offsetX) * scale,
            top: (bb.y + offsetY) * scale,
            width: bb.width * scale,
            height: bb.height * scale,
          };

          return <div key={bIndex} style={styleBox} />;
        })}
      </div>

      {/* natural size 表示 */}
      {naturalSize.width > 0 && (
        <div style={{ fontSize: '0.75em', marginTop: '0.5rem' }}>
          (natural size: {naturalSize.width} x {naturalSize.height})
        </div>
      )}
      {/* serverSavedPathがあれば表示 */}
      {cropItem.serverSavedPath && (
        <div style={{ marginTop: '0.5rem', fontSize: '0.8em', color: '#666' }}>
          SavedPath: {cropItem.serverSavedPath}
        </div>
      )}
      {children}
    </div>
  );
};

export default SingleCroppedImagePreview;