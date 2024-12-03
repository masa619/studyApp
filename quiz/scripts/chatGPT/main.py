import logging
import sys
import os
import json
from pathlib import Path
from datetime import datetime
import uuid
import tempfile
from itertools import islice
import time

from createJSON import convert_to_jsonl
from upload_batchFile import BatchFileUploader
from getResult import BatchResultFetcher
from integrateResult import process_json_file
from exec_batchAPI import BatchJobManager
from deleteFile import FileDeleter


def setup_logging(log_file: str) -> logging.Logger:
    """ロギング設定を初期化"""
    log_dir = os.path.dirname(log_file)
    os.makedirs(log_dir, exist_ok=True)

    logger = logging.getLogger("batch_processor")
    logger.setLevel(logging.INFO)
    formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')

    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    file_handler = logging.FileHandler(log_file)
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)

    return logger


def process_chunks(chunk_files: list, logger: logging.Logger) -> list:
    """Process each JSONL chunk file using the batch API and return the results."""
    results = []
    uploader = BatchFileUploader()
    job_manager = BatchJobManager()
    result_fetcher = BatchResultFetcher(api_key=os.getenv('OPENAI_API_KEY'))
    file_deleter = FileDeleter(api_key=os.getenv('OPENAI_API_KEY'))

    for chunk_file in chunk_files:
        try:
            # アップロード処理
            file_id = uploader.upload_batch_file(chunk_file)
            if not file_id:
                logger.error(f"Failed to upload {chunk_file}. Skipping.")
                continue

            # バッチジョブの作成と実行
            job_id = job_manager.create_batch_job(file_id=file_id, model="gpt-4-0125-preview")
            if not job_id:
                logger.error(f"Failed to create batch job for {chunk_file}. Skipping.")
                continue

            # ジョブの完了を待機
            if not job_manager.wait_for_completion(job_id):
                logger.error(f"Error waiting for job completion for {chunk_file}. Skipping.")
                continue

            # 結果の取得
            result_data = result_fetcher.fetch_result(job_id)
            if result_data is None:
                logger.error(f"Failed to fetch results for {chunk_file}. Skipping.")
                continue

            results.append(result_data)

            # サーバーからファイルを削除
            if not file_deleter.delete_file(file_id):
                logger.error(f"Failed to delete file {file_id} from server.")

        finally:
            # ローカルのチャンクファイルを削除
            try:
                os.remove(chunk_file)
                logger.info(f"Deleted local chunk file: {chunk_file}")
            except OSError as e:
                logger.error(f"Error deleting chunk file {chunk_file}: {e}")

            # API制限を考慮した待機
            time.sleep(3)

    return results


def split_jsonl_file(input_file: str, lines_per_file: int) -> list:
    """Split a JSONL file into smaller files with a specified number of lines."""
    output_files = []
    with open(input_file, 'r', encoding='utf-8') as f:
        chunk_num = 0
        while True:
            lines = list(islice(f, lines_per_file))
            if not lines:
                break
            chunk_file = f"{input_file}_chunk_{chunk_num}.jsonl"
            with open(chunk_file, 'w', encoding='utf-8') as chunk_f:
                chunk_f.writelines(lines)
            output_files.append(chunk_file)
            chunk_num += 1
    return output_files


def main():
    """メイン処理"""
    log_file = "logs/batch_process.log"
    logger = setup_logging(log_file)
    
    # APIキーの確認
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        logger.error("OPENAI_API_KEY is not set in environment variables")
        return

    try:
        # 出力ディレクトリの作成
        output_dir = Path("/Users/shipro/Projects/StudyApp/quiz/scripts/chatGPT/result")
        output_dir.mkdir(parents=True, exist_ok=True)

        # 一時ファイルディレクトリの作成
        tmp_dir = Path("/Users/shipro/Projects/StudyApp/quiz/scripts/chatGPT/tmp")
        tmp_dir.mkdir(parents=True, exist_ok=True)

        # File paths
        input_json = "/Users/shipro/Projects/StudyApp/quiz/scripts/chatGPT/recovery/RECOVERY_extracted_questions.json"
        output1_jsonl = "/Users/shipro/Projects/StudyApp/quiz/scripts/chatGPT/tmp/output1.jsonl"
        output_dir = "/Users/shipro/Projects/StudyApp/quiz/scripts/chatGPT/recovery"

        # Step 1: Convert JSON to JSONL
        logger.info("Step 1: Converting JSON to JSONL")
        output1_jsonl = convert_to_jsonl(input_file=input_json, output_file=output1_jsonl)
        if not output1_jsonl:
            logger.error("Failed to convert JSON to JSONL. Aborting.")
            return

        # Step 2: Split JSONL into smaller chunks
        logger.info("Step 2: Splitting JSONL into smaller chunks")
        chunk_files = split_jsonl_file(output1_jsonl, lines_per_file=300)

        # Step 3: Process each chunk
        logger.info("Step 3: Processing each JSONL chunk")
        results = process_chunks(chunk_files, logger)

        # Step 4: 結果の集約
        logger.info("Step 4: Aggregating results")
        aggregated_results = []
        
        for result in results:
            if result is None:
                continue

            # 一時ファイルに結果を保存
            with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix=".jsonl", encoding='utf-8') as temp_file:
                json.dump(result, temp_file, ensure_ascii=False)
                temp_file_path = temp_file.name

            try:
                processed_data = process_json_file(temp_file_path)
                if processed_data:
                    aggregated_results.extend(processed_data)
            finally:
                # 一時ファイルの削除
                try:
                    os.unlink(temp_file_path)
                except OSError:
                    pass

        # 結果の保存
        if not aggregated_results:
            logger.error("No results were successfully processed")
            return

        date_prefix = datetime.now().strftime("%Y%m%d_%H%M%S")
        random_uuid = uuid.uuid4().hex
        output_file_name = f"batch_result_{date_prefix}_{random_uuid}.json"
        output_dir = "result"
        os.makedirs(output_dir, exist_ok=True)
        output_file_path = Path(output_dir) / output_file_name

        with open(output_file_path, 'w', encoding='utf-8') as f:
            json.dump(aggregated_results, f, ensure_ascii=False, indent=2)
        logger.info(f"Aggregated results saved to: {output_file_path}")

    except Exception as e:
        logger.error(f"Unexpected error occurred: {str(e)}", exc_info=True)


if __name__ == "__main__":
    main()
    