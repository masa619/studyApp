import json
import logging
import traceback
from pathlib import Path
import uuid
from datetime import datetime

# ログ設定
logging.basicConfig(
    filename='error.log',
    level=logging.ERROR,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

def convert_to_json(content):
    """
    改行を含む文字列をJSON形式に変換する
    """
    try:
        # 改行を削除してからJSONとして解析
        content = content.replace('\n', '').strip()
        return json.loads(content)
    except json.JSONDecodeError as e:
        logging.error(f"Invalid JSON format after conversion: {str(e)}")
        
        # 修正を試みる
        try:
            # バッククォートを削除して再試行
            if content.startswith('```json') and content.endswith('```'):
                content = content[7:-3].strip()
            return json.loads(content)
        except json.JSONDecodeError as e:
            logging.error(f"Failed to fix JSON format: {str(e)}")
            return None

def process_json_file(input_file):
    """
    JSONファイルを処理してcontextを抽出し、1つのJSONファイルに統合する
    """
    print("A. Starting the process")
    extracted_data = []  # 抽出したデータを保存するリスト
    
    try:
        # ファイルの存在を確認
        if not Path(input_file).exists():
            logging.error(f"B. Input file {input_file} not found")
            print(f"B. Input file {input_file} not found")
            return
        
        print(f"C. Input file {input_file} exists, attempting to open it")
        
        # ファイルを読み込む
        with open(input_file, 'r', encoding='utf-8') as f:
            data = json.load(f)  # JSONとして読み込み
            print(f"D. Successfully loaded JSON data")
        
        if not isinstance(data, list):
            logging.error("E. Input data is not a JSON array")
            print("E. Input data is not a JSON array")
            return
        
        print(f"F. Processing {len(data)} records")
        
        for index, record in enumerate(data, 1):
            try:
                # 必要なキーが存在するか確認
                if 'response' not in record or 'body' not in record['response']:
                    logging.error(f"G. Record {index}: Missing 'response' or 'body' key")
                    print(f"G. Record {index}: Missing 'response' or 'body' key")
                    continue
                
                # 'choices' 内の context を抽出
                choices = record['response']['body'].get('choices', [])
                if choices and choices[0].get('index') == 0:
                    message = choices[0].get('message', {})
                    content = message.get('content', '')
                    
                    # 改行を含む文字列をJSON形式に変換
                    converted_context = convert_to_json(content)
                    if converted_context is not None:
                        # Contextがリスト形式の場合は展開して追加
                        if isinstance(converted_context, list):
                            extracted_data.extend(converted_context)
                            print(f"H. Record {index}: Context list extended")
                        else:
                            extracted_data.append(converted_context)
                            print(f"H. Record {index}: Context object appended")
                    else:
                        logging.error(f"I. Record {index}: Failed to convert content to valid JSON")
                        print(f"I. Record {index}: Failed to convert content to valid JSON")
                else:
                    logging.error(f"J. Record {index}: No valid choice with index 0")
                    print(f"J. Record {index}: No valid choice with index 0")
            
            except Exception as e:
                logging.error(f"K. Record {index}: Unexpected error - {traceback.format_exc()}")
                print(f"K. Record {index}: Unexpected error - {str(e)}")
        
        print(f"L. Completed processing all records")
        
        # 抽出したデータを1つのJSONファイルに統合して保存する処理を削除し、
        # 代わりに抽出したデータをリターンするように変更
        if extracted_data:
            print(f"M. Preparing to return {len(extracted_data)} extracted records")
            return extracted_data
        else:
            logging.error("O. No valid data was extracted")
            print("O. No valid data was extracted")
            return None
        
    except Exception as e:
        logging.error(f"P. Fatal error while processing file: {traceback.format_exc()}")
        print(f"P. Fatal error: {str(e)}")
        raise

def main():
    """Manually process a specified JSONL file and output the results."""
    input_file = "/Users/shipro/Projects/StudyApp/quiz/scripts/chatGPT/tmp/output2.jsonl"
    output_dir = "/Users/shipro/Projects/StudyApp/quiz/scripts/chatGPT/result"

    try:
        # Process the input file
        extracted_data = process_json_file(input_file)
        if not extracted_data:
            print("No valid data was extracted. Exiting.")
            return

        # Save the extracted data to a new JSON file
        date_prefix = datetime.now().strftime("%Y%m%d_%H%M%S")
        random_uuid = uuid.uuid4().hex
        output_file_name = f"recovered_result_{date_prefix}_{random_uuid}.json"
        output_file_path = Path(output_dir) / output_file_name

        with open(output_file_path, 'w', encoding='utf-8') as f:
            json.dump(extracted_data, f, ensure_ascii=False, indent=2)
        print(f"Extracted data saved to: {output_file_path}")

    except Exception as e:
        logging.error(f"Unexpected error occurred during manual execution: {traceback.format_exc()}")
        print(f"Unexpected error: {str(e)}")

if __name__ == "__main__":
    main()