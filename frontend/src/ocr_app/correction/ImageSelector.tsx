// src/ocr_app/correction/ImageSelector.tsx

import React from 'react';
import { Area } from '../types';

interface Props {
  areaList: Area[];        // ManualCorrectionから受け取る「Area配列」
  selectedAreaIndex: number;
  onSelectArea: (index: number) => void;
}

/**
 * 左ペインでArea一覧を表示し、選択されたindexを親コンポーネントへ通知する
 */
const ImageSelector: React.FC<Props> = ({ areaList, selectedAreaIndex, onSelectArea }) => {
  return (
    <div style={{ padding: '0.5rem' }}>
      <h3>Area List</h3>
      {areaList.map((item, idx) => (
        <div
          key={idx}
          style={{
            cursor: 'pointer',
            marginBottom: '8px',
            fontWeight: idx === selectedAreaIndex ? 'bold' : 'normal',
            textDecoration: idx === selectedAreaIndex ? 'underline' : 'none',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
          onClick={() => onSelectArea(idx)}
        >
          {/* 単にAreaのNoだけ表示 */}
          Area No: {item.No}
        </div>
      ))}
    </div>
  );
};

export default ImageSelector;