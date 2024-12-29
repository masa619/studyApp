// src/ocr_app/konva/services/uploadService.ts

import axios from 'axios';

/**
 * サーバーへクロップ画像をアップロード (action="add")
 *  - question_image_paths や options_image_paths に画像を追加する
 */
export async function uploadCroppedImage(params: {
  originalImagePath: string;
  selectedImageType: string;   // "question" | "options"
  jsonId: string;
  areaId: string;
  labelName: string;
  noNumber: string;
  base64: string;
  selectedIrohaKey?: string;
}): Promise<{
  saved_path: string;
  updated_json_data: any;      // サーバーから返却された最新JSON
}> {
  const resp = await axios.post('http://127.0.0.1:8000/ocr_app/api/upload_cropped_image/', {
    action: 'add', // ★ 画像を追加する
    original_image_path: params.originalImagePath,
    selected_image_type: params.selectedImageType, 
    json_id: params.jsonId,
    area_id: params.areaId,
    label_name: params.labelName,
    no_number: params.noNumber,
    cropped_image_base64: params.base64,
    selected_iroha_key: params.selectedIrohaKey,
  });

  if (resp.status !== 200) {
    throw new Error(`Upload error: ${resp.statusText}`);
  }
  return {
    saved_path: resp.data.saved_path,
    updated_json_data: resp.data.updated_json_data,
  };
}

/**
 * サーバーへ画像削除をリクエスト (action="delete")
 *  - question_image_paths や options_image_paths から削除する
 */
export async function deleteCroppedImage(params: {
  selectedImageType: string;  // "question" | "options"
  jsonId: string;
  areaId: string;
  noNumber: string;
  filePath: string;  // 削除対象の絶対パス
}): Promise<{
  detail: string;
  updated_json_data: any; 
}> {
  const resp = await axios.post('http://127.0.0.1:8000/ocr_app/api/upload_cropped_image/', {
    action: 'delete',
    selected_image_type: params.selectedImageType,
    json_id: params.jsonId,
    area_id: params.areaId,
    no_number: params.noNumber,
    delete_filename: params.filePath,
  });
  if (resp.status !== 200) {
    throw new Error(`Delete error: ${resp.statusText}`);
  }
  return resp.data; 
}