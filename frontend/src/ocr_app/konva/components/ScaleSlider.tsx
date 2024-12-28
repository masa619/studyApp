// src/ocr_app/konva/ScaleSlider.tsx
import React from 'react';
import { Slider } from '@mui/material';

interface Props {
  scale: number;
  setScale: (val: number) => void;
}

const ScaleSlider: React.FC<Props> = ({ scale, setScale }) => {
  const handleSliderChange = (event: any, newVal: number | number[]) => {
    if (typeof newVal === 'number') {
      setScale(newVal);
    }
  };

  return (
    <div style={{ width: 300, marginBottom: '1rem' }}>
      <p>Scale: {scale.toFixed(2)}</p>
      <Slider
        min={0.5}
        max={2.0}
        step={0.1}
        value={scale}
        onChange={handleSliderChange}
        valueLabelDisplay="auto"
        style={{ width: '100%' }} 
      />
    </div>
  );
};

export default ScaleSlider;