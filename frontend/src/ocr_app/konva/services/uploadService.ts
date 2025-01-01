// src/ocr_app/konva/services/uploadService.ts

import axios from 'axios';

interface UploadCroppedImageParams {
  originalImagePath: string;
  selectedImageType: string;   // "question" | "options"
  jsonId: string;
  No: string;
  labelName: string;
  base64: string;
  selectedIrohaKey?: string;
}

interface UploadResponse {
  saved_path: string;
  updated_json_data: any;      // サーバーから返却された最新JSON
}

export const uploadCroppedImage = async (params: UploadCroppedImageParams): Promise<UploadResponse> => {
  console.log('uploadCroppedImage params:', params);
  const resp = await axios.post('http://127.0.0.1:8000/ocr_app/api/upload_cropped_image/', {
    action: 'add',
    original_image_path: params.originalImagePath,
    selected_image_type: params.selectedImageType, 
    json_id: params.jsonId,
    No: params.No,
    label_name: params.labelName,
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
};

interface DeleteCroppedImageParams {
  selectedImageType: string;  // "question" | "options"
  jsonId: string;
  No: string;
  filePath: string;  // 削除対象の絶対パス
}

interface DeleteResponse {
  detail: string;
  updated_json_data: any;
}

export const deleteCroppedImage = async (params: DeleteCroppedImageParams): Promise<DeleteResponse> => {
  console.log('deleteCroppedImage params:', params);
  const resp = await axios.post('http://127.0.0.1:8000/ocr_app/api/upload_cropped_image/', {
    action: 'delete',
    selected_image_type: params.selectedImageType,
    json_id: params.jsonId,
    No: params.No,
    delete_filename: params.filePath,
  });
  if (resp.status !== 200) {
    throw new Error(`Delete error: ${resp.statusText}`);
  }
  return resp.data; 
};