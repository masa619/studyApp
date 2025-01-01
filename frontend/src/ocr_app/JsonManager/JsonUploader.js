import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/ocr_app/jsonmanager/JsonUploader.tsx
import { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { JsonDataContext } from '../Context/JsonDataContext';
/**
 * 新規JSONファイルをアップロード (multipart/form-data) + optional OCR
 */
const JsonUploader = () => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [description, setDescription] = useState('');
    const [performOCR, setPerformOCR] = useState(false);
    const [message, setMessage] = useState('');
    const { setSelectedJsonId } = useContext(JsonDataContext);
    useEffect(() => {
        if (description) {
            setMessage(`Description set to: ${description}`);
        }
    }, [description]);
    const handleFileChange = (e) => {
        setSelectedFile(e.target.files?.[0] || null);
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const directory_name = file.webkitRelativePath.split('/').slice(0, -1).join('/');
            setDescription(directory_name);
            console.log(directory_name);
        }
    };
    const handleUpload = async () => {
        if (!selectedFile) {
            setMessage("No file selected");
            return;
        }
        try {
            setMessage("Uploading...");
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('description', description);
            formData.append('perform_ocr', performOCR ? 'true' : 'false');
            const response = await axios.post('http://localhost:8000/ocr_app/api/import_json/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setMessage(`Success: ${JSON.stringify(response.data)}`);
            setSelectedJsonId(response.data.json_id);
        }
        catch (error) {
            console.error(error);
            setMessage(`Failed: ${error.message || String(error)}`);
        }
    };
    return (_jsxs("div", { children: [_jsx("h4", { children: "Upload New JSON" }), message && _jsx("p", { style: { color: 'blue', whiteSpace: 'pre-wrap' }, children: message }), _jsxs("div", { style: { marginBottom: '8px' }, children: [_jsx("label", { children: "Description: " }), _jsx("input", { type: "text", value: description, onChange: e => setDescription(e.target.value), style: { marginLeft: '4px' } })] }), _jsxs("div", { style: { marginBottom: '8px' }, children: [_jsx("label", { children: "JSON File: " }), _jsx("input", { type: "file", accept: ".json", onChange: handleFileChange })] }), _jsxs("div", { style: { marginBottom: '8px' }, children: [_jsx("label", { children: "Perform OCR: " }), _jsx("input", { type: "checkbox", checked: performOCR, onChange: e => setPerformOCR(e.target.checked), style: { marginLeft: '4px' } })] }), _jsx("button", { onClick: handleUpload, children: "Upload" })] }));
};
export default JsonUploader;
