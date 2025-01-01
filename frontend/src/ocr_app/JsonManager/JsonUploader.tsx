// src/ocr_app/jsonmanager/JsonUploader.tsx
import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { JsonDataContext } from '../Context/JsonDataContext';
/**
 * 新規JSONファイルをアップロード (multipart/form-data) + optional OCR
 */
const JsonUploader: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [performOCR, setPerformOCR] = useState(false);
  const [message, setMessage] = useState('');
  const { setSelectedJsonId } = useContext(JsonDataContext);

  useEffect(() => {
    if (description) {
      setMessage(`Description set to: ${description}`);
    }
  }, [description]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

      const response = await axios.post(
        'http://localhost:8000/ocr_app/api/import_json/',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      );

      setMessage(`Success: ${JSON.stringify(response.data)}`);
      setSelectedJsonId(response.data.json_id);
    } catch (error: any) {
      console.error(error);
      setMessage(`Failed: ${error.message || String(error)}`);
    }
  };

  return (
    <div>
      <h4>Upload New JSON</h4>

      {message && <p style={{ color: 'blue', whiteSpace: 'pre-wrap' }}>{message}</p>}

      <div style={{ marginBottom: '8px' }}>
        <label>Description: </label>
        <input
          type="text"
          value={description}
          onChange={e => setDescription(e.target.value)}
          style={{ marginLeft: '4px' }}
        />
      </div>

      <div style={{ marginBottom: '8px' }}>
        <label>JSON File: </label>
        <input type="file" accept=".json" onChange={handleFileChange} />
      </div>

      <div style={{ marginBottom: '8px' }}>
        <label>Perform OCR: </label>
        <input
          type="checkbox"
          checked={performOCR}
          onChange={e => setPerformOCR(e.target.checked)}
          style={{ marginLeft: '4px' }}
        />
      </div>

      <button onClick={handleUpload}>Upload</button>
    </div>
  );
};

export default JsonUploader;