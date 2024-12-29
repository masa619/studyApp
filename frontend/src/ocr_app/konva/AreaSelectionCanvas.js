import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/ocr_app/konva/AreaSelectionCanvas.tsx
import { useState, useEffect, useContext } from 'react';
import { Stage, Layer, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';
import { Button, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { JsonDataContext } from '../Context/JsonDataContext';
import { convertToMediaUrl } from '../utils/convertToMediaUrl';
import ImageSelector from '../correction/ImageSelector';
import { useRectController } from './hooks/useRectController';
import ScaleSlider from './components/ScaleSlider';
import RectList from './components/RectList';
import RectRow from './components/RectRow';
import SingleCroppedImagePreview from './components/SingleCroppedImagePreview';
import { deleteCroppedImage } from './services/uploadService'; // 削除API
const DEFAULT_BASE_WIDTH = 600;
const AreaSelectionCanvas = () => {
    // ========== 1) Context & State ==========
    const { selectedJsonId, selectedJsonData, setSelectedJsonData } = useContext(JsonDataContext);
    const areaList = selectedJsonData?.json_data?.areas || [];
    const [selectedAreaIndex, setSelectedAreaIndex] = useState(0);
    const currentArea = areaList[selectedAreaIndex];
    // "Question" / "Options" 切り替え
    const [selectedImageType, setSelectedImageType] = useState('Question');
    // ========== 2) 既存画像を配列で参照 ==========
    const questionImagePaths = currentArea?.question_element?.image_paths || [];
    const optionsImagePaths = (() => {
        const od = currentArea?.options_element?.options_dict;
        if (!od)
            return [];
        // 例: {"イ": { text: "1", image_paths: [...] }, "ロ": {...}, ...}
        return Object.values(od).flatMap((v) => v?.image_paths || []);
    })();
    // 選択タイプに応じて表示用の配列を切り替える
    const existingImages = selectedImageType === 'Question' ? questionImagePaths : optionsImagePaths;
    // ========== 3) 表示する画像URLを決める ==========
    // question_image_fullPath / options_image_fullPath (単数キー) もあり得ますが、
    // とりあえず最初に表示するのは "Question" を初期とする例
    const questionImageFullPath = convertToMediaUrl(currentArea?.question_image_path || '');
    const optionsImageFullPath = convertToMediaUrl(currentArea?.options_image_path || '');
    const areaImageFullPath = convertToMediaUrl(currentArea?.area_image_path || '');
    // selectedImageType により Canvas の表示対象を切り替え
    const [imageUrl, setImageUrl] = useState(questionImageFullPath);
    const [image, status] = useImage(imageUrl, 'anonymous');
    useEffect(() => {
        if (selectedImageType === 'Question') {
            setImageUrl(questionImageFullPath);
        }
        else {
            setImageUrl(optionsImageFullPath);
        }
    }, [selectedImageType, questionImageFullPath, optionsImageFullPath]);
    // ========== 4) Canvasスケール管理 ==========
    const [scale, setScale] = useState(1.0);
    const [naturalWidth, setNaturalWidth] = useState(0);
    const [naturalHeight, setNaturalHeight] = useState(0);
    useEffect(() => {
        if (status === 'loaded' && image) {
            console.log('image loaded: ', image.naturalWidth, image.naturalHeight);
            setNaturalWidth(image.naturalWidth);
            setNaturalHeight(image.naturalHeight);
        }
    }, [status, image]);
    const scaledWidth = naturalWidth > 0 ? naturalWidth * scale : 0;
    const scaledHeight = naturalHeight > 0 ? naturalHeight * scale : 0;
    // ========== 5) 矩形管理フック ==========
    const { rects, newRect, croppedImages, handleMouseDown, handleMouseMove, handleMouseUp, removeRect, handlePreviewRect, handleCropRect, handleSaveRect, resetRectsAndCrops, } = useRectController(image || null, naturalWidth, naturalHeight, scaledWidth, scaledHeight, questionImageFullPath, optionsImageFullPath, selectedImageType, currentArea);
    // ========== 6) 既存画像の削除 ==========
    const handleDeleteRegisteredImage = async (filePath) => {
        if (!currentArea)
            return;
        if (!selectedJsonData)
            return;
        const jsonId = selectedJsonData?.id?.toString() || '1';
        const areaId = currentArea?.area_id?.toString() || '1';
        const noNumber = currentArea?.No?.toString() || '1';
        try {
            const resp = await deleteCroppedImage({
                selectedImageType: selectedImageType.toLowerCase(),
                jsonId,
                areaId,
                noNumber,
                filePath,
            });
            // Context更新 => 最新JSONに置き換える
            if (setSelectedJsonData) {
                setSelectedJsonData((prev) => {
                    if (!prev)
                        return prev;
                    return {
                        ...prev,
                        json_data: resp.updated_json_data,
                    };
                });
                alert('Deleted successfully');
            }
        }
        catch (error) {
            console.error('handleDeleteRegisteredImage error:', error);
            alert('Error while deleting image');
        }
    };
    // ========== 7) エリア画像を表示する ==========
    const handleUseAreaImagePath = () => {
        if (areaImageFullPath) {
            setImageUrl(areaImageFullPath);
        }
        else {
            alert('area_image_path がありません');
        }
    };
    // リセット
    const handleReset = () => {
        resetRectsAndCrops();
    };
    // ========== 8) レンダリング ==========
    return (_jsxs("div", { style: { border: '1px solid #ccc', padding: '1rem', display: 'flex', gap: '1rem' }, children: [_jsxs("div", { style: { width: 220, borderRight: '1px solid #ccc', marginRight: '1rem' }, children: [_jsx(ImageSelector, { areaList: areaList, selectedAreaIndex: selectedAreaIndex, onSelectArea: setSelectedAreaIndex }), _jsx("div", { style: { marginTop: '1rem' }, children: _jsxs(FormControl, { size: "small", style: { marginBottom: '1rem' }, children: [_jsx(InputLabel, { id: "image-type-label", children: "Image Type" }), _jsxs(Select, { labelId: "image-type-label", value: selectedImageType, label: "Image Type", onChange: (e) => setSelectedImageType(e.target.value), style: { width: 120 }, children: [_jsx(MenuItem, { value: "Question", children: "Question" }), _jsx(MenuItem, { value: "Options", children: "Options" })] })] }) }), existingImages.length > 0 && (_jsxs("div", { style: { marginTop: '1rem' }, children: [_jsx("h4", { children: "Registered Images" }), existingImages.map((imgPath, idx) => (_jsxs("div", { style: { marginBottom: '0.5rem' }, children: [_jsx("img", { src: convertToMediaUrl(imgPath), alt: `registered_${idx}`, style: { maxWidth: '100%', display: 'block', marginBottom: '0.25rem' } }), _jsx(Button, { variant: "outlined", color: "error", onClick: () => handleDeleteRegisteredImage(imgPath), children: "DELETE" })] }, idx)))] }))] }), _jsxs("div", { style: { flex: 1 }, children: [_jsx("h3", { children: "Area Selection (Canvas)" }), _jsx(ScaleSlider, { scale: scale, setScale: setScale }), _jsxs("p", { children: ["scaledWidth: ", scaledWidth, ", scaledHeight: ", scaledHeight, " ", _jsx("br", {}), "naturalWidth: ", naturalWidth, ", naturalHeight: ", naturalHeight] }), _jsx("div", { style: {
                            width: scaledWidth,
                            height: scaledHeight,
                            border: '1px solid gray',
                            overflow: 'hidden',
                        }, children: _jsx(Stage, { width: scaledWidth, height: scaledHeight, onMouseDown: handleMouseDown, onMouseMove: handleMouseMove, onMouseUp: handleMouseUp, style: { backgroundColor: '#fefefe' }, children: _jsxs(Layer, { children: [image && (_jsx(KonvaImage, { image: image, x: 0, y: 0, width: scaledWidth, height: scaledHeight })), _jsx(RectList, { rects: rects, strokeColor: "red", fillColor: "rgba(255,0,0,0.1)", onRectClick: (i) => removeRect(i) }), newRect && (_jsx(RectList, { rects: [newRect], strokeColor: "blue", fillColor: "rgba(0,0,255,0.1)" }))] }) }) }), _jsxs("div", { style: { marginTop: '1rem' }, children: [_jsx("h4", { children: "Drawn Rectangles" }), rects.length === 0 ? (_jsx("p", { children: "None" })) : (rects.map((r, i) => (_jsx(RectRow, { index: i, rect: r, onPreview: handlePreviewRect, onCrop: handleCropRect, onSave: handleSaveRect, onRemove: removeRect }, i))))] }), croppedImages.length > 0 && (_jsxs("div", { style: { marginTop: '1rem' }, children: [_jsx("h4", { children: "Cropped Images" }), _jsx("div", { style: { display: 'flex', flexWrap: 'wrap', gap: '1rem' }, children: croppedImages.map((ci, idx) => (_jsx(SingleCroppedImagePreview, { cropItem: ci, scale: 1.0 }, idx))) })] })), _jsxs("div", { style: { marginTop: '1rem' }, children: [_jsx(Button, { variant: "contained", color: "primary", style: { marginRight: '0.5rem' }, onClick: handleUseAreaImagePath, children: "USE AREA_IMAGE_PATH" }), _jsx(Button, { variant: "contained", color: "secondary", onClick: handleReset, children: "RESET" })] })] })] }));
};
export default AreaSelectionCanvas;
