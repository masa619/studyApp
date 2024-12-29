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
 * - 右ペイン: 選択したAreaの CorrectionDetail (OCR + JSON編集)
 * - "Run OCR" ボタン でサーバーに対し /api/trigger_ocr(mode=single) を呼ぶ
 * - "Save All Changes" ボタン で JSON を PUT 更新
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
    getQuestionOcrText: () => string;
    getOptionsOcrText: () => string;
  }>(null);

  // jsonData が切り替わったら初期化
  useEffect(() => {
    setLocalData(jsonData);
    setMessage('');
    setSelectedAreaIndex(0);
  }, [jsonData]);

  // areas配列を直接取得
  const areaList = localData.json_data?.areas || [];
  const currentArea: Area | undefined = areaList[selectedAreaIndex];

  // 選択肢の分割結果を保持するState
  const [optionCheckResult, setOptionCheckResult] = useState<any>(null);

  // 左ペインでAreaを選択
  const handleSelectArea = (idx: number) => {
    setSelectedAreaIndex(idx);
  };

  // 選択中のAreaオブジェクトを更新
  const handleUpdateArea = (updatedArea: Area, areaIndex: number) => {
    const updated = { ...localData };
    const newAreas = [...(updated.json_data.areas || [])];
    newAreas[areaIndex] = updatedArea;
    updated.json_data.areas = newAreas;
    setLocalData(updated);
  };

  /**
   * 単一画像OCR
   * => /api/trigger_ocr  (mode=single, image_type=question|options)
   * => normalized_text が返ってくる
   * => ここでは CorrectionDetail 内のUI に反映させるのではなく、
   *    JSONの text を直接上書きする（要件次第）
   *    or CorrectionDetail でサーバーから再取得し反映させる運用も可
   */
  const handleRunSingleOCR = async (
    imagePath: string | undefined,
    imageType: 'question' | 'options'
  ) => {
    if (!imagePath) {
      setMessage('imagePathがありません');
      return;
    }
    setMessage('Running single OCR...');
    try {
      const payload = {
        mode: 'single',
        image_path: imagePath,
        image_type: imageType,
        force_rerun: false,
      };
      const resp = await axios.post('http://localhost:8000/ocr_app/api/trigger_ocr', payload);
      const data = resp.data;
      if (!data || !data.results || !Array.isArray(data.results)) {
        setMessage('Unexpected response format');
        return;
      }
      const [ocrResult] = data.results;
      if (!ocrResult) {
        setMessage('No OCR result returned');
        return;
      }

      if (ocrResult.status === 'done') {
        const fullText = ocrResult.normalized_text || ocrResult.full_text || '';
        setMessage(`Single OCR success: ${fullText.substring(0, 30)}...`);

        // 選択肢の分割結果を更新
        if (ocrResult.option_check_result) {
          setOptionCheckResult(ocrResult.option_check_result);
          console.log(ocrResult.option_check_result);
        } else {
          // options じゃない場合などは null になるかも
          setOptionCheckResult(null);
        }

      } else if (ocrResult.status === 'error') {
        setMessage(`OCR error: ${ocrResult.error_message ?? 'no error message'}`);
      } else {
        setMessage(`OCR status: ${ocrResult.status}`);
      }
    } catch (error: any) {
      console.error(error);
      setMessage(`Single OCR failed: ${error.message || String(error)}`);
    }
  };

  /**
   * 一括保存 (OCR + JSON更新) のフロー
   * 1) CorrectionDetail内で OCR結果を一括PUT
   * 2) CorrectionDetailから取得した JSON用テキストを localData に反映
   * 3) 最後に JSONをPUT更新
   */
  const handleSaveAll = async () => {
    try {
      setMessage('Saving...');
      // (A) CorrectionDetail の OCR結果を保存 (normalized_text)
      if (correctionDetailRef.current) {
        await correctionDetailRef.current.handleSaveAllOcr();
      }
      
      // (B) CorrectionDetailから取得したテキストを JSON に反映
      const qText = correctionDetailRef.current?.getQuestionOcrText() ?? '';
      const oText = correctionDetailRef.current?.getOptionsOcrText() ?? '';
      console.log("qText", qText);

      if (currentArea) {
        const updatedLocalData = { ...localData };
        const newAreas = [...updatedLocalData.json_data.areas];
        const targetArea = { ...newAreas[selectedAreaIndex] };

        // JSON の question_element / options_element を上書き
        targetArea.question_element.text = qText;
        targetArea.options_element.text = oText;
        console.log("targetArea.question_element.text", targetArea.question_element.text);
        console.log("targetArea.options_element.text", targetArea.options_element.text);
        if (optionCheckResult?.lines && typeof optionCheckResult.lines === 'object') {
          // 「イ,ロ,ハ,ニ」など各キーに対して text を更新
          const odict = { ...targetArea.options_element.options_dict };
          for (const [k, v] of Object.entries(optionCheckResult.lines)) {
            // 万が一定義がなければ初期化
            if (!odict[k]) {
              odict[k] = { text: '', image_paths: [] };
            }
            odict[k].text = v as string || '';
          }
          targetArea.options_element.options_dict = odict;
        }
        // ▲▲▲▲▲▲
        newAreas[selectedAreaIndex] = targetArea;
        updatedLocalData.json_data.areas = newAreas;
        setLocalData(updatedLocalData);

        // (C) JSONをPUT更新
        const payload = {
          json_id: jsonId,
          area_id: currentArea.area_id,
          description: updatedLocalData.description,
          json_data: {
            areas: updatedLocalData.json_data.areas,
          },
        };
        await axios.put(`http://localhost:8000/ocr_app/api/input_json/${jsonId}/`, payload);

        setMessage('Saved successfully! (OCR + JSON using normalized text)');
      }
    } catch (error: any) {
      console.error(error);
      setMessage(`Save failed: ${error.message || String(error)}`);
    }
  };

  // ボタンスタイル例
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
    marginRight: 0,
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
      {/* === 左カラム: Area一覧 === */}
      <div style={{ width: '220px', borderRight: '1px solid #ccc' }}>
        <ImageSelector
          areaList={areaList}
          selectedAreaIndex={selectedAreaIndex}
          onSelectArea={handleSelectArea}
        />
      </div>

      {/* === 右カラム: CorrectionDetail === */}
      <div style={{ flex: 1, padding: '1rem' }}>
        <h2>Manual Correction for JSON ID: {jsonId}</h2>

        {/* メッセージ表示 */}
        {message && <p style={{ color: 'blue' }}>{message}</p>}

        {currentArea ? (
          <>
            {/* OCRトリガーボタン (Question / Options) */}
            <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => handleRunSingleOCR(currentArea.question_image_path, 'question')}
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
                onClick={() => handleRunSingleOCR(currentArea.options_image_path, 'options')}
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

            {/* CorrectionDetail */}
            <CorrectionDetail
              ref={correctionDetailRef}
              area={currentArea}
              areaIndex={selectedAreaIndex}
              onUpdateArea={handleUpdateArea}
              propOptionCheckResult={optionCheckResult}
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