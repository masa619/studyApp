import json
import os
import traceback

def merge_json_files(english_path, japanese_path, output_path):
    """
    2つのJSONファイルを統合するための関数
    
    Args:
        english_path (str): 英語版JSONファイルのパス
        japanese_path (str): 日本語版JSONファイルのパス
        output_path (str): 出力するJSONファイルのパス
    """
    # JSONファイルの読み込み
    try:
        with open(english_path, 'r', encoding='utf-8') as f:
            english_data = json.load(f)
        
        with open(japanese_path, 'r', encoding='utf-8') as f:
            japanese_data = json.load(f)
    except FileNotFoundError as e:
        print(f"エラー: ファイルが見つかりません - {e}")
        return
    except json.JSONDecodeError as e:
        print(f"エラー: JSONの解析に失敗しました - {e}")
        return

    # JSONデータがリスト形式であることを前提に処理
    if isinstance(english_data, list) and isinstance(japanese_data, list):
        merged_data = []

        for en_item in english_data:
            en_no = en_item.get('No')
            # 日本語データから一致するNoを持つ辞書を探す
            jp_item = next((item for item in japanese_data if item.get('no') == en_no or item.get('No') == en_no), None)

            if jp_item:
                # 英語データと日本語データをマージ
                merged_item = {}

                # Noを追加
                merged_item['No'] = en_no

                # questionとquestion_jpをトップに追加
                merged_item['question'] = en_item.get('question', '')
                merged_item['question_jp'] = jp_item.get('question', '')

                # 他の英語データを追加
                for key, value in en_item.items():
                    if key.lower() in ["no", "question"]:
                        continue
                    merged_item[key] = value

                # choicesをマージ
                merged_choices = []
                for en_choice in en_item.get('choices', []):
                    key = en_choice.get('key')
                    text = en_choice.get('text')
                    # 日本語のchoicesから一致するkeyを探す
                    jp_choice = next((choice for choice in jp_item.get('choices', []) if choice.get('key') == key), {})
                    text_jp = jp_choice.get('text', '')
                    merged_choices.append({
                        'key': key,
                        'text': text,
                        'text_jp': text_jp
                    })
                merged_item['choices'] = merged_choices

                # 他の日本語データをマージ
                for key, value in jp_item.items():
                    if key.lower() in ["no", "question", "choices", "answer_key"]:
                        continue
                    if key in merged_item:
                        merged_item[f"{key}_jp"] = value
                    else:
                        merged_item[key] = value

                merged_data.append(merged_item)
            else:
                # 日本語データが存在しない場合、英語データのみを追加
                merged_data.append(en_item)
                # Noの不一致をスタックトレースに出力
                print(f"警告: Noが一致しません - 英語データのNo: {en_no}")
                traceback.print_stack()

    else:
        print("エラー: JSONデータの形式が一致しません。両方ともリストである必要があります。")
        return

    # 結果をJSONファイルとして出力
    try:
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(merged_data, f, ensure_ascii=False, indent=2)
        print(f"統合されたJSONファイルが正常に作成されました: {output_path}")
    except Exception as e:
        print(f"エラー: ファイルの書き込みに失敗しました - {e}")

# 使用例
if __name__ == "__main__":
    # ファイルパスの設定
    english_path = "/Users/shipro/Projects/StudyApp/quiz/scripts/chatGPT/input/extracted_data.json"
    japanese_path = "/Users/shipro/Projects/StudyApp/quiz/scripts/chatGPT/result/recovered_result_20241126_122444_fb642908ab154f16979b589fbf155318.json"
    output_path = os.path.join("/Users/shipro/Projects/StudyApp/quiz/scripts/chatGPT/merged", "merged_output.json")
    
    # 関数の実行
    merge_json_files(english_path, japanese_path, output_path)