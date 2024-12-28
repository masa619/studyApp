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
  areaIndex: number;         // ManualCorrectionでのインデックス
  onUpdateArea: (updatedArea: Area, areaIndex: number) => void;
}

interface CorrectionDetailExposed {
  handleSaveAllOcr: () => Promise<void>;
  getQuestionFullText: () => string;
  getOptionsFullText: () => string;
}

const CorrectionDetail = forwardRef<CorrectionDetailExposed, Props>(
  ({ area, areaIndex, onUpdateArea }, ref) => {
    // バウンディングボックス
    const [boundingBoxes, setBoundingBoxes] = useState<any[]>([]);
    const [optionBoundingBoxes, setOptionBoundingBoxes] = useState<any[]>([]);

    // OCRResult由来のフルテキスト
    const [questionOcrId, setQuestionOcrId] = useState<number | null>(null);
    const [questionFullText, setQuestionFullText] = useState<string>('');

    const [optionsOcrId, setOptionsOcrId] = useState<number | null>(null);
    const [optionsFullText, setOptionsFullText] = useState<string>('');

    // メッセージ
    const [message, setMessage] = useState('');

    // 画像パス (ローカル絶対パス)
    const questionOcrPath = area.question_image_path || '';
    const optionsOcrPath = area.options_image_path || '';

    // HTTPアクセス用に置換
    const basePath = '/Users/shipro/Documents/CREATE_DATA2/';
    const questionImageUrl = transformImagePath(questionOcrPath, basePath);
    const optionImageUrl = transformImagePath(optionsOcrPath, basePath);

    // (1) question画像OCR結果を取得
    const fetchQuestionOcrResult = async (ocrPath: string) => {
      try {
        const res = await axios.get<{ results: any[] }>(
          'http://localhost:8000/ocr_app/api/find_ocr_result_by_path/',
          { params: { image_path: ocrPath } }
        );
        const ocrItem = res.data.results?.[0];
        if (!ocrItem || !ocrItem.vision_api_response) {
          setBoundingBoxes([]);
          setQuestionOcrId(null);
          setQuestionFullText('');
          return;
        }
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

        setQuestionOcrId(ocrItem.id ?? null);
        setQuestionFullText(ocrItem.full_text ?? '');
      } catch (err) {
        console.error(err);
        setBoundingBoxes([]);
        setQuestionOcrId(null);
        setQuestionFullText('');
      }
    };

    // (2) options画像OCR結果を取得
    const fetchOptionsOcrResult = async (ocrPath: string) => {
      try {
        const res = await axios.get<{ results: any[] }>(
          'http://localhost:8000/ocr_app/api/find_ocr_result_by_path/',
          { params: { image_path: ocrPath } }
        );
        const ocrItem = res.data.results?.[0];
        if (!ocrItem || !ocrItem.vision_api_response) {
          setOptionBoundingBoxes([]);
          setOptionsOcrId(null);
          setOptionsFullText('');
          return;
        }
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

        setOptionsOcrId(ocrItem.id ?? null);
        setOptionsFullText(ocrItem.full_text ?? '');
      } catch (err) {
        console.error(err);
        setOptionBoundingBoxes([]);
        setOptionsOcrId(null);
        setOptionsFullText('');
      }
    };

    // useEffectで初回/画像変更時にOCR結果を取得
    useEffect(() => {
      if (questionOcrPath) {
        fetchQuestionOcrResult(questionOcrPath);
      } else {
        setBoundingBoxes([]);
        setQuestionOcrId(null);
        setQuestionFullText('');
      }
    }, [questionOcrPath]);

    useEffect(() => {
      if (optionsOcrPath) {
        fetchOptionsOcrResult(optionsOcrPath);
      } else {
        setOptionBoundingBoxes([]);
        setOptionsOcrId(null);
        setOptionsFullText('');
      }
    }, [optionsOcrPath]);

    // (3) 個別保存 (Question/Options)
    const handleSaveQuestionOcr = async () => {
      if (!questionOcrId) {
        setMessage('No Question OCRResult found.');
        return;
      }
      try {
        setMessage('Saving Question OCR...');
        await axios.put(`http://localhost:8000/ocr_app/api/ocr_results/${questionOcrId}/`, {
          full_text: questionFullText,
          status: 'manual_corrected',
        });
        setMessage('Question OCR saved!');
      } catch (err: any) {
        console.error(err);
        setMessage(`Failed to save question OCR: ${err.message}`);
      }
    };
    const handleSaveOptionsOcr = async () => {
      if (!optionsOcrId) {
        setMessage('No Options OCRResult found.');
        return;
      }
      try {
        setMessage('Saving Options OCR...');
        await axios.put(`http://localhost:8000/ocr_app/api/ocr_results/${optionsOcrId}/`, {
          full_text: optionsFullText,
          status: 'manual_corrected',
        });
        setMessage('Options OCR saved!');
      } catch (err: any) {
        console.error(err);
        setMessage(`Failed to save options OCR: ${err.message}`);
      }
    };

    // (4) 一括保存 (OCR結果だけ)
    const handleSaveAllOcr = async () => {
      setMessage('Saving all OCR...');
      try {
        if (questionOcrId) {
          await axios.put(`http://localhost:8000/ocr_app/api/ocr_results/${questionOcrId}/`, {
            full_text: questionFullText,
            status: 'manual_corrected',
          });
        }
        if (optionsOcrId) {
          await axios.put(`http://localhost:8000/ocr_app/api/ocr_results/${optionsOcrId}/`, {
            full_text: optionsFullText,
            status: 'manual_corrected',
          });
        }
        setMessage('All OCR saved successfully!');
      } catch (err: any) {
        console.error(err);
        setMessage(`Failed to save all: ${err.message}`);
      }
    };

    // (5) JSON上の text 更新
    const handleQuestionChange = (newText: string) => {
      const updated: Area = {
        ...area,
        question_element: {
          ...area.question_element,
          text: newText,
        },
      };
      onUpdateArea(updated, areaIndex);
    };
    const handleOptionsChange = (newText: string) => {
      const updated: Area = {
        ...area,
        options_element: {
          ...area.options_element,
          text: newText,
        },
      };
      onUpdateArea(updated, areaIndex);
    };

    // 親(ManualCorrection) から呼べるメソッド
    useImperativeHandle(ref, () => ({
      handleSaveAllOcr,
      getQuestionFullText: () => questionFullText,
      getOptionsFullText: () => optionsFullText,
    }));

    return (
      <div style={{ border: '1px solid #ccc', padding: '1rem' }}>
        {/* 余計なページ情報は不要に */}
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

        {/* 質問用のOCRフルテキスト */}
        <div style={{ marginTop: '1rem' }}>
          <label>Question OCR Text:</label>
          <br />
          <textarea
            rows={4}
            cols={60}
            value={questionFullText}
            onChange={(e) => setQuestionFullText(e.target.value)}
          />
          <br />
          <button
            type="button"
            onClick={handleSaveQuestionOcr}
            disabled={!questionOcrId}
          >
            Save Question OCR
          </button>
        </div>

        {/* JSON上の question_element.text */}
        <div style={{ marginTop: '1rem' }}>
          <label>Question text (JSON):</label>
          <br />
          <textarea
            rows={2}
            cols={60}
            value={area.question_element.text}
            onChange={(e) => handleQuestionChange(e.target.value)}
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

        {/* 選択肢用のOCRフルテキスト */}
        <div style={{ marginTop: '1rem' }}>
          <label>Options OCR Text:</label>
          <br />
          <textarea
            rows={4}
            cols={60}
            value={optionsFullText}
            onChange={(e) => setOptionsFullText(e.target.value)}
          />
          <br />
          <button
            type="button"
            onClick={handleSaveOptionsOcr}
            disabled={!optionsOcrId}
          >
            Save Options OCR
          </button>
        </div>

        {/* JSON上の options_element.text */}
        <div style={{ marginTop: '1rem' }}>
          <label>Options text (JSON):</label>
          <br />
          <textarea
            rows={2}
            cols={60}
            value={area.options_element.text}
            onChange={(e) => handleOptionsChange(e.target.value)}
          />
        </div>

        {/* OCR一括保存 (このコンポーネント内) */}
        <div style={{ marginTop: '1.5rem' }}>
          <button type="button" onClick={handleSaveAllOcr}>
            Save All OCR (Only)
          </button>
        </div>
      </div>
    );
  }
);

export default CorrectionDetail;