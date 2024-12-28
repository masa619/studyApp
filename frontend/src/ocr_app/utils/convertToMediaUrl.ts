// src/ocr_app/utils/convertToMediaUrl.ts
export function convertToMediaUrl(path: string | undefined): string {
    if (!path) return '';
    // 必要な置換処理
    return `http://localhost:8000/media/${path.replace(/^.*?CREATE_DATA2\//, '')}`;
  }