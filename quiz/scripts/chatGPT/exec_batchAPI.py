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
            job_id = batch_job.id
            self.logger.info(f"ジョブ作成成功 - ジョブID: {job_id}")
            return job_id
        except openai.OpenAIError as e:
            self.logger.error(f"ジョブ作成エラー: {str(e)}")
            self.logger.error(f"Batchオブジェクト: {batch_job}")
            return None

    def download_error_file(self, error_file_id: str) -> Optional[str]:
        try:
            # ファイルをダウンロード
            error_file = openai.File.retrieve(error_file_id)
            file_content = openai.File.download(error_file_id)
            
            # ファイル内容をログに記録
            self.logger.error(f"エラーファイルの内容: {file_content.decode('utf-8')}")
            return file_content.decode('utf-8')
        except openai.OpenAIError as e:
            self.logger.error(f"エラーファイルのダウンロードエラー: {str(e)}")
            return None

    def get_job_status(self, job_id: str) -> Optional[Dict[str, Any]]:
        try:
            batch_job = openai.batches.retrieve(job_id)
            self.logger.info(f"ジョブステータス取得: {batch_job.status}")

            error_message = None
            retry = False  # 再試行フラグ

            if batch_job.status == 'failed':
                self.logger.error(f"ジョブエラーの詳細: {batch_job.errors}")
                self.logger.error(f"Batchオブジェクト: {batch_job}")
                print("ジョブエラーの詳細:", batch_job.errors)

                if batch_job.errors:
                    error_messages = []
                    for error in batch_job.errors.data:
                        if hasattr(error, 'message'):
                            error_messages.append(error.message)
                        if error.code == 'token_limit_exceeded':
                            retry = True  # token_limit_exceededの場合は再試行フラグを立てる

                    error_message = "; ".join(error_messages) if error_messages else '不明なエラーが発生しました'

            if batch_job.error_file_id:
                self.download_error_file(batch_job.error_file_id)

            return {
                'status': batch_job.status,
                'created_at': batch_job.created_at,
                'completed_at': batch_job.completed_at,
                'model': batch_job.endpoint,
                'error_file_id': batch_job.error_file_id,
                'output_file_id': batch_job.output_file_id,
                'error_message': error_message,
                'retry': retry  # 再試行フラグを追加
            }
        except openai.OpenAIError as e:
            self.logger.error(f"ステータス取得エラー: {str(e)}")
            return None

    def wait_for_completion(self, job_id: str) -> bool:
        start_time = time.time()
        while time.time() - start_time < 86400:  # 24時間
            status = self.get_job_status(job_id)
            if not status:
                return False
            if status['status'] == 'completed':
                self.logger.info("ジョブが正常に完了しました")
                return True
            if status['status'] == 'failed':
                if status.get('retry'):
                    self.logger.info("トークン制限に達しました。30秒後に再試行します...")
                    time.sleep(30)
                    continue  # 再試行
                self.logger.error(f"ジョブが失敗しました: {status.get('error_message')}")
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