export interface ExplanationItem {
    key_terminology: string;
    option_analysis: string;
    overall_assessment: string;
    situation_analysis: string;
    additional_knowledge: string;
    answer_and_key_points: string;
  }
  
  export interface ExplanationProps {
    explanation: ExplanationItem[];
  }