import React from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

interface AccordionItemProps {
  title: string;
  content: React.ReactNode;
  defaultExpanded?: boolean;
  className?: string;
}

export const AccordionItem: React.FC<AccordionItemProps> = ({
  title,
  content,
  defaultExpanded = false,
  className,
}) => (
  <Accordion defaultExpanded={defaultExpanded} className={className}>
    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
      <Typography variant="subtitle1">{title}</Typography>
    </AccordionSummary>
    <AccordionDetails>
      {typeof content === 'string' ? (
        <Typography>{content}</Typography>
      ) : (
        content
      )}
    </AccordionDetails>
  </Accordion>
);