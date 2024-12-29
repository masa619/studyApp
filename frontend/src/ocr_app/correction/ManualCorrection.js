import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// src/ocr_app/correction/ManualCorrection.tsx
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ImageSelector from './ImageSelector';
import CorrectionDetail from './CorrectionDetail';
/**
 * ManualCorrection コンポーネント:
 * - 左ペイン: Area一覧 (ImageSelector)
 * - 右ペイン: 選択したAreaの CorrectionDetail (OCR + JSON編集)
 * - "Run OCR" ボタン でサーバーに対し /api/trigger_ocr(mode=single) を呼ぶ
 * - "Save All Changes" ボタン で JSON を PUT 更新
 */
const ManualCorrection = ({ jsonId, jsonData }) => {
    // ローカルで編集するためのState
    const [localData, setLocalData] = useState(jsonData);
    // 選択中のAreaのインデックス
    const [selectedAreaIndex, setSelectedAreaIndex] = useState(0);
    // ステータスメッセージ (画面上部に表示)
    const [message, setMessage] = useState('');
    // CorrectionDetail ref
    const correctionDetailRef = useRef(null);
    // jsonData が切り替わったら初期化
    useEffect(() => {
        setLocalData(jsonData);
        setMessage('');
        setSelectedAreaIndex(0);
    }, [jsonData]);
    // areas配列を直接取得
    const areaList = localData.json_data?.areas || [];
    const currentArea = areaList[selectedAreaIndex];
    // 選択肢の分割結果を保持するState
    const [optionCheckResult, setOptionCheckResult] = useState(null);
    // 左ペインでAreaを選択
    const handleSelectArea = (idx) => {
        setSelectedAreaIndex(idx);
    };
    // 選択中のAreaオブジェクトを更新
    const handleUpdateArea = (updatedArea, areaIndex) => {
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
    const handleRunSingleOCR = async (imagePath, imageType) => {
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
                }
                else {
                    // options じゃない場合などは null になるかも
                    setOptionCheckResult(null);
                }
            }
            else if (ocrResult.status === 'error') {
                setMessage(`OCR error: ${ocrResult.error_message ?? 'no error message'}`);
            }
            else {
                setMessage(`OCR status: ${ocrResult.status}`);
            }
        }
        catch (error) {
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
                        odict[k].text = v || '';
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
        }
        catch (error) {
            console.error(error);
            setMessage(`Save failed: ${error.message || String(error)}`);
        }
    };
    // ボタンスタイル例
    const baseButtonStyle = {
        padding: '0.5rem 1rem',
        borderRadius: '4px',
        border: 'none',
        cursor: 'pointer',
        marginRight: '1rem',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
        transition: 'background-color 0.3s ease',
    };
    const questionButtonStyle = {
        ...baseButtonStyle,
        backgroundColor: '#007BFF',
        color: '#fff',
    };
    const optionsButtonStyle = {
        ...baseButtonStyle,
        backgroundColor: '#28A745',
        color: '#fff',
        marginRight: 0,
    };
    const saveAllButtonStyle = {
        ...baseButtonStyle,
        backgroundColor: '#FF5722',
        color: '#fff',
        marginRight: 0,
        marginTop: '1rem',
    };
    return (_jsxs("div", { style: { display: 'flex', gap: '1rem' }, children: [_jsx("div", { style: { width: '220px', borderRight: '1px solid #ccc' }, children: _jsx(ImageSelector, { areaList: areaList, selectedAreaIndex: selectedAreaIndex, onSelectArea: handleSelectArea }) }), _jsxs("div", { style: { flex: 1, padding: '1rem' }, children: [_jsxs("h2", { children: ["Manual Correction for JSON ID: ", jsonId] }), message && _jsx("p", { style: { color: 'blue' }, children: message }), currentArea ? (_jsxs(_Fragment, { children: [_jsxs("div", { style: { marginBottom: '1rem', display: 'flex', gap: '0.5rem' }, children: [_jsx("button", { onClick: () => handleRunSingleOCR(currentArea.question_image_path, 'question'), style: questionButtonStyle, onMouseEnter: (e) => {
                                            e.currentTarget.style.backgroundColor = '#0056b3';
                                        }, onMouseLeave: (e) => {
                                            e.currentTarget.style.backgroundColor = '#007BFF';
                                        }, children: "Run OCR (Question)" }), _jsx("button", { onClick: () => handleRunSingleOCR(currentArea.options_image_path, 'options'), style: optionsButtonStyle, onMouseEnter: (e) => {
                                            e.currentTarget.style.backgroundColor = '#218838';
                                        }, onMouseLeave: (e) => {
                                            e.currentTarget.style.backgroundColor = '#28A745';
                                        }, children: "Run OCR (Options)" })] }), _jsx(CorrectionDetail, { ref: correctionDetailRef, area: currentArea, areaIndex: selectedAreaIndex, onUpdateArea: handleUpdateArea, propOptionCheckResult: optionCheckResult }), _jsx("button", { onClick: handleSaveAll, style: saveAllButtonStyle, onMouseEnter: (e) => {
                                    e.currentTarget.style.backgroundColor = '#e64a19';
                                }, onMouseLeave: (e) => {
                                    e.currentTarget.style.backgroundColor = '#FF5722';
                                }, children: "Save All Changes (OCR + JSON)" })] })) : (_jsx("p", { children: "No area selected" }))] })] }));
};
export default ManualCorrection;
