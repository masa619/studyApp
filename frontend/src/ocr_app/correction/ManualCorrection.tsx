// src/ocr_app/correction/ManualCorrection.tsx

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { InputJSONData, Area } from '../types';
import ImageSelector from './ImageSelector';
import CorrectionDetail from './CorrectionDetail';

interface ManualCorrectionProps {
  jsonId: number;
  jsonData: InputJSONData; // { id, description, json_data: { areas: Area[] } }
}

/**
 * ManualCorrection コンポーネント:
 * - 左ペイン: Area一覧 (ImageSelector)
 * - 右ペイン: 選択したAreaの詳細表示 + OCRボタン + 一括保存
 */
const ManualCorrection: React.FC<ManualCorrectionProps> = ({ jsonId, jsonData }) => {
  // ローカルで編集するためのState
  const [localData, setLocalData] = useState<InputJSONData>(jsonData);

  // 選択中のAreaのインデックス
  const [selectedAreaIndex, setSelectedAreaIndex] = useState(0);

  // ステータスメッセージ (画面上部に表示)
  const [message, setMessage] = useState('');

  // CorrectionDetail ref
  const correctionDetailRef = useRef<{
    handleSaveAllOcr: () => Promise<void>;
    getQuestionFullText: () => string;
    getOptionsFullText: () => string;
  }>(null);

  // jsonDataが切り替わったら初期化
  useEffect(() => {
    setLocalData(jsonData);
    setMessage('');
    setSelectedAreaIndex(0);
  }, [jsonData]);

  // 単純化: areas配列を直接取得
  const areaList = localData.json_data?.areas || [];
  const currentArea: Area | undefined = areaList[selectedAreaIndex];

  // 左ペインでAreaを選択したときの処理
  const handleSelectArea = (idx: number) => {
    setSelectedAreaIndex(idx);
  };

  // 選択中のAreaオブジェクトを更新する
  const handleUpdateArea = (updatedArea: Area, areaIndex: number) => {
    const updated = { ...localData };
    const newAreas = [...(updated.json_data?.areas || [])];

    newAreas[areaIndex] = updatedArea;
    updated.json_data.areas = newAreas;

    setLocalData(updated);
  };

  /**
   * 単一画像に対して OCR をリクエストする (trigger_ocr_for_image_single)
   * imagePathを指定してOCR実行 → 結果の full_text を対象のエリアにセット → 再描画
   */
  const handleRunSingleOCR = async (imagePath: string | undefined) => {
    if (!imagePath) {
      setMessage('imagePathがありません');
      return;
    }
    setMessage('Running single OCR...');
    try {
      const resp = await axios.post('http://localhost:8000/ocr_app/api/trigger_ocr_for_image_single', {
        image_path: imagePath,
      });
      setMessage(`Single OCR response: ${resp.data.detail ?? 'no detail'}`);

      // 取得したフルテキスト等をStateに反映して再描画
      if (resp.data.full_text && currentArea) {
        // currentAreaをコピーして書き換え
        const updatedArea = { ...currentArea };

        // どの画像をOCRしたかで更新先を切り替え
        if (imagePath === currentArea.question_image_path) {
          // 質問テキストを更新
          updatedArea.question_element.text = resp.data.full_text;
        } else if (imagePath === currentArea.options_image_path) {
          // オプションテキストを更新
          updatedArea.options_element.text = resp.data.full_text;
        }
        // (必要に応じて question_image_paths / options_image_paths への対応を追加)

        // 更新したAreaをStateへ反映 → CorrectionDetailに再描画される
        handleUpdateArea(updatedArea, selectedAreaIndex);
      }
    } catch (error: any) {
      console.error(error);
      setMessage(`Single OCR failed: ${error.message || String(error)}`);
    }
  };

  /**
   * 一括保存 (OCR + JSON更新) のフロー
   *  1) CorrectionDetail内でOCR結果を保存
   *  2) CorrectionDetailから取得したテキストを JSON に反映
   *  3) JSONをPUT更新
   */
  const handleSaveAll = async () => {
    try {
      setMessage('Saving...');

      // (A) CorrectionDetailのOCRResultをまとめて保存
      if (correctionDetailRef.current) {
        await correctionDetailRef.current.handleSaveAllOcr();
      }

      // (B) OCR テキストを JSON に反映（ここでは現在選択中Areaのみ反映）
      const qText = correctionDetailRef.current?.getQuestionFullText() ?? '';
      const oText = correctionDetailRef.current?.getOptionsFullText() ?? '';

      if (currentArea) {
        const updatedLocalData = { ...localData };
        const newAreas = [...updatedLocalData.json_data.areas];
        const targetArea = { ...newAreas[selectedAreaIndex] };

        // OCR結果を JSONの question_element / options_element に反映
        targetArea.question_element.text = qText;
        targetArea.options_element.text = oText;

        newAreas[selectedAreaIndex] = targetArea;
        updatedLocalData.json_data.areas = newAreas;
        setLocalData(updatedLocalData);

        // (C) JSONをPUT更新
        const payload = {
          description: updatedLocalData.description,
          json_data: {
            areas: updatedLocalData.json_data.areas,
          },
        };
        await axios.put(`http://localhost:8000/ocr_app/api/input_json/${jsonId}/`, payload);

        setMessage('Saved successfully! (OCR + JSON)');
      }
    } catch (error: any) {
      console.error(error);
      setMessage(`Save failed: ${error.message || String(error)}`);
    }
  };

  // ボタンスタイル (サンプル)
  const baseButtonStyle: React.CSSProperties = {
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    marginRight: '1rem',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
    transition: 'background-color 0.3s ease',
  };

  const questionButtonStyle: React.CSSProperties = {
    ...baseButtonStyle,
    backgroundColor: '#007BFF',
    color: '#fff',
  };

  const optionsButtonStyle: React.CSSProperties = {
    ...baseButtonStyle,
    backgroundColor: '#28A745',
    color: '#fff',
    marginRight: 0, // 最後は不要
  };

  const saveAllButtonStyle: React.CSSProperties = {
    ...baseButtonStyle,
    backgroundColor: '#FF5722',
    color: '#fff',
    marginRight: 0,
    marginTop: '1rem',
  };

  return (
    <div style={{ display: 'flex', gap: '1rem' }}>
      {/* 左カラム: Area一覧 */}
      <div style={{ width: '220px', borderRight: '1px solid #ccc' }}>
        <ImageSelector
          areaList={areaList}
          selectedAreaIndex={selectedAreaIndex}
          onSelectArea={handleSelectArea}
        />
      </div>

      {/* 右カラム: 詳細エリア */}
      <div style={{ flex: 1, padding: '1rem' }}>
        <h2>Manual Correction for JSON ID: {jsonId}</h2>

        {/* メッセージ表示欄 */}
        {message && <p style={{ color: 'blue' }}>{message}</p>}

        {currentArea ? (
          <>
            {/* OCRトリガーボタン (Question / Options) */}
            <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => handleRunSingleOCR(currentArea.question_image_path)}
                style={questionButtonStyle}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#0056b3';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#007BFF';
                }}
              >
                Run OCR (Question)
              </button>

              <button
                onClick={() => handleRunSingleOCR(currentArea.options_image_path)}
                style={optionsButtonStyle}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#218838';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#28A745';
                }}
              >
                Run OCR (Options)
              </button>
            </div>

            {/* 選択中のArea詳細 (CorrectionDetail) */}
            <CorrectionDetail
              ref={correctionDetailRef}
              area={currentArea}
              areaIndex={selectedAreaIndex}
              onUpdateArea={handleUpdateArea}
            />

            {/* 一括保存ボタン */}
            <button
              onClick={handleSaveAll}
              style={saveAllButtonStyle}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#e64a19';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#FF5722';
              }}
            >
              Save All Changes (OCR + JSON)
            </button>
          </>
        ) : (
          <p>No area selected</p>
        )}
      </div>
    </div>
  );
};

export default ManualCorrection;