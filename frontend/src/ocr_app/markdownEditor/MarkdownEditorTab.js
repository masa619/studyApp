import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// --- src/ocr_app/markdownEditor/MarkdownEditorTab.tsx ---
import { useContext, useEffect, useState, useCallback } from 'react';
import { Button, FormControl, InputLabel, MenuItem, Select, Typography, Card, CardMedia, CardActions, Grid, Snackbar, Alert } from '@mui/material';
import axios from 'axios';
import { JsonDataContext } from '../Context/JsonDataContext';
import MarkdownEditor from './components/MarkdownEditor';
import MarkdownPreview from './components/MarkdownPreview';
import { useMarkdownData } from './hooks/useMarkdownData';
import ImageSelector from '../correction/ImageSelector';
const MarkdownEditorTab = () => {
    const { selectedJsonData, setSelectedJsonData, selectedAreaIndex, setSelectedAreaIndex, } = useContext(JsonDataContext);
    const currentArea = selectedJsonData?.json_data?.areas?.[selectedAreaIndex || 0];
    const optionKeys = currentArea?.options_element?.options_dict
        ? Object.keys(currentArea.options_element.options_dict)
        : [];
    const [editorTarget, setEditorTarget] = useState('question_text');
    const [selectedOptionKey, setSelectedOptionKey] = useState('');
    // Snackbar用のステート
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success');
    // 画像パスを /media/... に変換するための簡易関数 (環境に合わせて調整)
    const convertToMediaUrl = useCallback((path) => {
        if (!path)
            return '';
        // 例: Django /media/ 以下に配置している想定
        return `http://localhost:8000/media/${path.replace(/^.*?CREATE_DATA2\//, '')}`;
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
    // useMarkdownData: Markdownテキストとstate管理
    const { markdownText, setMarkdownText, handleChange, resetToInitial, } = useMarkdownData(getCurrentText());
    // editorTarget or currentArea or selectedOptionKey が変わったらテキストを再取得
    useEffect(() => {
        setMarkdownText(getTextByTarget(editorTarget));
    }, [currentArea, editorTarget, selectedOptionKey]);
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
    // EditorTarget選択変更
    const handleEditorTargetChange = (e) => {
        const newTarget = e.target.value;
        setEditorTarget(newTarget);
        setMarkdownText(getTextByTarget(newTarget));
    };
    // オプションキー選択変更
    const handleOptionKeyChange = (e) => {
        const newKey = e.target.value;
        setSelectedOptionKey(newKey);
        if (editorTarget === 'options_text') {
            const dictItem = currentArea?.options_element?.options_dict?.[newKey];
            setMarkdownText(dictItem?.text || '');
        }
    };
    // 「Available Images」一覧に表示するパスを取得
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
    // =========== 画像挿入機能 (従来の handleInsertImage) ===========
    const handleInsertImageToMarkdown = useCallback((imagePath) => {
        // CREATE_DATA2/ 以降を取り出して /media/... にする例
        const relative = imagePath.match(/CREATE_DATA2\/(.*)/)?.[1] || imagePath;
        const imageMarkdown = `\n![image](/media/${relative})\n`;
        // Markdown末尾に挿入
        setMarkdownText((prev) => prev + imageMarkdown);
        // 成功メッセージ
        setSnackbarMessage('Image inserted successfully');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
    }, [setMarkdownText]);
    // =========== プレビュー（新タブで拡大） ===========
    const handlePreviewImageInNewTab = useCallback((imagePath) => {
        window.open(convertToMediaUrl(imagePath), '_blank');
    }, [convertToMediaUrl]);
    // Snackbarを閉じる
    const handleSnackbarClose = (_event, reason) => {
        if (reason === 'clickaway')
            return;
        setSnackbarOpen(false);
    };
    // JSON更新 (Saveボタン)  
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
            const newJsonData = updatedJson(selectedJsonData);
            if (!newJsonData)
                return;
            setSelectedJsonData(newJsonData);
            // サーバーPUT (例: Django REST API)
            const payload = {
                json_id: selectedJsonData.id,
                No: currentArea.No,
                description: newJsonData.description,
                json_data: {
                    areas: newJsonData.json_data.areas,
                },
            };
            await axios.put(`http://localhost:8000/ocr_app/api/input_json/${selectedJsonData.id}/`, payload);
            // 成功メッセージ
            setSnackbarMessage('Markdown text saved successfully!');
            setSnackbarSeverity('success');
            setSnackbarOpen(true);
        }
        catch (error) {
            console.error('Failed to save:', error);
            // エラーメッセージ
            setSnackbarMessage('Failed to save changes. Please try again.');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        }
    };
    // 次のAreaに移動
    const handleNextArea = useCallback(() => {
        if (!selectedJsonData)
            return;
        const totalAreas = selectedJsonData.json_data.areas.length;
        const nextIndex = (selectedAreaIndex || 0) + 1;
        if (nextIndex < totalAreas) {
            setSelectedAreaIndex(nextIndex);
            // 移動成功メッセージ
            setSnackbarMessage(`Moved to Area ${nextIndex + 1}`);
            setSnackbarSeverity('info');
            setSnackbarOpen(true);
            // スクロールを一番上に戻す
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        else {
            // 最後のAreaの場合
            setSnackbarMessage('This is the last area');
            setSnackbarSeverity('info');
            setSnackbarOpen(true);
        }
    }, [selectedJsonData, selectedAreaIndex, setSelectedAreaIndex]);
    if (!selectedJsonData) {
        return _jsx("p", { children: "No JSON selected." });
    }
    // 次のAreaが存在するかチェック
    const hasNextArea = selectedJsonData.json_data.areas.length > (selectedAreaIndex || 0) + 1;
    return (_jsxs("div", { style: { display: 'flex', gap: '1rem' }, children: [_jsx("div", { style: { width: '220px', borderRight: '1px solid #ccc' }, children: _jsx(ImageSelector, { areaList: selectedJsonData.json_data.areas, selectedAreaIndex: selectedAreaIndex || 0, onSelectArea: (index) => {
                        setSelectedAreaIndex(index);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    } }) }), _jsxs("div", { style: { flex: 1, marginTop: '1rem' }, children: [_jsx("h2", { children: "Markdown Editor" }), _jsxs(FormControl, { fullWidth: true, style: { marginBottom: '1rem' }, children: [_jsx(InputLabel, { children: "Editor Target" }), _jsxs(Select, { value: editorTarget, label: "Editor Target", onChange: handleEditorTargetChange, children: [_jsx(MenuItem, { value: "question_text", children: "Question Text" }), _jsx(MenuItem, { value: "options_text", children: "Options Text" })] })] }), editorTarget === 'options_text' && (_jsxs(FormControl, { fullWidth: true, style: { marginBottom: '1rem' }, children: [_jsx(InputLabel, { children: "Option Key" }), _jsx(Select, { value: selectedOptionKey, label: "Option Key", onChange: handleOptionKeyChange, children: optionKeys.map((key) => (_jsx(MenuItem, { value: key, children: key }, key))) })] })), currentArea?.area_image_path && (_jsxs("div", { style: { marginBottom: '1rem' }, children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: "Area Image" }), _jsx("div", { style: { width: '600px', marginBottom: '1rem' }, children: _jsx(Card, { children: _jsx(CardMedia, { component: "img", style: { width: '600px', height: 'auto', objectFit: 'contain' }, image: convertToMediaUrl(currentArea.area_image_path), alt: "Area Image" }) }) })] })), getPreviewImages().length > 0 && (_jsxs("div", { style: { marginBottom: '1rem' }, children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: "Available Images" }), _jsx(Grid, { container: true, spacing: 2, children: getPreviewImages().map((imagePath, index) => (_jsx(Grid, { item: true, xs: 12, sm: 6, md: 3, lg: 2, children: _jsxs(Card, { children: [_jsx(CardMedia, { component: "img", style: { width: '100%', height: '120px', objectFit: 'contain' }, image: convertToMediaUrl(imagePath), alt: `Preview ${index + 1}` }), _jsxs(CardActions, { children: [_jsx(Button, { size: "small", color: "primary", onClick: () => handlePreviewImageInNewTab(imagePath), children: "Preview" }), _jsx(Button, { size: "small", color: "secondary", onClick: () => handleInsertImageToMarkdown(imagePath), children: "Insert" })] })] }) }, index))) })] })), _jsx(MarkdownEditor, { value: markdownText, onChange: handleChange }), _jsx("h3", { children: "Preview" }), _jsx("div", { style: {
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            padding: '1.5rem',
                            minHeight: '200px',
                            backgroundColor: '#fff',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            overflowY: 'auto',
                            maxHeight: '500px'
                        }, children: _jsx(MarkdownPreview, { content: markdownText }) }), _jsx("div", { style: { marginTop: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }, children: _jsxs("div", { style: { display: 'flex', gap: '0.5rem' }, children: [_jsx(Button, { variant: "contained", color: "primary", onClick: handleSave, children: "Save" }), _jsx(Button, { variant: "outlined", onClick: resetToInitial, children: "Reset" }), _jsx(Button, { variant: "contained", color: "secondary", onClick: handleNextArea, disabled: !hasNextArea, children: "Next Area" })] }) }), _jsx(Snackbar, { open: snackbarOpen, autoHideDuration: 3000, onClose: handleSnackbarClose, anchorOrigin: { vertical: 'top', horizontal: 'center' }, sx: {
                            marginTop: '4rem',
                            '& .MuiSnackbar-root': {
                                top: '64px !important',
                            }
                        }, children: _jsx(Alert, { onClose: handleSnackbarClose, severity: snackbarSeverity, sx: {
                                width: '100%',
                                boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                                fontSize: '0.95rem',
                                '& .MuiAlert-message': {
                                    padding: '8px 0',
                                }
                            }, children: snackbarMessage }) })] })] }));
};
export default MarkdownEditorTab;
