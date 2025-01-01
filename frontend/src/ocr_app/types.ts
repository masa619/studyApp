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
  setSelectedAreaIndex: (index: number | null) => void;
  selectedAreaIndex: number | null;
}

// 各要素のインターフェース
export interface Element {
  category: string;
  bbox: number[];
  text: string;
}

export interface NoElement extends Element {}
export interface QuestionElement extends Element {
  image_paths: string[];
}
export interface OptionsElement extends Element {
  options_dict: Record<string, {
    text: string;
    image_paths: string[];
  }>;
}
export interface OptionDictItem {
  text: string;
  image_paths: string[];
}

export interface Area {
  No: string;
  answer: string;
  area_bbox: number[];
  no_element: NoElement;
  question_element: QuestionElement;
  options_element: OptionsElement;
  area_image_path: string;
  no_image_path: string;
  question_image_path: string;
  options_image_path: string;
  question_image_type?: string;
  options_image_type?: string;
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
  normalized_text?: string; // ノーマライズ済みテキスト
  error_message?: string;
}