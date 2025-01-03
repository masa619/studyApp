import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
// src/ocr_app/konva/components/SingleCroppedImagePreview.tsx
import { useState, useRef, useCallback, useEffect } from 'react';
import { TextField, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
const SingleCroppedImagePreview = ({ cropItem, scale = 1, children, onLabelChange }) => {
    // 「サーバーで処理後の画像」があればそれを優先、それが無ければフロントのdataUrlを使う
    const finalSrc = cropItem.serverCroppedBase64
        ? `data:image/png;base64,${cropItem.serverCroppedBase64}`
        : cropItem.dataUrl;
    const imgRef = useRef(null);
    const [label, setLabel] = useState(cropItem.label);
    const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
    const [selectedKey, setSelectedKey] = useState(cropItem.selectedIrohaKey || '');
    const filteredBoxes = (cropItem.boundingBoxes || []).filter((bb) => bb.label !== 'final_box');
    const [boxStates, setBoxStates] = useState(() => filteredBoxes.map((bb) => ({ ...bb, isVisible: true })));
    // ラベル編集用の状態
    const [isEditing, setIsEditing] = useState(false);
    const [editingLabel, setEditingLabel] = useState(cropItem.label);
    useEffect(() => {
        setSelectedKey(cropItem.selectedIrohaKey || '');
    }, [cropItem.selectedIrohaKey]);
    const handleSelectChange = (e) => {
        const newKey = e.target.value; // "イ" "ロ" "ハ" "ニ" または空
        setSelectedKey(newKey);
        // CroppedImage側にも反映しておき、後で handleSaveRect で送信できるようにする
        cropItem.selectedIrohaKey = newKey;
    };
    const handleImageLoad = useCallback((e) => {
        const { naturalWidth, naturalHeight } = e.currentTarget;
        setNaturalSize({ width: naturalWidth, height: naturalHeight });
    }, []);
    const toggleBoxVisibility = useCallback((index) => {
        setBoxStates((prev) => prev.map((box, i) => {
            if (i === index) {
                return { ...box, isVisible: !box.isVisible };
            }
            return box;
        }));
    }, []);
    const handleLabelChange = (e) => {
        const newVal = e.target.value;
        setLabel(newVal);
        // 親にラベル変更を通知し、親側の cropItem.label も更新しておく
        if (onLabelChange) {
            onLabelChange(newVal);
        }
    };
    // boundingBoxes が変われば再初期化
    useEffect(() => {
        setBoxStates(filteredBoxes.map((bb) => ({ ...bb, isVisible: true })));
    }, [cropItem.boundingBoxes]);
    const expandMargin = cropItem.expandMargin ?? 0;
    // ラベル編集の確定
    const handleLabelSubmit = () => {
        if (onLabelChange) {
            onLabelChange(editingLabel);
        }
        setIsEditing(false);
    };
    // ラベル編集のキャンセル
    const handleLabelCancel = () => {
        setEditingLabel(cropItem.label);
        setIsEditing(false);
    };
    return (_jsxs("div", { style: { border: '1px solid #ccc', padding: '0.5rem', display: 'inline-block' }, children: [_jsx("div", { style: {
                    fontWeight: 'bold',
                    marginBottom: '0.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }, children: isEditing ? (_jsxs(_Fragment, { children: [_jsx(TextField, { size: "small", value: editingLabel, onChange: (e) => setEditingLabel(e.target.value), onKeyPress: (e) => {
                                if (e.key === 'Enter') {
                                    handleLabelSubmit();
                                }
                            }, autoFocus: true }), _jsx(IconButton, { size: "small", onClick: handleLabelSubmit, children: _jsx(CheckIcon, {}) }), _jsx(IconButton, { size: "small", onClick: handleLabelCancel, children: _jsx(CloseIcon, {}) })] })) : (_jsxs(_Fragment, { children: [cropItem.label, _jsx(IconButton, { size: "small", onClick: () => setIsEditing(true), children: _jsx(EditIcon, {}) })] })) }), _jsxs("div", { style: { marginBottom: '0.5rem' }, children: [_jsx("label", { children: "\u9078\u629E\u30AD\u30FC: " }), _jsxs("select", { value: selectedKey, onChange: handleSelectChange, style: { marginLeft: '4px' }, children: [_jsx("option", { value: "", children: "(\u9078\u629E\u306A\u3057)" }), _jsx("option", { value: "\u30A4", children: "\u30A4" }), _jsx("option", { value: "\u30ED", children: "\u30ED" }), _jsx("option", { value: "\u30CF", children: "\u30CF" }), _jsx("option", { value: "\u30CB", children: "\u30CB" })] })] }), boxStates.length > 0 && (_jsx("div", { style: { marginBottom: '0.5rem' }, children: boxStates.map((box, idx) => (_jsxs("button", { onClick: () => toggleBoxVisibility(idx), style: {
                        marginRight: '0.5rem',
                        cursor: 'pointer',
                        backgroundColor: box.isVisible ? '#e0f7fa' : '#ffe0e0',
                    }, children: [box.isVisible ? 'Hide' : 'Show', " [", box.label || 'box', "]"] }, idx))) })), _jsxs("div", { style: { position: 'relative', display: 'inline-block' }, children: [_jsx("img", { ref: imgRef, src: finalSrc, alt: cropItem.label, onLoad: handleImageLoad, style: {
                            display: 'block',
                            width: naturalSize.width > 0 ? naturalSize.width * scale : 'auto',
                            height: 'auto',
                            outline: '2px solid #888',
                            outlineOffset: '-2px',
                        } }), boxStates.map((bb, bIndex) => {
                        if (!bb.isVisible)
                            return null;
                        const offsetX = expandMargin;
                        const offsetY = expandMargin;
                        const styleBox = {
                            position: 'absolute',
                            border: `3px solid ${bb.color || 'blue'}`,
                            pointerEvents: 'none',
                            left: (bb.x + offsetX) * scale,
                            top: (bb.y + offsetY) * scale,
                            width: bb.width * scale,
                            height: bb.height * scale,
                        };
                        return _jsx("div", { style: styleBox }, bIndex);
                    })] }), naturalSize.width > 0 && (_jsxs("div", { style: { fontSize: '0.75em', marginTop: '0.5rem' }, children: ["(natural size: ", naturalSize.width, " x ", naturalSize.height, ")"] })), cropItem.serverSavedPath && (_jsxs("div", { style: { marginTop: '0.5rem', fontSize: '0.8em', color: '#666' }, children: ["SavedPath: ", cropItem.serverSavedPath] })), children] }));
};
export default SingleCroppedImagePreview;
