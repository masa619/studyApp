import json
import logging
import traceback
from pathlib import Path

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
        return None

def process_json_file(input_file, output_file):
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
        
        # 抽出したデータを1つのJSONファイルに統合
        if extracted_data:
            print(f"M. Preparing to write {len(extracted_data)} extracted records to {output_file}")
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(extracted_data, f, ensure_ascii=False, indent=2)
            print(f"N. Successfully saved extracted data to {output_file}")
        else:
            logging.error("O. No valid data was extracted")
            print("O. No valid data was extracted")
            
    except Exception as e:
        logging.error(f"P. Fatal error while processing file: {traceback.format_exc()}")
        print(f"P. Fatal error: {str(e)}")
        raise

if __name__ == "__main__":
    # 入力ファイルと出力ファイルのパス
    input_file = "/Users/shipro/Projects/StudyApp/output_result.jsonl"
    output_file = "./extracted_context.json"
    
    print("Q. Checking input file existence")
    if Path(input_file).exists():
        try:
            process_json_file(input_file, output_file)
        except Exception as e:
            print(f"R. An error occurred: {str(e)}")
    else:
        logging.error(f"S. Input file {input_file} not found")
        print(f"S. Input file {input_file} not found")