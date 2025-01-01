// src/ocr_app/OcrDashboard.tsx
import React, { useState, useContext } from 'react';
import { Tabs, Tab } from '@mui/material';

import { JsonDataContext } from './Context/JsonDataContext';
import JsonManager from './JsonManager/JsonManager';
import JsonDetailView from './jsonview/JsonDetailView';
import ManualCorrection from './correction/ManualCorrection';
import AreaSelectionCanvas from './konva/AreaSelectionCanvas'; // Canvas追加
import ExamImportForm from './exportJSON/ExamImportForm';
import MarkdownEditorTab from './markdownEditor/MarkdownEditorTab';

const OcrDashboard: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);

  // Contextから状態を取得
  const {
    selectedJsonId,
    selectedJsonData,
    loading,
    error,
  } = useContext(JsonDataContext);

  // タブ切り替え
  const handleChangeTab = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <div style={{ padding: '1rem' }}>
      <header style={{ marginBottom: '1rem', position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 100 }}>
        <p>Selected JSON ID: {selectedJsonId ?? 'None'}</p>
      </header>

      <Tabs 
        value={tabValue} 
        onChange={handleChangeTab}
        style={{ position: 'sticky', top: '1rem', backgroundColor: 'white', zIndex: 99 }}
      >
        <Tab label="JSON Manager" />
        <Tab label="Detail" />
        <Tab label="Correction" />
        <Tab label="Canvas" /> 
        <Tab label="Exam Import" /> 
        <Tab label="Markdown Editor" /> 
      </Tabs>

      {/* 0: JSON Manager */}
      {tabValue === 0 && (
        <JsonManager />
      )}

      {/* 1: Detail */}
      {tabValue === 1 && (
        selectedJsonId ? (
          <div style={{ marginTop: '1rem' }}>
            {loading && <p>Loading JSON detail...</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {selectedJsonData && !loading && (
              <JsonDetailView />
            )}
          </div>
        ) : (
          <p style={{ marginTop: '1rem' }}>No JSON selected.</p>
        )
      )}

      {/* 2: Correction */}
      {tabValue === 2 && (
        selectedJsonId ? (
          <div style={{ marginTop: '1rem' }}>
            {loading && <p>Loading JSON detail...</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {selectedJsonData && !loading && (
              <ManualCorrection　/>
            )}
          </div>
        ) : (
          <p style={{ marginTop: '1rem' }}>No JSON selected.</p>
        )
      )}

      {/* 3: Canvas (Konva) */}
      {tabValue === 3 && (
        selectedJsonId ? (
          <div style={{ marginTop: '1rem' }}>
            {loading && <p>Loading JSON detail...</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {/* 
              ここで selectedJsonData.areas を実際に用いるコンポーネントを呼び出す
              例: <AreaSelectionCanvas />
            */}
            {selectedJsonData && !loading && (
              <AreaSelectionCanvas />
            )}
          </div>
        ) : (
          <p style={{ marginTop: '1rem' }}>No JSON selected.</p>
        )
      )}

      {tabValue === 4 && (
        selectedJsonId ? (
          <div style={{ marginTop: '1rem' }}>
            {loading && <p>Loading JSON detail...</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {/* 
              ここで selectedJsonData.areas を実際に用いるコンポーネントを呼び出す
              例: <AreaSelectionCanvas />
            */}
            {selectedJsonData && !loading && (
              <ExamImportForm />
            )}
          </div>
        ) : (
          <p style={{ marginTop: '1rem' }}>No JSON selected.</p>
        )
      )}

      {/* 5: Markdown Editor Tab */}
      {tabValue === 5 && (
        selectedJsonId ? (
          <div style={{ marginTop: '1rem' }}>
            {loading && <p>Loading JSON detail...</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {selectedJsonData && !loading && (
              <MarkdownEditorTab />
            )}
          </div>
        ) : (
          <p style={{ marginTop: '1rem' }}>No JSON selected.</p>
        )
      )}
    </div>
  );
};

export default OcrDashboard;