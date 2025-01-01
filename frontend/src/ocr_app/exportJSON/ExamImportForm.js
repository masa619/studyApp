import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { JsonDataContext } from '../Context/JsonDataContext';
const ExamImportForm = ({ onSuccess }) => {
    const { selectedJsonData } = useContext(JsonDataContext);
    // ==================== ステート宣言 ====================
    // (A) カテゴリ一覧
    const [categoryList, setCategoryList] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(false);
    const [errorCategories, setErrorCategories] = useState('');
    // (B) 選択中のカテゴリslug
    const [selectedCategorySlug, setSelectedCategorySlug] = useState(null);
    // (C) Exam一覧
    const [examList, setExamList] = useState([]);
    const [loadingExams, setLoadingExams] = useState(false);
    const [errorExams, setErrorExams] = useState('');
    // (D) JSONアップロード用フォーム (Exam ID, Key, Name)
    const [examId, setExamId] = useState(''); // 空なら新規
    const [examKey, setExamKey] = useState('');
    const [examName, setExamName] = useState('');
    // (E) メッセージ表示
    const [message, setMessage] = useState('');
    // ==================== 1) カテゴリ一覧の取得 ====================
    const fetchCategoryList = async () => {
        setLoadingCategories(true);
        setErrorCategories('');
        try {
            // GET /exam_core/api/categories/
            const res = await axios.get('/exam_core/api/categories/');
            setCategoryList(res.data);
        }
        catch (err) {
            console.error(err);
            setErrorCategories(`Error fetching categories: ${err.message}`);
        }
        finally {
            setLoadingCategories(false);
        }
    };
    // ==================== 2) カテゴリ選択 ====================
    const handleSelectCategory = (catSlug) => {
        setSelectedCategorySlug(catSlug);
        // 選択が変わったらExam一覧をクリア
        setExamList([]);
        setExamId(''); // フォームのExam IDもリセット
        fetchExamList(catSlug);
    };
    // ==================== 3) カテゴリに紐づくExam一覧を取得 ====================
    const fetchExamList = async (catSlug) => {
        setLoadingExams(true);
        setErrorExams('');
        try {
            // 例: GET /exam_core/api/categories/electrician_2nd/exams/
            const res = await axios.get(`/exam_core/api/categories/${catSlug}/exams/`);
            setExamList(res.data); // これがExamCore[]配列
        }
        catch (err) {
            console.error(err);
            setErrorExams(`Error fetching exams: ${err.message}`);
        }
        finally {
            setLoadingExams(false);
        }
    };
    // ==================== 4) Exam削除 ====================
    const handleDeleteExam = async (targetExamId) => {
        try {
            await axios.delete('/exam_core/api/delete-exams/', {
                data: { exam_ids: [targetExamId] },
            });
            setMessage(`Deleted exam id=${targetExamId} successfully`);
            // 再取得
            if (selectedCategorySlug) {
                fetchExamList(selectedCategorySlug);
            }
        }
        catch (err) {
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
            if (onSuccess)
                onSuccess('Import finished');
            // 新規Examが成功 → 一覧更新
            if (!examId && selectedCategorySlug) {
                fetchExamList(selectedCategorySlug);
            }
        }
        catch (err) {
            console.error(err);
            setMessage(`Import failed: ${err.message}`);
        }
    };
    // ==================== 初回マウント時にカテゴリ一覧を取得 ====================
    useEffect(() => {
        fetchCategoryList();
    }, []);
    // ==================== レンダリング ====================
    return (_jsxs("div", { style: { display: 'flex', gap: '1rem' }, children: [_jsxs("div", { style: { width: '30%', borderRight: '1px solid #ccc' }, children: [_jsx("h3", { children: "ExamCategory List" }), loadingCategories && _jsx("p", { children: "Loading categories..." }), errorCategories && _jsx("p", { style: { color: 'red' }, children: errorCategories }), categoryList.map((cat) => (_jsxs("div", { style: {
                            padding: '0.3rem',
                            backgroundColor: cat.slug === selectedCategorySlug ? '#eef' : 'transparent',
                            cursor: 'pointer',
                        }, onClick: () => handleSelectCategory(cat.slug), children: [cat.name, " (slug=", cat.slug, ")"] }, cat.id)))] }), _jsxs("div", { style: { width: '70%', padding: '0 1rem' }, children: [_jsx("h2", { children: "Exam Management / Import" }), _jsxs("section", { children: [_jsxs("h4", { children: ["Selected Category: ", selectedCategorySlug ?? 'None'] }), _jsx("h3", { children: "ExamCore List" }), loadingExams && _jsx("p", { children: "Loading exams..." }), errorExams && _jsx("p", { style: { color: 'red' }, children: errorExams }), !loadingExams && examList.length === 0 && (_jsx("p", { style: { color: 'red' }, children: "None" })), !loadingExams && examList.map((exam) => (_jsxs("div", { style: {
                                    display: 'flex',
                                    gap: '1rem',
                                    alignItems: 'center',
                                    marginBottom: '0.5rem'
                                }, children: [_jsxs("span", { children: ["ID: ", exam.id] }), _jsxs("span", { children: ["Key: ", exam.key] }), _jsxs("span", { children: ["Name: ", exam.name] }), _jsx("button", { onClick: () => handleDeleteExam(exam.id), style: {
                                            backgroundColor: '#f44336', // Red
                                            color: 'white',
                                            padding: '8px 12px',
                                            border: 'none',
                                            borderRadius: '5px',
                                            cursor: 'pointer',
                                            fontSize: '0.9rem',
                                        }, children: "Delete" })] }, exam.id)))] }), _jsxs("section", { style: { marginTop: '1rem' }, children: [_jsx("h3", { children: "JSON Import Form" }), _jsx("label", { children: "Existing Exam ID (optional): " }), _jsx("input", { type: "text", value: examId, onChange: (e) => setExamId(e.target.value), placeholder: "If you have an existing exam id..." }), _jsxs("div", { style: { marginTop: '0.5rem' }, children: [_jsx("label", { children: "Exam Key (new exam): " }), _jsx("input", { type: "text", value: examKey, onChange: (e) => setExamKey(e.target.value), placeholder: "ex: electrician_2nd_2024" })] }), _jsxs("div", { style: { marginTop: '0.5rem' }, children: [_jsx("label", { children: "Exam Name (new exam): " }), _jsx("input", { type: "text", value: examName, onChange: (e) => setExamName(e.target.value), placeholder: "ex: 2024\u5E74\u5EA6 \u7B2C2\u7A2E\u96FB\u6C17\u5DE5\u4E8B\u58EB" })] }), _jsx("div", { style: { marginTop: '1rem' }, children: _jsx("button", { onClick: handleImport, style: {
                                        backgroundColor: '#4CAF50', // Green
                                        color: 'white',
                                        padding: '10px 15px',
                                        border: 'none',
                                        borderRadius: '5px',
                                        cursor: 'pointer',
                                        fontSize: '1rem',
                                    }, children: "Import JSON" }) })] }), message && (_jsx("div", { style: { marginTop: '1rem', color: message.startsWith('Import success') ? 'green' : 'red' }, children: message }))] })] }));
};
export default ExamImportForm;
