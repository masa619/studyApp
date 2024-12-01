import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# プロジェクトのルートディレクトリをPYTHONPATHに追加
project_root = Path(__file__).resolve().parent.parent.parent
sys.path.append(str(project_root))
print(f"[DEBUG] Project root path: {project_root}")
print(f"[DEBUG] Python path: {sys.path}")

# 環境の決定
ENVIRONMENT = os.environ.get('ENVIRONMENT', 'development')
print(f"[DEBUG] Current environment: {ENVIRONMENT}")

# 適切な.envファイルを読み込む
env_file = project_root / f'.env.{ENVIRONMENT}'
print(f"[DEBUG] Loading environment file: {env_file}")
print(f"[DEBUG] Environment file exists: {env_file.exists()}")

# dotenvを使って環境変数をロード
load_dotenv(dotenv_path=env_file)
print(f"[DEBUG] DJANGO_SECRET_KEY: {os.getenv('DJANGO_SECRET_KEY')}")

# Django設定モジュールを環境変数に設定
django_settings = f'studyapp.settings.{ENVIRONMENT}'
os.environ.setdefault('DJANGO_SETTINGS_MODULE', django_settings)
print(f"[DEBUG] Django settings module: {django_settings}")
print(f"[DEBUG] Current environment variables:")
print(f"  - DJANGO_SETTINGS_MODULE: {os.environ.get('DJANGO_SETTINGS_MODULE')}")
print(f"  - PYTHONPATH: {os.environ.get('PYTHONPATH')}")

# Djangoのセットアップ
print("[DEBUG] Setting up Django...")
import django
django.setup()
print("[DEBUG] Django setup completed")

from quiz.models import Exam, Question, Choice
import json

def import_json_to_db(json_file_path):
    """JSONデータをDjangoデータベースにインポートするスクリプト"""
    # 欠落しているキーを記録するリスト
    missing_keys = []

    # 1. Examの初期データを作成
    exam, created = Exam.objects.get_or_create(
        key="1",
        defaults={
            "name": "AWS Solutions Architect - Professional",
            "category": None,  # または空文字やnullとして処理
            "is_active": True,
        }
    )
    
    if created:
        print(f"Exam '{exam.name}' を新規作成しました。")
    else:
        print(f"Exam '{exam.name}' は既に存在します。")

    # 2. JSONファイルを読み込む
    with open(json_file_path, 'r', encoding='utf-8') as file:
        data = json.load(file)

    # 3. QuestionとChoiceをインポート
    for question_data in data:
        # Check if "No" key exists, otherwise skip or handle the question
        question_no = question_data.get("No")
        if question_no is None:
            print("Skipping question due to missing 'No' key.")
            continue

        # Check for missing keys and record them
        missing_fields = []
        for field in ["question", "question_jp", "answer_key", "choices"]:
            if field not in question_data:
                missing_fields.append(field)

        if missing_fields:
            missing_keys.append((question_no, missing_fields))

        # Questionを作成または取得
        question, created = Question.objects.get_or_create(
            no=int(question_no),
            exam=exam,
            defaults={
                "question_text_en": question_data.get("question", ""),
                "question_text_ja": question_data.get("question_jp", ""),
                "answer_key": question_data.get("answer_key", ""),
                "community_vote_distribution": question_data.get("community_vote_distribution", None),
                "page_images": question_data.get("page_images", []),
                "explanation_en": question_data.get("explanation_en", []),
                "explanation_ja": question_data.get("explanation_jp", []),
                "keywords": question_data.get("keywords", []),
            }
        )
        if created:
            print(f"Question '{question.no}' を作成しました。")
        else:
            print(f"Question '{question.no}' は既に存在します。")

        # Choiceを作成
        for choice_data in question_data.get("choices", []):
            choice, created = Choice.objects.get_or_create(
                question=question,
                key=choice_data.get("key", ""),
                defaults={
                    "choice_text_en": choice_data.get("text", ""),
                    "choice_text_ja": choice_data.get("text_jp", ""),
                }
            )
            if created:
                print(f"Choice '{choice.key}' を作成しました。")
            else:
                print(f"Choice '{choice.key}' は既に存在します。")

    # 欠落しているキーの一覧を出力
    if missing_keys:
        print("以下の質問番号でキーが欠落しています:")
        for no, fields in missing_keys:
            print(f" - Question No: {no}, Missing fields: {', '.join(fields)}")
    else:
        print("すべての質問に必要なキーが存在します。")

    print("JSONデータのインポートが完了しました。")

if __name__ == "__main__":
    # JSONファイルのパスを指定
    json_file_path = project_root / 'quiz' / 'scripts' / 'chatGPT' / 'merged' / 'merged_output.json'
    print(f"[DEBUG] Loading JSON file from: {json_file_path}")
    print(f"[DEBUG] JSON file exists: {json_file_path.exists()}")
    
    import_json_to_db(str(json_file_path))