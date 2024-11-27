import os
from openai import OpenAI

# 環境変数からOpenAI APIキーを取得
api_key = os.getenv('OPENAI_API_KEY')
if not api_key:
    raise ValueError("環境変数 'OPENAI_API_KEY' が設定されていません。APIキーを設定してください。")

# OpenAIクライアントの初期化
client = OpenAI(api_key=api_key)

# 削除するファイルIDを指定
file_id = 'file-DKLSxHVSSK3dWbyYLZyPfR'

# ファイル削除を実行
try:
    delete_response = client.files.delete(file_id)
    if delete_response.deleted:
        print(f'ファイル削除が成功しました: {file_id}')
    else:
        print(f'ファイル削除に失敗しました: {file_id}')
except Exception as e:
    print(f'ファイル削除中にエラーが発生しました: {e}')