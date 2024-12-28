// src/ocr_app/JsonManager/JsonList.tsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface InputJSONItem {
  id: number;
  description: string;
  created_at: string;
  updated_at: string;
}

interface Props {
  onSelectJson: (id: number) => void;
}

const JsonList: React.FC<Props> = ({ onSelectJson }) => {
  const [jsonList, setJsonList] = useState<InputJSONItem[]>([]);
  const [message, setMessage] = useState('');

  const fetchList = async () => {
    try {
      const res = await axios.get<InputJSONItem[]>(
        'http://localhost:8000/ocr_app/api/input_json/'
      );
      setJsonList(res.data);
    } catch (err: any) {
      console.error(err);
      setMessage(`Failed to fetch list. ${err.message || ''}`);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure to delete this JSON data?')) return;
    try {
      await axios.delete(`http://localhost:8000/ocr_app/api/input_json/${id}/`);
      setMessage(`Deleted id=${id}`);
      // リスト再取得
      fetchList();
    } catch (err: any) {
      console.error(err);
      setMessage(`Failed to delete. ${err.message || ''}`);
    }
  };

  return (
    <div style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '4px' }}>
      <h3>Existing JSON List</h3>
      {message && <p style={{ color: 'red' }}>{message}</p>}

      {jsonList.length === 0 ? (
        <p>No JSON found.</p>
      ) : (
        <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
          {jsonList.map(item => (
            <li
              key={item.id}
              style={{
                marginBottom: '0.5rem',
                borderBottom: '1px solid #eee',
                paddingBottom: '0.5rem'
              }}
            >
              <div>
                <strong>ID:</strong> {item.id} | <strong>Desc:</strong> {item.description}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>
                Created: {item.created_at}
              </div>
              <div style={{ marginTop: '4px' }}>
                <button onClick={() => onSelectJson(item.id)} style={{ marginRight: '8px' }}>
                  Detail
                </button>
                <button onClick={() => handleDelete(item.id)} style={{ color: 'red' }}>
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default JsonList;