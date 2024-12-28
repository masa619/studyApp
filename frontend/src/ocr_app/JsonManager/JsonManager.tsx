// src/ocr_app/JsonManager/JsonManager.tsx
import React, { useContext } from 'react';
import { JsonDataContext } from '../Context/JsonDataContext';
import JsonList from './JsonList';
import JsonUploader from './JsonUploader';

const JsonManager: React.FC = () => {
  // Contextから操作関数を取得
  const { setSelectedJsonId } = useContext(JsonDataContext);

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1rem' }}>
      <h2>JSON Manager</h2>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <div style={{ flex: 2 }}>
          <JsonList onSelectJson={(id) => setSelectedJsonId(id)} />
        </div>
        <div style={{ flex: 1, border: '1px solid #ccc', padding: '1rem', borderRadius: '4px' }}>
          <JsonUploader />
        </div>
      </div>
    </div>
  );
};

export default JsonManager;