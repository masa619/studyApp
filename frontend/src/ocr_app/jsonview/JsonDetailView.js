import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/ocr_app/jsonview/JsonDetailView.tsx
import { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { JsonDataContext } from '../Context/JsonDataContext';
import AreaItem from './AreaItem';
const JsonDetailView = () => {
    const navigate = useNavigate();
    const { selectedJsonId, selectedJsonData, loading, error } = useContext(JsonDataContext);
    useEffect(() => {
        console.log('[JsonDetailView] selectedJsonId:', selectedJsonId);
        console.log('[JsonDetailView] selectedJsonData:', selectedJsonData);
    }, [selectedJsonId, selectedJsonData]);
    if (loading) {
        return _jsx("p", { children: "Loading detail..." });
    }
    if (error) {
        return (_jsxs("div", { children: [_jsx("p", { style: { color: 'red' }, children: error }), _jsx("button", { onClick: () => navigate(-1), children: "Back" })] }));
    }
    if (!selectedJsonData) {
        return (_jsxs("div", { children: [_jsx("p", { children: "No JSON selected." }), _jsx("button", { onClick: () => navigate(-1), children: "Back" })] }));
    }
    // ここで「json_data」として取り出し、その中に「areas」が入っている想定
    const { id, description, json_data } = selectedJsonData;
    const areas = json_data?.areas || [];
    return (_jsxs("div", { style: { padding: '1rem' }, children: [_jsx("button", { onClick: () => navigate(-1), children: "Back" }), _jsxs("h2", { children: ["JSON Detail (ID: ", id, ")"] }), _jsxs("p", { children: [_jsx("strong", { children: "Description:" }), " ", description] }), _jsx("hr", {}), areas.length > 0 ? (_jsxs("div", { children: [_jsx("h3", { children: "Areas" }), areas.map((area, idx) => (_jsx(AreaItem, { areaIndex: idx }, idx)))] })) : (_jsx("p", { children: "No areas found." }))] }));
};
export default JsonDetailView;
