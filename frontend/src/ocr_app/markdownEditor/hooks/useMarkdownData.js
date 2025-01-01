// frontend/src/ocr_app/markdownEditor/hooks/useMarkdownData.ts
import { useState } from 'react';
export const useMarkdownData = (initialValue) => {
    const [markdownText, setMarkdownText] = useState(initialValue);
    const handleChange = (e) => {
        setMarkdownText(e.target.value);
    };
    const resetToInitial = () => {
        setMarkdownText(initialValue);
    };
    return {
        markdownText,
        setMarkdownText,
        handleChange,
        resetToInitial,
    };
};
