export interface ChoiceData {
  key: string;
  text_en: string;
  text_ja: string;
  image_url: string | null;
}

export interface ExplanationItem {
  key_terminology: string;
  option_analysis: string;
  overall_assessment: string;
  situation_analysis: string;
  additional_knowledge: string;
  answer_and_key_points: string;
}

export interface Question {
  id: number;
  no: number;
  question_text_en: string;
  question_text_ja: string;
  choices: ChoiceData[];
  answer_key: string;
  correct_answer_index: number;
  community_vote_distribution: string | null;
  page_images: string[];
  explanation_en: ExplanationItem[];
  explanation_ja: ExplanationItem[];
  keywords: string[];
}

export interface AnswerLogPayload {
  question_id: number;
  selected_choice_id: number;
  response_time: number;
}