import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/ocr_app/JsonManager/JsonManager.tsx
import { useContext } from 'react';
import { JsonDataContext } from '../Context/JsonDataContext';
import JsonList from './JsonList';
import JsonUploader from './JsonUploader';
const JsonManager = () => {
    // Contextから操作関数を取得
    const { setSelectedJsonId } = useContext(JsonDataContext);
    return (_jsxs("div", { style: { maxWidth: '900px', margin: '0 auto', padding: '1rem' }, children: [_jsx("h2", { children: "JSON Manager" }), _jsxs("div", { style: { display: 'flex', gap: '1rem' }, children: [_jsx("div", { style: { flex: 2 }, children: _jsx(JsonList, { onSelectJson: (id) => setSelectedJsonId(id) }) }), _jsx("div", { style: { flex: 1, border: '1px solid #ccc', padding: '1rem', borderRadius: '4px' }, children: _jsx(JsonUploader, {}) })] })] }));
};
export default JsonManager;
