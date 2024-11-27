import logging
import sys
import os
import json
from pathlib import Path
from datetime import datetime
import uuid
from itertools import islice
import time

from createJSON import convert_to_jsonl
from upload_batchFile import BatchFileUploader
from exec_batchAPI import BatchJobManager
from deleteFile import FileDeleter
from getResult import BatchResultFetcher
from integrateResult import process_json_file


def setup_logging(log_file: str) -> logging.Logger:
    """ロギング設定を初期化"""
    logger = logging.getLogger("main")
    logger.setLevel(logging.INFO)
    formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')

    # コンソール出力
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    # ログファイル出力
    file_handler = logging.FileHandler(log_file)
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)

    return logger


def split_jsonl_file(input_file: str, lines_per_file: int) -> list:
    """Split a JSONL file into smaller files with a specified number of lines."""
    output_files = []
    with open(input_file, 'r', encoding='utf-8') as f:
        for i, chunk_lines in enumerate(iter(lambda: list(islice(f, lines_per_file)), [])):
            chunk_file = f"{input_file}_chunk_{i}.jsonl"
            with open(chunk_file, 'w', encoding='utf-8') as chunk_f:
                chunk_f.writelines(chunk_lines)
            output_files.append(chunk_file)
    return output_files


def process_chunks(chunk_files: list, logger: logging.Logger) -> list:
    """Process each JSONL chunk file using the batch API and return the results."""
    results = []
    uploader = BatchFileUploader()
    job_manager = BatchJobManager()
    result_fetcher = BatchResultFetcher(api_key=os.getenv('OPENAI_API_KEY'))
    file_deleter = FileDeleter(api_key=os.getenv('OPENAI_API_KEY'))

    for chunk_file in chunk_files:
        try:
            # Upload the chunk
            file_id = uploader.upload_batch_file(chunk_file)
            if not file_id:
                logger.error(f"Failed to upload {chunk_file}. Skipping.")
                continue

            # Create and execute batch job
            job_id = job_manager.create_batch_job(file_id=file_id, model="gpt-4o-2024-11-20")
            if not job_id:
                logger.error(f"Failed to create batch job for {chunk_file}. Skipping.")
                continue

            # Wait for job completion
            if not job_manager.wait_for_completion(job_id):
                logger.error(f"Error waiting for job completion for {chunk_file}. Skipping.")
                continue

            # Fetch results
            result_data = result_fetcher.fetch_result(job_id)
            if result_data is None:
                logger.error(f"Failed to fetch results for {chunk_file}. Skipping.")
                continue

            results.append(result_data)

            # Delete the file from the server
            if not file_deleter.delete_file(file_id):
                logger.error(f"Failed to delete file {file_id} from server.")

        finally:
            # Clean up local chunk file
            os.remove(chunk_file)
            logger.info(f"Deleted local chunk file: {chunk_file}")

            # 3秒待機
            time.sleep(3)
    return results


def main():
    """Main function to manage the entire process."""
    log_file = "logs/main.log"
    logger = setup_logging(log_file)

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

        # Step 4: Aggregate results
        logger.info("Step 4: Aggregating results")
        aggregated_results = []
        for result in results:
            # Process each result using process_json_file
            processed_data = process_json_file(result)
            if processed_data:
                aggregated_results.extend(processed_data)

        # Step 5: Save aggregated results to a JSON file
        date_prefix = datetime.now().strftime("%Y%m%d_%H%M%S")
        random_uuid = uuid.uuid4().hex
        output_file_name = f"result_{date_prefix}_{random_uuid}.json"
        output_file_path = Path(output_dir) / output_file_name

        with open(output_file_path, 'w', encoding='utf-8') as f:
            json.dump(aggregated_results, f, ensure_ascii=False, indent=2)
        logger.info(f"Aggregated results saved to: {output_file_path}")

    except Exception as e:
        logger.error(f"Unexpected error occurred: {str(e)}")


if __name__ == "__main__":
    main()
    