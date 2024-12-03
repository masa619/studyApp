import json
import os

def extract_specific_questions(input_file, target_numbers):
    # JSONファイルを読み込む
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # 指定されたNoに一致する問題を抽出
    extracted_questions = []
    for item in data:
        if "No" in item and item["No"] in [str(num) for num in target_numbers]:
            extracted_questions.append(item)
    
    # 出力先のパスを指定
    output_dir = '/Users/shipro/Projects/StudyApp/quiz/scripts/chatGPT/recovery'
    output_file = os.path.join(output_dir, 'extracted_questions.json')
    
    # 新しいJSONファイルに書き出す
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(extracted_questions, f, ensure_ascii=False, indent=2)
    
    print(f"抽出完了: {len(extracted_questions)}問を{output_file}に保存しました")

# 抽出したい問題番号のリスト
target_numbers = [3, 87, 96, 177, 191, 211, 243, 265]

# プログラムを実行
input_file = '/Users/shipro/Projects/StudyApp/quiz/scripts/chatGPT/input/extracted_data.json'
extract_specific_questions(input_file, target_numbers)