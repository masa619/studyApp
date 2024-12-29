// src/ocr_app/correction/CorrectionDetail.tsx

import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from 'react';
import axios from 'axios';
import { Area } from '../types';
import ImageWithBoundingBoxes from './ImageWithBoundingBoxes';
import { transformImagePath } from '../utils/transformImagePath';

interface Props {
  area: Area;                // 1つのArea
  areaIndex: number;         // ManualCorrection でのインデックス
  onUpdateArea: (updatedArea: Area, areaIndex: number) => void;
  propOptionCheckResult?: {
    status: string;
    message: string;
    lines: Record<string, string | null>;
    duplicates: string[];
    missing: string[];
  } | null;
}

interface CorrectionDetailExposed {
  handleSaveAllOcr: () => Promise<void>;
  getQuestionFullText: () => string;
  getOptionsFullText: () => string;
}

/**
 * CorrectionDetail:
 * - サーバーOCRからの normalized_text
 * - JSON(Area)に保存されている text
 * を相互にコピー・保存するコンポーネント
 */
const CorrectionDetail = forwardRef<CorrectionDetailExposed, Props>(
  ({ area, areaIndex, onUpdateArea, propOptionCheckResult }, ref) => {

    // === バウンディングボックス (質問/選択肢) ===
    const [boundingBoxes, setBoundingBoxes] = useState<any[]>([]);
    const [optionBoundingBoxes, setOptionBoundingBoxes] = useState<any[]>([]);

    // === OCRResult の ID ===
    const [questionOcrId, setQuestionOcrId] = useState<number | null>(null);
    const [optionsOcrId, setOptionsOcrId] = useState<number | null>(null);

    // === OCRから取得したテキスト ===
    const [questionOcrText, setQuestionOcrText] = useState<string>('');
    const [optionsOcrText, setOptionsOcrText] = useState<string>('');

    // === JSONに保存されているテキスト ===
    const [questionJsonText, setQuestionJsonText] = useState<string>('');
    const [optionsJsonText, setOptionsJsonText] = useState<string>('');

    // === サーバー側split結果 (イロハニ) ===
    const [optionCheckResult, setOptionCheckResult] = useState<{
      status: string;
      message: string;
      lines: Record<string, string | null>;
      duplicates: string[];
      missing: string[];
    } | null>(null);

    // ステータスメッセージ
    const [message, setMessage] = useState('');

    // 画像パス
    const questionOcrPath = area.question_image_path || '';
    const optionsOcrPath = area.options_image_path || '';

    // HTTPアクセス用にパス変換（実環境に合わせて変更）
    const basePath = '/Users/shipro/Documents/CREATE_DATA2/';
    const questionImageUrl = transformImagePath(questionOcrPath, basePath);
    const optionImageUrl = transformImagePath(optionsOcrPath, basePath);

    // ----------------------------------------------------
    // area や propOptionCheckResult が切り替わったら State を再初期化
    // ----------------------------------------------------
    useEffect(() => {
      // 1) 質問と選択肢の JSON テキストをリセット
      setQuestionJsonText(area.question_element?.text || '');
      setOptionsJsonText(area.options_element?.text || '');

      // 2) JSON内の options_dict をもとに optionCheckResult を初期化
      const existingDict = area.options_element?.options_dict;
      if (existingDict && Object.keys(existingDict).length > 0) {
        // { イ: { text: "1", image_paths: [] }, ... } から lines部分を再構築
        const linesFromDict: Record<string, string | null> = {};
        for (const [key, val] of Object.entries(existingDict)) {
          linesFromDict[key] = val.text;
        }

        setOptionCheckResult({
          status: 'init',
          message: 'Loaded from JSON (area.options_element.options_dict)',
          lines: linesFromDict,
          duplicates: [],
          missing: [],
        });
      } else {
        setOptionCheckResult(null);
      }

      // 3) サーバーから再取得した optionCheckResult (prop) があれば優先して上書き
      if (propOptionCheckResult) {
        setOptionCheckResult(propOptionCheckResult);
      }
    }, [area, propOptionCheckResult]);

    // -----------------------------------------
    // 質問画像のOCR結果取得
    // -----------------------------------------
    const fetchQuestionOcrResult = async (ocrPath: string) => {
      try {
        const res = await axios.get<{ results: any[] }>(
          'http://localhost:8000/ocr_app/api/ocr_results/',
          { params: { image_path: ocrPath } }
        );
        const ocrItem = res.data.results?.[0];
        if (!ocrItem || !ocrItem.vision_api_response) {
          setBoundingBoxes([]);
          setQuestionOcrId(null);
          setQuestionOcrText('');
          return;
        }
        // バウンディングボックス
        const textAnnotations = ocrItem.vision_api_response.textAnnotations || [];
        const rawBoxes = textAnnotations.slice(1).map((ann: any) => {
          const poly = ann.boundingPoly.vertices;
          return {
            x_min: poly[0]?.x || 0,
            y_min: poly[0]?.y || 0,
            x_max: poly[2]?.x || 0,
            y_max: poly[2]?.y || 0,
            text: ann.description,
            confidence: ann.confidence || 1,
          };
        });
        setBoundingBoxes(rawBoxes);

        // OCRResult ID
        setQuestionOcrId(ocrItem.id ?? null);

        // ノーマライズテキスト (無ければ full_text)
        const normalized = ocrItem.normalized_text ?? ocrItem.full_text ?? '';
        setQuestionOcrText(normalized);
      } catch (err) {
        console.error(err);
        setBoundingBoxes([]);
        setQuestionOcrId(null);
        setQuestionOcrText('');
      }
    };

    // -----------------------------------------
    // 選択肢画像のOCR結果取得
    // -----------------------------------------
    const fetchOptionsOcrResult = async (ocrPath: string) => {
      try {
        const res = await axios.get<{ results: any[] }>(
          'http://localhost:8000/ocr_app/api/ocr_results/',
          { params: { image_path: ocrPath } }
        );
        const ocrItem = res.data.results?.[0];
        if (!ocrItem || !ocrItem.vision_api_response) {
          setOptionBoundingBoxes([]);
          setOptionsOcrId(null);
          setOptionsOcrText('');
          return;
        }
        // バウンディングボックス
        const textAnnotations = ocrItem.vision_api_response.textAnnotations || [];
        const rawBoxes = textAnnotations.slice(1).map((ann: any) => {
          const poly = ann.boundingPoly.vertices;
          return {
            x_min: poly[0]?.x || 0,
            y_min: poly[0]?.y || 0,
            x_max: poly[2]?.x || 0,
            y_max: poly[2]?.y || 0,
            text: ann.description,
            confidence: ann.confidence || 1,
          };
        });
        setOptionBoundingBoxes(rawBoxes);

        // OCRResult ID
        setOptionsOcrId(ocrItem.id ?? null);

        // ノーマライズテキスト (無ければ full_text)
        const normalized = ocrItem.normalized_text ?? ocrItem.full_text ?? '';
        setOptionsOcrText(normalized);
      } catch (err) {
        console.error(err);
        setOptionBoundingBoxes([]);
        setOptionsOcrId(null);
        setOptionsOcrText('');
      }
    };

    // -----------------------------------------
    // 画像パス変化のたびにOCR結果を再取得
    // -----------------------------------------
    useEffect(() => {
      if (questionOcrPath) {
        fetchQuestionOcrResult(questionOcrPath);
      } else {
        setBoundingBoxes([]);
        setQuestionOcrId(null);
        setQuestionOcrText('');
      }
    }, [questionOcrPath]);

    useEffect(() => {
      if (optionsOcrPath) {
        fetchOptionsOcrResult(optionsOcrPath);
      } else {
        setOptionBoundingBoxes([]);
        setOptionsOcrId(null);
        setOptionsOcrText('');
      }
    }, [optionsOcrPath]);

    // -----------------------------------------
    // 個別保存 (質問)
    // -----------------------------------------
    const handleSaveQuestionOcr = async () => {
      if (!questionOcrId) {
        setMessage('No Question OCRResult found.');
        return;
      }
      try {
        setMessage('Saving Question OCR...');
        await axios.put(`http://localhost:8000/ocr_app/api/ocr_results/${questionOcrId}/`, {
          normalized_text: questionOcrText,
          status: 'manual_corrected',
        });
        setMessage('Question OCR (normalized_text) saved!');
      } catch (err: any) {
        console.error(err);
        setMessage(`Failed to save question OCR: ${err.message}`);
      }
    };

    // -----------------------------------------
    // 個別保存 (選択肢)
    // -----------------------------------------
    const handleSaveOptionsOcr = async () => {
      if (!optionsOcrId) {
        setMessage('No Options OCRResult found.');
        return;
      }
      try {
        setMessage('Saving Options OCR...');
        await axios.put(`http://localhost:8000/ocr_app/api/ocr_results/${optionsOcrId}/`, {
          normalized_text: optionsOcrText,
          status: 'manual_corrected',
        });
        setMessage('Options OCR (normalized_text) saved!');
      } catch (err: any) {
        console.error(err);
        setMessage(`Failed to save options OCR: ${err.message}`);
      }
    };

    // -----------------------------------------
    // 一括保存 (OCR) → ManualCorrection から呼ばれる
    // -----------------------------------------
    const handleSaveAllOcr = async () => {
      setMessage('Saving all OCR...');
      try {
        if (questionOcrId) {
          await axios.put(`http://localhost:8000/ocr_app/api/ocr_results/${questionOcrId}/`, {
            normalized_text: questionOcrText,
            status: 'manual_corrected',
          });
        }
        if (optionsOcrId) {
          await axios.put(`http://localhost:8000/ocr_app/api/ocr_results/${optionsOcrId}/`, {
            normalized_text: optionsOcrText,
            status: 'manual_corrected',
          });
        }
        setMessage('All OCR (normalized_text) saved successfully!');
      } catch (err: any) {
        console.error(err);
        setMessage(`Failed to save all: ${err.message}`);
      }
    };

    // -----------------------------------------
    // JSON 側のテキスト編集
    // -----------------------------------------
    const handleQuestionJsonChange = (newText: string) => {
      setQuestionJsonText(newText);
      const updated: Area = {
        ...area,
        question_element: {
          ...area.question_element,
          text: newText,
        },
      };
      onUpdateArea(updated, areaIndex);
    };

    const handleOptionsJsonChange = (newText: string) => {
      setOptionsJsonText(newText);
      const updated: Area = {
        ...area,
        options_element: {
          ...area.options_element,
          text: newText,
        },
      };
      onUpdateArea(updated, areaIndex);
    };

    // -----------------------------------------
    // OCR → JSON 反映
    // -----------------------------------------
    const handleApplyOcrToQuestionJson = () => {
      handleQuestionJsonChange(questionOcrText);
      setMessage('Applied OCR text to JSON (Question).');
    };

    const handleApplyOcrToOptionsJson = () => {
      handleOptionsJsonChange(optionsOcrText);
      setMessage('Applied OCR text to JSON (Options).');
    };

    // -----------------------------------------
    // JSON → OCR 反映 (もし必要なら)
    // -----------------------------------------
    const handleApplyJsonToQuestionOcr = () => {
      setQuestionOcrText(questionJsonText);
      setMessage('Applied JSON text to OCR text (Question).');
    };

    const handleApplyJsonToOptionsOcr = () => {
      setOptionsOcrText(optionsJsonText);
      setMessage('Applied JSON text to OCR text (Options).');
    };

    // -----------------------------------------
    // 親(ManualCorrection) から呼べるメソッド (ref)
    // -----------------------------------------
    useImperativeHandle(ref, () => ({
      handleSaveAllOcr,
      getQuestionFullText: () => questionJsonText,
      getOptionsFullText: () => optionsJsonText,
    }));

    return (
      <div style={{ border: '1px solid #ccc', padding: '1rem' }}>
        <p>Area No: {area.No}</p>
        <p>Answer: {area.answer}</p>
        {message && <p style={{ color: 'blue' }}>{message}</p>}

        {/* 質問画像 + バウンディングボックス */}
        {questionImageUrl ? (
          <div style={{ margin: '1rem 0' }}>
            <ImageWithBoundingBoxes
              imageUrl={questionImageUrl}
              boundingBoxes={boundingBoxes}
              width={800}
              height={600}
            />
          </div>
        ) : (
          <p>No question image path found.</p>
        )}

        {/* ============ 質問用のUI ============ */}
        <div style={{ marginTop: '1rem' }}>
          <h4>Question: OCR Normalized Text</h4>
          <textarea
            rows={4}
            cols={60}
            value={questionOcrText}
            onChange={(e) => setQuestionOcrText(e.target.value)}
          />
          <br />
          <button onClick={handleSaveQuestionOcr} disabled={!questionOcrId}>
            Save Question OCR
          </button>
          {'  '}
          <button onClick={handleApplyOcrToQuestionJson}>
            Apply OCR → JSON
          </button>
          {'  '}
          <button onClick={handleApplyJsonToQuestionOcr}>
            Apply JSON → OCR
          </button>
        </div>

        <div style={{ marginTop: '1rem' }}>
          <h4>Question: JSON Text</h4>
          <textarea
            rows={4}
            cols={60}
            value={questionJsonText}
            onChange={(e) => handleQuestionJsonChange(e.target.value)}
          />
        </div>

        {/* 選択肢画像 + バウンディングボックス */}
        {optionImageUrl ? (
          <div style={{ margin: '1rem 0' }}>
            <ImageWithBoundingBoxes
              imageUrl={optionImageUrl}
              boundingBoxes={optionBoundingBoxes}
              width={800}
              height={600}
            />
          </div>
        ) : (
          <p>No options image path found.</p>
        )}

        {/* ============ 選択肢用のUI ============ */}
        <div style={{ marginTop: '1rem' }}>
          <h4>Options: OCR Normalized Text</h4>
          <textarea
            rows={4}
            cols={60}
            value={optionsOcrText}
            onChange={(e) => setOptionsOcrText(e.target.value)}
          />
          <br />
          <button onClick={handleSaveOptionsOcr} disabled={!optionsOcrId}>
            Save Options OCR
          </button>
          {'  '}
          <button onClick={handleApplyOcrToOptionsJson}>
            Apply OCR → JSON
          </button>
          {'  '}
          <button onClick={handleApplyJsonToOptionsOcr}>
            Apply JSON → OCR
          </button>
        </div>

        {/* サーバー側 split結果表示 (optionCheckResult) */}
        <div style={{ marginTop: '1rem', backgroundColor: '#f9f9f9', padding: '1rem' }}>
          <h4>Options (Server Split Result): イ / ロ / ハ / ニ</h4>

          {!optionCheckResult ? (
            <p>No server-split or JSON-split result</p>
          ) : optionCheckResult.status === 'ok' || optionCheckResult.status === 'init' ? (
            <>
              <p style={{ color: 'green' }}>{optionCheckResult.message}</p>
              {Object.entries(optionCheckResult.lines)
                // イロハニの表示順をそろえる例 (任意)
                .sort(([a], [b]) => {
                  const order = ['イ', 'ロ', 'ハ', 'ニ'];
                  return order.indexOf(a) - order.indexOf(b);
                })
                .map(([key, val]) => (
                  <div key={key} style={{ marginBottom: '0.5rem' }}>
                    <h5 style={{ margin: 0 }}>Key: {key}</h5>
                    <pre style={{ whiteSpace: 'pre-wrap', marginTop: '4px' }}>
                      {val}
                    </pre>
                  </div>
                ))
              }
            </>
          ) : (
            <>
              {/* status='error' 等の場合 */}
              <p style={{ color: 'red' }}>{optionCheckResult.message}</p>
              <ul>
                {optionCheckResult.duplicates?.length > 0 && (
                  <li>Duplicates: {optionCheckResult.duplicates.join(',')}</li>
                )}
                {optionCheckResult.missing?.length > 0 && (
                  <li>Missing: {optionCheckResult.missing.join(',')}</li>
                )}
              </ul>
            </>
          )}
        </div>

        <div style={{ marginTop: '1rem' }}>
          <h4>Options: JSON Text</h4>
          <textarea
            rows={4}
            cols={60}
            value={optionsJsonText}
            onChange={(e) => handleOptionsJsonChange(e.target.value)}
          />
        </div>

        {/* OCR一括保存 (Normalized) */}
        <div style={{ marginTop: '1.5rem' }}>
          <button onClick={handleSaveAllOcr}>
            Save All OCR (Only)
          </button>
        </div>
      </div>
    );
  }
);

export default CorrectionDetail;