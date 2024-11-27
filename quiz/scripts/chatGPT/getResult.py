import os
import json
from openai import OpenAI
from dotenv import load_dotenv
from typing import Optional

# 環境変数からAPIキーを読み込む
load_dotenv()
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    raise ValueError("APIキーが設定されていません。環境変数 'OPENAI_API_KEY' を設定してください。")

# OpenAIクライアントの初期化
client = OpenAI(api_key=api_key)

# 確認するジョブIDを指定
job_id = "batch_6743ca66060c81909d1128d6242a0bce"  # 必要に応じてジョブIDを置き換えてください

class BatchResultFetcher:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.client = OpenAI(api_key=self.api_key)

    def fetch_result(self, job_id: str) -> Optional[str]:
        try:
            job_status = self.client.batches.retrieve(job_id)
            status = job_status.status
            print(f"ジョブID: {job_id}, ステータス: {status}")

            if status == "completed":
                output_file_id = job_status.output_file_id
                print(f"出力ファイルID: {output_file_id}")

                file_response = self.client.files.content(output_file_id)
                file_text = file_response.read().decode("utf-8")

                decoded_data = []
                for line in file_text.splitlines():
                    decoded_data.append(json.loads(line))

                # JSONデータを返す
                return decoded_data

            else:
                print(f"ジョブが完了していません。現在のステータス: {status}")
                return None

        except Exception as e:
            print(f"エラーが発生しました: {str(e)}")
            return None
