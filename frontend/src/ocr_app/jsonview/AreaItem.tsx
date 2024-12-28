// src/ocr_app/jsonview/AreaItem.tsx
import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { JsonDataContext } from '../Context/JsonDataContext';
import { OCRResultType } from '../types';

/**
 * Props: 表示したいAreaのインデックス。
 * JsonDataContextから areas[areaIndex] を取得して表示する。
 */
interface Props {
  areaIndex: number;
}

const AreaItem: React.FC<Props> = ({ areaIndex }) => {
  // Context から選択中のJSONデータを取得
  const { selectedJsonData } = useContext(JsonDataContext);

  // 該当エリアを取得
  const area = selectedJsonData?.json_data?.areas?.[areaIndex];

  // areaが存在しない場合のフォールバック
  if (!area) {
    return <p>No area found for index {areaIndex}.</p>;
  }

  // OCR実行状況 (question / options)
  const [questionOcrStatus, setQuestionOcrStatus] = useState<string>('not_yet');
  const [optionsOcrStatus, setOptionsOcrStatus] = useState<string>('not_yet');

  // OCR結果の全文
  const [questionFullText, setQuestionFullText] = useState<string>('');
  const [optionsFullText, setOptionsFullText] = useState<string>('');

  // 画像URL変換 (例: ローカル絶対パス → http://localhost:8000/media/xxx)
  const convertToMediaUrl = (path: string | undefined): string => {
    if (!path) return '';
    return `http://localhost:8000/media/${path.replace(/^.*?CREATE_DATA2\//, '')}`;
  };

  // 複数画像表示用に、配列があればそちらを、なければ単一パスを配列化して使う
  const questionImagePaths =
    area.question_image_paths && area.question_image_paths.length > 0
      ? area.question_image_paths
      : area.question_image_path
      ? [area.question_image_path]
      : [];

  const optionsImagePaths =
    area.options_image_paths && area.options_image_paths.length > 0
      ? area.options_image_paths
      : area.options_image_path
      ? [area.options_image_path]
      : [];

  // OCR結果を取得して State に反映
  const fetchOCRResult = async (
    imagePath: string | undefined,
    setStatus: (s: string) => void,
    setFullText: (t: string) => void,
  ) => {
    if (!imagePath) return;
    try {
      const resp = await axios.get<{ results: OCRResultType[] }>(
        'http://localhost:8000/ocr_app/api/find_ocr_result_by_path/',
        {
          params: { image_path: imagePath },
        },
      );
      const results = resp.data.results;
      if (results && results.length > 0) {
        setStatus(results[0].status);
        setFullText(results[0].full_text || '');
      } else {
        setStatus('not_yet');
        setFullText('');
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
      setFullText('');
    }
  };

  // 初期表示 or areaが切り替わった時にOCR結果を取得
  useEffect(() => {
    // question_image_path と options_image_path のみOCRを取得する例
    // （複数画像パターンにも対応したい場合はリスト内の全画像に対して取得処理を行う等の拡張が必要）
    fetchOCRResult(area.question_image_path, setQuestionOcrStatus, setQuestionFullText);
    fetchOCRResult(area.options_image_path, setOptionsOcrStatus, setOptionsFullText);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [area.question_image_path, area.options_image_path]);

  return (
    <div style={{ border: '1px solid #ddd', padding: '0.5rem', marginBottom: '0.5rem' }}>
      {/* 1) Area情報 */}
      <h4>
        Area No: {area.No} (area_id: {area.area_id})
      </h4>
      <p>Answer: {area.answer}</p>

      {/* 2) Questionテキスト */}
      <p>
        <strong>Question text:</strong> {area.question_element?.text ?? ''}
      </p>

      {/* 3) Question複数画像（横並び） */}
      {questionImagePaths.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', margin: '8px 0' }}>
          {questionImagePaths.map((path, idx) => {
            const qImgUrl = convertToMediaUrl(path);
            return (
              <img
                key={`qimg-${idx}`}
                src={qImgUrl}
                alt={`Question image ${idx}`}
                style={{ maxWidth: '300px', border: '1px solid #ccc' }}
              />
            );
          })}
        </div>
      )}

      {/* OCR Status (Question) */}
      <p>
        <strong>Question OCR Status:</strong> {questionOcrStatus}{' '}
        {questionOcrStatus === 'done' && (
          <span>
            <br />
            <strong>Question Full Text:</strong> {questionFullText}
          </span>
        )}
      </p>

      <hr />

      {/* 4) Optionテキスト */}
      <p>
        <strong>Options text:</strong> {area.options_element?.text ?? ''}
      </p>

      {/* 5) Option複数画像（横並び） */}
      {optionsImagePaths.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', margin: '8px 0' }}>
          {optionsImagePaths.map((path, idx) => {
            const oImgUrl = convertToMediaUrl(path);
            return (
              <img
                key={`oimg-${idx}`}
                src={oImgUrl}
                alt={`Options image ${idx}`}
                style={{ maxWidth: '300px', border: '1px solid #ccc' }}
              />
            );
          })}
        </div>
      )}

      {/* OCR Status (Options) */}
      <p>
        <strong>Options OCR Status:</strong> {optionsOcrStatus}{' '}
        {optionsOcrStatus === 'done' && (
          <span>
            <br />
            <strong>Options Full Text:</strong> {optionsFullText}
          </span>
        )}
      </p>
    </div>
  );
};

export default AreaItem;