import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/ocr_app/OcrDashboard.tsx
import { useState, useContext } from 'react';
import { Tabs, Tab } from '@mui/material';
import { JsonDataContext } from './Context/JsonDataContext';
import JsonManager from './JsonManager/JsonManager';
import JsonDetailView from './jsonview/JsonDetailView';
import ManualCorrection from './correction/ManualCorrection';
import AreaSelectionCanvas from './konva/AreaSelectionCanvas'; // Canvas追加
const OcrDashboard = () => {
    const [tabValue, setTabValue] = useState(0);
    // Contextから状態を取得
    const { selectedJsonId, selectedJsonData, loading, error, } = useContext(JsonDataContext);
    // タブ切り替え
    const handleChangeTab = (event, newValue) => {
        setTabValue(newValue);
    };
    return (_jsxs("div", { style: { padding: '1rem' }, children: [_jsxs("header", { style: { marginBottom: '1rem' }, children: [_jsx("h1", { children: "OCR Dashboard" }), _jsxs("p", { children: ["Selected JSON ID: ", selectedJsonId ?? 'None'] })] }), _jsxs(Tabs, { value: tabValue, onChange: handleChangeTab, children: [_jsx(Tab, { label: "JSON Manager" }), _jsx(Tab, { label: "Detail" }), _jsx(Tab, { label: "Correction" }), _jsx(Tab, { label: "Canvas" }), " "] }), tabValue === 0 && (_jsx(JsonManager, {})), tabValue === 1 && (selectedJsonId ? (_jsxs("div", { style: { marginTop: '1rem' }, children: [loading && _jsx("p", { children: "Loading JSON detail..." }), error && _jsx("p", { style: { color: 'red' }, children: error }), selectedJsonData && !loading && (_jsx(JsonDetailView, {}))] })) : (_jsx("p", { style: { marginTop: '1rem' }, children: "No JSON selected." }))), tabValue === 2 && (selectedJsonId ? (_jsxs("div", { style: { marginTop: '1rem' }, children: [loading && _jsx("p", { children: "Loading JSON detail..." }), error && _jsx("p", { style: { color: 'red' }, children: error }), selectedJsonData && !loading && (_jsx(ManualCorrection, { jsonId: selectedJsonId, jsonData: selectedJsonData }))] })) : (_jsx("p", { style: { marginTop: '1rem' }, children: "No JSON selected." }))), tabValue === 3 && (selectedJsonId ? (_jsxs("div", { style: { marginTop: '1rem' }, children: [loading && _jsx("p", { children: "Loading JSON detail..." }), error && _jsx("p", { style: { color: 'red' }, children: error }), selectedJsonData && !loading && (_jsx(AreaSelectionCanvas, {}))] })) : (_jsx("p", { style: { marginTop: '1rem' }, children: "No JSON selected." })))] }));
};
export default OcrDashboard;
