// src/ocr_app/jsonview/types.ts
import { Dispatch, SetStateAction } from 'react';

export interface JsonDataContextType {
  selectedJsonId: number | null;
  selectedJsonData: InputJSONData | null;
  loading: boolean;
  error: string;
  setSelectedJsonId: (id: number | null) => void;
  fetchJsonDetail: (id: number) => Promise<void>;
  setSelectedJsonData?: Dispatch<SetStateAction<InputJSONData | null>>;
}

// 各要素のインターフェース
export interface Element {
  category: string;
  bbox: number[];
  text: string;
}

export interface NoElement extends Element {}
export interface QuestionElement extends Element {}
export interface OptionsElement extends Element {}

export interface Area {
  No: string;
  answer: string;
  area_id: number;
  area_bbox: number[];

  no_element: NoElement;
  question_element: QuestionElement;
  options_element: OptionsElement;

  area_image_path: string;
  no_image_path: string;
  question_image_path: string;
  options_image_path: string;
  question_image_paths: string[];
  options_image_paths: string[];
}
// フロント側では「areas」をトップレベルで扱う形に修正
export interface InputJSONData {
  id: number;
  description: string;
  json_data: {
    areas: Area[];
  };
  created_at?: string;
  updated_at?: string;
}

export interface OCRResultType {
  image_path: string;
  status: string;        // "done" | "error" | "running" など
  full_text?: string;    // OCRで取得した文字列
  error_message?: string;
}