// src/ocr_app/context/JsonDataContext.tsx
import React, { createContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { InputJSONData, JsonDataContextType } from '../types';

// Contextオブジェクトを作成
export const JsonDataContext = createContext<JsonDataContextType>({
  selectedJsonId: null,
  selectedJsonData: null,
  loading: false,
  error: '',
  setSelectedJsonId: () => {},
  fetchJsonDetail: async () => {},
  
});

interface JsonDataProviderProps {
  children: React.ReactNode;
}

export const JsonDataProvider: React.FC<JsonDataProviderProps> = ({ children }) => {
  const [selectedJsonId, setSelectedJsonId] = useState<number | null>(null);
  const [selectedJsonData, setSelectedJsonData] = useState<InputJSONData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  /**
   * 指定されたIDのJSON詳細を取得
   */
  const fetchJsonDetail = useCallback(async (id: number) => {
    console.log('[JsonDataProvider] fetchJsonDetail called. ID =', id);
    setLoading(true);
    setError('');

    try {
      // ここで受け取るJSONが「{ id, description, areas: [...], ... }」の形であることが前提
      const res = await axios.get<InputJSONData>(
        `http://localhost:8000/ocr_app/api/input_json/${id}/`
      );
      setSelectedJsonData(res.data);

      console.log('[JsonDataProvider] fetchJsonDetail success:', res.data);
    } catch (err: any) {
      console.error('[JsonDataProvider] fetchJsonDetail error:', err);
      setError(`Failed to fetch JSON data (id=${id}). ${err.message ?? ''}`);
    } finally {
      setLoading(false);
    }
  }, []);

  // Provider初期マウント/アンマウント時のログ
  useEffect(() => {
    console.log('[JsonDataProvider] Mounted');
    return () => {
      console.log('[JsonDataProvider] Unmounted');
    };
  }, []);

  // selectedJsonId が変わったら自動で詳細フェッチ
  useEffect(() => {
    console.log('[JsonDataProvider] selectedJsonId changed:', selectedJsonId);
    if (selectedJsonId) {
      fetchJsonDetail(selectedJsonId);
    } else {
      setSelectedJsonData(null);
    }
  }, [selectedJsonId, fetchJsonDetail]);

  return (
    <JsonDataContext.Provider
      value={{
        selectedJsonId,
        selectedJsonData,
        loading,
        error,
        setSelectedJsonId,
        fetchJsonDetail,
        setSelectedJsonData,
      }}
    >
      {children}
    </JsonDataContext.Provider>
  );
};