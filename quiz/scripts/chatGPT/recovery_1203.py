import logging
import sys
import os
import json
from pathlib import Path
from datetime import datetime
import uuid
import tempfile

from getResult import BatchResultFetcher
from integrateResult import process_json_file

def setup_logging(log_file: str) -> logging.Logger:
    """ロギング設定を初期化"""
    log_dir = os.path.dirname(log_file)
    os.makedirs(log_dir, exist_ok=True)

    logger = logging.getLogger("recovery")
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
    """リカバリ用メイン関数"""
    log_file = "logs/recovery.log"
    logger = setup_logging(log_file)
    
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        logger.error("OPENAI_API_KEY is not set in environment variables")
        return

    try:
        batch_job_id = "batch_674e52161f1c8190b088b56be165ab75"
        output_dir = "/Users/shipro/Projects/StudyApp/quiz/scripts/chatGPT/recovery"
        os.makedirs(output_dir, exist_ok=True)

        logger.info(f"Step 1: Fetching results for batch job {batch_job_id}")
        result_fetcher = BatchResultFetcher(api_key=api_key)
        result = result_fetcher.fetch_result(batch_job_id)

        if result is None:
            logger.error("Failed to fetch results. Aborting.")
            return

        # Save the fetched result to the specified output directory
        fetched_file_path = Path(output_dir) / f"fetched_result_{batch_job_id}.json"
        with open(fetched_file_path, 'w', encoding='utf-8') as fetched_file:
            json.dump(result, fetched_file, ensure_ascii=False, indent=2)
        
        logger.info(f"Fetched results saved to: {fetched_file_path}")

        logger.info("Step 2: Processing results")
        with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix=".jsonl", encoding='utf-8') as temp_file:
            json.dump(result, temp_file, ensure_ascii=False)
            temp_file_path = temp_file.name

        processed_data = process_json_file(temp_file_path)

        if not processed_data:
            logger.error("Failed to process results. Aborting.")
            return

        logger.info("Step 3: Saving processed results")
        date_prefix = datetime.now().strftime("%Y%m%d_%H%M%S")
        random_uuid = uuid.uuid4().hex
        output_file_name = f"recovery_result_{date_prefix}_{random_uuid}.json"
        output_file_path = Path(output_dir) / output_file_name

        with open(output_file_path, 'w', encoding='utf-8') as f:
            json.dump(processed_data, f, ensure_ascii=False, indent=2)
        
        logger.info(f"Results successfully saved to: {output_file_path}")

        try:
            os.unlink(temp_file_path)
        except OSError:
            pass

    except OSError as e:
        logger.error(f"OSError occurred: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error occurred: {str(e)}")

if __name__ == "__main__":
    main()