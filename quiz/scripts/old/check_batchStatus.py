import os
import json
from openai import OpenAI
from dotenv import load_dotenv

# 環境変数からAPIキーを読み込む
load_dotenv()
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    raise ValueError("APIキーが設定されていません。環境変数 'OPENAI_API_KEY' を設定してください。")

# OpenAIクライアントの初期化
client = OpenAI(api_key=api_key)

# 確認するジョブIDを指定
job_id = "batch_6743ca66060c81909d1128d6242a0bce"  # 必要に応じてジョブIDを置き換えてください

# バッチジョブのステータスを確認し、結果をダウンロード
try:
    # ジョブのステータスを取得
    job_status = client.batches.retrieve(job_id)
    status = job_status.status
    print(f"ジョブID: {job_id}, ステータス: {status}")

    if status == "completed":
        # 結果ファイルのIDを取得
        output_file_id = job_status.output_file_id
        print(f"出力ファイルID: {output_file_id}")

        # 結果ファイルをダウンロード
        file_response = client.files.content(output_file_id)

        # バイナリデータをテキストとしてデコード
        file_text = file_response.read().decode("utf-8")

        # JSONLデコードおよび保存
        output_path = "./output_result.jsonl"
        decoded_data = []
        for line in file_text.splitlines():
            decoded_data.append(json.loads(line))

        # 保存
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(decoded_data, f, ensure_ascii=False, indent=2)
        print(f"結果が保存されました: {output_path}")

    else:
        print(f"ジョブが完了していません。現在のステータス: {status}")

except Exception as e:
    print(f"エラーが発生しました: {str(e)}")