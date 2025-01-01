// frontend/src/ocr_app/markdownEditor/components/MarkdownEditor.tsx
import React from 'react';
import { TextField } from '@mui/material';

type MarkdownEditorProps = {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
};

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ value, onChange }) => {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <TextField
        label="Markdown Text"
        multiline
        rows={10}
        variant="outlined"
        fullWidth
        value={value}
        onChange={onChange}
      />
    </div>
  );
};

export default MarkdownEditor;