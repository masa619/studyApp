import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
// src/ocr_app/correction/CorrectionDetail.tsx
import { useState, useEffect, forwardRef, useImperativeHandle, } from 'react';
import axios from 'axios';
import ImageWithBoundingBoxes from './ImageWithBoundingBoxes';
import { transformImagePath } from '../utils/transformImagePath';
const CorrectionDetail = forwardRef(({ area, areaIndex, onUpdateArea }, ref) => {
    // バウンディングボックス
    const [boundingBoxes, setBoundingBoxes] = useState([]);
    const [optionBoundingBoxes, setOptionBoundingBoxes] = useState([]);
    // OCRResult由来のフルテキスト
    const [questionOcrId, setQuestionOcrId] = useState(null);
    const [questionFullText, setQuestionFullText] = useState('');
    const [optionsOcrId, setOptionsOcrId] = useState(null);
    const [optionsFullText, setOptionsFullText] = useState('');
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
    const fetchQuestionOcrResult = async (ocrPath) => {
        try {
            const res = await axios.get('http://localhost:8000/ocr_app/api/find_ocr_result_by_path/', { params: { image_path: ocrPath } });
            const ocrItem = res.data.results?.[0];
            if (!ocrItem || !ocrItem.vision_api_response) {
                setBoundingBoxes([]);
                setQuestionOcrId(null);
                setQuestionFullText('');
                return;
            }
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
            setQuestionOcrId(ocrItem.id ?? null);
            setQuestionFullText(ocrItem.full_text ?? '');
        }
        catch (err) {
            console.error(err);
            setBoundingBoxes([]);
            setQuestionOcrId(null);
            setQuestionFullText('');
        }
    };
    // (2) options画像OCR結果を取得
    const fetchOptionsOcrResult = async (ocrPath) => {
        try {
            const res = await axios.get('http://localhost:8000/ocr_app/api/find_ocr_result_by_path/', { params: { image_path: ocrPath } });
            const ocrItem = res.data.results?.[0];
            if (!ocrItem || !ocrItem.vision_api_response) {
                setOptionBoundingBoxes([]);
                setOptionsOcrId(null);
                setOptionsFullText('');
                return;
            }
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
            setOptionsOcrId(ocrItem.id ?? null);
            setOptionsFullText(ocrItem.full_text ?? '');
        }
        catch (err) {
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
        }
        else {
            setBoundingBoxes([]);
            setQuestionOcrId(null);
            setQuestionFullText('');
        }
    }, [questionOcrPath]);
    useEffect(() => {
        if (optionsOcrPath) {
            fetchOptionsOcrResult(optionsOcrPath);
        }
        else {
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
        }
        catch (err) {
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
        }
        catch (err) {
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
        }
        catch (err) {
            console.error(err);
            setMessage(`Failed to save all: ${err.message}`);
        }
    };
    // (5) JSON上の text 更新
    const handleQuestionChange = (newText) => {
        const updated = {
            ...area,
            question_element: {
                ...area.question_element,
                text: newText,
            },
        };
        onUpdateArea(updated, areaIndex);
    };
    const handleOptionsChange = (newText) => {
        const updated = {
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
    return (_jsxs("div", { style: { border: '1px solid #ccc', padding: '1rem' }, children: [_jsxs("p", { children: ["Area No: ", area.No] }), _jsxs("p", { children: ["Answer: ", area.answer] }), message && _jsx("p", { style: { color: 'blue' }, children: message }), questionImageUrl ? (_jsx("div", { style: { margin: '1rem 0' }, children: _jsx(ImageWithBoundingBoxes, { imageUrl: questionImageUrl, boundingBoxes: boundingBoxes, width: 800, height: 600 }) })) : (_jsx("p", { children: "No question image path found." })), _jsxs("div", { style: { marginTop: '1rem' }, children: [_jsx("label", { children: "Question OCR Text:" }), _jsx("br", {}), _jsx("textarea", { rows: 4, cols: 60, value: questionFullText, onChange: (e) => setQuestionFullText(e.target.value) }), _jsx("br", {}), _jsx("button", { type: "button", onClick: handleSaveQuestionOcr, disabled: !questionOcrId, children: "Save Question OCR" })] }), _jsxs("div", { style: { marginTop: '1rem' }, children: [_jsx("label", { children: "Question text (JSON):" }), _jsx("br", {}), _jsx("textarea", { rows: 2, cols: 60, value: area.question_element.text, onChange: (e) => handleQuestionChange(e.target.value) })] }), optionImageUrl ? (_jsx("div", { style: { margin: '1rem 0' }, children: _jsx(ImageWithBoundingBoxes, { imageUrl: optionImageUrl, boundingBoxes: optionBoundingBoxes, width: 800, height: 600 }) })) : (_jsx("p", { children: "No options image path found." })), _jsxs("div", { style: { marginTop: '1rem' }, children: [_jsx("label", { children: "Options OCR Text:" }), _jsx("br", {}), _jsx("textarea", { rows: 4, cols: 60, value: optionsFullText, onChange: (e) => setOptionsFullText(e.target.value) }), _jsx("br", {}), _jsx("button", { type: "button", onClick: handleSaveOptionsOcr, disabled: !optionsOcrId, children: "Save Options OCR" })] }), _jsxs("div", { style: { marginTop: '1rem' }, children: [_jsx("label", { children: "Options text (JSON):" }), _jsx("br", {}), _jsx("textarea", { rows: 2, cols: 60, value: area.options_element.text, onChange: (e) => handleOptionsChange(e.target.value) })] }), _jsx("div", { style: { marginTop: '1.5rem' }, children: _jsx("button", { type: "button", onClick: handleSaveAllOcr, children: "Save All OCR (Only)" }) })] }));
});
export default CorrectionDetail;
