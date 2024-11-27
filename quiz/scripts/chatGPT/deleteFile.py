import os
from openai import OpenAI

class FileDeleter:
    def __init__(self, api_key: str):
        self.client = OpenAI(api_key=api_key)

    def delete_file(self, file_id: str):
        try:
            delete_response = self.client.files.delete(file_id)
            if delete_response.deleted:
                print(f'ファイル削除が成功しました: {file_id}')
                return True
            else:
                print(f'ファイル削除に失敗しました: {file_id}')
                return False
        except Exception as e:
            print(f'ファイル削除中にエラーが発生しました: {e}')
            return False

# 以下のコードはスクリプトとして直接実行された場合のみ動作します
if __name__ == "__main__":
    # 環境変数からOpenAI APIキーを取得
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        raise ValueError("環境変数 'OPENAI_API_KEY' が設定されていません。APIキーを設定してください。")

    # FileDeleterインスタンスの作成
    file_deleter = FileDeleter(api_key=api_key)
    # ファイル削除を実行
    file_deleter.delete_file(file_id)