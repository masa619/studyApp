import React from 'react';
import { Paper, Typography, Box } from '@mui/material';
import { AccordionItem } from '../../../ui/Accordion/AccordionItem';
import type { ExplanationProps } from './types';

interface AccordionItemConfig {
  key: string;
  title: string;
  defaultExpanded?: boolean;
}

const ACCORDION_ITEMS: AccordionItemConfig[] = [
  {
    key: 'situation_analysis',
    title: '状況分析',
    defaultExpanded: true,
  },
  {
    key: 'answer_and_key_points',
    title: '回答とポイント',
    defaultExpanded: true,
  },
  {
    key: 'option_analysis',
    title: '選択肢分析',
  },
  {
    key: 'overall_assessment',
    title: '総合評価',
  },
  {
    key: 'additional_knowledge',
    title: '追加知識',
  },
  {
    key: 'key_terminology',
    title: '重要用語',
  },
] as const;

export const Explanation: React.FC<ExplanationProps> = ({ explanation }) => {
  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h5" component="h3" gutterBottom>
        解説
      </Typography>
      
      {explanation.length > 0 ? (
        explanation.map((item, index) => (
          <Box key={index} sx={{ mb: 2 }}>
            {ACCORDION_ITEMS.map(({ key, title, defaultExpanded }) => (
              <AccordionItem
                key={key}
                title={title}
                content={item[key as keyof typeof item]}
                defaultExpanded={defaultExpanded}
              />
            ))}
          </Box>
        ))
      ) : (
        <Typography>解説はありません。</Typography>
      )}
    </Paper>
  );
};