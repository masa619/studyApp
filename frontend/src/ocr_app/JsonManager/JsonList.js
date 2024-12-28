import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/ocr_app/JsonManager/JsonList.tsx
import { useEffect, useState } from 'react';
import axios from 'axios';
const JsonList = ({ onSelectJson }) => {
    const [jsonList, setJsonList] = useState([]);
    const [message, setMessage] = useState('');
    const fetchList = async () => {
        try {
            const res = await axios.get('http://localhost:8000/ocr_app/api/input_json/');
            setJsonList(res.data);
        }
        catch (err) {
            console.error(err);
            setMessage(`Failed to fetch list. ${err.message || ''}`);
        }
    };
    useEffect(() => {
        fetchList();
    }, []);
    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure to delete this JSON data?'))
            return;
        try {
            await axios.delete(`http://localhost:8000/ocr_app/api/input_json/${id}/`);
            setMessage(`Deleted id=${id}`);
            // リスト再取得
            fetchList();
        }
        catch (err) {
            console.error(err);
            setMessage(`Failed to delete. ${err.message || ''}`);
        }
    };
    return (_jsxs("div", { style: { border: '1px solid #ccc', padding: '1rem', borderRadius: '4px' }, children: [_jsx("h3", { children: "Existing JSON List" }), message && _jsx("p", { style: { color: 'red' }, children: message }), jsonList.length === 0 ? (_jsx("p", { children: "No JSON found." })) : (_jsx("ul", { style: { listStyle: 'none', paddingLeft: 0 }, children: jsonList.map(item => (_jsxs("li", { style: {
                        marginBottom: '0.5rem',
                        borderBottom: '1px solid #eee',
                        paddingBottom: '0.5rem'
                    }, children: [_jsxs("div", { children: [_jsx("strong", { children: "ID:" }), " ", item.id, " | ", _jsx("strong", { children: "Desc:" }), " ", item.description] }), _jsxs("div", { style: { fontSize: '0.9rem', color: '#666' }, children: ["Created: ", item.created_at] }), _jsxs("div", { style: { marginTop: '4px' }, children: [_jsx("button", { onClick: () => onSelectJson(item.id), style: { marginRight: '8px' }, children: "Detail" }), _jsx("button", { onClick: () => handleDelete(item.id), style: { color: 'red' }, children: "Delete" })] })] }, item.id))) }))] }));
};
export default JsonList;
