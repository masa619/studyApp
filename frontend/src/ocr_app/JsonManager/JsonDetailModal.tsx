import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface InputJSONDetail {
  id: number;
  description: string;
  json_data: any;    // The actual JSON structure
  created_at: string;
  updated_at: string;
}

interface Props {
  jsonId: number;
  onClose: () => void;
}

/**
 * シンプルなモーダル例
 * - GET /ocr_app/api/input_json/<id>/ で詳細を取得
 * - json_data を簡易表示
 */
const JsonDetailModal: React.FC<Props> = ({ jsonId, onClose }) => {
  const [detail, setDetail] = useState<InputJSONDetail | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await axios.get<InputJSONDetail>(
          `http://localhost:8000/ocr_app/api/input_json/${jsonId}/`
        );
        setDetail(res.data);
      } catch (err: any) {
        console.error(err);
        setError(`Failed to fetch detail. ${err.message || ''}`);
      }
    };
    fetchDetail();
  }, [jsonId]);

  if (error) {
    return (
      <div style={modalStyle}>
        <div style={modalContentStyle}>
          <p style={{ color: 'red' }}>{error}</p>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div style={modalStyle}>
        <div style={modalContentStyle}>
          <p>Loading detail...</p>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }

  return (
    <div style={modalStyle}>
      <div style={modalContentStyle}>
        <h3>JSON Detail (ID: {detail.id})</h3>
        <p>Description: {detail.description}</p>
        <div style={{ maxHeight: '300px', overflow: 'auto', background: '#fafafa', padding: '8px' }}>
          <pre style={{ whiteSpace: 'pre-wrap' }}>
            {JSON.stringify(detail.json_data, null, 2)}
          </pre>
        </div>
        <p>Created: {detail.created_at}</p>
        <p>Updated: {detail.updated_at}</p>

        <button onClick={onClose} style={{ marginTop: '8px' }}>
          Close
        </button>
      </div>
    </div>
  );
};

// Minimal styling for modal
const modalStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.4)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const modalContentStyle: React.CSSProperties = {
  backgroundColor: '#fff',
  padding: '1rem',
  borderRadius: '6px',
  width: '500px',
  maxHeight: '80vh',
  overflow: 'auto'
};

export default JsonDetailModal;