import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { JsonDataContext } from '../Context/JsonDataContext';

/**
 * ExamCategoryItem:
 *   - id, slug, name, is_active
 */
type ExamCategoryItem = {
  id: number;
  slug: string;
  name: string;
  is_active: boolean;
};

/**
 * ExamItem:
 *   - id, key, name, is_active
 */
type ExamItem = {
  id: number;
  key: string;
  name: string;
  is_active: boolean;
};

type Props = {
  onSuccess?: (msg: string) => void;
};

const ExamImportForm: React.FC<Props> = ({ onSuccess }) => {
  const { selectedJsonData } = useContext(JsonDataContext);

  // ==================== ステート宣言 ====================
  // (A) カテゴリ一覧
  const [categoryList, setCategoryList] = useState<ExamCategoryItem[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [errorCategories, setErrorCategories] = useState<string>('');

  // (B) 選択中のカテゴリslug
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>(null);

  // (C) Exam一覧
  const [examList, setExamList] = useState<ExamItem[]>([]);
  const [loadingExams, setLoadingExams] = useState(false);
  const [errorExams, setErrorExams] = useState<string>('');

  // (D) JSONアップロード用フォーム (Exam ID, Key, Name)
  const [examId, setExamId] = useState<string>('');  // 空なら新規
  const [examKey, setExamKey] = useState<string>(''); 
  const [examName, setExamName] = useState<string>(''); 

  // (E) メッセージ表示
  const [message, setMessage] = useState<string>('');

  // ==================== 1) カテゴリ一覧の取得 ====================
  const fetchCategoryList = async () => {
    setLoadingCategories(true);
    setErrorCategories('');
    try {
      // GET /exam_core/api/categories/
      const res = await axios.get<ExamCategoryItem[]>('/exam_core/api/categories/');
      setCategoryList(res.data);
    } catch (err: any) {
      console.error(err);
      setErrorCategories(`Error fetching categories: ${err.message}`);
    } finally {
      setLoadingCategories(false);
    }
  };

  // ==================== 2) カテゴリ選択 ====================
  const handleSelectCategory = (catSlug: string) => {
    setSelectedCategorySlug(catSlug);
    // 選択が変わったらExam一覧をクリア
    setExamList([]);
    setExamId('');  // フォームのExam IDもリセット
    fetchExamList(catSlug);
  };

  // ==================== 3) カテゴリに紐づくExam一覧を取得 ====================
  const fetchExamList = async (catSlug: string) => {
    setLoadingExams(true);
    setErrorExams('');
    try {
      // 例: GET /exam_core/api/categories/electrician_2nd/exams/
      const res = await axios.get<ExamItem[]>(`/exam_core/api/categories/${catSlug}/exams/`);
      setExamList(res.data);  // これがExamCore[]配列
    } catch (err: any) {
      console.error(err);
      setErrorExams(`Error fetching exams: ${err.message}`);
    } finally {
      setLoadingExams(false);
    }
  };

  // ==================== 4) Exam削除 ====================
  const handleDeleteExam = async (targetExamId: number) => {
    try {
      await axios.delete('/exam_core/api/delete-exams/', {
        data: { exam_ids: [targetExamId] },
      });
      setMessage(`Deleted exam id=${targetExamId} successfully`);
      // 再取得
      if (selectedCategorySlug) {
        fetchExamList(selectedCategorySlug);
      }
    } catch (err: any) {
      console.error(err);
      setMessage(`Delete failed for exam id=${targetExamId}: ${err.message}`);
    }
  };

  // ==================== 5) JSON取り込み ====================
  const handleImport = async () => {
    // OCRで抽出したJSON
    if (!selectedJsonData) {
      setMessage('No selectedJsonData found.');
      return;
    }
    if (!selectedJsonData.json_data?.areas) {
      setMessage('selectedJsonData has no `areas` field.');
      return;
    }
    if (!selectedCategorySlug) {
      setMessage('No category selected.');
      return;
    }

    try {
      // examId があれば既存Examを上書き (/import-areas/<examId>/)
      // なければ新規Exam (/import-areas/)
      const baseURL = examId
        ? `/exam_core/api/import-areas/${examId}/`
        : `/exam_core/api/import-areas/`;

      const requestBody = {
        ...selectedJsonData.json_data, // { areas: [...], ... } 
        examKey,
        examName,
        categorySlug: selectedCategorySlug,
      };

      const res = await axios.post(baseURL, requestBody);
      setMessage(`Import success: ${JSON.stringify(res.data)}`);

      if (onSuccess) onSuccess('Import finished');

      // 新規Examが成功 → 一覧更新
      if (!examId && selectedCategorySlug) {
        fetchExamList(selectedCategorySlug);
      }

    } catch (err: any) {
      console.error(err);
      setMessage(`Import failed: ${err.message}`);
    }
  };

  // ==================== 初回マウント時にカテゴリ一覧を取得 ====================
  useEffect(() => {
    fetchCategoryList();
  }, []);

  // ==================== レンダリング ====================
  return (
    <div style={{ display: 'flex', gap: '1rem' }}>
      {/* 左ペイン: カテゴリ一覧 */}
      <div style={{ width: '30%', borderRight: '1px solid #ccc' }}>
        <h3>ExamCategory List</h3>
        {loadingCategories && <p>Loading categories...</p>}
        {errorCategories && <p style={{ color: 'red' }}>{errorCategories}</p>}
        {categoryList.map((cat) => (
          <div
            key={cat.id}
            style={{
              padding: '0.3rem',
              backgroundColor: cat.slug === selectedCategorySlug ? '#eef' : 'transparent',
              cursor: 'pointer',
            }}
            onClick={() => handleSelectCategory(cat.slug)}
          >
            {cat.name} (slug={cat.slug})
          </div>
        ))}
      </div>

      {/* 右ペイン: Exam一覧 + JSON Importフォーム */}
      <div style={{ width: '70%', padding: '0 1rem' }}>
        <h2>Exam Management / Import</h2>

        <section>
          <h4>Selected Category: {selectedCategorySlug ?? 'None'}</h4>
          <h3>ExamCore List</h3>
          {loadingExams && <p>Loading exams...</p>}
          {errorExams && <p style={{ color: 'red' }}>{errorExams}</p>}
          {/* ExamCore Listがない場合、Noneを赤字で表示 */}
          {!loadingExams && examList.length === 0 && (
            <p style={{ color: 'red' }}>None</p>
          )}
          {!loadingExams && examList.map((exam) => (
            <div
              key={exam.id}
              style={{
                display: 'flex',
                gap: '1rem',
                alignItems: 'center',
                marginBottom: '0.5rem'
              }}
            >
              <span>ID: {exam.id}</span>
              <span>Key: {exam.key}</span>
              <span>Name: {exam.name}</span>
              <button onClick={() => handleDeleteExam(exam.id)} style={{
                backgroundColor: '#f44336', // Red
                color: 'white',
                padding: '8px 12px',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '0.9rem',
              }}>Delete</button>
            </div>
          ))}
        </section>

        <section style={{ marginTop: '1rem' }}>
          <h3>JSON Import Form</h3>
          <label>Existing Exam ID (optional): </label>
          <input
            type="text"
            value={examId}
            onChange={(e) => setExamId(e.target.value)}
            placeholder="If you have an existing exam id..."
          />

          <div style={{ marginTop: '0.5rem' }}>
            <label>Exam Key (new exam): </label>
            <input
              type="text"
              value={examKey}
              onChange={(e) => setExamKey(e.target.value)}
              placeholder="ex: electrician_2nd_2024"
            />
          </div>

          <div style={{ marginTop: '0.5rem' }}>
            <label>Exam Name (new exam): </label>
            <input
              type="text"
              value={examName}
              onChange={(e) => setExamName(e.target.value)}
              placeholder="ex: 2024年度 第2種電気工事士"
            />
          </div>

          <div style={{ marginTop: '1rem' }}>
            <button onClick={handleImport} style={{
              backgroundColor: '#4CAF50', // Green
              color: 'white',
              padding: '10px 15px',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '1rem',
            }}>Import JSON</button>
          </div>
        </section>

        {message && (
          <div style={{ marginTop: '1rem', color: message.startsWith('Import success') ? 'green' : 'red' }}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamImportForm;