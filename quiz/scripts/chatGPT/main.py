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


def main():
    """メイン処理"""
    log_file = "logs/batch_process.log"
    logger = setup_logging(log_file)
    
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        logger.error("OPENAI_API_KEY is not set in environment variables")
        return

    try:
        # File paths
        input_json = "/Users/shipro/Projects/StudyApp/quiz/scripts/chatGPT/input/extracted_data.json"
        output1_jsonl = "/Users/shipro/Projects/StudyApp/quiz/scripts/chatGPT/tmp/output1.jsonl"
        output_dir = "/Users/shipro/Projects/StudyApp/quiz/scripts/chatGPT/result"

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
        logger.error(f"Unexpected error occurred: {str(e)}")


if __name__ == "__main__":
    main()
    