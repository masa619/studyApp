import os
import json
import logging
from typing import Optional
from pathlib import Path
from openai import OpenAI
from dotenv import load_dotenv

class BatchFileUploader:
    """OpenAIへのJSONLファイルアップロードを管理するクラス"""
    
    def __init__(self, api_key: Optional[str] = None, max_size_mb: int = 100):
        """
        初期化処理
        Args:
            api_key: OpenAI APIキー（省略時は環境変数から取得）
            max_size_mb: 最大ファイルサイズ（MB単位）
        """
        # ログ設定
        self.logger = self._setup_logging()
        
        # 環境変数の読み込み
        load_dotenv()
        
        # APIキーの設定
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError(
                "APIキーが設定されていません。環境変数 'OPENAI_API_KEY' を設定してください。\n"
                "例: export OPENAI_API_KEY='your_api_key'"
            )
        
        # OpenAIクライアントの初期化
        self.client = OpenAI(api_key=self.api_key)
        
        # 最大ファイルサイズ
        self.max_size_mb = max_size_mb
    
    def _setup_logging(self) -> logging.Logger:
        """ロギング設定を初期化"""
        logger = logging.getLogger(__name__)
        logger.setLevel(logging.INFO)
        handler = logging.StreamHandler()
        formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        return logger
    

    def validate_jsonl(self, file_path: str) -> bool:
        """
        JSONLファイルの形式を検証し、必要に応じて正規化
        Args:
            file_path: 検証するファイルのパス
        Returns:
            bool: 検証結果（True: 正常、False: 異常）
        """
        file_path = f"{file_path}"
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                for line_number, line in enumerate(f, start=1):
                    line = line.strip()  # 空白を削除
                    if not line:  # 空行はスキップ
                        continue
                    try:
                        json.loads(line)  # 各行をJSONとして検証
                    except json.JSONDecodeError as e:
                        self.logger.error(f"JSONLファイルの形式が不正です（行: {line_number}）: {e}")
                        return False
            self.logger.info("JSONLファイルの形式は正常です")
            return True
        except Exception as e:
            self.logger.error(f"ファイル検証中にエラーが発生しました: {e}")
            return False
    
    def check_file_size(self, file_path: str) -> bool:
        """
        ファイルサイズを検証
        Args:
            file_path: 検証するファイルのパス
        Returns:
            bool: 検証結果（True: 正常、False: 異常）
        """
        try:
            file_size = Path(file_path).stat().st_size
            size_mb = file_size / (1024 * 1024)
            if size_mb > self.max_size_mb:
                self.logger.error(f"ファイルサイズ({size_mb:.2f}MB)が上限({self.max_size_mb}MB)を超えています")
                return False
            self.logger.info(f"ファイルサイズは正常です: {size_mb:.2f}MB")
            return True
        except Exception as e:
            self.logger.error(f"ファイルサイズ検証中にエラーが発生しました: {e}")
            return False
    
    def upload_batch_file(self, file_path: str) -> Optional[str]:
        """
        JSONLファイルをアップロード
        Args:
            file_path: アップロードするファイルのパス
        Returns:
            Optional[str]: アップロード成功時はファイルID、失敗時はNone
        """
        file_path = Path(file_path)
        
        # 前提条件の検証
        if not file_path.exists():
            self.logger.error(f"指定されたファイルが存在しません: {file_path}")
            return None
        
        if not self.validate_jsonl(file_path):
            return None
            
        if not self.check_file_size(file_path):
            return None
        
        # ファイルアップロード
        try:
            with open(file_path, "rb") as batch_file:
                response = self.client.files.create(
                    file=batch_file,
                    purpose="batch"
                )
            file_id = response.id
            self.logger.info(f"ファイルアップロード成功 - ファイルID: {file_id}")
            return file_id
        except Exception as e:
            self.logger.error(f"OpenAIエラー: {e}")
            return None

def main():
    """メイン処理"""
    try:
        # アップローダーのインスタンス化
        uploader = BatchFileUploader(max_size_mb=100)
        
        # 設定値（実際の環境に合わせて調整）
        BATCH_FILE_PATH = "/Users/shipro/Downloads/normalized_translate_requests.jsonl"
        
        # アップロード実行
        file_id = uploader.upload_batch_file(BATCH_FILE_PATH)
        
        if file_id:
            print(f"処理が完了しました。ファイルID: {file_id}")
        else:
            print("処理が失敗しました。ログを確認してください。")
            
    except Exception as e:
        print(f"エラーが発生しました: {e}")