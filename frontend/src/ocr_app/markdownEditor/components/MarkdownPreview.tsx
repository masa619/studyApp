// frontend/src/ocr_app/markdownEditor/components/MarkdownPreview.tsx
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { Box } from '@mui/material';

// KaTeXのCSSをインポート
import 'katex/dist/katex.min.css';

type MarkdownPreviewProps = {
  content: string;
};

const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ content }) => {
  return (
    <Box sx={{
      '& h1, & h2, & h3, & h4, & h5, & h6': {
        mt: 3,
        mb: 2,
        fontWeight: 'bold',
        lineHeight: 1.2,
      },
      '& p': {
        mb: 2,
        lineHeight: 1.6,
      },
      '& ul, & ol': {
        mb: 2,
        pl: 4,
      },
      '& li': {
        mb: 1,
      },
      '& code': {
        backgroundColor: 'grey.100',
        p: '2px 4px',
        borderRadius: 1,
        fontSize: '0.9em',
      },
      '& pre': {
        backgroundColor: 'grey.100',
        p: 2,
        borderRadius: 1,
        overflowX: 'auto',
        mb: 2,
      },
      '& blockquote': {
        borderLeft: '4px solid',
        borderColor: 'grey.300',
        pl: 2,
        ml: 0,
        mb: 2,
        color: 'grey.600',
      },
      '& img': {
        maxWidth: '100%',
        height: 'auto',
      },
      '& table': {
        borderCollapse: 'collapse',
        width: '100%',
        mb: 2,
      },
      '& th, & td': {
        border: '1px solid',
        borderColor: 'grey.300',
        p: 1,
      },
      '& a': {
        color: 'primary.main',
        textDecoration: 'none',
        '&:hover': {
          textDecoration: 'underline',
        },
      },
      // KaTeX用のスタイル
      '& .katex': {
        fontSize: '1.1em',
      },
      '& .katex-display': {
        margin: '1em 0',
        overflow: 'auto hidden',
      },
    }}>
      <ReactMarkdown
        children={content}
        remarkPlugins={[remarkMath, remarkGfm, remarkBreaks]}
        rehypePlugins={[rehypeKatex]}
      />
    </Box>
  );
};

export default MarkdownPreview;