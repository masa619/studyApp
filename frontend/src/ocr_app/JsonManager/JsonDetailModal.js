import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import axios from 'axios';
/**
 * シンプルなモーダル例
 * - GET /ocr_app/api/input_json/<id>/ で詳細を取得
 * - json_data を簡易表示
 */
const JsonDetailModal = ({ jsonId, onClose }) => {
    const [detail, setDetail] = useState(null);
    const [error, setError] = useState('');
    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const res = await axios.get(`http://localhost:8000/ocr_app/api/input_json/${jsonId}/`);
                setDetail(res.data);
            }
            catch (err) {
                console.error(err);
                setError(`Failed to fetch detail. ${err.message || ''}`);
            }
        };
        fetchDetail();
    }, [jsonId]);
    if (error) {
        return (_jsx("div", { style: modalStyle, children: _jsxs("div", { style: modalContentStyle, children: [_jsx("p", { style: { color: 'red' }, children: error }), _jsx("button", { onClick: onClose, children: "Close" })] }) }));
    }
    if (!detail) {
        return (_jsx("div", { style: modalStyle, children: _jsxs("div", { style: modalContentStyle, children: [_jsx("p", { children: "Loading detail..." }), _jsx("button", { onClick: onClose, children: "Close" })] }) }));
    }
    return (_jsx("div", { style: modalStyle, children: _jsxs("div", { style: modalContentStyle, children: [_jsxs("h3", { children: ["JSON Detail (ID: ", detail.id, ")"] }), _jsxs("p", { children: ["Description: ", detail.description] }), _jsx("div", { style: { maxHeight: '300px', overflow: 'auto', background: '#fafafa', padding: '8px' }, children: _jsx("pre", { style: { whiteSpace: 'pre-wrap' }, children: JSON.stringify(detail.json_data, null, 2) }) }), _jsxs("p", { children: ["Created: ", detail.created_at] }), _jsxs("p", { children: ["Updated: ", detail.updated_at] }), _jsx("button", { onClick: onClose, style: { marginTop: '8px' }, children: "Close" })] }) }));
};
// Minimal styling for modal
const modalStyle = {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
};
const modalContentStyle = {
    backgroundColor: '#fff',
    padding: '1rem',
    borderRadius: '6px',
    width: '500px',
    maxHeight: '80vh',
    overflow: 'auto'
};
export default JsonDetailModal;
