// src/ocr_app/konva/components/RectRow.tsx

import React from 'react';
import { Button } from '@mui/material';
import { DrawnRect } from '../hooks/useRectController';

interface RectRowProps {
  index: number;
  rect: DrawnRect;
  onPreview: (index: number) => void;
  onCrop: (index: number) => void;
  onSave: (index: number) => void;
  onRemove: (index: number) => void;
}

const RectRow: React.FC<RectRowProps> = ({
  index,
  rect,
  onPreview,
  onCrop,
  onSave,
  onRemove,
}) => {
  const { x, y, width, height, label, isCropped } = rect;

  return (
    <div style={{ marginBottom: '0.5rem' }}>
      <span>
        #{index + 1} <strong>{label || 'image_unknown'}</strong>
        {` (x:${Math.round(x)}, y:${Math.round(y)}, w:${Math.round(width)}, h:${Math.round(height)})`}
      </span>
      {/* Previewボタン */}
      <Button
        variant="outlined"
        size="small"
        style={{ marginLeft: '0.5rem' }}
        onClick={() => onPreview(index)}
      >
        Preview
      </Button>

      {/* Cropボタン */}
      {!isCropped && (
        <Button
          variant="contained"
          size="small"
          color="primary"
          style={{ marginLeft: '0.5rem' }}
          onClick={() => onCrop(index)}
        >
          Crop
        </Button>
      )}

      {/* Saveボタン (Crop後にのみ表示) */}
      {isCropped && (
        <Button
          variant="contained"
          size="small"
          color="success"
          style={{ marginLeft: '0.5rem' }}
          onClick={() => onSave(index)}
        >
          Save
        </Button>
      )}

      {/* Rect削除ボタン */}
      <Button
        variant="outlined"
        size="small"
        color="error"
        style={{ marginLeft: '0.5rem' }}
        onClick={() => onRemove(index)}
      >
        Remove
      </Button>
    </div>
  );
};

export default RectRow;