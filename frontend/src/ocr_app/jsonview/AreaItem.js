import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
// src/ocr_app/jsonview/AreaItem.tsx
import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { JsonDataContext } from '../Context/JsonDataContext';
import './AreaItem.css';
const AreaItem = ({ areaIndex }) => {
    // Context から選択中のJSONデータを取得
    const { selectedJsonData } = useContext(JsonDataContext);
    // 該当エリアを取得
    const area = selectedJsonData?.json_data?.areas?.[areaIndex];
    // areaが存在しない場合のフォールバック
    if (!area) {
        return _jsxs("p", { children: ["No area found for index ", areaIndex, "."] });
    }
    // OCR実行状況 (question / options)
    const [questionOcrStatus, setQuestionOcrStatus] = useState('not_yet');
    const [optionsOcrStatus, setOptionsOcrStatus] = useState('not_yet');
    // OCR結果の全文
    const [questionFullText, setQuestionFullText] = useState('');
    const [optionsFullText, setOptionsFullText] = useState('');
    // 画像URL変換 (例: ローカル絶対パス → http://localhost:8000/media/xxx)
    const convertToMediaUrl = (path) => {
        if (!path)
            return '';
        return `http://localhost:8000/media/${path.replace(/^.*?CREATE_DATA2\//, '')}`;
    };
    // 複数画像表示用に、配列があればそちらを、なければ単一パスを配列化して使う
    const questionImagePaths = area.question_element?.image_paths && area.question_element?.image_paths.length > 0
        ? area.question_element?.image_paths
        : area.question_element?.image_paths
            ? [area.question_element?.image_paths]
            : [];
    const optionsImagePaths = (() => {
        // (A) まず、options_dict から取得
        const dict = area.options_element?.options_dict || {};
        const fromDict = dict
            ? Object.values(dict).flatMap((entry) => entry?.image_paths || [])
            : [];
        return Object.values(dict).flatMap((entry) => entry.image_paths || []);
    })();
    // OCR結果を取得して State に反映
    const fetchOCRResult = async (imagePath, setStatus, setFullText) => {
        if (!imagePath)
            return;
        try {
            const resp = await axios.get('http://localhost:8000/ocr_app/api/ocr_results/', {
                params: { image_path: imagePath },
            });
            const results = resp.data.results;
            if (results && results.length > 0) {
                setStatus(results[0].status);
                setFullText(results[0].full_text || '');
            }
            else {
                setStatus('not_yet');
                setFullText('');
            }
        }
        catch (err) {
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
    return (_jsxs("div", { style: { border: '1px solid #ddd', padding: '0.5rem', marginBottom: '0.5rem' }, children: [_jsxs("h4", { children: ["Area No: ", area.No] }), area.area_image_path && (_jsx("div", { style: { margin: '8px 0' }, children: _jsx("img", { src: convertToMediaUrl(area.area_image_path), alt: `Area image`, style: { maxWidth: '100%', border: '1px solid #ccc' } }) })), _jsxs("p", { children: ["Answer: ", area.answer] }), _jsxs("p", { children: [_jsx("strong", { children: "Question text:" }), " ", area.question_element?.text ?? ''] }), questionImagePaths.length > 0 && (_jsx("div", { style: { display: 'flex', flexWrap: 'wrap', gap: '8px', margin: '8px 0' }, children: questionImagePaths.map((path, idx) => {
                    const qImgUrl = Array.isArray(path) ? convertToMediaUrl(path[0]) : convertToMediaUrl(path);
                    return (_jsx("img", { src: qImgUrl, alt: `Question image ${idx}`, style: { border: '1px solid #ccc' } }, `qimg-${idx}`));
                }) })), _jsx("hr", {}), _jsxs("p", { children: [_jsx("strong", { children: "Options text:" }), " ", area.options_element?.text ?? ''] }), _jsxs("p", { children: [_jsx("strong", { children: "Options text:" }), " ", area.options_element?.text ?? ''] }), area.options_element?.options_dict && (_jsxs("div", { children: [_jsx("strong", { children: "\u9078\u629E\u80A2:" }), _jsx("ul", { children: Object.entries(area.options_element.options_dict).map(([key, value]) => (_jsxs("li", { children: [key, ". ", value.text] }, key))) })] })), optionsImagePaths.length > 0 && (_jsx("div", { style: { display: 'flex', flexWrap: 'wrap', gap: '8px', margin: '8px 0' }, children: optionsImagePaths.map((path, idx) => {
                    const oImgUrl = convertToMediaUrl(path);
                    return (_jsx("img", { src: oImgUrl, alt: `Options image ${idx}`, style: { border: '1px solid #ccc' } }, `oimg-${idx}`));
                }) })), _jsx("hr", {}), _jsxs("p", { children: [_jsx("strong", { children: "Options OCR Status:" }), " ", optionsOcrStatus, ' ', optionsOcrStatus === 'done' && (_jsxs("span", { children: [_jsx("br", {}), _jsx("strong", { children: "Options Full Text:" }), " ", optionsFullText] }))] })] }));
};
export default AreaItem;
