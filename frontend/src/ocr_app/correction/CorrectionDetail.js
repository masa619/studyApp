import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
// src/ocr_app/correction/CorrectionDetail.tsx
import { useState, useEffect, forwardRef, useImperativeHandle, } from 'react';
import axios from 'axios';
import ImageWithBoundingBoxes from './ImageWithBoundingBoxes';
import { transformImagePath } from '../utils/transformImagePath';
/**
 * CorrectionDetail:
 * - サーバーOCRからの normalized_text
 * - JSON(Area)に保存されている text
 * を相互にコピー・保存するコンポーネント
 */
const CorrectionDetail = forwardRef(({ area, areaIndex, onUpdateArea, propOptionCheckResult }, ref) => {
    // === バウンディングボックス (質問/選択肢) ===
    const [boundingBoxes, setBoundingBoxes] = useState([]);
    const [optionBoundingBoxes, setOptionBoundingBoxes] = useState([]);
    // === OCRResult の ID ===
    const [questionOcrId, setQuestionOcrId] = useState(null);
    const [optionsOcrId, setOptionsOcrId] = useState(null);
    // === OCRから取得したテキスト ===
    const [questionOcrText, setQuestionOcrText] = useState('');
    const [optionsOcrText, setOptionsOcrText] = useState('');
    // === JSONに保存されているテキスト ===
    const [questionJsonText, setQuestionJsonText] = useState('');
    const [optionsJsonText, setOptionsJsonText] = useState('');
    // === サーバー側split結果 (イロハニ) ===
    const [optionCheckResult, setOptionCheckResult] = useState(null);
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
            const linesFromDict = {};
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
        }
        else {
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
    const fetchQuestionOcrResult = async (ocrPath) => {
        try {
            const res = await axios.get('http://localhost:8000/ocr_app/api/ocr_results/', { params: { image_path: ocrPath } });
            const ocrItem = res.data.results?.[0];
            if (!ocrItem || !ocrItem.vision_api_response) {
                setBoundingBoxes([]);
                setQuestionOcrId(null);
                setQuestionOcrText('');
                return;
            }
            // バウンディングボックス
            const textAnnotations = ocrItem.vision_api_response.textAnnotations || [];
            const rawBoxes = textAnnotations.slice(1).map((ann) => {
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
        }
        catch (err) {
            console.error(err);
            setBoundingBoxes([]);
            setQuestionOcrId(null);
            setQuestionOcrText('');
        }
    };
    // -----------------------------------------
    // 選択肢画像のOCR結果取得
    // -----------------------------------------
    const fetchOptionsOcrResult = async (ocrPath) => {
        try {
            const res = await axios.get('http://localhost:8000/ocr_app/api/ocr_results/', { params: { image_path: ocrPath } });
            const ocrItem = res.data.results?.[0];
            if (!ocrItem || !ocrItem.vision_api_response) {
                setOptionBoundingBoxes([]);
                setOptionsOcrId(null);
                setOptionsOcrText('');
                return;
            }
            // バウンディングボックス
            const textAnnotations = ocrItem.vision_api_response.textAnnotations || [];
            const rawBoxes = textAnnotations.slice(1).map((ann) => {
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
        }
        catch (err) {
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
        }
        else {
            setBoundingBoxes([]);
            setQuestionOcrId(null);
            setQuestionOcrText('');
        }
    }, [questionOcrPath]);
    useEffect(() => {
        if (optionsOcrPath) {
            fetchOptionsOcrResult(optionsOcrPath);
        }
        else {
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
        }
        catch (err) {
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
        }
        catch (err) {
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
        }
        catch (err) {
            console.error(err);
            setMessage(`Failed to save all: ${err.message}`);
        }
    };
    // -----------------------------------------
    // JSON 側のテキスト編集
    // -----------------------------------------
    const handleQuestionJsonChange = (newText) => {
        setQuestionJsonText(newText);
        const updated = {
            ...area,
            question_element: {
                ...area.question_element,
                text: newText,
            },
        };
        onUpdateArea(updated, areaIndex);
    };
    const handleOptionsJsonChange = (newText) => {
        setOptionsJsonText(newText);
        const updated = {
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
    return (_jsxs("div", { style: { border: '1px solid #ccc', padding: '1rem' }, children: [_jsxs("p", { children: ["Area No: ", area.No] }), _jsxs("p", { children: ["Answer: ", area.answer] }), message && _jsx("p", { style: { color: 'blue' }, children: message }), questionImageUrl ? (_jsx("div", { style: { margin: '1rem 0' }, children: _jsx(ImageWithBoundingBoxes, { imageUrl: questionImageUrl, boundingBoxes: boundingBoxes, width: 800, height: 600 }) })) : (_jsx("p", { children: "No question image path found." })), _jsxs("div", { style: { marginTop: '1rem' }, children: [_jsx("h4", { children: "Question: OCR Normalized Text" }), _jsx("textarea", { rows: 4, cols: 60, value: questionOcrText, onChange: (e) => setQuestionOcrText(e.target.value) }), _jsx("br", {}), _jsx("button", { onClick: handleSaveQuestionOcr, disabled: !questionOcrId, children: "Save Question OCR" }), '  ', _jsx("button", { onClick: handleApplyOcrToQuestionJson, children: "Apply OCR \u2192 JSON" }), '  ', _jsx("button", { onClick: handleApplyJsonToQuestionOcr, children: "Apply JSON \u2192 OCR" })] }), _jsxs("div", { style: { marginTop: '1rem' }, children: [_jsx("h4", { children: "Question: JSON Text" }), _jsx("textarea", { rows: 4, cols: 60, value: questionJsonText, onChange: (e) => handleQuestionJsonChange(e.target.value) })] }), optionImageUrl ? (_jsx("div", { style: { margin: '1rem 0' }, children: _jsx(ImageWithBoundingBoxes, { imageUrl: optionImageUrl, boundingBoxes: optionBoundingBoxes, width: 800, height: 600 }) })) : (_jsx("p", { children: "No options image path found." })), _jsxs("div", { style: { marginTop: '1rem' }, children: [_jsx("h4", { children: "Options: OCR Normalized Text" }), _jsx("textarea", { rows: 4, cols: 60, value: optionsOcrText, onChange: (e) => setOptionsOcrText(e.target.value) }), _jsx("br", {}), _jsx("button", { onClick: handleSaveOptionsOcr, disabled: !optionsOcrId, children: "Save Options OCR" }), '  ', _jsx("button", { onClick: handleApplyOcrToOptionsJson, children: "Apply OCR \u2192 JSON" }), '  ', _jsx("button", { onClick: handleApplyJsonToOptionsOcr, children: "Apply JSON \u2192 OCR" })] }), _jsxs("div", { style: { marginTop: '1rem', backgroundColor: '#f9f9f9', padding: '1rem' }, children: [_jsx("h4", { children: "Options (Server Split Result): \u30A4 / \u30ED / \u30CF / \u30CB" }), !optionCheckResult ? (_jsx("p", { children: "No server-split or JSON-split result" })) : optionCheckResult.status === 'ok' || optionCheckResult.status === 'init' ? (_jsxs(_Fragment, { children: [_jsx("p", { style: { color: 'green' }, children: optionCheckResult.message }), Object.entries(optionCheckResult.lines)
                                // イロハニの表示順をそろえる例 (任意)
                                .sort(([a], [b]) => {
                                const order = ['イ', 'ロ', 'ハ', 'ニ'];
                                return order.indexOf(a) - order.indexOf(b);
                            })
                                .map(([key, val]) => (_jsxs("div", { style: { marginBottom: '0.5rem' }, children: [_jsxs("h5", { style: { margin: 0 }, children: ["Key: ", key] }), _jsx("pre", { style: { whiteSpace: 'pre-wrap', marginTop: '4px' }, children: val })] }, key)))] })) : (_jsxs(_Fragment, { children: [_jsx("p", { style: { color: 'red' }, children: optionCheckResult.message }), _jsxs("ul", { children: [optionCheckResult.duplicates?.length > 0 && (_jsxs("li", { children: ["Duplicates: ", optionCheckResult.duplicates.join(',')] })), optionCheckResult.missing?.length > 0 && (_jsxs("li", { children: ["Missing: ", optionCheckResult.missing.join(',')] }))] })] }))] }), _jsxs("div", { style: { marginTop: '1rem' }, children: [_jsx("h4", { children: "Options: JSON Text" }), _jsx("textarea", { rows: 4, cols: 60, value: optionsJsonText, onChange: (e) => handleOptionsJsonChange(e.target.value) })] }), _jsx("div", { style: { marginTop: '1.5rem' }, children: _jsx("button", { onClick: handleSaveAllOcr, children: "Save All OCR (Only)" }) })] }));
});
export default CorrectionDetail;
