import os
import time
from openai import OpenAI
from dotenv import load_dotenv

# 環境変数からAPIキーを読み込む
load_dotenv()
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    raise ValueError("APIキーが設定されていません。環境変数 'OPENAI_API_KEY' を設定してください。")

# OpenAIクライアントの初期化
client = OpenAI(api_key=api_key)

# 入力ファイルのパス
input_file_path = "/path/to/your/input_file.jsonl"

# 入力ファイルのアップロード
with open(input_file_path, "rb") as f:
    file_response = client.files.create(file=f, purpose="fine-tune")
input_file_id = file_response["id"]
print(f"入力ファイルがアップロードされました。ファイルID: {input_file_id}")

# バッチジョブの作成
batch_job = client.batches.create(
    input_file_id=input_file_id,
    endpoint="/v1/completions",
    task_parameters={
        "model": "gpt-3.5-turbo",
        "temperature": 0.7,
        "max_tokens": 150
    }
)
job_id = batch_job["id"]
print(f"バッチジョブが作成されました。ジョブID: {job_id}")

# ジョブの完了を待機
while True:
    job_status = client.batches.retrieve(id=job_id)
    status = job_status["status"]
    if status == "completed":
        print("ジョブが完了しました。")
        break
    elif status == "failed":
        print("ジョブが失敗しました。")
        break
    else:
        print(f"ジョブのステータス: {status} - 30秒後に再確認します。")
        time.sleep(30)

# 結果の取得
if status == "completed":
    output_file_id = job_status["output_file_id"]
    output_file = client.files.retrieve(id=output_file_id)
    output_content = client.files.download(id=output_file_id)
    output_path = "/path/to/save/output_file.jsonl"
    with open(output_path, "wb") as f:
        f.write(output_content)
    print(f"結果が保存されました: {output_path}")