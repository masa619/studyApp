import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// --- src/ocr_app/markdownEditor/MarkdownEditorTab.tsx ---
import { useContext, useEffect, useState, useCallback } from 'react';
import { Button, FormControl, InputLabel, MenuItem, Select, Grid, Typography, Card, CardMedia, CardActionArea, } from '@mui/material';
import axios from 'axios';
import { JsonDataContext } from '../Context/JsonDataContext';
import MarkdownEditor from './components/MarkdownEditor';
import MarkdownPreview from './components/MarkdownPreview';
import { useMarkdownData } from './hooks/useMarkdownData';
import ImageSelector from '../correction/ImageSelector';
/**
 * Markdownエディタ用タブ
 */
const MarkdownEditorTab = () => {
    const { selectedJsonData, setSelectedJsonData, selectedAreaIndex, setSelectedAreaIndex, } = useContext(JsonDataContext);
    // 選択中のArea
    const currentArea = selectedJsonData?.json_data?.areas?.[selectedAreaIndex || 0];
    // 選択できるオプションキー一覧
    const optionKeys = currentArea?.options_element?.options_dict
        ? Object.keys(currentArea.options_element.options_dict)
        : [];
    // 編集対象
    const [editorTarget, setEditorTarget] = useState('question_text');
    // 個別にオプションキーを選択する場合
    const [selectedOptionKey, setSelectedOptionKey] = useState('');
    // 画像プレビュー用のURL変換
    const convertToMediaUrl = (path) => {
        if (!path)
            return '';
        return `http://localhost:8000/media/${path.replace(/^.*?CREATE_DATA2\//, '')}`;
    };
    const convertToRelativePath = useCallback((fullPath) => {
        // CREATE_DATA2 以降のパスを抽出
        const match = fullPath.match(/CREATE_DATA2\/(.*)/);
        if (match) {
            return match[1];
        }
        return fullPath;
    }, []);
    // 初期設定：オプションキー一覧があれば最初のものをデフォルトに
    useEffect(() => {
        if (optionKeys.length > 0) {
            setSelectedOptionKey(optionKeys[0]);
        }
    }, [currentArea]);
    // 現在のテキストを取り出す関数
    const getCurrentText = () => {
        if (!currentArea)
            return '';
        switch (editorTarget) {
            case 'question_text':
                return currentArea.question_element?.text || '';
            case 'options_text': {
                const dictItem = currentArea.options_element?.options_dict?.[selectedOptionKey];
                return dictItem?.text || '';
            }
            default:
                return '';
        }
    };
    // カスタムフック: MarkdownテキストとローカルStateを同期
    const { markdownText, setMarkdownText, handleChange, resetToInitial, } = useMarkdownData(getCurrentText());
    // Area切り替え時にテキストを更新
    useEffect(() => {
        // 現在のeditorTargetに応じたテキストで更新
        setMarkdownText(getTextByTarget(editorTarget));
    }, [currentArea, editorTarget, selectedOptionKey]);
    // EditorTarget切り替え時にテキストも更新
    const handleEditorTargetChange = (e) => {
        const newTarget = e.target.value;
        setEditorTarget(newTarget);
        // 選択されたEditorTargetに応じてテキストを更新
        setMarkdownText(getTextByTarget(newTarget));
    };
    const getTextByTarget = (target) => {
        if (!currentArea)
            return '';
        switch (target) {
            case 'question_text':
                return currentArea.question_element?.text || '';
            case 'options_text':
                return currentArea.options_element?.options_dict?.[selectedOptionKey]?.text || '';
            default:
                return '';
        }
    };
    // オプションキーの切り替え
    const handleOptionKeyChange = (e) => {
        const newKey = e.target.value;
        setSelectedOptionKey(newKey);
        // options_textの場合はテキストを再取得
        if (editorTarget === 'options_text') {
            const dictItem = currentArea?.options_element?.options_dict?.[newKey];
            setMarkdownText(dictItem?.text || '');
        }
    };
    // 画像をMarkdownに挿入
    const handleInsertImage = (imagePath) => {
        // CREATE_DATA2 以降のパスを抽出し、メディアルートを付与
        const relativePath = imagePath.match(/CREATE_DATA2\/(.*)/)
            ? imagePath.match(/CREATE_DATA2\/(.*)/)?.[1]
            : imagePath;
        const imageMarkdown = `\n![image](/media/${relativePath})\n`;
        setMarkdownText((prev) => prev + imageMarkdown);
    };
    // プレビュー画像の取得
    const getPreviewImages = () => {
        if (!currentArea)
            return [];
        if (editorTarget === 'question_text') {
            return currentArea.question_element?.image_paths || [];
        }
        else if (editorTarget === 'options_text' && selectedOptionKey) {
            return currentArea.options_element?.options_dict?.[selectedOptionKey]?.image_paths || [];
        }
        return [];
    };
    // JSONの更新ロジック
    const handleSave = async () => {
        if (!selectedJsonData || !setSelectedJsonData || !currentArea)
            return;
        try {
            const updatedJson = (prev) => {
                if (!prev)
                    return prev;
                const newAreas = [...(prev.json_data.areas || [])];
                const targetIndex = selectedAreaIndex || 0;
                const areaCopy = { ...newAreas[targetIndex] };
                switch (editorTarget) {
                    case 'question_text':
                        areaCopy.question_element = {
                            ...areaCopy.question_element,
                            text: markdownText,
                        };
                        break;
                    case 'options_text': {
                        const dictItem = areaCopy.options_element.options_dict[selectedOptionKey];
                        areaCopy.options_element.options_dict[selectedOptionKey] = {
                            ...dictItem,
                            text: markdownText,
                        };
                        break;
                    }
                }
                newAreas[targetIndex] = areaCopy;
                return {
                    ...prev,
                    json_data: {
                        ...prev.json_data,
                        areas: newAreas,
                    },
                };
            };
            // Context更新
            const newJsonData = updatedJson(selectedJsonData);
            if (!newJsonData)
                return;
            setSelectedJsonData(newJsonData);
            // サーバーへPUT更新
            const payload = {
                json_id: selectedJsonData.id,
                No: currentArea.No,
                description: newJsonData.description,
                json_data: {
                    areas: newJsonData.json_data.areas,
                },
            };
            await axios.put(`http://localhost:8000/ocr_app/api/input_json/${selectedJsonData.id}/`, payload);
            alert('Markdown text saved successfully!');
        }
        catch (error) {
            console.error('Failed to save:', error);
            alert('Failed to save changes. Please try again.');
        }
    };
    // 以下は表示UI
    if (!selectedJsonData) {
        return _jsx("p", { children: "No JSON selected." });
    }
    return (_jsxs("div", { style: { display: 'flex', gap: '1rem' }, children: [_jsx("div", { style: { width: '220px', borderRight: '1px solid #ccc' }, children: _jsx(ImageSelector, { areaList: selectedJsonData.json_data.areas, selectedAreaIndex: selectedAreaIndex || 0, onSelectArea: setSelectedAreaIndex }) }), _jsxs("div", { style: { flex: 1, marginTop: '1rem' }, children: [_jsx("h2", { children: "Markdown Editor" }), _jsxs(FormControl, { fullWidth: true, style: { marginBottom: '1rem' }, children: [_jsx(InputLabel, { children: "Editor Target" }), _jsxs(Select, { value: editorTarget, label: "Editor Target", onChange: handleEditorTargetChange, children: [_jsx(MenuItem, { value: "question_text", children: "Question Text" }), _jsx(MenuItem, { value: "options_text", children: "Options Text" })] })] }), editorTarget === 'options_text' && (_jsxs(FormControl, { fullWidth: true, style: { marginBottom: '1rem' }, children: [_jsx(InputLabel, { children: "Option Key" }), _jsx(Select, { value: selectedOptionKey, label: "Option Key", onChange: handleOptionKeyChange, children: optionKeys.map((key) => (_jsx(MenuItem, { value: key, children: key }, key))) })] })), getPreviewImages().length > 0 && (_jsxs("div", { style: { marginBottom: '1rem' }, children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: "Available Images" }), _jsx(Grid, { container: true, spacing: 2, children: getPreviewImages().map((imagePath, index) => (_jsx(Grid, { item: true, xs: 4, children: _jsx(Card, { children: _jsx(CardActionArea, { onClick: () => handleInsertImage(imagePath), children: _jsx(CardMedia, { component: "img", height: "140", image: convertToMediaUrl(imagePath), alt: `Preview ${index + 1}` }) }) }) }, index))) })] })), _jsx(MarkdownEditor, { value: markdownText, onChange: handleChange }), _jsx("h3", { children: "Preview" }), _jsx("div", { style: {
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            padding: '1.5rem',
                            minHeight: '200px',
                            backgroundColor: '#fff',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            overflowY: 'auto',
                            maxHeight: '500px'
                        }, children: _jsx(MarkdownPreview, { content: markdownText }) }), _jsxs("div", { style: { marginTop: '1rem' }, children: [_jsx(Button, { variant: "contained", color: "primary", onClick: handleSave, style: { marginRight: '0.5rem' }, children: "Save" }), _jsx(Button, { variant: "outlined", onClick: resetToInitial, children: "Reset" })] })] })] }));
};
export default MarkdownEditorTab;
