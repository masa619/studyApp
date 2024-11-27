import os
import time
import logging
from typing import Optional, Dict, Any
from datetime import datetime
from pathlib import Path
import openai
from dotenv import load_dotenv

class BatchJobManager:
    def __init__(self, api_key: Optional[str] = None, timeout: int = 3600):
        self.logger = self._setup_logging()
        load_dotenv() 
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("APIキーが設定されていません。環境変数 'OPENAI_API_KEY' を設定してください。")
        openai.api_key = self.api_key
        self.timeout = timeout

    def _setup_logging(self) -> logging.Logger:
        logger = logging.getLogger(__name__)
        logger.setLevel(logging.INFO)
        log_dir = Path(__file__).resolve().parent / "logs"
        log_dir.mkdir(exist_ok=True)
        file_handler = logging.FileHandler(log_dir / f"batch_job_{datetime.now():%Y%m%d_%H%M%S}.log")
        console_handler = logging.StreamHandler()
        formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        file_handler.setFormatter(formatter)
        console_handler.setFormatter(formatter)
        logger.addHandler(file_handler)
        logger.addHandler(console_handler)
        return logger

    def create_batch_job(self, file_id: str, model: str) -> Optional[str]:
        try:
            batch_job = openai.batches.create(
                input_file_id=file_id,
                endpoint="/v1/chat/completions",
                completion_window="24h",
            )
            job_id = batch_job.id  # 直接属性にアクセス
            self.logger.info(f"ジョブ作成成功 - ジョブID: {job_id}")
            return job_id
        except openai.OpenAIError as e:
            self.logger.error(f"ジョブ作成エラー: {str(e)}")
            return None

    def get_job_status(self, job_id: str) -> Optional[Dict[str, Any]]:
        try:
            batch_job = openai.batches.retrieve(job_id)
            self.logger.info(f"ジョブステータス取得: {batch_job.status}")
            return {
                'status': batch_job.status,
                'created_at': batch_job.created_at,  # 正しいキー名に修正
                'completed_at': batch_job.completed_at,  # 修正：finished_at -> completed_at
                'model': batch_job.endpoint,  # モデルに該当する値を取得
                'error_file_id': batch_job.error_file_id,  # エラーの詳細ファイルID
                'output_file_id': batch_job.output_file_id,  # 出力結果のファイルID
            }
        except openai.OpenAIError as e:
            self.logger.error(f"ステータス取得エラー: {str(e)}")
            return None
        
    def wait_for_completion(self, job_id: str) -> bool:
        """
        ジョブが完了するまで待機します。最大24時間待機します。
        """
        start_time = time.time()
        while time.time() - start_time < 86400:  # 24時間 (24 * 60 * 60 = 86400秒)
            status = self.get_job_status(job_id)
            if not status:
                return False
            if status['status'] == 'completed':
                self.logger.info("ジョブが正常に完了しました")
                return True
            if status['status'] == 'failed':
                self.logger.error(f"ジョブが失敗しました: {status.get('error')}")
                return False
            self.logger.info(f"ジョブステータス: {status['status']} - 待機中...")
            time.sleep(30)  # 30秒間隔で再チェック
        self.logger.error("ジョブがタイムアウトしました (24時間経過)")
        return False

    def cancel_job(self, job_id: str) -> bool:
        try:
            openai.Batch.cancel(job_id)
            self.logger.info(f"ジョブ {job_id} をキャンセルしました")
            return True
        except openai.OpenAIError as e:  # 修正: openai.error.OpenAIError -> openai.OpenAIError
            self.logger.error(f"ジョブキャンセルエラー: {str(e)}")
            return False

def main():
    job_manager = BatchJobManager()
    FILE_ID = "file-7QdbfxMeVwBPW6JxEC8Yv5"
    MODEL = "gpt-3.5-turbo"
    job_id = job_manager.create_batch_job(file_id=FILE_ID, model=MODEL)
    if job_id and job_manager.wait_for_completion(job_id):
        print("バッチ処理が正常に完了しました")
    else:
        print("バッチ処理が失敗しました")

if __name__ == "__main__":
    main()